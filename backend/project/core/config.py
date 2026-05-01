from typing import ClassVar, Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Config(BaseSettings):
    model_config: ClassVar[SettingsConfigDict] = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )

    MODE: Literal["DEV", "TEST", "PROD"] = "DEV"

    SQLALCHEMY_ECHO: bool = False

    DATABASE_URL: str

    AUTH_ACCESS_TOKEN_LIFETIME: int = 60 * 30
    AUTH_REFRESH_TOKEN_LIFETIME: int = 60 * 60 * 24 * 7

    SALT: str

    # Comma-separated list of origins. If empty, CORS middleware is not enabled.
    CORS_ALLOW_ORIGINS: list[str] = []


config = Config()  # pyright: ignore[reportCallIssue]
