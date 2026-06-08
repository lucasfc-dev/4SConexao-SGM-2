"""
Exception handlers for PDF Service API.
"""
from fastapi import Request
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
    InvalidAPIKeyException,
    FuncionalidadeNotAvailableException
)


def setup_exception_handlers(app):
    """Configure all exception handlers for the application"""
    
    @app.exception_handler(BadRequestException)
    async def bad_request_exception_handler(request: Request, exc: BadRequestException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": exc.message}
        )

    @app.exception_handler(UnauthorizedException)
    async def unauthorized_exception_handler(request: Request, exc: UnauthorizedException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": exc.message}
        )

    @app.exception_handler(ForbiddenException)
    async def forbidden_exception_handler(request: Request, exc: ForbiddenException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": exc.message}
        )

    @app.exception_handler(NotFoundException)
    async def not_found_exception_handler(request: Request, exc: NotFoundException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": exc.message}
        )

    @app.exception_handler(MethodNotAllowedException)
    async def method_not_allowed_exception_handler(request: Request, exc: MethodNotAllowedException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": exc.message}
        )

    @app.exception_handler(InternalServerErrorException)
    async def internal_server_error_exception_handler(request: Request, exc: InternalServerErrorException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": exc.message}
        )

    @app.exception_handler(InvalidTokenException)
    async def invalid_token_exception_handler(request: Request, exc: InvalidTokenException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": exc.message},
            headers={"WWW-Authenticate": "Bearer"}
        )

    @app.exception_handler(InvalidAPIKeyException)
    async def invalid_api_key_exception_handler(request: Request, exc: InvalidAPIKeyException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": exc.message}
        )

    @app.exception_handler(FuncionalidadeNotAvailableException)
    async def funcionalidade_not_available_exception_handler(request: Request, exc: FuncionalidadeNotAvailableException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": exc.message}
        )

    @app.exception_handler(APIException)
    async def api_exception_handler(request: Request, exc: APIException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": exc.message}
        )
