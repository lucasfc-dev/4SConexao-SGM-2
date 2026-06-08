from fastapi import Request,Query,Depends
from fastapi.routing import APIRouter
from fastapi.responses import JSONResponse, StreamingResponse
from babel.dates import format_date
from tortoise.expressions import Q
from api.models import Dispensa,Secao,CertificadoPublicacao
from api.schemas import DispensaIn,DispensaOut,UpdatedDispensa,QueryDispensa
from api.services.pdf.pdf_service import PDFService
from api.exceptions import NotFoundException, BadRequestException
from tortoise.exceptions import DoesNotExist
from tortoise.transactions import in_transaction
from uuid import UUID
from typing import List, Optional,Union
from datetime import date, datetime
from io import BytesIO

router = APIRouter(prefix='/dispensa',tags=["Dispensas"])

@router.post('/',response_model=DispensaOut)
async def create_dispensa(request:Request,disp:DispensaIn):
    async with in_transaction() as connection:
        try:
            client = request.state.client
            secao = await Secao.get(id=disp.secao)
            dispensa = await Dispensa.create(
                tipo_dispensa=disp.tipo_dispensa,
                pub_date=disp.pub_date,
                homolog_date=disp.homolog_date,
                julg_date=disp.julg_date,
                orgao=disp.orgao,
                num_processo=disp.num_processo,
                secao=secao,
                natureza_objeto=disp.natureza_objeto,
                regime_execucao=disp.regime_execucao,
                situacao=disp.situacao,
                valor_estimado=disp.valor_estimado,
                valor_vencedor=disp.valor_vencedor,
                objeto=disp.objeto,
                fundamento_legal=disp.fundamento_legal,
                estabelecimento=client.estabelecimento.id,
                published_by=client.user.id,
                using_db=connection
            )
            return dispensa.to_pydantic()
        except DoesNotExist:
            raise NotFoundException('Seção não encontrada')

@router.get('/', response_model=Union[List[DispensaOut], int])
async def get_dispensas(
    request: Request,
    relations: List[str] = Query(default=[]),
    limit: int = Query(default=20),
    offset: int = Query(default=0),
    count: bool = Query(default=False),
    query: QueryDispensa = Depends(),
):
    client = request.state.client
    orgaos_ids = client.user.orgaos
    filters = query.model_dump(exclude_none=True)
    orgao_filter = filters.pop('orgao', None)
    q = Q(orgao__in=orgaos_ids)
    if orgao_filter:
        q &= Q(orgao=orgao_filter)
    if count:
        return await Dispensa.filter(q, **filters).count()
    dispensas = await Dispensa.filter(q, **filters).order_by('-pub_date').limit(limit).offset(offset)
    if relations:
        _client = request.state.client if 'orgao' in relations else None
        return [await dispensa.include_relations(relations, _client) for dispensa in dispensas]
    return [dispensa.to_pydantic() for dispensa in dispensas]

@router.get('/estabelecimento/{id}/',response_model=Union[List[DispensaOut],int])
async def get_dispensas_estabelecimento(
    id,
    relations:List[str]=Query(default=[]),
    query: QueryDispensa = Depends(),
    count:bool=False,
    limit:int=10,
    offset:int=0
    ):
    filters = query.model_dump(exclude_none=True)
    if count:
        return await Dispensa.filter(estabelecimento=id, **filters).count()
    dispensas = await Dispensa.filter(estabelecimento=id, **filters).offset(offset).limit(limit).order_by('-pub_date')
    if relations:
        return [await dispensa.include_relations(relations) for dispensa in dispensas]
    return [dispensa.to_pydantic() for dispensa in dispensas]

@router.get('/{id}/',response_model=DispensaOut)
async def get_dispensa(id:UUID,relations:List[str]=Query(default=[])):
    try:
        dispensa = await Dispensa.get(id=id)
        if relations:
            client = request.state.client if 'orgao' in relations else None
            return await dispensa.include_relations(relations, client)
        return dispensa.to_pydantic()
    except DoesNotExist:
        raise NotFoundException('Dispensa não encontrada')
    
@router.get('/{id}/docs/')
async def get_dispensa_docs(id:UUID):
    try:
        dispensa = await Dispensa.get(id=id).prefetch_related('documentos')
        return [doc.to_pydantic() for doc in dispensa.documentos]
    except DoesNotExist:
        raise NotFoundException('Dispensa não encontrada')


@router.post('/{dispensa_id}/certificado/')
async def create_certificado_publicacao_dispensa_from_dispensa(
    request: Request,
    dispensa_id: UUID,
):
    """Gera um PDF de Certificado de Publicação de dispensa (sem body)."""

    client = request.state.client

    try:
        dispensa = await Dispensa.get(id=dispensa_id)
    except DoesNotExist:
        raise NotFoundException('Dispensa não encontrada')

    await dispensa.fetch_related('certificado_publicacao')
    if getattr(dispensa, 'certificado_publicacao', None) is not None:
        raise BadRequestException('Dispensa já possui certificado de publicação')

    dispensa.published_by = client.user.id
    pub_user = await client.user.get_user_by_id(dispensa.published_by)

    if not pub_user:
        raise BadRequestException('Responsável pela publicação não encontrado')
    if not pub_user.cargo:
        raise BadRequestException('Responsável pela publicação não possui cargo cadastrado')

    agora = datetime.now()
    data_extenso = format_date(dispensa.pub_date, format='long', locale='pt_BR')
    payload = {
        'num_processo': dispensa.num_processo,
        'objeto': dispensa.objeto,
        'nome': pub_user.nome,
        'cargo': pub_user.cargo,
        'data_extenso': data_extenso,
        'tipo_dispensa': dispensa.tipo_dispensa
    }

    pdf_service = PDFService(client)
    pdf_bytes = await pdf_service.gerar_certificado_publicacao_dispensa(payload)

    certificado = await CertificadoPublicacao.create(
        data=pdf_bytes,
        pub_date=agora.date(),
        tipo='dispensa',
    )

    dispensa.certificado_publicacao = certificado
    await dispensa.save()

    return {**certificado.to_dict(), 'dispensa': dispensa.id}


@router.get('/{dispensa_id}/certificado/content/')
async def get_certificado_publicacao_dispensa_content_by_dispensa(
    request: Request,
    dispensa_id: UUID,
):
    """Retorna o conteúdo (PDF) do certificado de publicação da dispensa."""

    from api.utils.files import iterfile, get_download_headers

    try:
        dispensa = await Dispensa.get(id=dispensa_id)
    except DoesNotExist:
        raise NotFoundException('Dispensa não encontrada')

    await dispensa.fetch_related('certificado_publicacao')
    certificado = getattr(dispensa, 'certificado_publicacao', None)
    if certificado is None:
        raise NotFoundException('Certificado não encontrado')

    safe_num = (dispensa.num_processo or 'dispensa').replace('/', '_')
    headers = get_download_headers(
        filename=f"certificado_publicacao_dispensa_{safe_num}.pdf",
        content_length=len(certificado.data),
        disposition='attachment',
    )

    return StreamingResponse(
        iterfile(certificado.data),
        media_type='application/pdf',
        headers=headers,
    )


@router.delete('/{dispensa_id}/certificado/')
async def delete_certificado_publicacao_dispensa(
    request: Request,
    dispensa_id: UUID,
):
    """Remove o certificado de publicação da dispensa."""

    try:
        dispensa = await Dispensa.get(id=dispensa_id)
    except DoesNotExist:
        raise NotFoundException('Dispensa não encontrada')

    await dispensa.fetch_related('certificado_publicacao')
    certificado = dispensa.certificado_publicacao

    async with in_transaction() as connection:
        dispensa.certificado_publicacao = None
        await dispensa.save(using_db=connection)
        await certificado.delete(using_db=connection)

    return JSONResponse({'message': 'Certificado removido com sucesso'})


@router.patch('/{id}/',response_model=DispensaOut)
async def update_dispensa(id:UUID,updated_dispensa:UpdatedDispensa):
    try:
        dispensa = await Dispensa.get(id=id)
        updated_dict = updated_dispensa.model_dump(exclude_none=True)
        if 'secao' in updated_dict:
            secao = await Secao.get(id=updated_dict['secao'])
            updated_dict['secao'] = secao
        await dispensa.update_from_dict(updated_dict).save()
        return dispensa.to_pydantic()
    except DoesNotExist:
        raise NotFoundException('Dispensa não encontrada')

@router.delete('/{id}/')
async def delete_dispensa(id:UUID):
    async with in_transaction() as connection:
        try:
            dispensa = await Dispensa.get(id=id)
            await dispensa.delete(using_db=connection)
            return JSONResponse({
                'message':f'Dispensa {dispensa.id} deletada',
                'id':str(dispensa.id)
            },status_code=200)
        except DoesNotExist:
            raise NotFoundException('Dispensa não encontrada')

@router.get('/estabelecimento/{estabelecimento_id}/exportar/')
async def exportar_dispensas(
    request: Request,
    estabelecimento_id: UUID,
    type: str = 'csv',
    num_processo: Optional[str] = Query(None),
    objeto: Optional[str] = Query(None),
    orgao: Optional[str] = Query(None),
    situacao: Optional[str] = Query(None),
    tipo_dispensa: Optional[str] = Query(None),
    pub_date_lte: Optional[date] = Query(None),
    pub_date_gte: Optional[date] = Query(None),
):
    params = {
        "estabelecimento": estabelecimento_id,
        "num_processo__icontains": num_processo,
        "objeto__icontains": objeto,
        "orgao": orgao,
        "situacao__icontains": situacao,
        "tipo_dispensa__icontains": tipo_dispensa,
        "pub_date__lte": pub_date_lte,
        "pub_date__gte": pub_date_gte,
    }

    params = {k: v for k, v in params.items() if v}
    dispensas = await Dispensa.filter(**params).prefetch_related('secao')
    
    import pandas as pd
    format_data = [
        {
            "Numero Processo": disp.num_processo,
            "Objeto": disp.objeto,
            "Tipo Dispensa": disp.tipo_dispensa,
            "Situacao": disp.situacao,
            "Natureza Objeto": disp.natureza_objeto,
            "Regime Execucao": disp.regime_execucao,
            "Valor Estimado": str(disp.valor_estimado),
            "Valor Vencedor": str(disp.valor_vencedor),
            "Data Publicacao": disp.pub_date.isoformat() if disp.pub_date else "",
            "Data Homologacao": disp.homolog_date.isoformat() if disp.homolog_date else "",
            "Data Julgamento": disp.julg_date.isoformat() if disp.julg_date else "",
        } for disp in dispensas
    ]
    
    if format_data:
        data = {
            key: [d[key] for d in format_data]
            for key in format_data[0]
        }
        df = pd.DataFrame(data)
    else:
        df = pd.DataFrame(columns=["Numero Processo", "Objeto", "Tipo Dispensa", "Situacao", "Natureza Objeto", "Regime Execucao", "Valor Estimado", "Valor Vencedor", "Data Publicacao", "Data Homologacao", "Data Julgamento"])
    
    if type == 'csv':
        csv_data = df.to_csv(index=False)
        csv_buffer = BytesIO(csv_data.encode('utf-8'))
        return StreamingResponse(csv_buffer, media_type='text/csv', headers={
            'Content-Disposition': f'attachment; filename="dispensas_{date.today()}.csv"'
        })
    elif type == 'xml':
        df_xml = df.rename(columns=lambda x: x.replace(' ', '_'))
        xml_data = df_xml.to_xml(index=False)
        xml_buffer = BytesIO(xml_data.encode('utf-8'))
        return StreamingResponse(xml_buffer, media_type='application/xml', headers={
            'Content-Disposition': f'attachment; filename="dispensas_{date.today()}.xml"'
        })
    elif type == 'pdf':
        from datetime import datetime
        
        # Preparar os dados de dispensa para enviar ao pdf_service
        processos = [
            {
                'num_processo': disp.num_processo,
                'objeto': disp.objeto,
                'situacao': disp.situacao,
                'pub_date': disp.pub_date.strftime('%d/%m/%Y') if disp.pub_date else None,
                'julg_date': disp.julg_date.strftime('%d/%m/%Y') if disp.julg_date else None,
                'tipo_dispensa': disp.tipo_dispensa,
                'orgao': {'nome': disp.orgao if hasattr(disp, 'orgao') else 'Órgão Municipal'}
            }
            for disp in dispensas
        ]
        
        date_now = datetime.now().date()
        pdf_service = PDFService(None)  # Sem AuthClient para PDF simples
        pdf_data = await pdf_service.gerar_pdf_simples_dispensa(
            processos=processos,
            estabelecimento_id=estabelecimento_id,
            data_relatorio=date_now.strftime('%d/%m/%Y'),
            titulo='Relatório Municipal de Dispensas'
        )
        
        pdf_buffer = BytesIO(pdf_data)
        return StreamingResponse(pdf_buffer, media_type='application/pdf', headers={
            'Content-Disposition': f'attachment; filename="dispensas_{date.today()}.pdf"'
        })
