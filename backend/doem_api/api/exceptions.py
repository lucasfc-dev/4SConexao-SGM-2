"""Custom exceptions for the DOEM API."""

from http import HTTPStatus


class APIException(Exception):
    """Base exception class for all API exceptions."""
    
    def __init__(self, message: str, status_code: int = HTTPStatus.INTERNAL_SERVER_ERROR):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class BadRequestException(APIException):
    """Exception raised for bad requests (400)."""
    
    def __init__(self, message: str = "Bad Request"):
        super().__init__(message, HTTPStatus.BAD_REQUEST)


class UnauthorizedException(APIException):
    """Exception raised for unauthorized access (401)."""
    
    def __init__(self, message: str = "Unauthorized"):
        super().__init__(message, HTTPStatus.UNAUTHORIZED)


class ForbiddenException(APIException):
    """Exception raised for forbidden access (403)."""
    
    def __init__(self, message: str = "Forbidden"):
        super().__init__(message, HTTPStatus.FORBIDDEN)


class NotFoundException(APIException):
    """Exception raised when a resource is not found (404)."""
    
    def __init__(self, message: str = "Not Found"):
        super().__init__(message, HTTPStatus.NOT_FOUND)


class MethodNotAllowedException(APIException):
    """Exception raised for method not allowed (405)."""
    
    def __init__(self, message: str = "Method Not Allowed"):
        super().__init__(message, HTTPStatus.METHOD_NOT_ALLOWED)


class InternalServerErrorException(APIException):
    """Exception raised for internal server errors (500)."""
    
    def __init__(self, message: str = "Internal Server Error"):
        super().__init__(message, HTTPStatus.INTERNAL_SERVER_ERROR)


class InvalidTokenException(UnauthorizedException):
    """Exception raised for invalid or expired tokens."""
    
    def __init__(self, message: str = "Invalid or expired token"):
        super().__init__(message)


class CertificateException(BadRequestException):
    """Exception raised for certificate-related errors."""
    
    def __init__(self, message: str = "Certificate error"):
        super().__init__(message)


class CertificateExpiredException(CertificateException):
    """Exception raised when certificate has expired."""
    
    def __init__(self, message: str = "Certificado expirado"):
        super().__init__(message)


class InvalidCertificatePasswordException(CertificateException):
    """Exception raised for invalid certificate password."""
    
    def __init__(self, message: str = "Certificado ou senha inválidos"):
        super().__init__(message)


class FuncionalidadeNotAvailableException(ForbiddenException):
    """Exception raised when establishment doesn't have required functionality."""
    
    def __init__(self, message: str = "Estabelecimento não possui essa funcionalidade"):
        super().__init__(message)
