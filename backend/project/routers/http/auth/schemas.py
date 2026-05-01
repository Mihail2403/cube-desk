from pydantic import BaseModel, Field


class AuthRegisterRequest(BaseModel):
    login: str = Field(min_length=3, max_length=64)
    password: str = Field(min_length=8, max_length=128)


class AuthLoginRequest(BaseModel):
    login: str = Field(min_length=3, max_length=64)
    password: str = Field(min_length=8, max_length=128)


class AuthRefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=16, max_length=128)


class AuthLogoutRequest(BaseModel):
    refresh_token: str | None = Field(default=None, min_length=16, max_length=128)


class AuthTokenPairResponse(BaseModel):
    access_token: str
    access_expires_in: int
    refresh_token: str
    refresh_expires_in: int


class UserMeResponse(BaseModel):
    id: int
    login: str
    is_active: bool

