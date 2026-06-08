from fastapi import Request
from fastapi.routing import APIRouter
from fastapi.responses import StreamingResponse
from api.pdf_controller.relatorio_contratacao import create_pdf_relatorio, create_relatorio_fiscal_contrato
from api.pdf_controller.certificado_publicacao import (
    create_certificado_publicacao_contrato,
    create_certificado_publicacao_dispensa,
    create_certificado_publicacao_licitacao,
)
from api.services.auth.auth_service import AuthClient
from api.exceptions import BadRequestException, InternalServerErrorException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from uuid import UUID
from io import BytesIO

router = APIRouter(prefix="/contratacao", tags=["contratacao"])


class RelatorioLicitacaoRequest(BaseModel):
    """Request para geração de relatório de licitações"""
    processos: List[Dict[str, Any]]
    data_relatorio: str
    titulo: str = "Relatório Municipal de Procedimentos Licitatórios"
    estabelecimento_id: Optional[UUID] = None


class RelatorioDispensaRequest(BaseModel):
    """Request para geração de relatório de dispensas"""
    processos: List[Dict[str, Any]]
    data_relatorio: str
    titulo: str = "Relatório Municipal de Procedimentos Licitatórios"
    estabelecimento_id: Optional[UUID] = None


class RelatorioContratoRequest(BaseModel):
    """Request para geração de relatório de contratos"""
    processos: List[Dict[str, Any]]
    data_relatorio: str
    titulo: str = "Relatório Municipal de Contratos"
    estabelecimento_id: Optional[UUID] = None


class RelatorioFiscalRequest(BaseModel):
    """Request para geração de relatório de fiscais de contrato"""
    processos: List[Dict[str, Any]]
    data_relatorio: str
    titulo: str = "Relatório Municipal de Fiscais de Contrato"
    estabelecimento_id: Optional[UUID] = None


class RelatorioFiscalizacaoRequest(BaseModel):
    """Request para geração de relatório de fiscalização de contrato"""
    num_relatorio: str
    num_contrato: str
    competencia: str
    fundamento_legal: str
    constatacoes: str
    conclusao: str
    objeto: str
    contratado: str
    cnpj_contratado: str
    valor: str
    valor_extenso: str
    portaria: str
    fiscal: str
    vigencia: str
    data_local: str
    cidade: str
    orgao: Dict[str, Any]


class CertificadoPublicacaoContratoRequest(BaseModel):
    """Request para geração de certificado de publicação de contrato"""

    num_contrato: str
    objeto: str
    nome: str
    cargo: str
    data_extenso: str


class CertificadoPublicacaoLicitacaoRequest(BaseModel):
    """Request para geração de certificado de publicação de licitação"""

    num_processo: str
    modalidade: str
    objeto: str
    nome: str
    cargo: str
    data_extenso: str


class CertificadoPublicacaoDispensaRequest(BaseModel):
    """Request para geração de certificado de publicação de dispensa"""

    num_processo: str
    objeto: str
    nome: str
    cargo: str
    data_extenso: str
    tipo_dispensa: str


async def _resolve_estabelecimento(
    request: Request, estabelecimento_id: Optional[UUID]
) -> tuple[Optional[bytes], str]:
    """
    Resolve (icone_bytes, nome) do estabelecimento via AuthClient do usuário
    (rota autenticada com Bearer) ou via API key + estabelecimento_id
    (rota chamada por outro serviço como contratacao_api).
    """
    client = getattr(request.state, 'client', None)
    if client is not None:
        icone_bytes = await client.estabelecimento.get_icone_bytes()
        return icone_bytes, client.estabelecimento.model.nome
    if estabelecimento_id is not None:
        data = await AuthClient.get_estabelecimento_public_data(estabelecimento_id)
        return data.icone, data.nome
    raise BadRequestException(
        "É necessário autenticação Bearer ou estabelecimento_id no payload"
    )


@router.post("/relatorio/licitacao/")
async def generate_relatorio_licitacao(request: Request, relatorio_request: RelatorioLicitacaoRequest):
    """Gera PDF do relatório de licitações."""
    try:
        icone_bytes, nome_estabelecimento = await _resolve_estabelecimento(
            request, relatorio_request.estabelecimento_id
        )

        context = {
            'icone_bytes': icone_bytes,
            'nome_estabelecimento': nome_estabelecimento,
            'data_relatorio': relatorio_request.data_relatorio,
            'tipo': 'licitacao',
            'titulo': relatorio_request.titulo
        }

        pdf_data = create_pdf_relatorio(relatorio_request.processos, context)

        pdf_buffer = BytesIO(pdf_data)
        return StreamingResponse(
            pdf_buffer,
            media_type='application/pdf',
            headers={'Content-Disposition': 'attachment; filename="relatorio_licitacoes.pdf"'}
        )
    except BadRequestException:
        raise
    except Exception as e:
        raise InternalServerErrorException(f"Erro ao gerar PDF: {str(e)}")


@router.post("/relatorio/dispensa/")
async def generate_relatorio_dispensa(request: Request, relatorio_request: RelatorioDispensaRequest):
    """Gera PDF do relatório de dispensas."""
    try:
        icone_bytes, nome_estabelecimento = await _resolve_estabelecimento(
            request, relatorio_request.estabelecimento_id
        )

        context = {
            'icone_bytes': icone_bytes,
            'nome_estabelecimento': nome_estabelecimento,
            'data_relatorio': relatorio_request.data_relatorio,
            'tipo': 'dispensa',
            'titulo': relatorio_request.titulo
        }

        pdf_data = create_pdf_relatorio(relatorio_request.processos, context)

        pdf_buffer = BytesIO(pdf_data)
        return StreamingResponse(
            pdf_buffer,
            media_type='application/pdf',
            headers={'Content-Disposition': 'attachment; filename="relatorio_dispensas.pdf"'}
        )
    except BadRequestException:
        raise
    except Exception as e:
        raise InternalServerErrorException(f"Erro ao gerar PDF: {str(e)}")


@router.post("/relatorio/contrato/")
async def generate_relatorio_contrato(request: Request, relatorio_request: RelatorioContratoRequest):
    """Gera PDF do relatório de contratos."""
    try:
        icone_bytes, nome_estabelecimento = await _resolve_estabelecimento(
            request, relatorio_request.estabelecimento_id
        )

        context = {
            'icone_bytes': icone_bytes,
            'nome_estabelecimento': nome_estabelecimento,
            'data_relatorio': relatorio_request.data_relatorio,
            'tipo': 'contrato',
            'titulo': relatorio_request.titulo
        }

        pdf_data = create_pdf_relatorio(relatorio_request.processos, context)

        pdf_buffer = BytesIO(pdf_data)
        return StreamingResponse(
            pdf_buffer,
            media_type='application/pdf',
            headers={'Content-Disposition': 'attachment; filename="relatorio_contratos.pdf"'}
        )
    except BadRequestException:
        raise
    except Exception as e:
        raise InternalServerErrorException(f"Erro ao gerar PDF: {str(e)}")


@router.post("/relatorio/fiscal/")
async def generate_relatorio_fiscal(request: Request, relatorio_request: RelatorioFiscalRequest):
    """Gera PDF do relatório de fiscais de contrato."""
    try:
        icone_bytes, nome_estabelecimento = await _resolve_estabelecimento(
            request, relatorio_request.estabelecimento_id
        )

        context = {
            'icone_bytes': icone_bytes,
            'nome_estabelecimento': nome_estabelecimento,
            'data_relatorio': relatorio_request.data_relatorio,
            'tipo': 'fiscal',
            'titulo': relatorio_request.titulo
        }

        pdf_data = create_pdf_relatorio(relatorio_request.processos, context)

        pdf_buffer = BytesIO(pdf_data)
        return StreamingResponse(
            pdf_buffer,
            media_type='application/pdf',
            headers={'Content-Disposition': 'attachment; filename="relatorio_fiscais.pdf"'}
        )
    except BadRequestException:
        raise
    except Exception as e:
        raise InternalServerErrorException(f"Erro ao gerar PDF: {str(e)}")


@router.post("/relatorio/fiscalizacao/")
async def generate_relatorio_fiscalizacao(request: Request, relatorio_request: RelatorioFiscalizacaoRequest):
    """
    Gera PDF do relatório de fiscalização mensal de contrato
    """
    try:
        # Obter icone do órgão via AuthClient
        auth_client = request.state.client
        orgao_id = relatorio_request.orgao.get('id')
        
        # Buscar ícone do órgão se houver ID
        icone_bytes = None
        if orgao_id:
            try:
                icone_bytes = await auth_client.estabelecimento.get_orgao_icone(orgao_id)
            except Exception as e:
                # Se não conseguir buscar o ícone, continua sem ele
                print(f"Aviso: Não foi possível buscar ícone do órgão {orgao_id}: {str(e)}")
        
        dados_relatorio = relatorio_request.model_dump()
        dados_relatorio['icone_bytes'] = icone_bytes
        
        pdf_data = create_relatorio_fiscal_contrato(dados_relatorio)
        
        pdf_buffer = BytesIO(pdf_data)
        return StreamingResponse(
            pdf_buffer,
            media_type='application/pdf',
            headers={'Content-Disposition': f'attachment; filename="relatorio_fiscalizacao_{relatorio_request.num_relatorio.replace("/", "_")}.pdf"'}
        )
    except Exception as e:
        print(f"Erro ao gerar relatório de fiscalização: {str(e)}")
        import traceback
        traceback.print_exc()
        raise InternalServerErrorException(f"Erro ao gerar PDF: {str(e)}")


@router.post("/certificado/publicacao/")
async def generate_certificado_publicacao_contrato(
    request: Request,
    certificado_request: CertificadoPublicacaoContratoRequest,
):
    """Gera PDF do certificado de publicação de contrato."""

    try:
        auth_client = request.state.client
        icone_bytes = await auth_client.estabelecimento.get_icone_bytes()
        nome_estabelecimento = auth_client.estabelecimento.model.nome
        cidade = auth_client.estabelecimento.model.cidade

        payload = certificado_request.model_dump()

        # Enriquecer com config do estabelecimento quando disponível (ex.: ADM e URL do site)
        config = getattr(auth_client.estabelecimento.model, 'config', None) or {}
        if isinstance(config, dict):
            url_site = (
                config.get('url_site')
            )
            if url_site:
                payload['url_site'] = str(url_site)

        pdf_data = create_certificado_publicacao_contrato(
            payload,
            icone_bytes=icone_bytes,
            nome_estabelecimento=nome_estabelecimento,
            cidade=cidade,
        )

        pdf_buffer = BytesIO(pdf_data)
        safe_num = certificado_request.num_contrato.replace("/", "_")
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="certificado_publicacao_contrato_{safe_num}.pdf"'
            },
        )
    except Exception as e:
        raise InternalServerErrorException(f"Erro ao gerar PDF: {str(e)}")


@router.post("/certificado/publicacao/licitacao/")
async def generate_certificado_publicacao_licitacao(
    request: Request,
    certificado_request: CertificadoPublicacaoLicitacaoRequest,
):
    """Gera PDF do certificado de publicação de licitação."""

    try:
        auth_client = request.state.client
        icone_bytes = await auth_client.estabelecimento.get_icone_bytes()
        nome_estabelecimento = auth_client.estabelecimento.model.nome
        cidade = auth_client.estabelecimento.model.cidade

        payload = certificado_request.model_dump()

        config = getattr(auth_client.estabelecimento.model, "config", None) or {}
        if isinstance(config, dict):

            url_site = config.get("url_site")
            if url_site:
                payload["url_site"] = str(url_site)

        pdf_data = create_certificado_publicacao_licitacao(
            payload,
            icone_bytes=icone_bytes,
            nome_estabelecimento=nome_estabelecimento,
            cidade=cidade,
        )

        pdf_buffer = BytesIO(pdf_data)
        safe_num = certificado_request.num_processo.replace("/", "_")
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="certificado_publicacao_licitacao_{safe_num}.pdf"'
            },
        )
    except Exception as e:
        raise InternalServerErrorException(f"Erro ao gerar PDF: {str(e)}")


@router.post("/certificado/publicacao/dispensa/")
async def generate_certificado_publicacao_dispensa(
    request: Request,
    certificado_request: CertificadoPublicacaoDispensaRequest,
):
    """Gera PDF do certificado de publicação de dispensa."""

    try:
        auth_client = request.state.client
        icone_bytes = await auth_client.estabelecimento.get_icone_bytes()
        nome_estabelecimento = auth_client.estabelecimento.model.nome
        cidade = auth_client.estabelecimento.model.cidade

        payload = certificado_request.model_dump()

        config = getattr(auth_client.estabelecimento.model, "config", None) or {}
        if isinstance(config, dict):
            adm = config.get("adm") or config.get("administracao")
            if adm:
                payload["adm"] = str(adm)

            url_site = config.get("url_site")
            if url_site:
                payload["url_site"] = str(url_site)

        pdf_data = create_certificado_publicacao_dispensa(
            payload,
            icone_bytes=icone_bytes,
            nome_estabelecimento=nome_estabelecimento,
            cidade=cidade,
        )

        pdf_buffer = BytesIO(pdf_data)
        safe_num = certificado_request.num_processo.replace("/", "_")
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="certificado_publicacao_dispensa_{safe_num}.pdf"'
            },
        )
    except Exception as e:
        raise InternalServerErrorException(f"Erro ao gerar PDF: {str(e)}")
