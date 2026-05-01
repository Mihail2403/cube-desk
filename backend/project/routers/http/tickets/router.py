from __future__ import annotations

from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from project import models
from project.core.database import get_async_session
from project.dependencies.auth import get_current_active_user
from project.services import tickets as tickets_service

from . import schemas as local_schemas

router = APIRouter(prefix="/tickets", tags=["tickets"])


@router.post(
    "",
    response_model=local_schemas.TicketResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_ticket(
    body: local_schemas.TicketCreateRequest,
    user: Annotated[models.User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> local_schemas.TicketResponse:
    ticket = await tickets_service.create_ticket(
        session,
        author_id=user.id,
        title=body.title,
        description=body.description,
    )
    return local_schemas.TicketResponse.model_validate(ticket, from_attributes=True)


@router.get("", response_model=list[local_schemas.TicketResponse])
async def get_tickets(
    session: Annotated[AsyncSession, Depends(get_async_session)],
    user: Annotated[models.User, Depends(get_current_active_user)],
    status: Annotated[models.Ticket.TicketStatus | None, Query()] = None,
    updated_at__gt: Annotated[datetime | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> list[local_schemas.TicketResponse]:
    tickets = await tickets_service.get_tickets(
        session,
        user=user,
        status=status,
        updated_at__gt=updated_at__gt,
        limit=limit,
        offset=offset,
    )
    return [local_schemas.TicketResponse.model_validate(t, from_attributes=True) for t in tickets]


@router.get("/{ticket_id}", response_model=local_schemas.TicketResponse)
async def get_ticket(
    ticket_id: int,
    user: Annotated[models.User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> local_schemas.TicketResponse:
    ticket = await tickets_service.get_ticket(session, user=user, ticket_id=ticket_id)
    return local_schemas.TicketResponse.model_validate(ticket, from_attributes=True)


@router.patch("/{ticket_id}", response_model=local_schemas.TicketResponse)
async def update_ticket(
    ticket_id: int,
    body: local_schemas.TicketUpdateRequest,
    user: Annotated[models.User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> local_schemas.TicketResponse:
    ticket = await tickets_service.update_ticket(
        session,
        user=user,
        ticket_id=ticket_id,
        title=body.title,
        description=body.description,
        status=body.status,
    )
    return local_schemas.TicketResponse.model_validate(ticket, from_attributes=True)


@router.post(
    "/{ticket_id}/messages",
    response_model=local_schemas.TicketMessageResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_message(
    ticket_id: int,
    body: local_schemas.TicketMessageCreateRequest,
    user: Annotated[models.User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> local_schemas.TicketMessageResponse:
    message = await tickets_service.create_message(
        session,
        user=user,
        ticket_id=ticket_id,
        body=body.body,
    )
    return local_schemas.TicketMessageResponse.model_validate(message, from_attributes=True)


@router.get("/{ticket_id}/messages", response_model=list[local_schemas.TicketMessageResponse])
async def list_messages(
    ticket_id: int,
    user: Annotated[models.User, Depends(get_current_active_user)],
    session: Annotated[AsyncSession, Depends(get_async_session)],
    id__gt: Annotated[int | None, Query(ge=1)] = None,
    limit: Annotated[int, Query(ge=1, le=500)] = 200,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> list[local_schemas.TicketMessageResponse]:
    messages = await tickets_service.get_messages(
        session,
        user=user,
        ticket_id=ticket_id,
        id__gt=id__gt,
        limit=limit,
        offset=offset,
    )
    return [
        local_schemas.TicketMessageResponse.model_validate(m, from_attributes=True)
        for m in messages
    ]
