from datetime import datetime

from sqlalchemy import ColumnElement, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from project import models


async def get_auth_token(
    session: AsyncSession,
    *,
    access_token: str | None = None,
    refresh_token: str | None = None,
) -> models.AuthToken | None:
    filters: list[ColumnElement[bool]] = []

    if access_token is not None:
        filters.append(models.AuthToken.access_token == access_token)
        filters.append(models.AuthToken.access_expires_at >= datetime.now())

    if refresh_token is not None:
        filters.append(models.AuthToken.refresh_token == refresh_token)
        filters.append(models.AuthToken.refresh_expires_at >= datetime.now())

    if not filters:
        return None

    stmt = (
        select(models.AuthToken)
        .options(selectinload(models.AuthToken.user))
        .where(*filters)
        .limit(1)
    )

    return (await session.execute(stmt)).scalar()


async def create_auth_token(
    session: AsyncSession,
    *,
    instance: models.AuthToken,
) -> models.AuthToken:
    session.add(instance)
    await session.flush()
    return instance


async def delete_auth_token(session: AsyncSession, *, auth_token: models.AuthToken) -> None:
    await session.delete(auth_token)
    await session.flush()
