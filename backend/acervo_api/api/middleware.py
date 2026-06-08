from fastapi import Request
from fastapi.responses import JSONResponse
from api.services.auth.auth_service import AuthClient
from api.exceptions import (
    ForbiddenException,
    FuncionalidadeNotAvailableException,
    InvalidAPIKeyException,
    APIException,
)

public_static_routes = [
    "/openapi.json",
    "/redoc",
    "/docs",
]

public_routes: list[str] = [
    r"^/$",
]


async def auth_middleware(request: Request, call_next):
    import re

    path = request.url.path

    if (
        path in public_static_routes
        or any(re.match(pattern, path) for pattern in public_routes)
        or request.method == "OPTIONS"
    ):
        return await call_next(request)

    try:
        api_key = request.headers.get("X-API-Key")
        if api_key:
            valid = await AuthClient.validate_api_key(api_key)
            if valid:
                return await call_next(request)
            raise InvalidAPIKeyException("Chave de API inválida")

        token = request.headers.get("Authorization")
        if not token:
            raise ForbiddenException("Token não encontrado")

        token = token.split(" ")[1]
        auth_client: AuthClient = await AuthClient.create(token)

        request.state.client = auth_client

        # Gate de funcionalidade do estabelecimento (superuser sem estab pula).
        if auth_client.estabelecimento and not auth_client.user.has_funcionalidade('Acervo Digital'):
            raise FuncionalidadeNotAvailableException('Estabelecimento não possui essa funcionalidade')

        response = await call_next(request)
        return response

    except APIException as exc:
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message},
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Headers": "*",
            },
        )
    except Exception as exc:
        return JSONResponse(
            status_code=500,
            content={"detail": f"Internal server error: {exc}"},
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Headers": "*",
            },
        )
