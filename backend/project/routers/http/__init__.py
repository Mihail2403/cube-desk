from fastapi import APIRouter

from .auth.router import router as auth_router
from .health.router import router as health_router
from .tickets.router import router as tickets_router
from .users.router import router as users_router

api_router = APIRouter(prefix="/api")
api_router.include_router(auth_router)
api_router.include_router(health_router)
api_router.include_router(tickets_router)
api_router.include_router(users_router)

__all__ = ("api_router",)
