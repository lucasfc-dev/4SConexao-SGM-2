from __future__ import annotations
import httpx
from api.schemas import EstabelecimentoOut
from api.exceptions import InternalServerErrorException
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from api.services.auth.auth_service import AuthClient


class EstabelecimentoDomain:
    def __init__(self, model: EstabelecimentoOut, client: "AuthClient"):
        self.model = model
        self.client = client
        self._funcionalidades_cache = None

    @property
    def id(self):
        return self.model.id

    async def get_orgao(self, orgao_id) -> Optional[dict]:
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.client.base_url}/orgao/{orgao_id}/",
                    headers=self.client.headers,
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                raise InternalServerErrorException(f"Erro ao buscar órgão: {e}")

    async def get_orgaos(self) -> Optional[list]:
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.client.base_url}/orgao/",
                    headers=self.client.headers,
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                raise InternalServerErrorException(f"Erro ao buscar órgãos: {e}")

    async def get_funcionalidades(self) -> list[dict]:
        if self._funcionalidades_cache is not None:
            return self._funcionalidades_cache
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.client.base_url}/pacote/funcionalidades/{self.id}/",
                    headers=self.client.headers,
                )
                response.raise_for_status()
                self._funcionalidades_cache = response.json()
                return self._funcionalidades_cache
        except httpx.HTTPError as e:
            raise InternalServerErrorException(f"Erro ao buscar funcionalidades do pacote: {e}")

    async def has_funcionalidade(self, nome: str) -> bool:
        funcionalidades = await self.get_funcionalidades()
        return any(func['nome'] == nome for func in funcionalidades)

    async def get_users(self) -> list[dict]:
        """Lista os usuários do estabelecimento do client (contexto com token)."""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.client.base_url}/user/all/estabelecimento/",
                    headers=self.client.headers,
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                raise InternalServerErrorException(f"Erro ao buscar usuários do estabelecimento: {e}")
