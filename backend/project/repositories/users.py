from collections.abc import Sequence

from sqlalchemy import ColumnElement, select
from sqlalchemy.ext.asyncio import AsyncSession

from project import models


async def get_user(
    session: AsyncSession,
    *,
    user_id: int | None = None,
    login: str | None = None,
) -> models.User | None:
    filters: list[ColumnElement[bool]] = []
    if user_id is not None:
        filters.append(models.User.id == user_id)
    if login is not None:
        filters.append(models.User.login == login)

    stmt = select(models.User).where(*filters)
    if len(filters) == 1:
        stmt = stmt.limit(1)

    return (await session.execute(stmt)).scalar()


async def create_user(
    session: AsyncSession,
    *,
    instance: models.User,
) -> models.User:
    session.add(instance)
    await session.flush()
    return instance


async def get_users(
    session: AsyncSession,
    *,
    roles: Sequence[models.User.UserRole] | None = None,
    only_active: bool = True,
) -> list[models.User]:
    stmt = select(models.User).order_by(models.User.login.asc())
    conditions: list[ColumnElement[bool]] = []
    if only_active:
        conditions.append(models.User.is_active.is_(True))
    if roles:
        conditions.append(models.User.role.in_(tuple(roles)))
    if conditions:
        stmt = stmt.where(*conditions)
    return list((await session.execute(stmt)).scalars().all())
