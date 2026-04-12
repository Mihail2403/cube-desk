from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Config(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )

    MODE: Literal["DEV", "TEST", "PROD"] = "DEV"

    SQLALCHEMY_ECHO: bool = False

    DATABASE_URL: str


config = Config()  # type: ignore
