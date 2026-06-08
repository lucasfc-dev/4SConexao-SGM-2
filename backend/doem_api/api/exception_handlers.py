"""Exception handlers for the DOEM API."""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from api.exceptions import (
    APIException,
    BadRequestException,
    UnauthorizedException,
    ForbiddenException,
    NotFoundException,
    MethodNotAllowedException,
    InternalServerErrorException,
    InvalidTokenException,
    CertificateException,
    CertificateExpiredException,
    InvalidCertificatePasswordException,
    FuncionalidadeNotAvailableException
)


def setup_exception_handlers(app: FastAPI):
    """Register all exception handlers with the FastAPI app."""
    
    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        """Catch-all handler for unhandled exceptions."""
        return JSONResponse(
            status_code=500,
            content={"detail": f"Internal server error: {exc}"}
        )

    @app.exception_handler(APIException)
    async def api_exception_handler(request: Request, exc: APIException):
        """Global handler for all custom API exceptions."""
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message}
        )

    @app.exception_handler(BadRequestException)
    async def bad_request_handler(request: Request, exc: BadRequestException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message}
        )

    @app.exception_handler(UnauthorizedException)
    async def unauthorized_handler(request: Request, exc: UnauthorizedException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message},
            headers={"WWW-Authenticate": "Bearer"}
        )

    @app.exception_handler(ForbiddenException)
    async def forbidden_handler(request: Request, exc: ForbiddenException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message}
        )

    @app.exception_handler(NotFoundException)
    async def not_found_handler(request: Request, exc: NotFoundException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message}
        )

    @app.exception_handler(MethodNotAllowedException)
    async def method_not_allowed_handler(request: Request, exc: MethodNotAllowedException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message}
        )

    @app.exception_handler(InternalServerErrorException)
    async def internal_server_error_handler(request: Request, exc: InternalServerErrorException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message}
        )

    @app.exception_handler(InvalidTokenException)
    async def invalid_token_handler(request: Request, exc: InvalidTokenException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message},
            headers={"WWW-Authenticate": "Bearer"}
        )

    @app.exception_handler(CertificateException)
    async def certificate_handler(request: Request, exc: CertificateException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message}
        )

    @app.exception_handler(CertificateExpiredException)
    async def certificate_expired_handler(request: Request, exc: CertificateExpiredException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message}
        )

    @app.exception_handler(InvalidCertificatePasswordException)
    async def invalid_certificate_password_handler(request: Request, exc: InvalidCertificatePasswordException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message}
        )

    @app.exception_handler(FuncionalidadeNotAvailableException)
    async def funcionalidade_not_available_handler(request: Request, exc: FuncionalidadeNotAvailableException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message}
        )
