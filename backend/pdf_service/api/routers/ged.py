from fastapi import Request,Query
from fastapi.routing import APIRouter
from fastapi.responses import StreamingResponse
from api.pdf_controller.relatorio_ged import create_pdf, adicionar_assinatura_ged_completa
from api.schemas import PDFRelatorioRequest,AssinaturaDocQrcodeRequest
from api.services.auth.auth_service import AuthClient
from api.exceptions import BadRequestException, InternalServerErrorException
from datetime import datetime
from typing import List, Optional
from io import BytesIO
from uuid import UUID
import qrcode

router = APIRouter(prefix="/ged", tags=["ged"])

@router.post("/relatorio/")
async def gerar_relatorio_ged(
    request: Request, 
    pdf_relatorio: PDFRelatorioRequest,
):
    """
    Gera relatório de documentos GED.
    Pode ser usado com autenticação (client) ou com estabelecimento_id para rotas públicas.
    """
    client = getattr(request.state, 'client', None)
    
    if client:
        # Rota autenticada - usa dados do cliente
        icone_bytes = await client.estabelecimento.get_icone_bytes()
        nome_estabelecimento = client.estabelecimento.model.nome
    elif pdf_relatorio.estabelecimento_id:
        # Rota pública - busca dados via API key
        estabelecimento_data = await AuthClient.get_estabelecimento_public_data(pdf_relatorio.estabelecimento_id)
        icone_bytes = estabelecimento_data.icone
        nome_estabelecimento = estabelecimento_data.nome
    else:
        raise BadRequestException(
            "É necessário autenticação ou estabelecimento_id"
        )
    
    context = {
        'icone_bytes': icone_bytes,
        'nome_estabelecimento': nome_estabelecimento,
        'data_relatorio': datetime.now().date().strftime('%d/%m/%Y')
    }
    pdf_data = create_pdf(pdf_relatorio.documents, context)
    return StreamingResponse(BytesIO(pdf_data), media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=relatorio_ged.pdf"})

@router.post("/assinar_doc_qrcode/")
async def assinar_documento_com_qrcode(request: Request, assinatura: AssinaturaDocQrcodeRequest):
    img_buffer = BytesIO()
    img = qrcode.make(assinatura.url_qrcode)
    img.save(img_buffer,'PNG')
    img_buffer.seek(0)

    pdf_bytes = assinatura.get_decoded_documento()
    pdf_assinado = adicionar_assinatura_ged_completa(
        pdf_bytes,
        img_buffer,
        assinatura.url_qrcode,
        emissor=assinatura.proprietario,
        dados_assinatura=assinatura.dados_assinatura,
    )

    return StreamingResponse(BytesIO(pdf_assinado), media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=documento_assinado.pdf"})