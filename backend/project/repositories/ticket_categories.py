from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from project import models


async def list_categories(session: AsyncSession) -> list[models.TicketCategory]:
    stmt = select(models.TicketCategory).order_by(models.TicketCategory.name.asc())
    return list((await session.execute(stmt)).scalars().all())


async def get_category(
    session: AsyncSession,
    *,
    category_id: int,
) -> models.TicketCategory | None:
    stmt = select(models.TicketCategory).where(models.TicketCategory.id == category_id).limit(1)
    return (await session.execute(stmt)).scalar()


async def get_category_by_name(
    session: AsyncSession,
    *,
    name: str,
) -> models.TicketCategory | None:
    stmt = select(models.TicketCategory).where(models.TicketCategory.name == name).limit(1)
    return (await session.execute(stmt)).scalar()


async def create_category(
    session: AsyncSession,
    *,
    instance: models.TicketCategory,
) -> models.TicketCategory:
    session.add(instance)
    await session.flush()
    return instance


async def delete_category(
    session: AsyncSession,
    *,
    category: models.TicketCategory,
) -> None:
    await session.delete(category)
    await session.flush()


async def count_tickets_in_category(
    session: AsyncSession,
    *,
    category_id: int,
) -> int:
    stmt = (
        select(func.count())
        .select_from(models.Ticket)
        .where(models.Ticket.category_id == category_id)
    )
    return int((await session.execute(stmt)).scalar_one())


async def get_default_category_id(session: AsyncSession) -> int | None:
    stmt = select(models.TicketCategory.id).order_by(models.TicketCategory.id.asc()).limit(1)
    return (await session.execute(stmt)).scalar()
