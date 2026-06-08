from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from fastapi import Request
from api.services.auth.auth_service import AuthClient
from api.exceptions import APIException, InvalidAPIKeyException
import re

public_static_routes = [    
    "/",
    "/openapi.json",
    "/redoc",
    "/docs",
    "/ouvidoria/estatisticas_esic/exportar_pdf/"
]

# Rotas que não precisam de autenticação (principalmente para debugging/health checks)
public_routes = [
    r"^/$"
]

async def auth_middleware(request: Request, call_next):
    """
    Middleware de autenticação para PDF Service.
    Verifica token JWT e inicializa AuthClient para endpoints protegidos.
    """
    path = request.url.path
    
    # Permite acesso sem autenticação para rotas públicas
    if (path in public_static_routes or 
        any(re.match(pattern, path) for pattern in public_routes) or 
        request.method == "OPTIONS"):
        return await call_next(request)
    
    api_key = request.headers.get("X-API-Key")
    if api_key:
        valid = await AuthClient.validate_api_key(api_key)
        if valid:
            return await call_next(request)
        raise InvalidAPIKeyException("Chave de API inválida")
    
    token = request.headers.get("Authorization")
    if token is None:
        return JSONResponse(
            {"error": "Token de autorização não encontrado"}, 
            status_code=401
        )
    
    # Extrai o token do header "Bearer {token}"
    try:
        token = token.split(" ")[1]
    except IndexError:
        return JSONResponse(
            {"error": "Formato de token inválido. Use: Bearer {token}"}, 
            status_code=401
        )
    
    # Inicializa AuthClient com o token
    try:
        auth_client: AuthClient = await AuthClient.create(token)
        
        # Adiciona o cliente de autenticação ao estado da requisição
        request.state.client = auth_client

        # Prossegue com a requisição
        response = await call_next(request)
        return response
    except APIException as e:
        # Middleware exceptions need explicit CORS headers
        return JSONResponse(
            {"error": e.message},
            status_code=e.status_code,
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Credentials": "true"
            }
        )
    except Exception as e:
        return JSONResponse(
            {"error": f"Erro na autenticação: {str(e)}"}, 
            status_code=500,
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Credentials": "true"
            }
        )