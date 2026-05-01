from typing import Any

from typing_extensions import override


class AppException(Exception):
    message: str
    details: dict[str, Any]

    def __init__(
        self,
        message: str = "Application error",
        *,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.details = dict(details) if details else {}

    def as_dict(self) -> dict[str, Any]:
        return {"message": self.message, **self.details}


class DetailedError(AppException):
    def __init__(
        self,
        message: str,
        *,
        details: dict[str, Any] | None = None,
        **extra: dict[str, Any],
    ) -> None:
        merged = dict(details) if details else {}
        merged.update(extra)
        super().__init__(message, details=merged)

    @override
    def __str__(self) -> str:
        parts = [f"{type(self).__name__}: {self.message}"]
        if self.details:
            parts.append(str(self.details))
        return " ".join(parts)


class BadRequestError(DetailedError):
    pass


class UnAuthorizedError(DetailedError):
    pass


class ForbiddenError(DetailedError):
    pass


class NotFoundError(DetailedError):
    pass


class ConflictError(DetailedError):
    pass


class FileSizeError(DetailedError):
    pass


class UnsupportedMediaTypeError(DetailedError):
    pass


class TooManyRequestsError(DetailedError):
    pass


class ServiceUnavailableError(DetailedError):
    pass


class ServiceNotImplementedError(DetailedError):
    pass


class BadGatewayError(DetailedError):
    pass
