from __future__ import annotations

from datetime import timedelta
from typing import Any, BinaryIO, cast

import aioboto3  # pyright: ignore[reportMissingTypeStubs]

from project.core.config import config

from . import schemes as local_schemes


def _get_session() -> Any:
    return aioboto3.Session(  # type: ignore[no-any-return]
        aws_access_key_id=config.S3_ACCESS_KEY,
        aws_secret_access_key=config.S3_SECRET_KEY,
        region_name=config.S3_REGION,
    )


async def put_object(
    *,
    key: str,
    fileobj: BinaryIO,
    content_type: str | None,
) -> local_schemes.StoredObject:
    session = _get_session()

    extra_args: dict[str, str] = {}
    if content_type:
        extra_args["ContentType"] = content_type

    client_cm = session.client(
        "s3",
        endpoint_url=config.S3_ENDPOINT_URL,
        use_ssl=config.S3_USE_SSL,
    )
    async with client_cm as s3:
        await s3.upload_fileobj(  # pyright: ignore[reportUnknownMemberType]
            Fileobj=fileobj,
            Bucket=config.S3_BUCKET,
            Key=key,
            ExtraArgs=extra_args or None,
        )

    return local_schemes.StoredObject(bucket=config.S3_BUCKET, key=key)


async def delete_object(*, key: str) -> None:
    session = _get_session()

    client_cm = session.client(
        "s3",
        endpoint_url=config.S3_ENDPOINT_URL,
        use_ssl=config.S3_USE_SSL,
    )
    async with client_cm as s3:
        await s3.delete_object(  # pyright: ignore[reportUnknownMemberType]
            Bucket=config.S3_BUCKET,
            Key=key,
        )


async def create_presigned_get_url(*, key: str) -> str:
    session = _get_session()

    expires_in = int(timedelta(seconds=config.S3_PRESIGNED_GET_TTL_SECONDS).total_seconds())
    client_cm = session.client(
        "s3",
        endpoint_url=config.S3_ENDPOINT_URL,
        use_ssl=config.S3_USE_SSL,
    )
    async with client_cm as s3:
        url = await s3.generate_presigned_url(  # pyright: ignore[reportUnknownMemberType]
            ClientMethod="get_object",
            Params={"Bucket": config.S3_BUCKET, "Key": key},
            ExpiresIn=expires_in,
        )
        return cast(str, url)

