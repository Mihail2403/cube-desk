from contextlib import asynccontextmanager

from fastapi import FastAPI

from project.core.database.engine import engine
from project.routers.http import api_router
from project.routers.http.exceptions import setup_exception_handlers


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await engine.dispose()


def create_app() -> FastAPI:
    app = FastAPI(
        title="Cube Desk API",
        lifespan=lifespan,
    )
    app.include_router(api_router)
    setup_exception_handlers(app)
    return app
