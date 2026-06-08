from starlette.responses import JSONResponse
from fastapi import Request
from fastapi.exceptions import HTTPException
from api.services.auth.auth_service import AuthClient
import re

public_static_routes = [    
    "/",
    "/openapi.json",
    "/redoc",
    "/chamado/",
    "/docs/"
]

public_routes = [
    r"^/chamado/[0-9a-f-]{36}/?$/", 
    r"^/chamado/protocolo/[A-F0-9]{6}-\d{4}-\d{4}/?$",
    r"^/chamado/estabelecimento/[0-9a-f-]{36}/estatisticas/?$",
    r"^/chamado/estabelecimento/[0-9a-f-]{36}/estatisticas/exportar/?$",
    r"^/docs/[0-9a-f-]{36}/content/?$",
    r"^/relatorio/[0-9a-f-]{36}/download/?$",
    r"^/relatorio/estabelecimento/[0-9a-f-]{36}/?$",
]


async def auth_middleware(request: Request, call_next):
    path = request.url.path

    if path in public_static_routes or any(re.match(pattern, path) for pattern in public_routes) or request.method == "OPTIONS":
        return await call_next(request)

    token = request.headers.get("Authorization")
    api_key = request.headers.get("X-API-Key")
    if not token and not api_key:
        return JSONResponse({"error": "Token não encontrado"}, status_code=403)

    token = token.split(" ")[1]

    try:
        auth_client:AuthClient = await AuthClient.create(token)
    except HTTPException as e:
        return JSONResponse({"error": e.detail}, status_code=e.status_code)

    request.state.client = auth_client
    has_ouv = auth_client.user.has_funcionalidade('Chamados Ouvidoria')
    if not has_ouv:
        return JSONResponse(
            content={'error': 'Estabelecimento não possui essa funcionalidade'},
            status_code=403
        )

    response = await call_next(request)
    return response
