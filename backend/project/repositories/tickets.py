from datetime import datetime

from sqlalchemy import ColumnElement, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

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
    stmt = (
        select(models.Ticket)
        .where(models.Ticket.id == ticket_id)
        .options(
            selectinload(models.Ticket.author),
            selectinload(models.Ticket.assignee),
        )
        .limit(1)
    )
    return (await session.execute(stmt)).scalar()


async def get_tickets(
    session: AsyncSession,
    *,
    limit: int,
    offset: int,
    author_id: int | None = None,
    status: models.Ticket.TicketStatus | None = None,
    priority: models.Ticket.TicketPriority | None = None,
    updated_at__gt: datetime | None = None,
) -> list[models.Ticket]:
    filters: list[ColumnElement[bool]] = []
    if author_id is not None:
        filters.append(models.Ticket.author_id == author_id)
    if status is not None:
        filters.append(models.Ticket.status == status)
    if priority is not None:
        filters.append(models.Ticket.priority == priority)
    if updated_at__gt is not None:
        filters.append(models.Ticket.updated_at > updated_at__gt)

    stmt = (
        select(models.Ticket)
        .where(*filters)
        .options(
            selectinload(models.Ticket.author),
            selectinload(models.Ticket.assignee),
        )
        .order_by(models.Ticket.id.desc())
        .limit(limit)
        .offset(offset)
    )
    return list((await session.execute(stmt)).scalars().all())


async def count_tickets(
    session: AsyncSession,
    *,
    status: models.Ticket.TicketStatus | None = None,
    statuses: tuple[models.Ticket.TicketStatus, ...] | None = None,
    created_at__gte: datetime | None = None,
    updated_at__gte: datetime | None = None,
) -> int:
    stmt = select(func.count()).select_from(models.Ticket)
    conds: list[ColumnElement[bool]] = []
    if status is not None:
        conds.append(models.Ticket.status == status)
    if statuses is not None and len(statuses) > 0:
        conds.append(models.Ticket.status.in_(statuses))
    if created_at__gte is not None:
        conds.append(models.Ticket.created_at >= created_at__gte)
    if updated_at__gte is not None:
        conds.append(models.Ticket.updated_at >= updated_at__gte)
    if conds:
        stmt = stmt.where(*conds)
    return int((await session.execute(stmt)).scalar_one())


async def create_message(
    session: AsyncSession,
    *,
    instance: models.TicketMessage,
) -> models.TicketMessage:
    session.add(instance)
    await session.flush()
    return instance


async def create_message_attachment(
    session: AsyncSession,
    *,
    instance: models.TicketMessageAttachment,
) -> models.TicketMessageAttachment:
    session.add(instance)
    await session.flush()
    return instance


async def get_messages(
    session: AsyncSession,
    *,
    ticket_id: int,
    limit: int,
    offset: int,
    id__gt: int | None = None,
) -> list[models.TicketMessage]:
    filters: list[ColumnElement[bool]] = [models.TicketMessage.ticket_id == ticket_id]
    if id__gt is not None:
        filters.append(models.TicketMessage.id > id__gt)

    stmt = (
        select(models.TicketMessage)
        .options(
            selectinload(models.TicketMessage.attachments),
            selectinload(models.TicketMessage.author),
        )
        .where(*filters)
        .order_by(models.TicketMessage.id.asc())
        .limit(limit)
        .offset(offset)
    )
    return list((await session.execute(stmt)).scalars().all())
