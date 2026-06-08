from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
from fastapi.responses import JSONResponse
from api.services.auth.auth_service import AuthClient
from api.exceptions import ForbiddenException, FuncionalidadeNotAvailableException, APIException
from api.config import INTER_SERVICE_API_KEY
import re


public_static_routes = [    
    "/openapi.json",
    "/redoc"
]

public_routes = [
    r"^/$",
    r"^/diario/[0-9a-f-]{36}/content/$",
    r"^/diario/[0-9a-f-]{36}/$",
    r"^/diario/estabelecimento/[0-9a-f-]{36}/$",
    r"^/diario/estabelecimento/[0-9a-f-]{36}/count/$",
    r"^/diario/valida/[^/]+/$"
]


def _allow_shared_upload_without_doem_feature(request: Request) -> bool:
    """Allow GED -> DOEM shared upload without DOEM feature check.

    This bypass is intentionally restricted to one route and requires a valid
    inter-service API key.
    """
    return (
        request.method == "POST"
        and request.url.path == "/docs/uploadfile/"
        and INTER_SERVICE_API_KEY
        and request.headers.get("X-API-Key") == INTER_SERVICE_API_KEY
    )


async def auth_middleware(request: Request, call_next):
    path = request.url.path
    if path in public_static_routes or any(re.match(pattern, path) for pattern in public_routes) and request.method == "GET" or request.method == "OPTIONS":
        return await call_next(request)
    
    try:
        token = request.headers.get("Authorization")
        if token is None:
            raise ForbiddenException("Token não encontrado")
        
        token = token.split(" ")[1]
        auth_client: AuthClient = await AuthClient.create(token)
        
        request.state.client = auth_client

        if _allow_shared_upload_without_doem_feature(request):
            return await call_next(request)

        has_doem = auth_client.user.has_funcionalidade('Diário Oficial Eletrônico')
        if not has_doem:
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
                "Access-Control-Allow-Headers": "*"
            }
        )
    except Exception as exc:
        # Handle unexpected exceptions
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Headers": "*"
            }
        )


