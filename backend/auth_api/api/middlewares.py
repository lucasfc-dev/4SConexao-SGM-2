from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from api.security import get_current_user, verify_api_key
from api.exceptions import InvalidTokenException, InvalidAPIKeyException, UnauthorizedException, APIException
import re

public_static_routes = [
    "/",
    "/auth/token/",
    "/user/password_reset/",
    "/user/check_reset_token/",
    "/docs",
    "/openapi.json",
    "/redoc",
    "/auth/validate-api-key/"
]

public_regex_routes = [
    r"^/orgao/estabelecimento/[0-9a-f-]{36}/$",
    r"^/estabelecimento/[0-9a-f-]{36}/nome/$",
]

class AuthRequestMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if (
            path in public_static_routes
            or any(re.match(pattern, path) for pattern in public_regex_routes)
            or request.method == "OPTIONS"
        ):
            return await call_next(request)
        
        try:
            api_key = request.headers.get("X-API-Key")
            if api_key:
                if verify_api_key(api_key):
                    return await call_next(request)
                raise InvalidAPIKeyException("Chave de API inválida")
            
            token = request.headers.get("Authorization")
            if not token:
                raise UnauthorizedException("Token não encontrado")
            
            token = token.split(" ")[1]
            request.state.token = token

            user = await get_current_user(token)
            request.state.user = user
            response = await call_next(request)
            return response
        
        except APIException as exc:
            # Handle custom API exceptions in middleware
            headers = {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Headers": "*"
            }
            if isinstance(exc, (UnauthorizedException, InvalidTokenException, InvalidAPIKeyException)):
                headers["WWW-Authenticate"] = "Bearer"
            
            return JSONResponse(
                status_code=exc.status_code,
                content={"detail": exc.message},
                headers=headers
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


