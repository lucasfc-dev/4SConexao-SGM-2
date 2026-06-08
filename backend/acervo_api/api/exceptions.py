"""Custom exceptions for the Acervo API."""

from http import HTTPStatus


class APIException(Exception):
    """Base exception class for all API exceptions."""

    def __init__(self, message: str, status_code: int = HTTPStatus.INTERNAL_SERVER_ERROR):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class BadRequestException(APIException):
    def __init__(self, message: str = "Bad Request"):
        super().__init__(message, HTTPStatus.BAD_REQUEST)


class UnauthorizedException(APIException):
    def __init__(self, message: str = "Unauthorized"):
        super().__init__(message, HTTPStatus.UNAUTHORIZED)


class ForbiddenException(APIException):
    def __init__(self, message: str = "Forbidden"):
        super().__init__(message, HTTPStatus.FORBIDDEN)


class NotFoundException(APIException):
    def __init__(self, message: str = "Not Found"):
        super().__init__(message, HTTPStatus.NOT_FOUND)


class MethodNotAllowedException(APIException):
    def __init__(self, message: str = "Method Not Allowed"):
        super().__init__(message, HTTPStatus.METHOD_NOT_ALLOWED)


class ConflictException(APIException):
    def __init__(self, message: str = "Conflict"):
        super().__init__(message, HTTPStatus.CONFLICT)


class InternalServerErrorException(APIException):
    def __init__(self, message: str = "Internal Server Error"):
        super().__init__(message, HTTPStatus.INTERNAL_SERVER_ERROR)


class InvalidTokenException(UnauthorizedException):
    def __init__(self, message: str = "Invalid or expired token"):
        super().__init__(message)


class InvalidAPIKeyException(UnauthorizedException):
    def __init__(self, message: str = "Invalid API key"):
        super().__init__(message)


class FuncionalidadeNotAvailableException(ForbiddenException):
    def __init__(self, message: str = "Estabelecimento não possui essa funcionalidade"):
        super().__init__(message)
