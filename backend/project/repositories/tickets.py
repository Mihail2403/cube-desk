from __future__ import annotations

from sqlalchemy import ColumnElement, select
from sqlalchemy.ext.asyncio import AsyncSession

from project import models


async def create_ticket(
    session: AsyncSession,
    *,
    instance: models.Ticket,
) -> models.Ticket:
    session.add(instance)
    await session.flush()
    return instance


async def get_ticket(
    session: AsyncSession,
    *,
    ticket_id: int,
) -> models.Ticket | None:
    stmt = select(models.Ticket).where(models.Ticket.id == ticket_id).limit(1)
    return (await session.execute(stmt)).scalar()


async def get_tickets(
    session: AsyncSession,
    *,
    author_id: int | None = None,
    status: models.Ticket.TicketStatus | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[models.Ticket]:
    filters: list[ColumnElement[bool]] = []
    if author_id is not None:
        filters.append(models.Ticket.author_id == author_id)
    if status is not None:
        filters.append(models.Ticket.status == status)

    stmt = (
        select(models.Ticket)
        .where(*filters)
        .order_by(models.Ticket.id.desc())
        .limit(limit)
        .offset(offset)
    )
    return list((await session.execute(stmt)).scalars().all())


async def create_message(
    session: AsyncSession,
    *,
    instance: models.TicketMessage,
) -> models.TicketMessage:
    session.add(instance)
    await session.flush()
    return instance


async def get_messages(
    session: AsyncSession,
    *,
    ticket_id: int,
    limit: int = 200,
    offset: int = 0,
) -> list[models.TicketMessage]:
    stmt = (
        select(models.TicketMessage)
        .where(models.TicketMessage.ticket_id == ticket_id)
        .order_by(models.TicketMessage.id.asc())
        .limit(limit)
        .offset(offset)
    )
    return list((await session.execute(stmt)).scalars().all())
