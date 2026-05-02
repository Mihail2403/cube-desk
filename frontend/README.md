# Cube Desk — фронтенд

SPA для helpdesk-системы **Cube Desk**: тикеты, роли (`USER`, `SUPPORT`, `ADMIN`), Bearer-аутентификация с ротацией refresh-токена, сообщения с вложениями (`multipart/form-data`).

## Требования

- Node.js 20+
- Запущенный API Cube Desk (см. репозиторий `backend/`)

## Установка

```bash
npm install
```

## Переменные окружения

Скопируйте `.env.example` в `.env` и при необходимости измените URL API:

- `VITE_API_BASE_URL` — базовый URL без завершающего слэша, например `http://localhost:8000`.

## CORS

На бэкенде в `CORS_ALLOW_ORIGINS` должен быть указан origin фронтенда, например `http://localhost:5173`.

## Генерация типов из OpenAPI

После изменения `backend/openapi.json`:

```bash
npm run generate:api
```

Типы пишутся в `src/shared/api/generated-types.ts`. Поле `role` в ответе `GET /api/auth/me` дополнено вручную в `src/shared/types/api.ts` (см. `backend/FRONTEND_AGENT.md`).

## Скрипты

| Команда        | Описание              |
|----------------|-----------------------|
| `npm run dev`  | dev-сервер Vite       |
| `npm run build`| проверка типов + сборка |
| `npm run preview` | предпросмотр prod-сборки |
| `npm run lint` | ESLint                |

## Чеклист API-клиента

Соответствует разделу 9 в `backend/FRONTEND_AGENT.md`: refresh с заменой пары токенов, Bearer на защищённых маршрутах, `multipart` для сообщений, разбор кастомного 422 (`details.errors`), временные `download_url` для вложений.
