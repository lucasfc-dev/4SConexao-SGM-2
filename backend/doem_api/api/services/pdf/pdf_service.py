import httpx
import base64
from typing import List, Optional
from api.exceptions import (
    InternalServerErrorException,
    NotFoundException,
    CertificateExpiredException,
    InvalidCertificatePasswordException,
    BadRequestException
)
from api.config import PDF_SERVICE_URL
from api.models import Document
from io import BytesIO
from datetime import datetime
from pytz import timezone
from erpbrasil.assinatura import Assinatura, Certificado
from erpbrasil.assinatura.excecoes import CertificadoExpirado, CertificadoSenhaInvalida
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from api.services.auth.auth_service import AuthClient

fuso_horario = timezone('America/Sao_Paulo')


class PDFService:
    """Serviço para comunicação com o PDF Service e assinatura de documentos"""
    
    def __init__(self, auth_client:"AuthClient"):
        self.auth_client = auth_client
        self.base_url = PDF_SERVICE_URL  
    
    async def _prepare_documents_payload(self, documents_models: List[Document]) -> List[dict]:
        documents_for_service = []
        for doc in documents_models:
            # Verifica se o documento tem dados válidos
            if doc.data is None:
                raise BadRequestException(f'Documento com ID {doc.id} tem dados inválidos ou ausentes')
            
            doc_data = {
                'id': str(doc.id),
                'titulo': doc.titulo,
                'filename': doc.titulo,
                'tipo': doc.tipo,
                'data': base64.b64encode(doc.data).decode('utf-8'),
                'sender': str(doc.sender),
                'orgao': str(doc.orgao),
                'force_scan': doc.force_scan,
                'uploaded_at': doc.uploaded_at.isoformat()
            }
            documents_for_service.append(doc_data)
        return documents_for_service
    
    async def generate_diario_pdf(
        self, 
        documents_models: List[Document], 
        data_publicacao_full: str, 
        data_lei: str, 
        edicao: int
    ) -> bytes:
        """
        Gera PDF do diário oficial através do PDF service
        
        Args:
            documents_models: Lista de documentos do banco
            estabelecimento: Modelo do estabelecimento
            data_publicacao_full: Data de publicação formatada
            data_lei: Data da lei formatada
            edicao: Número da edição
            
        Returns:
            bytes: Dados do PDF gerado
            
        Raises:
            InternalServerErrorException: Em caso de erro na geração do PDF
        """
        try:
            # Prepara payload
            documents_payload = await self._prepare_documents_payload(documents_models)
            
            payload = {
                'documents': documents_payload,
                'data_publicacao_full': data_publicacao_full,
                'data_lei': data_lei,
                'edicao': edicao
            }
            
            # Faz requisição ao PDF service
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    url=f'{self.base_url}/diario/generate_pdf/',
                    headers=self.auth_client.headers,
                    json=payload,
                    timeout=300.0
                )
            
            if response.status_code != 200:
                raise InternalServerErrorException(f'Erro no serviço de PDF (HTTP {response.status_code}): {response.text}')
            
            # O PDF service agora retorna os bytes do PDF diretamente via StreamingResponse
            pdf_data = response.content
            return pdf_data
        except httpx.RequestError as e:
            raise InternalServerErrorException(f'Erro de conexão com o serviço de PDF: {str(e)}')
        except Exception as e:
            # Re-raise custom exceptions
            from api.exceptions import APIException
            if isinstance(e, APIException):
                raise e
            
            raise InternalServerErrorException(f'Erro interno no PDFService: {str(e)}')
    
    async def get_certificado(self) -> Certificado:
        """Obtém o certificado digital do estabelecimento
        
        Returns:
            Certificado: Objeto certificado do erpbrasil
            
        Raises:
            NotFoundException: Quando certificado não está cadastrado
            InvalidCertificatePasswordException: Quando a senha do certificado é inválida
            CertificateExpiredException: Quando o certificado está expirado
            InternalServerErrorException: Para outros erros
        """
        if not self.auth_client or not self.auth_client.estabelecimento:
            raise InternalServerErrorException('AuthClient ou estabelecimento não inicializado')
        
        try:
            cert_file = await self.auth_client.estabelecimento.get_cert_file()
            if cert_file is None:
                raise NotFoundException('Nenhum certificado cadastrado')
            
            raw_pass = await self.auth_client.estabelecimento.get_cert_password()
            cert_base64 = base64.b64encode(cert_file)
            
            cert = Certificado(cert_base64, raw_pass)
            print(f"PDFService: Certificado criado com sucesso. Proprietário: {cert.proprietario}")
            return cert
            
        except CertificadoExpirado:
            raise CertificateExpiredException('Certificado digital expirado')
        except CertificadoSenhaInvalida:
            raise InvalidCertificatePasswordException('Senha do certificado inválida')
        except (NotFoundException, InternalServerErrorException):
            # Re-raise exceções customizadas da API sem modificar
            raise
        except Exception as e:
            # Captura qualquer outro erro não previsto
            print(f"PDFService: Erro não esperado ao obter certificado: {type(e).__name__}: {e}")
            raise InternalServerErrorException(f'Erro ao obter certificado: {type(e).__name__}: {str(e)}')

    async def assinar_pdf(self, pdf_bytes: bytes, cod_ref: str, url_qrcode: str = None) -> dict:
        """Assina um PDF com o certificado digital do estabelecimento
        
        Args:
            pdf_bytes: Bytes do PDF a ser assinado
            cod_ref: Código de referência da assinatura
            

        Returns:
            bytes: PDF assinado digitalmente
            
        Raises:
            NotFoundException: Quando certificado não está cadastrado
            CertificateExpiredException: Quando certificado está expirado
            InvalidCertificatePasswordException: Quando senha do certificado é inválida
            BadRequestException: Quando os dados fornecidos são inválidos
            InternalServerErrorException: Para outros erros
        """
        if not self.auth_client or not self.auth_client.user or not self.auth_client.estabelecimento:
            raise InternalServerErrorException('AuthClient, usuário ou estabelecimento não inicializado para assinatura')
        
        if not pdf_bytes:
            raise BadRequestException('PDF vazio ou inválido')
        
        try:
            # Obtém certificado (já trata exceções específicas)
            cert: Certificado = await self.get_certificado()
            ass = Assinatura(cert)
            
            # Prepara dados da assinatura
            signingdate = datetime.now(fuso_horario).strftime("D:%Y%m%d%H%M%S%z")
            signingdate = signingdate[:-2] + "'" + signingdate[-2:] + "'"
            user = self.auth_client.user.model
            estabelecimento = self.auth_client.estabelecimento.model
            dados_assinatura = {
                'location': estabelecimento.cidade,
                'reason': f'Assinado por {user.nome} - Aprovação oficial de {cert.proprietario}',
                'proprietario': cert.proprietario,
                'contact': user.email,
                'signingdate': signingdate,
                'cod_ref': cod_ref
            }
            
            # Adiciona assinatura visual através do PDF service
            pdf_com_assinatura_visual = await self._adicionar_assinatura_visual(
                pdf_bytes, 
                cert.proprietario, 
                dados_assinatura,
                url_qrcode=url_qrcode
            )
            
            # Aplica a assinatura digital
            assinatura = ass.assina_pdf(pdf_com_assinatura_visual, dados_assinatura)
            
            # Combina PDF com assinatura visual + assinatura digital
            with BytesIO() as buffer:
                buffer.write(pdf_com_assinatura_visual)
                buffer.write(assinatura)
                buffer.seek(0)
                pdf_data = buffer.read()
                return {'dados_assinatura':dados_assinatura, 'pdf_data': pdf_data}

                
        except (NotFoundException, CertificateExpiredException, InvalidCertificatePasswordException, BadRequestException, InternalServerErrorException):
            raise
        except CertificadoExpirado:
            raise CertificateExpiredException('Certificado digital expirado')
        except CertificadoSenhaInvalida:
            raise InvalidCertificatePasswordException('Senha do certificado inválida')
        except httpx.RequestError as e:
            raise InternalServerErrorException(f'Erro de conexão com o serviço de PDF: {type(e).__name__}: {str(e)}')
        except Exception as e:
            raise InternalServerErrorException(f'Erro ao assinar PDF: {type(e).__name__}: {str(e)}')
    
    async def _adicionar_assinatura_visual(
        self, 
        pdf_bytes: bytes, 
        proprietario: str, 
        dados_assinatura: dict,
        url_qrcode: str = None
    ) -> bytes:
        """Adiciona assinatura visual ao PDF através do PDF service
        
        Args:
            pdf_bytes: Bytes do PDF
            proprietario: Nome do proprietário do certificado
            dados_assinatura: Dados da assinatura (location, reason, contact, etc)
            url_qrcode: URL de validação para QR code (se fornecido, adiciona página final com QR)
            
        Returns:
            bytes: PDF com assinatura visual
            
        Raises:
            InternalServerErrorException: Em caso de erro na comunicação
        """
        try:
            payload = {
                'pdf_data': base64.b64encode(pdf_bytes).decode('utf-8'),
                'proprietario': proprietario,
                'dados_assinatura': dados_assinatura
            }

            if url_qrcode:
                payload['url_qrcode'] = url_qrcode
                endpoint = '/diario/add_full_signature/'
            else:
                endpoint = '/diario/add_signature/'
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    url=f'{self.base_url}{endpoint}',
                    headers=self.auth_client.headers,
                    json=payload,
                    timeout=60.0
                )
            
            if response.status_code != 200:
                raise InternalServerErrorException(
                    f'Erro ao adicionar assinatura visual (HTTP {response.status_code}): {response.text}'
                )
            
            return response.content
            
        except httpx.RequestError as e:
            raise InternalServerErrorException(f'Erro de conexão com serviço de PDF: {type(e).__name__}: {str(e)}')
        except InternalServerErrorException:
            # Re-raise InternalServerErrorException sem modificar
            raise
        except Exception as e:
            raise InternalServerErrorException(f'Erro ao adicionar assinatura visual: {type(e).__name__}: {str(e)}')