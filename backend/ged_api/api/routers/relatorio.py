from typing import List
from uuid import UUID
from fastapi import Request
from fastapi.routing import APIRouter
from fastapi.responses import StreamingResponse
from api.services.auth.auth_service import AuthClient
from api.services.pdf.pdf_service import PDFService
from api.models import Relatorio,Document
from api.schemas import RelatorioOut,UserOut,DocQuery
from api.exceptions import NotFoundException, BadRequestException
from tortoise.exceptions import DoesNotExist
from io import BytesIO
from datetime import datetime


router = APIRouter(prefix='/relatorio',tags=['relatorio'])

@router.post('/',response_model=RelatorioOut)
async def create_relatorio(
    request:Request,
    query:DocQuery
    ):
    client:AuthClient = request.state.client
    data = datetime.now().date().strftime("%d/%m/%y")
    titulo = f"Relatório de legislação e Atos normativos de {data}"
    relatorio = await Relatorio.create(
        titulo=titulo,
        estabelecimento=client.estabelecimento.id
    )
    filters = query.model_dump(exclude_none=True)
    # Otimização: carregar apenas campos necessários, excluindo 'data' binário
    documents = await Document.filter(**filters).select_related('tipo','vereador').only(
        'id', 'titulo', 'descricao', 'situacao', 'orgao', 'pub_date', 'tipo', 'vereador'
    )
    if documents:
        pdf_service = PDFService(auth_client=client)
        pdf_data = await pdf_service.generate_relatorio_pdf(documents_models=documents)
        relatorio.data = pdf_data
        await relatorio.save()
        return relatorio
    raise BadRequestException('Não há nenhum documento com esse filtro.')

@router.get('/',response_model=List[RelatorioOut])
async def get_relatorios(request:Request):
    client:AuthClient = request.state.client
    # Otimização: carregar apenas metadados, excluindo campo binário 'data'
    relatorios = await Relatorio.filter(estabelecimento=client.estabelecimento.id).only(
        'id', 'titulo', 'estabelecimento', 'created_at'
    )
    return relatorios

@router.get('/{id}/',response_model=RelatorioOut)
async def get_relatorio(request:Request,id:UUID):
    try:
        relatorio = await Relatorio.get(id=id)
        return relatorio
    except DoesNotExist:
        raise NotFoundException('Id de Relatório não encontrado.')
    
@router.get('/{id}/content/')
async def get_content(request:Request,id:UUID):
    try:
        # Otimização: carregar apenas campo 'data' necessário
        relatorio = await Relatorio.get(id=id).only('data', 'titulo')
        
        from api.utils.files import iterfile, get_download_headers
        
        # Headers otimizados para download
        headers = get_download_headers(
            filename=f"{relatorio.titulo}.pdf",
            content_length=len(relatorio.data)
        )
        
        return StreamingResponse(iterfile(relatorio.data), media_type='application/pdf', headers=headers)
    except DoesNotExist:
        raise NotFoundException('Id de Relatório não encontrado.')
    
@router.delete('/{id}/',response_model=RelatorioOut)
async def delete_relatorio(request:Request,id:UUID):
    try:
        relatorio = await Relatorio.get(id=id)
        await relatorio.delete()
        return relatorio
    except DoesNotExist:
        raise NotFoundException('Id de Relatório não encontrado.')