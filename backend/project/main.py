from contextlib import asynccontextmanager
from typing import Awaitable, Callable

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from project.core.config import config
from project.core.database.engine import engine
from project.routers.http import api_router
from project.routers.http.exceptions import setup_exception_handlers
from project.services.ai.qdrant_store import ticket_solution_vector_store
from project.services.dev_seed import run_dev_seed_if_enabled


@asynccontextmanager
async def lifespan(app: FastAPI):
    await run_dev_seed_if_enabled()
    yield
    await ticket_solution_vector_store.close()
    await engine.dispose()


def create_app() -> FastAPI:
    app = FastAPI(
        title="Cube Desk API",
        lifespan=lifespan,
    )
    if config.CORS_ALLOW_ORIGINS:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=config.CORS_ALLOW_ORIGINS,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    @app.middleware("http")
    async def request_logging_middleware(  # pyright: ignore[reportUnusedFunction]
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        response = await call_next(request)
        logger.bind(request=request, response=response).info(
            f"Request processed: {request.method} {request.url.path} -> {response.status_code}"
        )
        return response

    app.include_router(api_router)
    setup_exception_handlers(app)
    return app
