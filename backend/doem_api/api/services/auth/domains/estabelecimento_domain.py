from __future__ import annotations
import httpx
from api.exceptions import InternalServerErrorException, NotFoundException
from api.schemas import EstabelecimentoOut, ServerDocumentOut
from api.config import SECRET_KEY
from cryptography.fernet import Fernet
from typing import Optional



from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from services.auth.auth_service import AuthClient

class EstabelecimentoDomain:
    def __init__(self, model: EstabelecimentoOut, client:"AuthClient"):
        self.model = model
        self.client = client
        self._funcionalidades_cache = None
        
        # Valida e inicializa o cipher para criptografia
        if not SECRET_KEY:
            raise InternalServerErrorException("SECRET_KEY não configurada")
        
        try:
            self.cipher = Fernet(SECRET_KEY)
        except Exception as e:
            raise InternalServerErrorException(f"Erro ao inicializar Fernet com SECRET_KEY: {e}") 

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
        """Obtém o arquivo do certificado digital
        
        Returns:
            bytes: Conteúdo do arquivo do certificado
            
        Raises:
            NotFoundException: Quando certificado não está cadastrado
            InternalServerErrorException: Para erros de comunicação
        """
        try:
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
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                raise NotFoundException("Certificado não encontrado")
            raise InternalServerErrorException(f"Erro ao buscar certificado: {e}")
        except httpx.HTTPError as e:
            raise InternalServerErrorException(f"Erro de conexão ao buscar certificado: {e}")
        except Exception as e:
            raise InternalServerErrorException(f"Erro inesperado ao buscar certificado: {e}")

    async def get_cert_password(self) -> str:
        """Obtém a senha descriptografada do certificado digital
        
        Returns:
            str: Senha do certificado em texto puro
            
        Raises:
            NotFoundException: Quando senha do certificado não está cadastrada
            InternalServerErrorException: Para erros de comunicação ou descriptografia
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    url=f'{self.client.base_url}/estabelecimento/{self.id}/cert_password/',
                    headers=self.client.headers
                )
                response.raise_for_status()
                data = response.json()
                
            if "senha_cert" not in data:
                raise NotFoundException("Senha do certificado não encontrada")
            
            encripted_pass = data["senha_cert"]
            if not encripted_pass:
                raise NotFoundException("Senha do certificado não cadastrada")
            
            # Descriptografa a senha
            try:                
                # A senha vem como string, precisa ser convertida para bytes
                encrypted_bytes = encripted_pass.encode('utf-8')
                pass_bytes = self.cipher.decrypt(encrypted_bytes)
                raw_pass = pass_bytes.decode('utf-8')
                return raw_pass
            except Exception as decrypt_error:
                raise InternalServerErrorException(
                    f"Falha ao descriptografar senha do certificado: {type(decrypt_error).__name__}: {str(decrypt_error)}"
                )
            
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                raise NotFoundException("Senha do certificado não encontrada")
            raise InternalServerErrorException(f"Erro ao buscar senha do certificado: {e}")
        except httpx.HTTPError as e:
            raise InternalServerErrorException(f"Erro de conexão ao buscar senha do certificado: {e}")
        except NotFoundException:
            raise
        except InternalServerErrorException:
            raise
        except Exception as e:
            raise InternalServerErrorException(f"Erro ao obter senha do certificado: {type(e).__name__}: {str(e)}")
        
    async def serialize_documents(self, document_models) -> list[ServerDocumentOut]:
        result = []
        for doc in document_models:
            orgao = await self.get_orgao(doc.orgao)
            result.append(ServerDocumentOut.from_orm(doc, orgao))
        return result