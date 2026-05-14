from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from project import models
from project.core.database import get_async_session
from project.dependencies.auth import require_roles
from project.routers.http.users.schemas import SupportUserResponse
from project.services import admin as admin_service

from . import schemas as local_schemas

router = APIRouter(prefix="/admin", tags=["admin"])

_admin_only = require_roles(models.User.UserRole.ADMIN)


@router.get("/stats", response_model=local_schemas.AdminDashboardStatsResponse)
async def admin_dashboard_stats(
    session: Annotated[AsyncSession, Depends(get_async_session)],
    _admin: Annotated[models.User, Depends(_admin_only)],
) -> local_schemas.AdminDashboardStatsResponse:
    raw = await admin_service.get_dashboard_stats(session)
    return local_schemas.AdminDashboardStatsResponse.model_validate(raw)


@router.patch(
    "/users/{user_id}/role",
    response_model=SupportUserResponse,
)
async def admin_update_user_role(
    user_id: int,
    body: local_schemas.UserRoleUpdateRequest,
    session: Annotated[AsyncSession, Depends(get_async_session)],
    _admin: Annotated[models.User, Depends(_admin_only)],
) -> SupportUserResponse:
    user = await admin_service.update_user_role(session, user_id=user_id, new_role=body.role)
    return SupportUserResponse.model_validate(user, from_attributes=True)
