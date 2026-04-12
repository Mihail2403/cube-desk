from collections.abc import Awaitable
from functools import partial
from typing import Callable

from fastapi import FastAPI, Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from project.core.exceptions import (
    AppException,
    BadGatewayError,
    BadRequestError,
    ConflictError,
    FileSizeError,
    ForbiddenError,
    NotFoundError,
    ServiceUnavailableError,
    TooManyRequestsError,
    UnAuthorizedError,
    UnsupportedMediaTypeError,
)


def setup_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(BadRequestError, error_handler(status.HTTP_400_BAD_REQUEST))
    app.add_exception_handler(UnAuthorizedError, error_handler(status.HTTP_401_UNAUTHORIZED))
    app.add_exception_handler(ForbiddenError, error_handler(status.HTTP_403_FORBIDDEN))
    app.add_exception_handler(NotFoundError, error_handler(status.HTTP_404_NOT_FOUND))
    app.add_exception_handler(ConflictError, error_handler(status.HTTP_409_CONFLICT))
    app.add_exception_handler(
        FileSizeError, error_handler(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE)
    )
    app.add_exception_handler(
        UnsupportedMediaTypeError, error_handler(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE)
    )
    app.add_exception_handler(
        TooManyRequestsError, error_handler(status.HTTP_429_TOO_MANY_REQUESTS)
    )
    app.add_exception_handler(BadGatewayError, error_handler(status.HTTP_502_BAD_GATEWAY))
    app.add_exception_handler(
        ServiceUnavailableError, error_handler(status.HTTP_503_SERVICE_UNAVAILABLE)
    )
    app.add_exception_handler(RequestValidationError, validation_error_handler)  # pyright: ignore[reportArgumentType]
    app.add_exception_handler(Exception, unknown_error_handler)


async def unknown_error_handler(request: Request, err: Exception) -> JSONResponse:
    return JSONResponse(
        content={"message": "Internal server error"},
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )


async def validation_error_handler(request: Request, err: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        content={"detail": jsonable_encoder(err.errors())},
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
    )


def error_handler(
    status_code: int,
) -> Callable[..., Awaitable[JSONResponse]]:
    return partial(app_error_handler, status_code=status_code)


async def app_error_handler(request: Request, err: AppException, status_code: int) -> JSONResponse:
    return await handle_error(
        request=request,
        err=err,
        status_code=status_code,
    )


async def handle_error(
    request: Request,
    err: AppException,
    status_code: int,
) -> JSONResponse:
    return JSONResponse(content=err.as_dict(), status_code=status_code)
