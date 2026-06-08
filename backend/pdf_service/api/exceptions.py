"""
Custom exceptions for PDF Service API.
"""
import http


class APIException(Exception):
    """Base exception for API errors"""
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class BadRequestException(APIException):
    """Exception for 400 Bad Request errors"""
    def __init__(self, message: str = "Bad Request"):
        super().__init__(message, http.HTTPStatus.BAD_REQUEST)


class UnauthorizedException(APIException):
    """Exception for 401 Unauthorized errors"""
    def __init__(self, message: str = "Unauthorized"):
        super().__init__(message, http.HTTPStatus.UNAUTHORIZED)


class ForbiddenException(APIException):
    """Exception for 403 Forbidden errors"""
    def __init__(self, message: str = "Forbidden"):
        super().__init__(message, http.HTTPStatus.FORBIDDEN)


class NotFoundException(APIException):
    """Exception for 404 Not Found errors"""
    def __init__(self, message: str = "Not Found"):
        super().__init__(message, http.HTTPStatus.NOT_FOUND)


class MethodNotAllowedException(APIException):
    """Exception for 405 Method Not Allowed errors"""
    def __init__(self, message: str = "Method Not Allowed"):
        super().__init__(message, http.HTTPStatus.METHOD_NOT_ALLOWED)


class InternalServerErrorException(APIException):
    """Exception for 500 Internal Server Error"""
    def __init__(self, message: str = "Internal Server Error"):
        super().__init__(message, http.HTTPStatus.INTERNAL_SERVER_ERROR)


class InvalidTokenException(APIException):
    """Exception for invalid JWT tokens"""
    def __init__(self, message: str = "Invalid token"):
        super().__init__(message, http.HTTPStatus.UNAUTHORIZED)


class InvalidAPIKeyException(APIException):
    """Exception for invalid API keys"""
    def __init__(self, message: str = "Invalid API key"):
        super().__init__(message, http.HTTPStatus.UNAUTHORIZED)


class FuncionalidadeNotAvailableException(APIException):
    """Exception for unavailable functionality"""
    def __init__(self, message: str = "Functionality not available"):
        super().__init__(message, http.HTTPStatus.FORBIDDEN)
