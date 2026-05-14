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

    # S3-compatible storage (MinIO) for attachments
    S3_ENDPOINT_URL: str
    S3_REGION: str = "us-east-1"
    S3_ACCESS_KEY: str
    S3_SECRET_KEY: str
    S3_BUCKET: str
    S3_USE_SSL: bool = False

    S3_PRESIGNED_GET_TTL_SECONDS: int = 60 * 10

    ATTACHMENTS_MAX_FILES: int = 10
    ATTACHMENTS_MAX_FILE_SIZE_BYTES: int = 10 * 1024 * 1024

    # Qdrant + local embeddings (similar closed tickets)
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_COLLECTION: str = "ticket_solutions"
    EMBEDDING_MODEL_NAME: str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
    EMBEDDING_VECTOR_SIZE: int = 384


config = Config()  # pyright: ignore[reportCallIssue]
