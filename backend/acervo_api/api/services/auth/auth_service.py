import httpx
from pydantic import ValidationError
from api.config import AUTH_API_URL
from api.schemas import UserOut
from api.services.auth.domains import users_domain, estabelecimento_domain
from api.exceptions import InternalServerErrorException
from typing import Optional


class AuthClient:
    def __init__(self, token: str):
        self.token = token
        self.base_url = AUTH_API_URL
        self.headers = {"Authorization": f"Bearer {self.token}"}
        self.user: Optional[users_domain.UserDomain] = None
        self.estabelecimento: Optional[estabelecimento_domain.EstabelecimentoDomain] = None

    @classmethod
    async def create(cls, token: str) -> "AuthClient":
        self = cls(token)
        async with httpx.AsyncClient() as client:
            try:
                user_response = await client.get(
                    f"{self.base_url}/user/server/me/",
                    headers=self.headers,
                )
                user_response.raise_for_status()
                user_data = user_response.json()
                user_model = UserOut(**user_data)

                self.user = users_domain.UserDomain(user_model, self)

                if user_model.estabelecimento:
                    self.estabelecimento = estabelecimento_domain.EstabelecimentoDomain(
                        user_model.estabelecimento, self
                    )
                return self

            except (httpx.HTTPError, ValidationError) as e:
                raise InternalServerErrorException(f"Erro ao inicializar AuthClient: {e}")

    @staticmethod
    async def validate_api_key(x_api_key: str) -> bool:
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{AUTH_API_URL}/auth/validate-api-key/",
                    headers={"X-API-Key": x_api_key},
                )
                response.raise_for_status()
                data = response.json()
                return data.get("valid", False)
            except httpx.HTTPError:
                return False
