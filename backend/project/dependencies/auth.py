import re
from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from project import models
from project.core.database import get_async_session
from project.core.exceptions import ForbiddenError, UnAuthorizedError
from project.repositories import auth_tokens as auth_token_repo

_http_bearer_optional = HTTPBearer(auto_error=False)


async def get_bearer_access_token_optional(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(_http_bearer_optional),
    ],
) -> str | None:
    if credentials is None:
        return None

    token = credentials.credentials.strip()
    if not re.fullmatch(r"[a-f0-9]+", token, re.IGNORECASE):
        raise UnAuthorizedError("Invalid `Authorization` header")

    return token


async def get_current_user_optional(
    access_token: Annotated[str | None, Depends(get_bearer_access_token_optional)],
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> models.User | None:
    if access_token is None:
        return None

    auth_token = await auth_token_repo.get_auth_token(session, access_token=access_token)
    if auth_token is None:
        return None

    return auth_token.user


def get_current_user(
    user: Annotated[models.User | None, Depends(get_current_user_optional)],
) -> models.User:
    if user is None:
        raise UnAuthorizedError("Authorization required")

    return user


def get_current_active_user(
    user: Annotated[models.User, Depends(get_current_user)],
) -> models.User:
    if not user.is_active:
        raise ForbiddenError("User is not active")

    return user


def require_roles(*roles: models.User.UserRole):
    def _require_roles(
        user: Annotated[models.User, Depends(get_current_active_user)],
    ) -> models.User:
        if user.role not in roles:
            raise ForbiddenError("Insufficient permissions")
        return user

    return _require_roles
