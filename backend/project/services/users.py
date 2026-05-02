from collections.abc import Sequence

from sqlalchemy.ext.asyncio import AsyncSession

from project import models
from project.repositories import users as users_repo


async def get_users(
    session: AsyncSession,
    *,
    roles: Sequence[models.User.UserRole] | None = None,
    only_active: bool = True,
) -> list[models.User]:
    return await users_repo.get_users(session, roles=roles, only_active=only_active)
