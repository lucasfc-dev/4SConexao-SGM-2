from __future__ import annotations

from datetime import datetime
from io import BytesIO

from fastapi import Request
from fastapi.responses import StreamingResponse
from fastapi.routing import APIRouter

from api.exceptions import BadRequestException
from api.pdf_controller.relatorios_transparencia import create_pdf_relatorio_transparencia
from api.schemas import PDFRelatorioTransparenciaRequest
from api.services.auth.auth_service import AuthClient


router = APIRouter(prefix="/transparencia", tags=["transparencia"])


@router.post("/relatorio/")
async def gerar_relatorio_transparencia(request: Request, payload: PDFRelatorioTransparenciaRequest):
    """Gera relatório tabular de Transparência (colunas variáveis).

    Pode ser usado com autenticação (JWT) ou com estabelecimento_id (rotas públicas) via API key.
    """

    client = getattr(request.state, "client", None)

    if client:
        icone_bytes = await client.estabelecimento.get_icone_bytes()
        nome_estabelecimento = client.estabelecimento.model.nome
    elif payload.estabelecimento_id:
        estabelecimento_data = await AuthClient.get_estabelecimento_public_data(payload.estabelecimento_id)
        icone_bytes = estabelecimento_data.icone
        nome_estabelecimento = estabelecimento_data.nome
    else:
        raise BadRequestException("É necessário autenticação ou estabelecimento_id")

    context = {
        "icone_bytes": icone_bytes,
        "nome_estabelecimento": nome_estabelecimento,
        "data_relatorio": datetime.now().date().strftime("%d/%m/%Y"),
    }

    pdf_data = create_pdf_relatorio_transparencia(
        rows=payload.rows,
        columns=payload.columns,
        title=payload.title,
        context=context,
    )

    return StreamingResponse(
        BytesIO(pdf_data),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=relatorio_transparencia.pdf"},
    )
