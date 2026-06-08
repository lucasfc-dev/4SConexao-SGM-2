import httpx
from uuid import UUID
from typing import List, Dict, Any, Optional
from api.config import PDF_SERVICE_URL, INTER_SERVICE_API_KEY
from api.exceptions import (
    BadRequestException,
    ForbiddenException,
    InternalServerErrorException,
    NotFoundException,
    UnauthorizedException,
)
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from api.services.auth.auth_service import AuthClient

class PDFService:
    """Serviço para comunicação com o PDF Service"""

    def __init__(self, auth_client: Optional["AuthClient"]):
        """
        Inicializa o serviço de PDF.

        Args:
            auth_client: Cliente de autenticação com acesso ao estabelecimento.
                Pode ser None em endpoints públicos; nesse caso, a comunicação
                com o PDF Service usa X-API-Key (INTER_SERVICE_API_KEY).
        """
        self.auth_client = auth_client
        self.base_url = PDF_SERVICE_URL

    def _headers(self) -> Dict[str, str]:
        if self.auth_client is not None:
            return self.auth_client.headers
        if INTER_SERVICE_API_KEY:
            return {"X-API-Key": INTER_SERVICE_API_KEY}
        raise InternalServerErrorException(
            "PDFService sem auth_client e INTER_SERVICE_API_KEY não configurada"
        )

    def _extract_error_detail(self, response: httpx.Response) -> str:
        try:
            data = response.json()
            if isinstance(data, dict):
                return str(data.get('detail') or data.get('error') or data)
            return str(data)
        except Exception:
            text = (response.text or '').strip()
            if not text:
                return 'Resposta sem corpo'
            return text[:2000]

    def _raise_pdf_service_exception(self, exc: httpx.HTTPStatusError, context: str) -> None:
        response = exc.response
        status = response.status_code
        detail = self._extract_error_detail(response)
        url = str(response.request.url)

        message = f"{context}: PDF Service retornou {status} em {url} - {detail}"
        if status in (400, 409, 422):
            raise BadRequestException(message)
        if status == 401:
            raise UnauthorizedException(message)
        if status == 403:
            raise ForbiddenException(message)
        if status == 404:
            raise NotFoundException(message)
        if status >= 500:
            raise InternalServerErrorException(message)
        raise InternalServerErrorException(message)
    
    async def gerar_relatorio_licitacao(
        self,
        processos: List[Dict[str, Any]],
        data_relatorio: str,
        titulo: str = "Relatório Municipal de Procedimentos Licitatórios"
    ) -> bytes:
        """
        Gera PDF de relatório de licitações
        
        Args:
            processos: Lista de dicionários com dados das licitações
            data_relatorio: Data do relatório formatada
            titulo: Título do relatório
            
        Returns:
            bytes: Conteúdo do PDF gerado
        """
        payload = {
            'processos': processos,
            'data_relatorio': data_relatorio,
            'titulo': titulo
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/contratacao/relatorio/licitacao/",
                headers=self._headers(),
                json=payload,
                timeout=30.0
            )
            response.raise_for_status()
            return response.content

    async def gerar_relatorio_dispensa(
        self,
        processos: List[Dict[str, Any]],
        data_relatorio: str,
        titulo: str = "Relatório Municipal de Procedimentos Licitatórios"
    ) -> bytes:
        """
        Gera PDF de relatório de dispensas
        
        Args:
            processos: Lista de dicionários com dados das dispensas
            data_relatorio: Data do relatório formatada
            titulo: Título do relatório
            
        Returns:
            bytes: Conteúdo do PDF gerado
        """
        payload = {
            'processos': processos,
            'data_relatorio': data_relatorio,
            'titulo': titulo
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/contratacao/relatorio/dispensa/",
                headers=self._headers(),
                json=payload,
                timeout=30.0
            )
            response.raise_for_status()
            return response.content

    async def gerar_relatorio_contrato(
        self,
        processos: List[Dict[str, Any]],
        data_relatorio: str,
        titulo: str = "Relatório Municipal de Contratos"
    ) -> bytes:
        """
        Gera PDF de relatório de contratos
        
        Args:
            processos: Lista de dicionários com dados dos contratos
            data_relatorio: Data do relatório formatada
            titulo: Título do relatório
            
        Returns:
            bytes: Conteúdo do PDF gerado
        """
        payload = {
            'processos': processos,
            'data_relatorio': data_relatorio,
            'titulo': titulo
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/contratacao/relatorio/contrato/",
                headers=self._headers(),
                json=payload,
                timeout=30.0
            )
            response.raise_for_status()
            return response.content

    async def gerar_relatorio_fiscalizacao(
        self,
        dados_relatorio: Dict[str, Any]
    ) -> bytes:
        """
        Gera PDF de relatório de fiscalização de contrato
        
        Args:
            dados_relatorio: Dicionário com todos os dados do relatório de fiscalização
            
        Returns:
            bytes: Conteúdo do PDF gerado
        """
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/contratacao/relatorio/fiscalizacao/",
                headers=self._headers(),
                json=dados_relatorio,
                timeout=30.0
            )
            response.raise_for_status()
            return response.content

    async def gerar_certificado_publicacao_contrato(
        self,
        dados_certificado: Dict[str, Any],
    ) -> bytes:
        """Gera PDF de certificado de publicação de contrato.

        Args:
            dados_certificado: Dicionário com dados do certificado
                (num_contrato, objeto, nome, cargo, data_extenso)

        Returns:
            bytes: Conteúdo do PDF gerado
        """

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/contratacao/certificado/publicacao/",
                    headers=self._headers(),
                    json=dados_certificado,
                    timeout=30.0,
                )
                response.raise_for_status()
                return response.content
        except httpx.HTTPStatusError as e:
            self._raise_pdf_service_exception(e, "Erro ao gerar certificado de publicação de contrato")
        except httpx.TimeoutException as e:
            raise InternalServerErrorException(
                f"Timeout ao comunicar com PDF Service ao gerar certificado de publicação de contrato: {e}"
            )
        except httpx.RequestError as e:
            raise InternalServerErrorException(
                f"Falha de comunicação com PDF Service ao gerar certificado de publicação de contrato: {e}"
            )

    async def gerar_certificado_publicacao_licitacao(
        self,
        dados_certificado: Dict[str, Any],
    ) -> bytes:
        """Gera PDF de certificado de publicação de licitação."""

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/contratacao/certificado/publicacao/licitacao/",
                    headers=self._headers(),
                    json=dados_certificado,
                    timeout=30.0,
                )
                response.raise_for_status()
                return response.content
        except httpx.HTTPStatusError as e:
            self._raise_pdf_service_exception(e, "Erro ao gerar certificado de publicação de licitação")
        except httpx.TimeoutException as e:
            raise InternalServerErrorException(
                f"Timeout ao comunicar com PDF Service ao gerar certificado de publicação de licitação: {e}"
            )
        except httpx.RequestError as e:
            raise InternalServerErrorException(
                f"Falha de comunicação com PDF Service ao gerar certificado de publicação de licitação: {e}"
            )

    async def gerar_certificado_publicacao_dispensa(
        self,
        dados_certificado: Dict[str, Any],
    ) -> bytes:
        """Gera PDF de certificado de publicação de dispensa."""

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/contratacao/certificado/publicacao/dispensa/",
                    headers=self._headers(),
                    json=dados_certificado,
                    timeout=30.0,
                )
                response.raise_for_status()
                return response.content
        except httpx.HTTPStatusError as e:
            self._raise_pdf_service_exception(e, "Erro ao gerar certificado de publicação de dispensa")
        except httpx.TimeoutException as e:
            raise InternalServerErrorException(
                f"Timeout ao comunicar com PDF Service ao gerar certificado de publicação de dispensa: {e}"
            )
        except httpx.RequestError as e:
            raise InternalServerErrorException(
                f"Falha de comunicação com PDF Service ao gerar certificado de publicação de dispensa: {e}"
            )
    
    async def _gerar_pdf_simples(
        self,
        endpoint: str,
        processos: List[Dict[str, Any]],
        estabelecimento_id: UUID,
        data_relatorio: Optional[str],
        titulo: str,
    ) -> bytes:
        """
        Chamada genérica para endpoints públicos do PDF Service.

        Para rotas públicas (sem AuthClient do usuário) — usa X-API-Key e
        envia `estabelecimento_id` no payload para que o PDF Service busque
        nome/ícone do estabelecimento via dados públicos.
        """
        payload = {
            'processos': processos,
            'estabelecimento_id': str(estabelecimento_id),
            'data_relatorio': data_relatorio,
            'titulo': titulo,
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}{endpoint}",
                headers=self._headers(),
                json=payload,
                timeout=30.0,
            )
            response.raise_for_status()
            return response.content

    async def gerar_pdf_simples_licitacao(
        self,
        processos: List[Dict[str, Any]],
        estabelecimento_id: UUID,
        data_relatorio: Optional[str] = None,
        titulo: str = "Relatório Municipal de Licitações",
    ) -> bytes:
        return await self._gerar_pdf_simples(
            "/contratacao/relatorio/licitacao/",
            processos, estabelecimento_id, data_relatorio, titulo,
        )

    async def gerar_pdf_simples_dispensa(
        self,
        processos: List[Dict[str, Any]],
        estabelecimento_id: UUID,
        data_relatorio: Optional[str] = None,
        titulo: str = "Relatório Municipal de Dispensas",
    ) -> bytes:
        return await self._gerar_pdf_simples(
            "/contratacao/relatorio/dispensa/",
            processos, estabelecimento_id, data_relatorio, titulo,
        )

    async def gerar_pdf_simples_fiscal(
        self,
        processos: List[Dict[str, Any]],
        estabelecimento_id: UUID,
        data_relatorio: Optional[str] = None,
        titulo: str = "Relatório Municipal de Fiscais de Contrato",
    ) -> bytes:
        return await self._gerar_pdf_simples(
            "/contratacao/relatorio/fiscal/",
            processos, estabelecimento_id, data_relatorio, titulo,
        )

    async def gerar_pdf_simples_contrato(
        self,
        processos: List[Dict[str, Any]],
        estabelecimento_id: UUID,
        data_relatorio: Optional[str] = None,
        titulo: str = "Relatório Municipal de Contratos",
    ) -> bytes:
        return await self._gerar_pdf_simples(
            "/contratacao/relatorio/contrato/",
            processos, estabelecimento_id, data_relatorio, titulo,
        )
