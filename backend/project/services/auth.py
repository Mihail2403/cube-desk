from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from project import models
from project.core.config import config
from project.core.exceptions import BadRequestError, ConflictError, UnAuthorizedError
from project.repositories import auth_tokens as auth_token_repo
from project.repositories import users as user_repo
from project.services.passwords import generate_user_salt, hash_password, verify_password


def _expires_at(*, seconds: int) -> datetime:
    return datetime.now(timezone.utc) + timedelta(seconds=seconds)


async def register(
    session: AsyncSession,
    *,
    login: str,
    password: str,
) -> tuple[models.User, models.AuthToken]:
    async with session.begin():
        existing = await user_repo.get_user(session, login=login)
        if existing is not None:
            raise ConflictError("Login already exists")

        user_salt = generate_user_salt()
        password_hash = hash_password(password=password, user_salt=user_salt)
        user = await user_repo.create_user(
            session,
            instance=models.User(
                login=login,
                password_hash=password_hash,
                salt=user_salt,
                is_active=True,
                role=models.User.UserRole.USER,
            ),
        )
        tokens = await issue_tokens(session, user_id=user.id)

        return user, tokens


async def login(
    session: AsyncSession,
    *,
    login: str,
    password: str,
) -> tuple[models.User, models.AuthToken]:
    async with session.begin():
        user = await user_repo.get_user(session, login=login)
        if user is None:
            raise UnAuthorizedError("Invalid credentials")

        if not user.is_active:
            raise UnAuthorizedError("User is not active")

        if not verify_password(
            password=password,
            user_salt=user.salt,
            password_hash=user.password_hash,
        ):
            raise UnAuthorizedError("Invalid credentials")

        tokens = await issue_tokens(session, user_id=user.id)
        return user, tokens


async def issue_tokens(session: AsyncSession, *, user_id: int) -> models.AuthToken:
    access_token = models.AuthToken.generate_token_value(length=15)
    refresh_token = models.AuthToken.generate_token_value(length=20)

    access_expires_in = int(config.AUTH_ACCESS_TOKEN_LIFETIME)
    refresh_expires_in = int(config.AUTH_REFRESH_TOKEN_LIFETIME)
    access_expires_at = _expires_at(seconds=access_expires_in)
    refresh_expires_at = _expires_at(seconds=refresh_expires_in)

    auth_token = await auth_token_repo.create_auth_token(
        session,
        instance=models.AuthToken(
            user_id=user_id,
            access_token=access_token,
            access_expires_at=access_expires_at,
            refresh_token=refresh_token,
            refresh_expires_at=refresh_expires_at,
        ),
    )

    return auth_token


async def refresh_tokens(session: AsyncSession, *, refresh_token: str) -> models.AuthToken:
    async with session.begin():
        auth_token = await auth_token_repo.get_auth_token(session, refresh_token=refresh_token)
        if auth_token is None:
            raise UnAuthorizedError("Invalid refresh token")

        user = auth_token.user
        if not user.is_active:
            raise UnAuthorizedError("User is not active")

        # rotate: invalidate old token row, issue a new one
        await auth_token_repo.delete_auth_token(session, auth_token=auth_token)
        return await issue_tokens(session, user_id=user.id)


async def logout(
    session: AsyncSession,
    *,
    access_token: str | None = None,
    refresh_token: str | None = None,
) -> None:
    if access_token is None and refresh_token is None:
        raise BadRequestError("Provide access_token or refresh_token")

    async with session.begin():
        auth_token = await auth_token_repo.get_auth_token(
            session,
            access_token=access_token,
            refresh_token=refresh_token,
        )
        if auth_token is None:
            return

        await auth_token_repo.delete_auth_token(session, auth_token=auth_token)
