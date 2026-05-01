from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from project import models
from project.core.database import get_async_session
from project.dependencies.auth import get_bearer_access_token_optional, get_current_active_user
from project.services import auth as auth_service

from . import schemas as local_schemas

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=local_schemas.AuthTokenPairResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(
    body: local_schemas.AuthRegisterRequest,
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> local_schemas.AuthTokenPairResponse:
    _, tokens = await auth_service.register(session, login=body.login, password=body.password)
    return local_schemas.AuthTokenPairResponse.model_validate(tokens, from_attributes=True)


@router.post("/login", response_model=local_schemas.AuthTokenPairResponse)
async def login(
    body: local_schemas.AuthLoginRequest,
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> local_schemas.AuthTokenPairResponse:
    _, tokens = await auth_service.login(session, login=body.login, password=body.password)
    return local_schemas.AuthTokenPairResponse.model_validate(tokens, from_attributes=True)


@router.post("/refresh", response_model=local_schemas.AuthTokenPairResponse)
async def refresh(
    body: local_schemas.AuthRefreshRequest,
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> local_schemas.AuthTokenPairResponse:
    tokens = await auth_service.refresh_tokens(session, refresh_token=body.refresh_token)
    return local_schemas.AuthTokenPairResponse.model_validate(tokens, from_attributes=True)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    body: local_schemas.AuthLogoutRequest,
    access_token: Annotated[str | None, Depends(get_bearer_access_token_optional)],
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> None:
    await auth_service.logout(session, access_token=access_token, refresh_token=body.refresh_token)


@router.get("/me", response_model=local_schemas.UserMeResponse)
async def me(
    user: Annotated[models.User, Depends(get_current_active_user)],
) -> local_schemas.UserMeResponse:
    return local_schemas.UserMeResponse(id=user.id, login=user.login, is_active=user.is_active)
