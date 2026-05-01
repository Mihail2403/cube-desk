from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from project import models
from project.core.exceptions import ForbiddenError, NotFoundError
from project.repositories import tickets as tickets_repo


async def have_access_to_ticket(
    *,
    user: models.User,
    ticket: models.Ticket,
) -> bool:
    if user.role == models.User.UserRole.USER:
        return ticket.author_id == user.id
    else:
        return True


async def create_ticket(
    session: AsyncSession,
    *,
    author_id: int,
    title: str,
    description: str | None,
) -> models.Ticket:
    async with session.begin():
        ticket = await tickets_repo.create_ticket(
            session,
            instance=models.Ticket(
                author_id=author_id,
                title=title,
                description=description or "",
            ),
        )
        return ticket


async def get_tickets(
    session: AsyncSession,
    *,
    user: models.User,
    status: models.Ticket.TicketStatus | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[models.Ticket]:
    if user.role == models.User.UserRole.USER:
        return await tickets_repo.get_tickets(
            session,
            author_id=user.id,
            status=status,
            limit=limit,
            offset=offset,
        )
    else:
        return await tickets_repo.get_tickets(
            session,
            status=status,
            limit=limit,
            offset=offset,
        )


async def get_ticket(
    session: AsyncSession,
    *,
    ticket_id: int,
    user: models.User,
) -> models.Ticket:
    ticket = await tickets_repo.get_ticket(session, ticket_id=ticket_id)
    if ticket is None:
        raise NotFoundError("Ticket not found")
    if not await have_access_to_ticket(user=user, ticket=ticket):
        raise ForbiddenError("No access to this ticket")
    return ticket


async def update_ticket(
    session: AsyncSession,
    *,
    user: models.User,
    ticket_id: int,
    title: str | None,
    description: str | None,
    status: models.Ticket.TicketStatus | None,
) -> models.Ticket:
    async with session.begin():
        ticket = await get_ticket(session, ticket_id=ticket_id, user=user)

        if title is not None:
            ticket.title = title
        if description is not None:
            ticket.description = description
        if status is not None:
            ticket.status = status

    return ticket


async def create_message(
    session: AsyncSession,
    *,
    user: models.User,
    ticket_id: int,
    body: str,
) -> models.TicketMessage:
    async with session.begin():
        ticket = await get_ticket(session, ticket_id=ticket_id, user=user)

        message = await tickets_repo.create_message(
            session,
            instance=models.TicketMessage(
                ticket_id=ticket.id,
                author_id=user.id,
                body=body,
            ),
        )
        return message


async def get_messages(
    session: AsyncSession,
    *,
    user: models.User,
    ticket_id: int,
    limit: int,
    offset: int,
) -> list[models.TicketMessage]:
    ticket = await get_ticket(session, ticket_id=ticket_id, user=user)
    messages = await tickets_repo.get_messages(
        session,
        ticket_id=ticket.id,
        limit=limit,
        offset=offset,
    )
    return messages
