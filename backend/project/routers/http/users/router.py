from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from project import models
from project.core.database import get_async_session
from project.dependencies.auth import require_roles
from project.services import users as users_service

from . import schemas as local_schemas

router = APIRouter(prefix="/users", tags=["users"])

_support_or_admin = require_roles(
    models.User.UserRole.ADMIN,
    models.User.UserRole.SUPPORT,
)


@router.get("/support", response_model=list[local_schemas.SupportUserResponse])
async def list_support_users(
    session: Annotated[AsyncSession, Depends(get_async_session)],
    _staff: Annotated[models.User, Depends(_support_or_admin)],
) -> list[local_schemas.SupportUserResponse]:
    users = await users_service.get_users(
        session,
        roles=(
            models.User.UserRole.SUPPORT,
            models.User.UserRole.ADMIN,
        ),
    )
    return [
        local_schemas.SupportUserResponse.model_validate(u, from_attributes=True) for u in users
    ]
