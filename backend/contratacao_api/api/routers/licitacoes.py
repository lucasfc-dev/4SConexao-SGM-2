from fastapi import Request,Query,Depends
from fastapi.routing import APIRouter
from fastapi.responses import JSONResponse, StreamingResponse
from babel.dates import format_date
from tortoise.expressions import Q
from api.models import Licitacao,Modalidade,Secao,CertificadoPublicacao
from api.schemas import LicitacaoIn,LicitacaoOut,UpdatedLicitacao,QueryLicitacao
from api.services.pdf.pdf_service import PDFService
from api.utils.scheduler import update_situacao_licitacao
from api.exceptions import NotFoundException, BadRequestException
from tortoise.exceptions import DoesNotExist
from tortoise.transactions import in_transaction
from uuid import UUID
from typing import List, Optional,Union
from datetime import date, datetime
from io import BytesIO

router = APIRouter(prefix='/licitacao',tags=['Licitações'])


@router.post('/sincronizar-situacao/')
async def sincronizar_situacao_licitacoes():
    resultado = await update_situacao_licitacao()
    return {
        "message": "Situação das licitações sincronizada com sucesso",
        "updated": resultado,
    }

@router.post('/',response_model=LicitacaoOut)
async def create_licitacao(request:Request,lic:LicitacaoIn):
    client = request.state.client
    try:
        modalidade = await Modalidade.get(id=lic.modalidade)
    except DoesNotExist:
        raise NotFoundException('Modalidade não encontrada.')
    try:
        secao = await Secao.get(id=lic.secao)
    except DoesNotExist:
        raise NotFoundException('Seção não encontrada.')
    async with in_transaction() as connection:
        licitacao = await Licitacao.create(
            orgao=lic.orgao,
            modalidade=modalidade,
            secao=secao,
            regime_execucao=lic.regime_execucao,
            natureza_procedimento=lic.natureza_procedimento,
            situacao=lic.situacao,
            valor_estimado=lic.valor_estimado,
            valor_vencedor=lic.valor_vencedor,
            pub_date=lic.pub_date,
            homolog_date=lic.homolog_date,
            julg_date=lic.julg_date,
            num_processo=lic.num_processo,
            objeto=lic.objeto,
            fundamento_legal=lic.fundamento_legal,
            estabelecimento=client.estabelecimento.id,
            published_by=client.user.id,
            using_db=connection
        )
        return licitacao.to_pydantic()


@router.get('/', response_model=Union[List[LicitacaoOut], int])
async def get_licitacoes(
    request: Request,
    relations: List[str] = Query(default=[]),
    limit: int = Query(default=20),
    offset: int = Query(default=0),
    count: bool = Query(default=False),
    query: QueryLicitacao = Depends(),
):
    client = request.state.client
    orgaos_ids = client.user.orgaos
    filters = query.model_dump(exclude_none=True)
    orgao_filter = filters.pop('orgao', None)
    q = Q(orgao__in=orgaos_ids)
    if orgao_filter:
        q = q & Q(orgao=orgao_filter)
    if count:
        return await Licitacao.filter(q, **filters).count()
    licitacoes = await Licitacao.filter(q, **filters).order_by('-pub_date').limit(limit).offset(offset)
    if relations:
        _client = request.state.client if 'orgao' in relations else None
        return [await licitacao.include_relations(relations, _client) for licitacao in licitacoes]
    return [licitacao.to_pydantic() for licitacao in licitacoes]

@router.get('/estabelecimento/{id}/',response_model=Union[List[LicitacaoOut],int])
async def get_licitacoes_estabelecimento(
    id,
    relations:List[str]=Query(default=[]),
    query: QueryLicitacao = Depends(),
    count:bool=False,
    limit:int=10,
    offset:int=0
    ):
    filters = query.model_dump(exclude_none=True)
    if count:
        return await Licitacao.filter(estabelecimento=id, **filters).count()
    licitacoes = await Licitacao.filter(estabelecimento=id, **filters).order_by('-pub_date').offset(offset).limit(limit)
    if relations:
        return [await licitacao.include_relations(relations) for licitacao in licitacoes]
    return [licitacao.to_pydantic() for licitacao in licitacoes]


@router.get('/{id}/',response_model=LicitacaoOut)
async def get_licitacao(request:Request,id:UUID,relations:List[str]=Query(default=[])):
    try:
        licitacao = await Licitacao.get(id=id)
        if relations:
            client = request.state.client if 'orgao' in relations else None
            return await licitacao.include_relations(relations,client)
        return licitacao.to_pydantic()
    except DoesNotExist:
        raise NotFoundException('Licitação não encontrada')

@router.get('/{id}/docs/')
async def get_licitacao_docs(id:UUID):
    try:
        licitacao = await Licitacao.get(id=id).prefetch_related('documentos')
        return [doc.to_pydantic() for doc in licitacao.documentos]
    except DoesNotExist:
        raise NotFoundException('Licitação não encontrada')


@router.post('/{licitacao_id}/certificado/')
async def create_certificado_publicacao_licitacao_from_licitacao(
    request: Request,
    licitacao_id: UUID,
):
    """Gera um PDF de Certificado de Publicação de licitação (sem body)."""

    client = request.state.client

    try:
        licitacao = await Licitacao.get(id=licitacao_id)
    except DoesNotExist:
        raise NotFoundException('Licitação não encontrada')

    await licitacao.fetch_related('certificado_publicacao', 'modalidade')
    if getattr(licitacao, 'certificado_publicacao', None) is not None:
        raise BadRequestException('Licitação já possui certificado de publicação')

    licitacao.published_by = client.user.id
    pub_user = await client.user.get_user_by_id(licitacao.published_by)

    if not pub_user:
        raise BadRequestException('Responsável pela publicação não encontrado')
    if not pub_user.cargo:
        raise BadRequestException('Responsável pela publicação não possui cargo cadastrado')

    agora = datetime.now()
    data_extenso = format_date(licitacao.pub_date, format='long', locale='pt_BR')
    payload = {
        'num_processo': licitacao.num_processo,
        'modalidade': licitacao.modalidade.nome if licitacao.modalidade else '',
        'objeto': licitacao.objeto,
        'nome': pub_user.nome,
        'cargo': pub_user.cargo,
        'data_extenso': data_extenso,
    }

    pdf_service = PDFService(client)
    pdf_bytes = await pdf_service.gerar_certificado_publicacao_licitacao(payload)

    certificado = await CertificadoPublicacao.create(
        data=pdf_bytes,
        pub_date=agora.date(),
        tipo='licitacao',
    )

    licitacao.certificado_publicacao = certificado
    await licitacao.save()

    return {**certificado.to_dict(), 'licitacao': licitacao.id}


@router.get('/{licitacao_id}/certificado/content/')
async def get_certificado_publicacao_licitacao_content_by_licitacao(
    request: Request,
    licitacao_id: UUID,
):
    """Retorna o conteúdo (PDF) do certificado de publicação da licitação."""

    from api.utils.files import iterfile, get_download_headers

    try:
        licitacao = await Licitacao.get(id=licitacao_id)
    except DoesNotExist:
        raise NotFoundException('Licitação não encontrada')

    await licitacao.fetch_related('certificado_publicacao')
    certificado = getattr(licitacao, 'certificado_publicacao', None)
    if certificado is None:
        raise NotFoundException('Certificado não encontrado')

    safe_num = (licitacao.num_processo or 'licitacao').replace('/', '_')
    headers = get_download_headers(
        filename=f"certificado_publicacao_licitacao_{safe_num}.pdf",
        content_length=len(certificado.data),
        disposition='attachment',
    )

    return StreamingResponse(
        iterfile(certificado.data),
        media_type='application/pdf',
        headers=headers,
    )


@router.delete('/{licitacao_id}/certificado/')
async def delete_certificado_publicacao_licitacao(
    request: Request,
    licitacao_id: UUID,
):
    """Remove o certificado de publicação da licitação."""

    try:
        licitacao = await Licitacao.get(id=licitacao_id)
    except DoesNotExist:
        raise NotFoundException('Licitação não encontrada')

    await licitacao.fetch_related('certificado_publicacao')
    certificado = licitacao.certificado_publicacao
    if certificado is None:
        raise NotFoundException('Certificado não encontrado')

    async with in_transaction() as connection:
        licitacao.certificado_publicacao = None
        await licitacao.save(using_db=connection)
        await certificado.delete(using_db=connection)

    return JSONResponse({'message': 'Certificado removido com sucesso'})


@router.patch('/{id}/',response_model=LicitacaoOut)
async def update_licitacao(id:UUID,updated_licitacao:UpdatedLicitacao):
    try:
        licitacao = await Licitacao.get(id=id)
        updated_dict = updated_licitacao.model_dump(exclude_none=True)
        relations = {'modalidade':Modalidade,'secao':Secao}
        for key in relations.keys():
            if key in updated_dict:
                updated_dict[key] = await relations[key].get(id=updated_dict[key])
        await licitacao.update_from_dict(updated_dict).save()
        return licitacao.to_pydantic()
    except DoesNotExist:
        raise NotFoundException('Licitação não encontrada')

@router.delete('/{id}/')
async def delete_licitacao(id:UUID):
    async with in_transaction() as connection:
        try:
            licitacao = await Licitacao.get(id=id)
            await licitacao.delete(using_db=connection)
            return JSONResponse({
                'message':f'Licitação {licitacao.id} deletada',
                'id':str(licitacao.id)
            },status_code=200)
        except DoesNotExist:
            raise NotFoundException('Licitação não encontrada')

@router.get('/estabelecimento/{estabelecimento_id}/exportar/')
async def exportar_licitacoes(
    request: Request,
    estabelecimento_id: UUID,
    type: str = 'csv',
    num_processo: Optional[str] = Query(None),
    objeto: Optional[str] = Query(None),
    orgao: Optional[str] = Query(None),
    situacao: Optional[str] = Query(None),
    modalidade: Optional[str] = Query(None),
    pub_date_lte: Optional[date] = Query(None),
    pub_date_gte: Optional[date] = Query(None),
):
    params = {
        "estabelecimento": estabelecimento_id,
        "num_processo__icontains": num_processo,
        "objeto__icontains": objeto,
        "orgao": orgao,
        "situacao__icontains": situacao,
        "modalidade__nome__icontains": modalidade,
        "pub_date__lte": pub_date_lte,
        "pub_date__gte": pub_date_gte,
    }

    params = {k: v for k, v in params.items() if v}
    licitacoes = await Licitacao.filter(**params).prefetch_related('modalidade', 'secao')
    
    import pandas as pd
    format_data = [
        {
            "Numero Processo": lic.num_processo,
            "Objeto": lic.objeto,
            "Modalidade": lic.modalidade.nome if lic.modalidade else "",
            "Situacao": lic.situacao,
            "Regime Execucao": lic.regime_execucao,
            "Valor Estimado": str(lic.valor_estimado),
            "Valor Vencedor": str(lic.valor_vencedor),
            "Data Publicacao": lic.pub_date.isoformat() if lic.pub_date else "",
            "Data Homologacao": lic.homolog_date.isoformat() if lic.homolog_date else "",
            "Data Julgamento": lic.julg_date.isoformat() if lic.julg_date else "",
        } for lic in licitacoes
    ]
    
    if format_data:
        data = {
            key: [d[key] for d in format_data]
            for key in format_data[0]
        }
        df = pd.DataFrame(data)
    else:
        df = pd.DataFrame(columns=["Numero Processo", "Objeto", "Modalidade", "Situacao", "Regime Execucao", "Valor Estimado", "Valor Vencedor", "Data Publicacao", "Data Homologacao", "Data Julgamento"])
    
    if type == 'csv':
        csv_data = df.to_csv(index=False)
        csv_buffer = BytesIO(csv_data.encode('utf-8'))
        return StreamingResponse(csv_buffer, media_type='text/csv', headers={
            'Content-Disposition': f'attachment; filename="licitacoes_{date.today()}.csv"'
        })
    elif type == 'xml':
        df_xml = df.rename(columns=lambda x: x.replace(' ', '_'))
        xml_data = df_xml.to_xml(index=False)
        xml_buffer = BytesIO(xml_data.encode('utf-8'))
        return StreamingResponse(xml_buffer, media_type='application/xml', headers={
            'Content-Disposition': f'attachment; filename="licitacoes_{date.today()}.xml"'
        })
    elif type == 'pdf':
        from datetime import datetime
        
        # Preparar os dados de licitação para enviar ao pdf_service
        processos = [
            {
                'num_processo': lic.num_processo,
                'objeto': lic.objeto,
                'situacao': lic.situacao,
                'pub_date': lic.pub_date.strftime('%d/%m/%Y') if lic.pub_date else None,
                'julg_date': lic.julg_date.strftime('%d/%m/%Y') if lic.julg_date else None,
                'modalidade': {'nome': lic.modalidade.nome if lic.modalidade else ''},
                'orgao': {'nome': lic.orgao if hasattr(lic, 'orgao') else 'Órgão Municipal'}
            }
            for lic in licitacoes
        ]
        
        date_now = datetime.now().date()
        pdf_service = PDFService(None)  # Sem AuthClient para PDF simples
        pdf_data = await pdf_service.gerar_pdf_simples_licitacao(
            processos=processos,
            estabelecimento_id=estabelecimento_id,
            data_relatorio=date_now.strftime('%d/%m/%Y'),
            titulo='Relatório Municipal de Licitações'
        )
        
        pdf_buffer = BytesIO(pdf_data)
        return StreamingResponse(pdf_buffer, media_type='application/pdf', headers={
            'Content-Disposition': f'attachment; filename="licitacoes_{date.today()}.pdf"'
        })