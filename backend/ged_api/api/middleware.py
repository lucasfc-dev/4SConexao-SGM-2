from fastapi import Request
from fastapi.responses import JSONResponse
from api.services.auth.auth_service import AuthClient
from api.exceptions import ForbiddenException, FuncionalidadeNotAvailableException, InvalidAPIKeyException, APIException
import re

public_static_routes = [    
    "/openapi.json",
    "/redoc",
]

public_routes = [
    r"^/$",
    r"^/docs/[0-9a-f-]{36}/content/$",
    r"^/docs/[0-9a-f-]{36}/$",
    r"^/docs/estabelecimento/[0-9a-f-]{36}/$",
    r"^/docs/valida/[^/]+/$",
    r"^/tipo/estabelecimento/[0-9a-f-]{36}/$",
    r"^/docs/estabelecimento/[0-9a-f-]{36}/exportar/$",
    r"^/docs/vereador/[0-9a-f-]{36}/$",
    r"^/vereador/[0-9a-f-]{36}/foto/$",
]


async def auth_middleware(request: Request, call_next):
    path = request.url.path

    if path in public_static_routes or any(re.match(pattern, path) for pattern in public_routes) or request.method == "OPTIONS":
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
        has_ged = auth_client.user.has_funcionalidade('Gestão de Documentos')
        if not has_ged:
            raise FuncionalidadeNotAvailableException('Estabelecimento não possui essa funcionalidade')

        response = await call_next(request)
        return response
    
    except APIException as exc:
        # Handle custom API exceptions in middleware
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
