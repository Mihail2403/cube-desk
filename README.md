# Cube Desk

Система тикетов с бэкендом на **FastAPI**, фронтендом на **React (Vite)** и вспомогательными сервисами: **PostgreSQL**, **MinIO** (S3 для вложений), **Qdrant** (поиск похожих закрытых тикетов по эмбеддингам).

## Требования

- [Docker](https://docs.docker.com/get-docker/) и Docker Compose v2
- для локального запуска бэкенда без Docker: Python 3.11+, [uv](https://github.com/astral-sh/uv)

## Быстрый старт (Docker)

1. Скопируйте пример окружения бэкенда и при необходимости отредактируйте:

   ```bash
   copy backend\.env.example backend\.env
   ```

   На Linux/macOS: `cp backend/.env.example backend/.env`

2. Из **корня репозитория** поднимите сервисы:

   ```bash
   docker compose up --build -d
   ```

3. Доступ:

   | Сервис   | URL |
   |----------|-----|
   | API      | http://localhost:8000 |
   | Документация OpenAPI | http://localhost:8000/docs |
   | Фронтенд | http://localhost:5173 |
   | MinIO консоль | http://localhost:9001 |
   | Qdrant   | http://localhost:6333 |

При первом старте API в контейнере выполняются миграции Alembic, затем поднимается Uvicorn. Модель эмбеддингов при необходимости качается в volume `hf_cache` (первый запуск с похожими тикетами может занять заметное время).

## Переменные окружения

Полный перечень с комментариями - в [`backend/.env.example`](backend/.env.example).

В `docker-compose.yml` для сервиса `api` заданы переопределения хостов под сеть Compose (`postgres`, `minio`, `qdrant` вместо `localhost`), они имеют приоритет над значениями из `.env`.

## Демо-данные (dev seed)

Чтобы при старте API автоматически создавались тестовые пользователи, категории, демо-тикеты и индекс похожих решений в Qdrant, в `backend/.env` задайте:

```env
SEED_DEV_DATA=true
SEED_DEV_PASSWORD=dev12345
```

Поведение:

- `Seed` выполняется только если **`MODE` не `PROD`**. При `MODE=PROD` `seed` отключается даже при `SEED_DEV_DATA=true`.
- **Пользователи и категории** создаются идемпотентно (уже существующие по логину или имени категории не дублируются).
- **Тикеты с перепиской** (открытые, в работе, решённые) и **закрытые** кейсы добавляются **только если в базе ещё нет ни одного тикета**. Чтобы пересоздать демо-тикеты, нужна пустая таблица тикетов или новая БД.
- Закрытые тикеты с непустым **resolution** после коммита синхронизируются в коллекцию Qdrant (`QDRANT_COLLECTION`), как при обычном закрытии тикета через API.

Учётки по умолчанию (пароль — значение `SEED_DEV_PASSWORD`):

| Логин         | Роль    |
|---------------|---------|
| `dev_admin`   | ADMIN   |
| `dev_support`, `dev_support2` | SUPPORT |
| `dev_user`, `dev_user2` | USER |

Логика сида: [`backend/project/services/dev_seed.py`](backend/project/services/dev_seed.py).

## Структура репозитория

- `backend/` — FastAPI-приложение (`app:app` для Uvicorn), Alembic, сервисы и роутеры.
- `frontend/` — SPA на Vite.
- `docker-compose.yml` — оркестрация всех сервисов для локальной разработки.

## Полезные команды

```bash
# логи API
docker compose logs -f api

# остановка
docker compose down

# остановка с удалением томов БД (полный сброс данных)
docker compose down -v
```

## Локальный бэкенд без Docker

Нужны запущенные PostgreSQL, MinIO и Qdrant (или их аналоги) с URL из `.env`. Затем из каталога `backend/`:

```bash
uv sync
uv run alembic upgrade head
uv run uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

Фронтенд — из `frontend/` по инструкциям в `package.json` (например `npm ci` и `npm run dev`).
