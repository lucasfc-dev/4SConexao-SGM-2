from __future__ import annotations
import httpx
from api.exceptions import InternalServerErrorException, NotFoundException
from api.schemas import EstabelecimentoOut
from api.config import SECRET_KEY
from typing import Optional



from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from services.auth.auth_service import AuthClient

class EstabelecimentoDomain:
    def __init__(self, model: EstabelecimentoOut, client:"AuthClient"):
        self.model = model
        self.client = client
        self._funcionalidades_cache = None
        self._encrypt_pass_cache = None

    @property
    def id(self):
        return self.model.id

    async def get_icone_bytes(self) -> bytes:
        url = f"{self.client.base_url}/estabelecimento/icone/{self.id}/"
        headers = self.client.headers

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=headers)
                response.raise_for_status()
                return response.content 
        except httpx.HTTPError as e:
            raise InternalServerErrorException(f"Erro ao buscar ícone do estabelecimento: {e}")
        
    async def get_orgao(self,orgao_id) -> Optional[dict]:
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.client.base_url}/orgao/{orgao_id}/",
                    headers=self.client.headers
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                raise InternalServerErrorException(f"Erro ao buscar órgão: {e}")
            
    async def get_orgaos(self) -> Optional[dict]:
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.client.base_url}/orgao/",
                    headers=self.client.headers
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                raise InternalServerErrorException(f"Erro ao buscar órgão: {e}")

    async def get_funcionalidades(self) -> list[dict]:
        if self._funcionalidades_cache is not None:
            return self._funcionalidades_cache

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.client.base_url}/pacote/funcionalidades/{self.id}/",
                    headers=self.client.headers
                )
                response.raise_for_status()
                self._funcionalidades_cache = response.json()
                return self._funcionalidades_cache
        except httpx.HTTPError as e:
            raise InternalServerErrorException(f"Erro ao buscar funcionalidades do pacote: {e}")

    async def has_funcionalidade(self, nome: str) -> bool:
        funcionalidades = await self.get_funcionalidades()
        return any(func['nome'] == nome for func in funcionalidades)
    
    async def get_cert_file(self) -> bytes:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.client.base_url}/estabelecimento/{self.id}/cert_file/",
                headers=self.client.headers,
            )
            resp.raise_for_status()
            data = resp.content
        if not data:
            raise NotFoundException("Certificado não encontrado")
        return data

    async def get_cert_password(self):
        if self._encrypt_pass_cache is not None:
            return self._encrypt_pass_cache
        async with httpx.AsyncClient() as client:
            response = await client.get(
                url=f'{self.client.base_url}/estabelecimento/{self.id}/cert_password/',
                headers=self.client.headers
            )
            data = response.json()
            return data["senha_cert"]
        
    # async def serialize_documents(self, document_models) -> list[ServerDocumentOut]:
    #     result = []
    #     for doc in document_models:
    #         orgao = await self.get_orgao(doc.orgao)
    #         result.append(ServerDocumentOut.from_orm(doc, orgao))
    #     return result
