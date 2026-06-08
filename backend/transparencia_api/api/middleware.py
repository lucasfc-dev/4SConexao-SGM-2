from starlette.responses import JSONResponse
from fastapi import Request
from api.services.auth.auth_service import AuthClient
from api.exceptions import APIException
import re

async def auth_middleware(request: Request, call_next):

    if request.method in ("OPTIONS","GET"):
        return await call_next(request)

    token = request.headers.get("Authorization")
    if not token:
        return JSONResponse({"error": "Token não encontrado"}, status_code=403)

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
    has_ged = auth_client.user.has_funcionalidade('Portal da Transparência')
    if not has_ged:
        return JSONResponse(
            content={'error': 'Estabelecimento não possui essa funcionalidade'},
            status_code=403
        )

    response = await call_next(request)
    return response
