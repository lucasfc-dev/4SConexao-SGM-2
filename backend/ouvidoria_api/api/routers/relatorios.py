from fastapi import APIRouter, Request, Depends, Query, HTTPException,Form,File,UploadFile
from fastapi.responses import StreamingResponse
from api.models import RelatorioEsic,Chamado
from api.schemas import TipoAberturaChamadoEnum,RelatorioEsicRequest
from api.services.pdf.pdf_service import PDFService
from io import BytesIO
from uuid import UUID
from datetime import date
from typing import Optional

router = APIRouter(prefix="/relatorio", tags=["Relatorios"])

@router.post("/esic/")
async def gerar_relatorio_esic(request:Request,relatorio_data: RelatorioEsicRequest):
    client = request.state.client
    estabelecimento = client.estabelecimento
    chamados_esic = await Chamado.filter(
        created_at__gte=relatorio_data.data_i,
        created_at__lte=relatorio_data.data_f,
        tipo_abertura=TipoAberturaChamadoEnum.INFORMACAO.value
    ).prefetch_related("identificacao","retornos")
    dados_tabela = {
        "header":{
            "endereco": estabelecimento.model.config.get("endereco",""),
            "telefone": estabelecimento.model.config.get("telefone",""),
            "nome_estabelecimento": estabelecimento.model.nome,
            "periodo_relatorio": f"{relatorio_data.data_i.strftime('%d/%m/%Y')} - {relatorio_data.data_f.strftime('%d/%m/%Y')}"
        },
        "body":[
        {
            "protocolo": chamado.num_protocolo,
            "solicitante": chamado.identificacao.nome if chamado.identificacao else "Anônimo",
            "data_solicitacao": chamado.created_at.date().strftime("%d/%m/%Y"),
            "detalhes_solicitacao": chamado.descricao,
            "data_resposta": chamado.retornos[-1].created_at.date().strftime("%d/%m/%Y") if chamado.retornos else None,
            "resposta": chamado.retornos[-1].mensagem if chamado.retornos else None
        } for chamado in chamados_esic]
    }
    pdf_service = PDFService(client)
    pdf_content = await pdf_service.gerar_relatorio_esic(dados_tabela)
    relatorio_esic = await RelatorioEsic.create(
        titulo='Relatório ESIC',
        estabelecimento=estabelecimento.id,
        data_inicio=relatorio_data.data_i,
        data_fim=relatorio_data.data_f,
        pdf_bytes=pdf_content,
        tipo_relatorio="ESIC"
    )
    return relatorio_esic.to_dict()
    
@router.post("/upload/")
async def upload_relatorio_esic(
    request: Request,
    file: UploadFile = File(...),
    titulo: str = Form(...),
    data_inicio: str = Form(...),
    data_fim: str = Form(...),
    gerado_em: Optional[date] = Form(None),
    tipo_relatorio: str = Form(...)
):
    client = request.state.client
    pdf_bytes = await file.read()
    relatorio = await RelatorioEsic.create(
        titulo=titulo,
        estabelecimento=client.estabelecimento.id,
        data_inicio=data_inicio,
        data_fim=data_fim,
        gerado_em=gerado_em,
        pdf_bytes=pdf_bytes,
        tipo_relatorio=tipo_relatorio
    )
    return relatorio.to_dict()

@router.get("/{relatorio_id}/download/")
async def download_relatorio_esic(relatorio_id:UUID):
    relatorio = await RelatorioEsic.get_or_none(id=relatorio_id)
    if not relatorio:
        raise HTTPException(status_code=404, detail="Relatório não encontrado.")
    
    from api.utils.files import iterfile, get_download_headers
    
    headers = get_download_headers(
        filename=f"relatorio_esic_{relatorio_id}.pdf",
        content_length=len(relatorio.pdf_bytes),
        disposition='attachment'
    )
    
    return StreamingResponse(
        iterfile(relatorio.pdf_bytes),
        media_type="application/pdf",
        headers=headers
    )

@router.get("/estabelecimento/{estabelecimento_id}/")
async def listar_relatorios_estabelecimento(estabelecimento_id:UUID):
    relatorios = await RelatorioEsic.filter(estabelecimento=estabelecimento_id)
    return [relatorio.to_dict() for relatorio in relatorios]

@router.delete("/{relatorio_id}/")
async def deletar_relatorio_esic(relatorio_id:UUID):
    relatorio = await RelatorioEsic.get_or_none(id=relatorio_id)
    if not relatorio:
        raise HTTPException(status_code=404, detail="Relatório não encontrado.")
    await relatorio.delete()
    return {"detail": "Relatório deletado com sucesso."}