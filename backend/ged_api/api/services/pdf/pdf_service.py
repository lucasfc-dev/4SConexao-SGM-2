from api.models import Document
from api.config import PDF_SERVICE_URL, SECRET_KEY, INTER_SERVICE_API_KEY
from api.exceptions import UnauthorizedException, InternalServerErrorException
from cryptography.fernet import Fernet
from erpbrasil.assinatura import Assinatura,Certificado
from typing import TYPE_CHECKING, List, Optional
import httpx
from datetime import datetime
from zoneinfo import ZoneInfo
from io import BytesIO
import base64
from uuid import UUID

if TYPE_CHECKING:
    from api.services.auth.auth_service import AuthClient

class PDFService:
    """Serviço para comunicação com o PDF Service"""    
    def __init__(self, auth_client: Optional["AuthClient"] = None):
        self.auth_client = auth_client
        self.base_url = PDF_SERVICE_URL  
        self.cipher = Fernet(SECRET_KEY)
        
        # Define headers baseado no tipo de autenticação
        if auth_client:
            self.headers = auth_client.headers
        else:
            # Para chamadas públicas, não há header de autenticação de usuário
            self.headers = {}

    async def generate_relatorio_pdf(self, documents_models: List[Document]):
        """Gera PDF de relatório através do PDF service (rota autenticada)"""
        if not self.auth_client:
            raise UnauthorizedException("Método requer autenticação de usuário")
        
        documents_for_service = []
        for doc in documents_models:
            doc_data = {
                "titulo": doc.titulo,
                "descricao": doc.descricao,
                "tipo": doc.tipo.nome,
                "situacao": doc.situacao,
                "pub_date": doc.pub_date.isoformat(),
            }
            documents_for_service.append(doc_data)

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/ged/relatorio/",
                    headers=self.headers,
                    json={"documents": documents_for_service},
                )
                response.raise_for_status()
                return response.content
        except httpx.HTTPError as e:
            raise InternalServerErrorException(f"Erro ao gerar PDF no PDF Service: {e}")
    
    async def generate_relatorio_pdf_public(self, documents_models: List[Document],estabelecimento_id: UUID):
        """Gera PDF de relatório através do PDF service (rota pública com inter-service API key)"""  
        documents_for_service = []
        for doc in documents_models:
            doc_data = {
                "titulo": doc.titulo,
                "descricao": doc.descricao,
                "tipo": doc.tipo.nome,
                "situacao": doc.situacao,
                "pub_date": doc.pub_date.isoformat(),
            }
            documents_for_service.append(doc_data)

        try:
            # Usar API key de inter-service para chamadas públicas
            headers = {
                "X-API-Key": INTER_SERVICE_API_KEY
            }
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/ged/relatorio/",
                    headers=headers,
                    json={
                        "documents": documents_for_service,
                        "estabelecimento_id": str(estabelecimento_id)
                    },
                )
                response.raise_for_status()
                return response.content
        except httpx.HTTPError as e:
            raise InternalServerErrorException(f"Erro ao gerar PDF no PDF Service: {e}")

    async def get_certificado(self) -> Certificado:
            cert_file = await self.auth_client.estabelecimento.get_cert_file()
            if cert_file is None:
                raise InternalServerErrorException('Nenhum certificado cadastrado')
            senha_criptografada = await self.auth_client.estabelecimento.get_cert_password()
            senha_bytes = self.cipher.decrypt(senha_criptografada.encode())
            senha = senha_bytes.decode()

            return Certificado(base64.b64encode(cert_file), senha)

    async def assinar_pdf(self, pdf_bytes: bytes, url_qrcode: str, cod_ref: Optional[str] = None) -> bytes:
        cert = await self.get_certificado()
        ass = Assinatura(cert)

        user = self.auth_client.user.model
        cidade = user.estabelecimento.cidade
        nome_usuario = user.nome
        email_usuario = user.email
        fuso_horario = ZoneInfo('America/Sao_Paulo')
        signingdate = datetime.now(fuso_horario).strftime("D:%Y%m%d%H%M%S%z")
        signingdate = signingdate[:-2] + "'" + signingdate[-2:] + "'"

        dados_assinatura = {
            'location': cidade,
            'reason': f'Assinado por {nome_usuario} - Aprovação oficial de {cert.proprietario}',
            'proprietario': cert.proprietario,
            'contact': email_usuario,
            'signingdate': signingdate,
            'cod_ref': cod_ref,
        }

        buffer = BytesIO()
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/ged/assinar_doc_qrcode/",
                    headers=self.auth_client.headers,
                    json={
                        'documento': base64.b64encode(pdf_bytes).decode('utf-8'),
                        'url_qrcode': url_qrcode,
                        'proprietario': cert.proprietario,
                        'dados_assinatura': dados_assinatura,
                    }
                )
                response.raise_for_status()
                pdf_com_qrcode = response.content

            assinatura = ass.assina_pdf(pdf_com_qrcode, dados_assinatura)

            buffer.write(pdf_com_qrcode)
            buffer.write(assinatura)
            buffer.seek(0)
            return buffer.read()
        finally:
            buffer.close()
