from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from project import models
from project.core.database import get_async_session
from project.dependencies.auth import require_roles
from project.routers.http.ticket_categories.schemas import TicketCategoryResponse
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


@router.get("/ticket-categories", response_model=list[TicketCategoryResponse])
async def admin_list_ticket_categories(
    session: Annotated[AsyncSession, Depends(get_async_session)],
    _admin: Annotated[models.User, Depends(_admin_only)],
) -> list[TicketCategoryResponse]:
    rows = await admin_service.list_ticket_categories(session)
    return [TicketCategoryResponse.model_validate(r, from_attributes=True) for r in rows]


@router.post(
    "/ticket-categories",
    response_model=TicketCategoryResponse,
    status_code=201,
)
async def admin_create_ticket_category(
    body: local_schemas.TicketCategoryCreateRequest,
    session: Annotated[AsyncSession, Depends(get_async_session)],
    _admin: Annotated[models.User, Depends(_admin_only)],
) -> TicketCategoryResponse:
    cat = await admin_service.create_ticket_category(session, name=body.name)
    return TicketCategoryResponse.model_validate(cat, from_attributes=True)


@router.patch("/ticket-categories/{category_id}", response_model=TicketCategoryResponse)
async def admin_update_ticket_category(
    category_id: int,
    body: local_schemas.TicketCategoryUpdateRequest,
    session: Annotated[AsyncSession, Depends(get_async_session)],
    _admin: Annotated[models.User, Depends(_admin_only)],
) -> TicketCategoryResponse:
    cat = await admin_service.update_ticket_category(
        session,
        category_id=category_id,
        name=body.name,
    )
    return TicketCategoryResponse.model_validate(cat, from_attributes=True)


@router.delete("/ticket-categories/{category_id}", status_code=204)
async def admin_delete_ticket_category(
    category_id: int,
    session: Annotated[AsyncSession, Depends(get_async_session)],
    _admin: Annotated[models.User, Depends(_admin_only)],
) -> None:
    await admin_service.delete_ticket_category(session, category_id=category_id)
