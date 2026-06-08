from starlette.responses import JSONResponse
from fastapi import Request
from api.services.auth.auth_service import AuthClient
from api.exceptions import APIException, UnauthorizedException, ForbiddenException, FuncionalidadeNotAvailableException
import re

public_static_routes = [    
    "/openapi.json",
    "/redoc"
]

public_routes = [
    r"^/licitacao/estabelecimento/[0-9a-f-]{36}/?$",          # GET /licitacao/estabelecimento/{id}/
    r"^/secao/estabelecimento/[0-9a-f-]{36}/?$",          # GET /secao/estabelecimento/{id}/
    r"^/licitacao/[0-9a-f-]{36}/?$",            # GET /licitacao/{id}/
    r"^/licitacao/[0-9a-f-]{36}/docs/?$",       # GET /licitacao/{id}/docs/
    r"^/licitacao/estabelecimento/[0-9a-f-]{36}/exportar/?$",  # GET /licitacao/estabelecimento/{id}/exportar/
    r"^/fiscal_contrato/estabelecimento/[0-9a-f-]{36}/?$",    # GET /fiscal_contrato/estabelecimento/{id}/
    r"^/fiscal_contrato/[0-9a-f-]{36}/?$",      # GET /fiscal_contrato/{id}/
    r"^/fiscal_contrato/[0-9a-f-]{36}/docs/?$",
    r"^/fiscal_contrato/estabelecimento/[0-9a-f-]{36}/exportar/?$", # GET /fiscal_contrato/estabelecimento/{id}/exportar/
    r"^/dispensa/estabelecimento/[0-9a-f-]{36}/?$",           # GET /dispensa/estabelecimento/{id}/
    r"^/dispensa/[0-9a-f-]{36}/?$",            # GET /dispensa/{id}/
    r"^/dispensa/[0-9a-f-]{36}/docs/?$",       # GET /dispensa/{id}/docs/
    r"^/dispensa/estabelecimento/[0-9a-f-]{36}/exportar/?$",   # GET /dispensa/estabelecimento/{id}/exportar/
    r"^/contrato/estabelecimento/[0-9a-f-]{36}/?$",           # GET /contrato/estabelecimento/{id}/
    r"^/contrato/[0-9a-f-]{36}/?$",           # GET /contrato/{id}/
    r"^/contrato/[0-9a-f-]{36}/docs/?$",      # GET /contrato/{id}/docs/
    r"^/contrato/estabelecimento/[0-9a-f-]{36}/exportar/?$",   # GET /contrato/estabelecimento/{id}/exportar/
    r"^/docs/[0-9a-f-]{36}/?$",              # GET /docs/{id}/
    r"^/docs/[0-9a-f-]{36}/content/?$",      # GET /docs/{id}/content/
    r"^/pessoa/estabelecimento/[0-9a-f-]{36}/?$",             # GET /pessoa/estabelecimento/{id}/
     r"^/pessoa/[0-9a-f-]{36}/?$",             # GET /pessoa/{id}/
    r"^/modalidade/estabelecimento/[0-9a-f-]{36}/?$",         # GET /modalidade/estabelecimento/{id}/
    r"^/comissao/responsavel/$",             # GET /comissao/responsavel/
]

async def auth_middleware(request: Request, call_next):
    path = request.url.path
    if (path in public_static_routes or
        (any(re.match(pattern, path) for pattern in public_routes) and request.method == "GET") or
        request.method == "OPTIONS"):
        return await call_next(request)
    token = request.headers.get("Authorization")
    if token is None:
        response = JSONResponse({"error": "Token não encontrado"}, status_code=401)
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "*"
        return response
    token = token.split(" ")[1]
    try:
        auth_client:AuthClient = await AuthClient.create(token)
    except APIException as e:
        response = JSONResponse({"error": e.message}, status_code=e.status_code)
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "*"
        return response
    request.state.client = auth_client
    has_atos = auth_client.user.has_funcionalidade('Atos Contratatórios') 
    if not has_atos:
        response = JSONResponse(
            content={'error': 'Estabelecimento não possui essa funcionalidade'},
            status_code=403
        )
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "*"
        return response

    response = await call_next(request)
    return response


