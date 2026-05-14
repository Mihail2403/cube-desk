from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from project import models
from project.core.database import get_async_session
from project.dependencies.auth import get_current_active_user
from project.repositories import ticket_categories as ticket_categories_repo

from . import schemas as local_schemas

router = APIRouter(prefix="/ticket-categories", tags=["ticket-categories"])


@router.get("", response_model=list[local_schemas.TicketCategoryResponse])
async def list_ticket_categories(
    session: Annotated[AsyncSession, Depends(get_async_session)],
    _user: Annotated[models.User, Depends(get_current_active_user)],
) -> list[local_schemas.TicketCategoryResponse]:
    rows = await ticket_categories_repo.list_categories(session)
    return [
        local_schemas.TicketCategoryResponse.model_validate(r, from_attributes=True) for r in rows
    ]
