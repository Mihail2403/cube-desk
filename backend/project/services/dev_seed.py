from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from project import models
from project.core.config import config
from project.core.database.engine import AsyncSessionLocal
from project.repositories import ticket_categories as ticket_categories_repo
from project.repositories import tickets as tickets_repo
from project.repositories import users as users_repo
from project.services.ai import ticket_similarity as ticket_similarity_service
from project.services.passwords import generate_user_salt, hash_password

_SEED_CATEGORY_NAMES = (
    "Аппаратное обеспечение",
    "Программное обеспечение",
    "Доступы и учётные записи",
    "Биллинг",
)

_SEED_USERS: tuple[tuple[str, models.User.UserRole], ...] = (
    ("dev_admin", models.User.UserRole.ADMIN),
    ("dev_support", models.User.UserRole.SUPPORT),
    ("dev_support2", models.User.UserRole.SUPPORT),
    ("dev_user", models.User.UserRole.USER),
    ("dev_user2", models.User.UserRole.USER),
)

# All CLOSED tickets with resolution (Qdrant sync after seed). Each row:
# title, description, resolution, category_index (0..3), priority, author login key.
_CLOSED_SEED_TICKETS: tuple[
    tuple[str, str, str, int, models.Ticket.TicketPriority, str],
    ...,
] = (
    (
        "Дублирование списания по подписке",
        "За текущий месяц в кабинете два одинаковых платежа.",
        "Второй платёж отменён, средства вернутся на карту в течение 3–5 рабочих дней.",
        3,
        models.Ticket.TicketPriority.URGENT,
        "dev_user2",
    ),
    (
        "Сброс пароля доменной учётной записи",
        "Не могу войти в ПК после отпуска, пишет «неверный пароль».",
        "Выполнен сброс пароля в AD, выдан временный пароль, пользователь "
        "обязан сменить его при первом входе.",
        2,
        models.Ticket.TicketPriority.MEDIUM,
        "dev_user",
    ),
    (
        "Принтер не печатает по сети",
        "Драйвер установлен, очередь пустая, задания «висят» в статусе Error.",
        "Перезапущена служба диспетчера печати, очищена очередь, "
        "переустановлен сетевой порт принтера — печать восстановлена.",
        0,
        models.Ticket.TicketPriority.MEDIUM,
        "dev_user2",
    ),
    (
        "Нет интернета в гостевой Wi‑Fi сети",
        "Телефон подключается, но без доступа в интернет, captive portal не открывается.",
        "На контроллере Wi‑Fi истёк сертификат captive portal — обновлён, гостевая сеть работает.",
        0,
        models.Ticket.TicketPriority.MEDIUM,
        "dev_user",
    ),
    (
        "Письма из CRM не доходят до Outlook",
        "Веб-CRM показывает «отправлено», в ящике пусто, нет и в спаме.",
        "Добавлен IP шлюза CRM в SPF и разрешён relay на Exchange — доставка восстановлена.",
        1,
        models.Ticket.TicketPriority.MEDIUM,
        "dev_user2",
    ),
    (
        "Office: «This product is already associated with another account»",
        "После переустановки Windows не активируется подписка Microsoft 365.",
        "Снята привязка лицензии в портале администратора, "
        "повторная активация на новом устройстве выполнена успешно.",
        1,
        models.Ticket.TicketPriority.MEDIUM,
        "dev_user",
    ),
    (
        "Высокая нагрузка на диск из-за службы обновлений",
        "Диск загружен на 100%, система тормозит несколько часов.",
        "Отключена раздача обновлений через P2P (Delivery Optimization), "
        "установлены накопительные обновления — нагрузка в норме.",
        1,
        models.Ticket.TicketPriority.MEDIUM,
        "dev_user2",
    ),
    (
        "Истёк SSL-сертификат на тестовом стенде",
        "Браузер блокирует HTTPS с предупреждением NET::ERR_CERT_DATE_INVALID.",
        "Выпущен и установлен новый сертификат Let's Encrypt, "
        "автопродление настроено через certbot.",
        1,
        models.Ticket.TicketPriority.MEDIUM,
        "dev_user",
    ),
    (
        "Неверная роль в Keycloak после импорта пользователей",
        "Пользователь попадает в приложение без прав администратора организации.",
        "Исправлен маппинг групп LDAP → realm roles, "
        "пользователю назначена корректная composite-роль.",
        2,
        models.Ticket.TicketPriority.MEDIUM,
        "dev_user2",
    ),
    (
        "Учётная запись заблокирована после неудачных входов",
        "Сообщение «account locked» при входе в VPN.",
        "Разблокировка в IdP, сброс счётчика неудачных попыток, рекомендована смена пароля.",
        2,
        models.Ticket.TicketPriority.MEDIUM,
        "dev_user",
    ),
    (
        "Квота OneDrive исчерпана, не сохраняются файлы",
        "OneDrive показывает красный значок, синхронизация остановлена.",
        "Очищена корзина OneDrive, перенесены архивы в cold storage, квота освобождена на 12 ГБ.",
        1,
        models.Ticket.TicketPriority.MEDIUM,
        "dev_user2",
    ),
    (
        "Нужен возврат за неиспользованный период SaaS",
        "Компания уволила сотрудников, лицензии не использовались 2 месяца.",
        "По договору оформлен кредит-нота на неиспользованные места, "
        "сумма зачтена в счёт следующего года.",
        3,
        models.Ticket.TicketPriority.MEDIUM,
        "dev_user",
    ),
    # Similar themes repeated on purpose (vector / search demos).
    (
        "Опять не пускает в домен после смены пароля",
        "Системный админ сменил пароль вчера, сегодня снова «учётная запись заблокирована».",
        "Снята блокировка в AD, синхронизация реплики задержалась — "
        "форсирован sync, вход восстановлен.",
        2,
        models.Ticket.TicketPriority.HIGH,
        "dev_user2",
    ),
    (
        "Забыл пароль от корпоративного ноутбука",
        "BitLocker recovery key не сохранял, нужен доступ к данным.",
        "Проверена привязка устройства к Intune, выдан recovery key из портала, "
        "после разблокировки пользователь сменил PIN.",
        2,
        models.Ticket.TicketPriority.MEDIUM,
        "dev_user",
    ),
    (
        "VPN отваливается каждые 10 минут",
        "OpenVPN клиент переподключается, в логах TLS handshake failed.",
        "Обновлён профиль сервера (tls-crypt), на клиенте отключен sleep для туннеля — стабильно.",
        2,
        models.Ticket.TicketPriority.MEDIUM,
        "dev_user2",
    ),
    (
        "Не подключается к VPN из дома",
        "Тот же ноутбук в офисе работает, дома бесконечное «подключение».",
        "Провайдер блокировал UDP/1194, переключили профиль на TCP 443, подключение успешно.",
        2,
        models.Ticket.TicketPriority.MEDIUM,
        "dev_user",
    ),
    (
        "Принтер печатает пустые страницы",
        "Текст в превью есть, на бумаге только полосы.",
        "Заменён картридж/барабан, выполнена калибровка через утилиту производителя.",
        0,
        models.Ticket.TicketPriority.LOW,
        "dev_user2",
    ),
    (
        "Сканер не виден в приложении",
        "MFP в сети пингуется, WIA не находит устройство.",
        "Переустановлен TWAIN-драйвер с сайта вендора, в брандмауэре открыт порт WSD — "
        "сканирование ок.",
        0,
        models.Ticket.TicketPriority.MEDIUM,
        "dev_user",
    ),
    (
        "Дважды списали за одну лицензию",
        "В счёте две строки за один SKU за один месяц.",
        "Дубль удалён из биллинга, выставлен корректирующий документ, деньги на баланс.",
        3,
        models.Ticket.TicketPriority.HIGH,
        "dev_user2",
    ),
    (
        "Неверная сумма НДС в счёте",
        "Счёт-фактура на 20% вместо договорных 10%.",
        "Пересчитан счёт, отправлен исправленный PDF, бухгалтерия подтвердила.",
        3,
        models.Ticket.TicketPriority.MEDIUM,
        "dev_user",
    ),
    (
        "Wi‑Fi на этаже периодически пропадает",
        "Сотрудники жалуются на дропы Zoom, RSSI низкий у перегородок.",
        "Поднята мощность на соседней AP, сменен канал 5 ГГц, добавлен survey-отчёт.",
        0,
        models.Ticket.TicketPriority.MEDIUM,
        "dev_user2",
    ),
    (
        "Гостевой Wi‑Fi снова не открывает портал",
        "Похоже на прошлый случай с сертификатом, но другой филиал.",
        "Обновлён цепочный сертификат на контроллере филиала, NTP синхронизирован — "
        "портал открывается.",
        0,
        models.Ticket.TicketPriority.MEDIUM,
        "dev_user",
    ),
    (
        "Teams не загружается, белый экран",
        "В браузере и десктоп-клиенте одно и то же после обновления.",
        "Очищен кэш Teams, сброшен WebView2, переустановлен клиент — вход работает.",
        1,
        models.Ticket.TicketPriority.MEDIUM,
        "dev_user2",
    ),
    (
        "Excel зависает на большом файле",
        "Файл 80 МБ, при открытии «не отвечает» минуты.",
        "Отключены лишние надстройки, файл разбит на книги, включено ручное вычисление формул.",
        1,
        models.Ticket.TicketPriority.LOW,
        "dev_user",
    ),
    (
        "Антивирус удалил рабочий скрипт",
        "Heuristic detection, скрипт деплоя помечен как троян.",
        "Добавлено исключение по пути и хэшу, политика согласована с ИБ, "
        "скрипт восстановлен из git.",
        1,
        models.Ticket.TicketPriority.HIGH,
        "dev_user2",
    ),
    (
        "Docker Desktop не стартует после обновления",
        "WSL2 integration error в логах.",
        "Обновлён WSL kernel, выполнен wsl --shutdown, переустановлен Docker — "
        "контейнеры запускаются.",
        1,
        models.Ticket.TicketPriority.MEDIUM,
        "dev_user",
    ),
    (
        "Нет прав на сетевую папку \\fileserver\\projects",
        "Раньше работало, после перевода в другой отдел — access denied.",
        "Обновлены группы AD, добавлен в нужную security group, кэш Kerberos сброшен.",
        2,
        models.Ticket.TicketPriority.MEDIUM,
        "dev_user2",
    ),
    (
        "MFA токен потерян, нужен сброс",
        "Телефон утерян, Authenticator недоступен.",
        "По видеозвонку подтверждена личность, сброшен MFA в IdP, выдан временный bypass на 24 ч.",
        2,
        models.Ticket.TicketPriority.URGENT,
        "dev_user",
    ),
    (
        "Jira webhook не срабатывает",
        "Интеграция с CI: события не доходят, 502 в логах nginx.",
        "Исправлен upstream timeout, добавлен keep-alive, тестовый POST 200 OK.",
        1,
        models.Ticket.TicketPriority.MEDIUM,
        "dev_user2",
    ),
    (
        "PostgreSQL «too many connections»",
        "Приложение падает в пик, в логах FATAL remaining connection slots.",
        "Поднят max_connections, внесён пулер pgbouncer в docker-compose стенда, "
        "нагрузочный тест зелёный.",
        1,
        models.Ticket.TicketPriority.HIGH,
        "dev_user",
    ),
    (
        "Монитор не выходит из режима сна",
        "Кнопка питания монитора не реагирует, только отключение кабеля помогает.",
        "Заменён блок питания монитора по гарантии, прошивка DP обновлена.",
        0,
        models.Ticket.TicketPriority.LOW,
        "dev_user2",
    ),
    (
        "USB‑клавиатура не определяется после засыпания",
        "Только перезагрузка ПК помогает.",
        "Отключён быстрый старт Windows, обновлён chipset driver, в BIOS включен xHCI без legacy.",
        0,
        models.Ticket.TicketPriority.MEDIUM,
        "dev_user",
    ),
    (
        "Запрос на перенос лицензий между юрлицами",
        "Слияние компаний, нужно переписать контракт.",
        "Оформлен акт приёма-передачи, в биллинге создан новый account, лицензии перенесены.",
        3,
        models.Ticket.TicketPriority.LOW,
        "dev_user2",
    ),
    (
        "Автопродление подписки отключить",
        "Боимся лишнего списания в следующем квартале.",
        "Автопродление выключено в биллинге, отправлено подтверждение на почту ответственного.",
        3,
        models.Ticket.TicketPriority.MEDIUM,
        "dev_user",
    ),
    (
        "Снова дубль платежа в кабинете",
        "Похожая ситуация как месяц назад, две одинаковые операции.",
        "Идемпотентный ключ на стороне платёжки сбойнул, второй платёж отменён, "
        "мониторинг заведён.",
        3,
        models.Ticket.TicketPriority.URGENT,
        "dev_user2",
    ),
    (
        "Chrome блокирует скачивание exe с портала",
        "«Файл может быть опасным», хотя это наш внутренний билд.",
        "Добавлен домен в политику Safe Browsing исключений, подписан код-сайнингом "
        "новый инсталлятор.",
        1,
        models.Ticket.TicketPriority.MEDIUM,
        "dev_user",
    ),
    (
        "LDAP sync задерживается на час",
        "Новые сотрудники не появляются в приложении сразу.",
        "Увеличен интервал не помог — найден lock на коннекте, исправлен pool size и retry policy.",
        2,
        models.Ticket.TicketPriority.MEDIUM,
        "dev_user2",
    ),
    (
        "Запрос на временный доступ к prod read-only",
        "Аудит на выходных, нужен SELECT без записи.",
        "Выдана роль read_only на 48 ч с IP whitelist, доступ отозван по таймеру.",
        2,
        models.Ticket.TicketPriority.HIGH,
        "dev_user",
    ),
    (
        "Микрофон не работает в Zoom только на этом ПК",
        "В других приложениях звук есть.",
        "Сброшены приватные настройки Zoom, выбран правильный input device, "
        "обновлены аудиодрайверы.",
        0,
        models.Ticket.TicketPriority.LOW,
        "dev_user2",
    ),
    (
        "Сервер обновлений WSUS завис на очереди",
        "Клиенты не получают патчи неделю.",
        "Перезапущена служба WsusService, очищена папка Content временно, "
        "синхронизация с Microsoft восстановлена.",
        1,
        models.Ticket.TicketPriority.HIGH,
        "dev_user",
    ),
    (
        "Ноутбук разряжается за два часа",
        "Батарея держала раньше полдня, сейчас падает до 20% очень быстро.",
        "Диагностика показала износ ячеек, батарея заменена по гарантии, "
        "калибровка циклами выполнена.",
        0,
        models.Ticket.TicketPriority.MEDIUM,
        "dev_user2",
    ),
    (
        "Перегрев и троттлинг под нагрузкой",
        "Игры и рендер — частые троттлы, вентилятор на максимуме.",
        "Заменена термопаста, продут радиатор, в BIOS снижен undervolt — "
        "температуры в норме.",
        0,
        models.Ticket.TicketPriority.MEDIUM,
        "dev_user",
    ),
    (
        "Синий экран KERNEL_SECURITY_CHECK_FAILURE",
        "После обновления драйвера сетевой карты.",
        "Откат драйвера, установлена стабильная версия с сайта OEM, "
        "MEM-тест без ошибок.",
        1,
        models.Ticket.TicketPriority.HIGH,
        "dev_user2",
    ),
    (
        "Не монтируется сетевая шара после смены пароля",
        "Windows просит credentials по кругу.",
        "Очищены сохранённые учётки Credential Manager, подключение с "
        "DOMAIN\\user восстановлено.",
        2,
        models.Ticket.TicketPriority.MEDIUM,
        "dev_user",
    ),
    (
        "Снова блокировка VPN после смены пароля AD",
        "Похоже на прошлый кейс, другой пользователь.",
        "Синхронизированы атрибуты в RADIUS, сброшен кэш на шлюзе — "
        "аутентификация успешна.",
        2,
        models.Ticket.TicketPriority.MEDIUM,
        "dev_user2",
    ),
    (
        "Почта: письма уходят в delayed queue Exchange",
        "Отправитель видит задержку 30–60 минут.",
        "Очередь разгребена, исправлен DNS для smart host, backlog снят.",
        1,
        models.Ticket.TicketPriority.HIGH,
        "dev_user",
    ),
    (
        "Спам-фильтр режет внутренние рассылки",
        "HR-дайджест попадает в Junk у части сотрудников.",
        "Добавлены исключения по заголовку и отправителю, правило "
        "согласовано с ИБ.",
        1,
        models.Ticket.TicketPriority.LOW,
        "dev_user2",
    ),
    (
        "Slack: не грузятся вложения",
        "Бесконечный спиннер, в консоли 403.",
        "Прокси корпоративный блокировал CDN Slack, добавлен bypass для "
        "нужных доменов.",
        1,
        models.Ticket.TicketPriority.MEDIUM,
        "dev_user",
    ),
    (
        "Confluence медленно открывает страницы",
        "Таймауты при поиске, CPU Java высокий.",
        "Пересобран индекс, увеличен heap, реиндексация ночью — отклик "
        "нормализован.",
        1,
        models.Ticket.TicketPriority.MEDIUM,
        "dev_user2",
    ),
    (
        "Jenkins pipeline падает на шаге npm ci",
        "Ошибка ECONNRESET к registry.",
        "Настроен зеркальный registry внутри сети, retry и timeout в "
        "pipeline — сборка зелёная.",
        1,
        models.Ticket.TicketPriority.MEDIUM,
        "dev_user",
    ),
    (
        "GitLab runner не берёт джобы",
        "Статус stale, в логах cannot assign IP.",
        "Пересоздан docker network runner, обновлён runner до последней "
        "патч-версии.",
        1,
        models.Ticket.TicketPriority.HIGH,
        "dev_user2",
    ),
    (
        "Kubernetes Pod в Pending",
        "Events: insufficient cpu.",
        "Снижены requests в манифесте, добавлена нода в пул — pod в Running.",
        1,
        models.Ticket.TicketPriority.HIGH,
        "dev_user",
    ),
    (
        "Ingress TLS handshake error",
        "Секрет сертификата есть, но браузер ругается на цепочку.",
        "Исправлен порядок fullchain в secret, перезагружен ingress-controller.",
        1,
        models.Ticket.TicketPriority.MEDIUM,
        "dev_user2",
    ),
    (
        "Redis OOM command not allowed",
        "Кэш приложения перестал писаться.",
        "Увеличен maxmemory-policy allkeys-lru, поднят лимит памяти контейнера.",
        1,
        models.Ticket.TicketPriority.HIGH,
        "dev_user",
    ),
    (
        "Медленный отчёт в BI, таймаут 60 с",
        "Запрос к витрине без фильтра по дате.",
        "Добавлен партиционированный фильтр, создан индекс по ключу join — "
        "время 3 с.",
        1,
        models.Ticket.TicketPriority.MEDIUM,
        "dev_user2",
    ),
    (
        "Запрос выгрузки персональных данных (GDPR)",
        "Сотрудник увольняется, нужен архив писем и тикетов.",
        "Сформирован архив в течение 72 ч, ссылка с TTL, доступ по MFA "
        "HR-менеджеру.",
        2,
        models.Ticket.TicketPriority.MEDIUM,
        "dev_user",
    ),
    (
        "Отзыв доступа уволенного сотрудника",
        "Нужно срочно отключить всё к концу дня.",
        "Учётка деактивирована в AD, сессии в IdP завершены, VPN и почта "
        "заблокированы.",
        2,
        models.Ticket.TicketPriority.URGENT,
        "dev_user2",
    ),
    (
        "Камера видеонаблюдения не в сети",
        "NVR показывает offline на одном канале.",
        "Заменён PoE-инжектор, патч-корд обжат заново — канал online.",
        0,
        models.Ticket.TicketPriority.LOW,
        "dev_user",
    ),
    (
        "ИБ: подозрительные логины из другой страны",
        "Ночные попытки входа в SaaS.",
        "Включена гео-политика, принудительный MFA, пароль сброшен "
        "пользователю.",
        2,
        models.Ticket.TicketPriority.HIGH,
        "dev_user2",
    ),
    (
        "Счёт выставлен на старый ИНН",
        "Реквизиты обновили в прошлом квартале.",
        "Перевыставлен счёт на актуальные реквизиты, старый аннулирован.",
        3,
        models.Ticket.TicketPriority.MEDIUM,
        "dev_user",
    ),
    (
        "Промокод не применился при оплате",
        "Скидка 15% не отразилась в итоге.",
        "Промокод был с ограничением по SKU, начислен ручной кредит на "
        "следующий счёт.",
        3,
        models.Ticket.TicketPriority.LOW,
        "dev_user2",
    ),
    (
        "Ещё раз двойное списание в конце месяца",
        "Повторяющаяся проблема у нескольких клиентов.",
        "Hotfix на платёжном шлюзе, ретро-рефанд вторых списаний, "
        "алерт в PagerDuty.",
        3,
        models.Ticket.TicketPriority.URGENT,
        "dev_user",
    ),
    (
        "1С не открывается «не найден ключ защиты»",
        "Hasp драйвер после обновления Windows.",
        "Переустановлен HASP License Manager, служба запущена, ключ "
        "определяется.",
        1,
        models.Ticket.TicketPriority.MEDIUM,
        "dev_user2",
    ),
    (
        "Сбой печати PDF из браузера",
        "Пустой лист или обрезанные поля.",
        "Включён «печать как изображение» в драйвере, обновлён Adobe Reader — "
        "корректно.",
        0,
        models.Ticket.TicketPriority.LOW,
        "dev_user",
    ),
    (
        "Ноутбук не видит второй монитор через док-станцию",
        "DisplayPort через USB-C только зеркало.",
        "Обновлена прошивка док-станции, установлены драйверы Thunderbolt — "
        "расширение экрана работает.",
        0,
        models.Ticket.TicketPriority.MEDIUM,
        "dev_user2",
    ),
    (
        "Бэкап Veeam failed: datastore full",
        "Цепочка инкрементов оборвалась.",
        "Освобождено место, запущен active full, проверена ретенция — "
        "джобы зелёные.",
        1,
        models.Ticket.TicketPriority.HIGH,
        "dev_user",
    ),
    (
        "Восстановление файла из бэкапа",
        "Удалили папку по ошибке, нужна версия за вчера.",
        "Файл восстановлен из снапшота NAS, права ACL скопированы с "
        "родительской папки.",
        1,
        models.Ticket.TicketPriority.MEDIUM,
        "dev_user2",
    ),
    (
        "Мобильный Outlook не синхронизирует календарь",
        "События с ПК не появляются на телефоне.",
        "Сброшен кэш аккаунта, проверена лицензия Intune, повторная "
        "настройка профиля.",
        1,
        models.Ticket.TicketPriority.LOW,
        "dev_user",
    ),
    (
        "macOS не подключается к корпоративному Wi‑Fi WPA3-Enterprise",
        "Ошибка authentication failed.",
        "Сертификат CA добавлен в System keychain, профиль MDM обновлён — "
        "Wi‑Fi ок.",
        0,
        models.Ticket.TicketPriority.MEDIUM,
        "dev_user2",
    ),
    (
        "Зависла очередь печати на терминальном сервере",
        "У всех пользователей сессии одновременно.",
        "Остановлен спулер, удалён проблемный драйвер, откат на PCL6 — "
        "очередь очищена.",
        0,
        models.Ticket.TicketPriority.HIGH,
        "dev_user",
    ),
    (
        "Срок действия сертификата SAML истёк",
        "SSO в SaaS перестал работать для всех.",
        "Загружен новый metadata и сертификат в IdP и SP, проверена "
        "цепочка — вход восстановлен.",
        2,
        models.Ticket.TicketPriority.URGENT,
        "dev_user2",
    ),
    (
        "Роли в приложении «слетели» после деплоя",
        "Все пользователи как гость.",
        "Откат миграции БД, исправлен seed ролей, повторный деплой — "
        "роли на месте.",
        1,
        models.Ticket.TicketPriority.URGENT,
        "dev_user",
    ),
    (
        "Rate limit 429 на публичном API",
        "Партнёр жалуется на отказы.",
        "Поднят лимит по API key, добавлен backoff в документации, "
        "квоты согласованы.",
        1,
        models.Ticket.TicketPriority.MEDIUM,
        "dev_user2",
    ),
    (
        "Ложное срабатывание DLP на исходящую почту",
        "Письмо с таблицей Excel блокируется.",
        "Правило DLP уточнено по шаблону, отправка разрешена для "
        "доверенного домена.",
        2,
        models.Ticket.TicketPriority.MEDIUM,
        "dev_user",
    ),
    (
        "Запрос на продление пробного SaaS-периода",
        "Пилот затянулся на неделю.",
        "Продление trial на 14 дней одобрено аккаунт-менеджером, "
        "отражено в биллинге.",
        3,
        models.Ticket.TicketPriority.LOW,
        "dev_user2",
    ),
    (
        "Несовпадение суммы в акте и в кабинете",
        "Акт на 120 тыс, в UI 118 тыс.",
        "Ошибка округления НДС на фронте, исправлен расчёт, акт "
        "переформирован.",
        3,
        models.Ticket.TicketPriority.MEDIUM,
        "dev_user",
    ),
    (
        "Повторная жалоба: VPN дома не работает",
        "Другой провайдер, та же симптоматика что у коллеги.",
        "Выдан профиль с obfuscation и TCP, добавлен split-tunnel для "
        "корпоративных подсетей.",
        2,
        models.Ticket.TicketPriority.MEDIUM,
        "dev_user2",
    ),
    (
        "Сервер времени NTP рассинхрон",
        "Сертификаты TLS отваливаются каскадом.",
        "Исправлен upstream NTP, отключены виртуальные гости без sync, "
        "дрейф устранён.",
        1,
        models.Ticket.TicketPriority.HIGH,
        "dev_user",
    ),
    (
        "Запрос на архивацию почтового ящика уволенного",
        "Юридическое хранение 90 дней.",
        "Включён litigation hold, ящик преобразован в shared mailbox с "
        "read-only доступом юристам.",
        2,
        models.Ticket.TicketPriority.MEDIUM,
        "dev_user2",
    ),
    (
        "Не работает сканирование в сеть на МФУ",
        "SMB share недоступен с панели устройства.",
        "Исправлены права на шару, SMB signing согласован с политикой — "
        "скан доходит.",
        0,
        models.Ticket.TicketPriority.MEDIUM,
        "dev_user",
    ),
    (
        "Пропал звук после обновления драйвера Realtek",
        "Устройство вывода «не подключено».",
        "Откат драйвера, установлен пакет с сайта вендора ноутбука — "
        "звук восстановлен.",
        0,
        models.Ticket.TicketPriority.LOW,
        "dev_user2",
    ),
    (
        "Ошибка лицензии 1С: количество сеансов",
        "Пиковая нагрузка в отчётный день.",
        "Докуплен пакет сеансов, файл лицензии обновлён на сервере.",
        3,
        models.Ticket.TicketPriority.HIGH,
        "dev_user",
    ),
    (
        "Дублирующийся инвойс в 1С и в биллинге портала",
        "Две одинаковые суммы за один период.",
        "Сверка с биллингом, сторно в 1С, портал синхронизирован по API.",
        3,
        models.Ticket.TicketPriority.MEDIUM,
        "dev_user2",
    ),
)


async def _ensure_user(
    session: AsyncSession,
    *,
    login: str,
    password: str,
    role: models.User.UserRole,
) -> models.User:
    existing = await users_repo.get_user(session, login=login)
    if existing is not None:
        return existing
    user_salt = generate_user_salt()
    password_hash = hash_password(password=password, user_salt=user_salt)
    return await users_repo.create_user(
        session,
        instance=models.User(
            login=login,
            password_hash=password_hash,
            salt=user_salt,
            is_active=True,
            role=role,
        ),
    )


async def _ensure_category(session: AsyncSession, *, name: str) -> models.TicketCategory:
    existing = await ticket_categories_repo.get_category_by_name(session, name=name)
    if existing is not None:
        return existing
    return await ticket_categories_repo.create_category(
        session,
        instance=models.TicketCategory(name=name),
    )


async def _seed_sample_tickets(
    session: AsyncSession,
    *,
    users_by_login: dict[str, models.User],
    categories: list[models.TicketCategory],
) -> list[int]:
    """Create demo tickets; returns ids to sync to Qdrant (CLOSED + resolution)."""
    if await tickets_repo.count_tickets(session) > 0:
        return []

    closed_ticket_ids: list[int] = []

    dev_user = users_by_login["dev_user"]
    dev_user2 = users_by_login["dev_user2"]
    support = users_by_login["dev_support"]
    cat_hw = categories[0]
    cat_sw = categories[1]
    cat_access = categories[2]

    t1 = await tickets_repo.create_ticket(
        session,
        instance=models.Ticket(
            author_id=dev_user.id,
            assignee_id=support.id,
            title="Не включается монитор после обновления драйвера",
            description=(
                "После последнего обновления Windows экран остаётся чёрным, "
                + "индикатор питания горит."
            ),
            status=models.Ticket.TicketStatus.OPEN,
            priority=models.Ticket.TicketPriority.HIGH,
            category_id=cat_hw.id,
        ),
    )
    await tickets_repo.create_message(
        session,
        instance=models.TicketMessage(
            ticket_id=t1.id,
            author_id=support.id,
            body=(
                "Здравствуйте. Подскажите, подключён ли монитор по HDMI или DisplayPort? "
                + "Пробовали безопасный режим?"
            ),
        ),
    )

    t2 = await tickets_repo.create_ticket(
        session,
        instance=models.Ticket(
            author_id=dev_user2.id,
            assignee_id=support.id,
            title="Ошибка 500 при открытии отчёта",
            description="В разделе «Отчёты» при выборе периода за май сервер отвечает 500.",
            status=models.Ticket.TicketStatus.IN_PROGRESS,
            priority=models.Ticket.TicketPriority.MEDIUM,
            category_id=cat_sw.id,
        ),
    )
    await tickets_repo.create_message(
        session,
        instance=models.TicketMessage(
            ticket_id=t2.id,
            author_id=dev_user2.id,
            body="Повторяется в Chrome и Edge, в логах консоли только failed to fetch.",
        ),
    )

    t3 = await tickets_repo.create_ticket(
        session,
        instance=models.Ticket(
            author_id=dev_user.id,
            assignee_id=None,
            title="Нужен доступ к тестовому VPN",
            description=(
                "Коллега из смежной команды попросил доступ к "
                + "тестовому контуру для проверки интеграции."
            ),
            status=models.Ticket.TicketStatus.RESOLVED,
            priority=models.Ticket.TicketPriority.LOW,
            category_id=cat_access.id,
            resolution=(
                "Выдан временный сертификат и инструкция по подключению. "
                + "Срок действия — 14 дней."
            ),
        ),
    )
    await tickets_repo.create_message(
        session,
        instance=models.TicketMessage(
            ticket_id=t3.id,
            author_id=support.id,
            body="Доступ оформлен, проверьте почту — там письмо с конфигурацией клиента.",
        ),
    )

    for title, description, resolution, cat_idx, priority, author_login in _CLOSED_SEED_TICKETS:
        author = users_by_login[author_login]
        t_closed = await tickets_repo.create_ticket(
            session,
            instance=models.Ticket(
                author_id=author.id,
                assignee_id=support.id,
                title=title,
                description=description,
                status=models.Ticket.TicketStatus.CLOSED,
                priority=priority,
                category_id=categories[cat_idx].id,
                resolution=resolution,
            ),
        )
        closed_ticket_ids.append(t_closed.id)

    return closed_ticket_ids


async def run_dev_seed_if_enabled() -> None:
    if not config.SEED_DEV_DATA:
        return

    if config.MODE == "PROD":
        logger.warning("SEED_DEV_DATA is enabled, but MODE=PROD — seeding is disabled")
        return

    password = config.SEED_DEV_PASSWORD
    if not password:
        logger.error("SEED_DEV_DATA=true, but SEED_DEV_PASSWORD is empty — skipping")
        return

    async with AsyncSessionLocal() as session:
        async with session.begin():
            categories = [
                await _ensure_category(session, name=name) for name in _SEED_CATEGORY_NAMES
            ]
            users_by_login: dict[str, models.User] = {}
            for login, role in _SEED_USERS:
                users_by_login[login] = await _ensure_user(
                    session,
                    login=login,
                    password=password,
                    role=role,
                )
            closed_ticket_ids = await _seed_sample_tickets(
                session,
                users_by_login=users_by_login,
                categories=categories,
            )

    if closed_ticket_ids:
        async with AsyncSessionLocal() as session:
            for ticket_id in closed_ticket_ids:
                ticket = await tickets_repo.get_ticket(session, ticket_id=ticket_id)
                if ticket is None:
                    continue
                await ticket_similarity_service.sync_ticket_solution_index(ticket)
        logger.info(
            "Synced {} closed ticket(s) to Qdrant collection {}",
            len(closed_ticket_ids),
            config.QDRANT_COLLECTION,
        )

    logger.info(
        "Seed dev data completed. Logins: {logins}; password from SEED_DEV_PASSWORD.",
        logins=", ".join(login for login, _ in _SEED_USERS),
    )
