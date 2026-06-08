from fastapi import APIRouter, Request, Query, Depends, Form, UploadFile, File
from fastapi.responses import JSONResponse, StreamingResponse
from babel.dates import format_date
from tortoise.exceptions import DoesNotExist
from tortoise.expressions import Q
from tortoise.transactions import in_transaction
from uuid import UUID
from typing import List, Optional, Union
from datetime import date
from datetime import datetime
from io import BytesIO
import re
from api.models import Contrato, Modalidade, Secao, Licitacao, Dispensa, Pessoa, Vigencia, CertificadoPublicacao, Documento
from api.schemas import ContratoIn, ContratoOut, UpdatedContrato, QueryContrato
from api.services.pdf.pdf_service import PDFService
from api.exceptions import NotFoundException, BadRequestException

router = APIRouter(prefix='/contrato', tags=['Contratos'])

@router.post('/', response_model=ContratoOut)
async def create_contrato(request: Request, contr: ContratoIn):
    try:
        modalidade = await Modalidade.get(id=contr.modalidade)
    except DoesNotExist:
        raise NotFoundException('Modalidade não encontrada.')
    try:
        secao = await Secao.get(id=contr.secao)
    except DoesNotExist:
        raise NotFoundException('Seção não encontrada.')
    try:
        fornecedor = await Pessoa.get(id=contr.fornecedor)
    except DoesNotExist:
        raise NotFoundException('Fornecedor não encontrado.')
    try:
        vigencia = await Vigencia.get(id=contr.vigencia)
    except DoesNotExist:
        raise NotFoundException('Vigência não encontrada.')

    licitacao = await Licitacao.get_or_none(id=contr.licitacao)
    dispensa = await Dispensa.get_or_none(id=contr.dispensa)
    client = request.state.client
    async with in_transaction() as connection:
        contrato = await Contrato.create(
            num_contrato=contr.num_contrato,
            published_by=client.user.id,
            modalidade=modalidade,
            secao=secao,
            valor_estimado=contr.valor_estimado,
            tipo=contr.tipo,
            situacao=contr.situacao,
            descricao=contr.descricao,
            pub_date=contr.pub_date,
            data_inicio=contr.data_inicio,
            data_vencimento=contr.data_vencimento,
            prazo_entrega=contr.prazo_entrega,
            finalidade=contr.finalidade,
            licitacao=licitacao,
            dispensa=dispensa,
            fornecedor=fornecedor,
            vigencia=vigencia,
            portaria=contr.portaria,
            objeto=contr.objeto,
            estabelecimento=client.estabelecimento.id,
            using_db=connection
        )
    return await contrato.include_relations(['certificado_publicacao'])

_NUM_CONTRATO_RE = re.compile(r'^(\d+)-(\d{4})-')

@router.post('/multiple/')
async def create_multiple_contratos(
    request: Request,
    pub_date: date = Form(...),
    secao_id: UUID = Form(...),
    files: List[UploadFile] = File(...),
    parse_num_contrato: bool = Query(default=False),
):
    client = request.state.client
    modalidade_default = await Modalidade.filter(estabelecimento=client.estabelecimento.id).first()
    try:
        secao = await Secao.get(id=secao_id)
    except DoesNotExist:
        raise NotFoundException('Seção não encontrada.')
    contratos_criados = []
    async with in_transaction() as connection:
        for file in files:
            content = await file.read()
            num_contrato = None
            if parse_num_contrato and file.filename:
                match = _NUM_CONTRATO_RE.match(file.filename)
                if match:
                    num_contrato = f'{match.group(1)}/{match.group(2)}'
            contrato = await Contrato.create(
                num_contrato=num_contrato,
                modalidade=modalidade_default,
                secao=secao,
                pub_date=pub_date,
                situacao='vigente',
                tipo='contrato',
                valor_estimado=0.00,
                prazo_entrega=0,
                estabelecimento=client.estabelecimento.id,
                using_db=connection
            )
            documento = await Documento.create(
                titulo=file.filename,
                data=content,
                using_db=connection
            )
            await contrato.documentos.add(documento, using_db=connection)
            contratos_criados.append(contrato)
    return contratos_criados

@router.get('/', response_model=Union[List[ContratoOut], int])
async def get_contratos(
    request: Request,
    relations: List[str] = Query(default=[]),
    count: bool = False,
    limit: int = Query(default=10),
    offset: int = Query(default=0),
    query: QueryContrato = Depends(),
):
    client = request.state.client
    orgaos_ids = client.user.orgaos
    filters = query.model_dump(exclude_none=True)
    secao_orgao_filter = filters.pop('secao__orgao', None)
    q = Q(secao__orgao__in=orgaos_ids)
    if secao_orgao_filter:
        q &= Q(secao__orgao=secao_orgao_filter)
    if count:
        return await Contrato.filter(q, **filters).count()
    contratos = await Contrato.filter(q, **filters).order_by('-pub_date').offset(offset).limit(limit)
    rels = relations if relations else ['certificado_publicacao']
    return [await contrato.include_relations(rels, client) for contrato in contratos]

@router.get('/estabelecimento/{id}/', response_model=Union[List[ContratoOut], int])
async def get_contratos_estabelecimento(
    id, relations: List[str] = Query(default=[]),
    query: QueryContrato = Depends(),
    count: bool = False,
    limit: int = 10,
    offset: int = 0
):
    filters = query.model_dump(exclude_none=True)
    if count:
        return await Contrato.filter(estabelecimento=id, **filters).count()
    contratos = await Contrato.filter(estabelecimento=id, **filters).order_by('-pub_date').offset(offset).limit(limit)
    if relations:
        return [await contrato.include_relations(relations) for contrato in contratos]
    return [await contrato.include_relations(['certificado_publicacao']) for contrato in contratos]

@router.get('/{id}/', response_model=ContratoOut)
async def get_contrato(id: UUID,relations:List[str]=Query(default=[])):
    try:
        contrato = await Contrato.get(id=id)
        if relations:
            return await contrato.include_relations(relations=relations)
        return await contrato.include_relations(['certificado_publicacao'])
    except DoesNotExist:
        raise NotFoundException('Contrato não encontrado')

@router.get('/{id}/docs/')
async def get_contrato_docs(id: UUID):
    try:
        contrato = await Contrato.get(id=id).prefetch_related('documentos')
        return [doc.to_pydantic() for doc in contrato.documentos]
    except DoesNotExist:
        raise NotFoundException('Contrato não encontrado')

@router.patch('/{id}/', response_model=ContratoOut)
async def update_contrato(id: UUID, updated: UpdatedContrato):
    try:
        contrato = await Contrato.get(id=id)
        updated_dict = updated.model_dump(exclude_none=True)
        relations = {
            'modalidade': Modalidade,
            'secao': Secao,
            'licitacao': Licitacao,
            'fornecedor': Pessoa,
            'vigencia': Vigencia,
            'dispensa': Dispensa,
        }
        for key in relations.keys():
            if key in updated_dict:
                updated_dict[key] = await relations[key].get(id=updated_dict[key])
        await contrato.update_from_dict(updated_dict).save()
        return await contrato.include_relations(['certificado_publicacao'])
    except DoesNotExist:
        raise NotFoundException('Contrato não encontrado')


@router.post('/{contrato_id}/certificado/')
async def create_certificado_publicacao_contrato_from_contrato(
    request: Request,
    contrato_id: UUID,
):
    """Gera um PDF de Certificado de Publicação de contrato (sem body)."""

    client = request.state.client

    try:
        contrato = await Contrato.get(id=contrato_id)
    except DoesNotExist:
        raise NotFoundException('Contrato não encontrado')

    await contrato.fetch_related('certificado_publicacao')
    if getattr(contrato, 'certificado_publicacao', None) is not None:
        raise BadRequestException('Contrato já possui certificado de publicação')

    if not contrato.published_by:
        raise BadRequestException('Contrato não possui responsável pela publicação')
    pub_user = await client.user.get_user_by_id(contrato.published_by)
    agora = datetime.now()
    data_extenso = format_date(contrato.pub_date, format='long', locale='pt_BR')
    payload = {
        'num_contrato': contrato.num_contrato,
        'objeto': contrato.objeto,
        'nome': pub_user.nome if pub_user else None,
        'cargo': pub_user.cargo if pub_user else None,
        'data_extenso': data_extenso,
    }

    pdf_service = PDFService(client)
    pdf_bytes = await pdf_service.gerar_certificado_publicacao_contrato(payload)

    certificado = await CertificadoPublicacao.create(
        data=pdf_bytes,
        pub_date=agora.date(),
        tipo='contrato',
    )

    contrato.certificado_publicacao = certificado
    await contrato.save()

    return {**certificado.to_dict(), 'contrato': contrato.id}


@router.get('/{contrato_id}/certificado/content/')
async def get_certificado_publicacao_contrato_content_by_contrato(
    request: Request,
    contrato_id: UUID,
):
    """Retorna o conteúdo (PDF) do certificado de publicação do contrato."""

    from api.utils.files import iterfile, get_download_headers

    try:
        contrato = await Contrato.get(id=contrato_id)
    except DoesNotExist:
        raise NotFoundException('Contrato não encontrado')

    await contrato.fetch_related('certificado_publicacao')
    certificado = getattr(contrato, 'certificado_publicacao', None)
    if certificado is None:
        raise NotFoundException('Certificado não encontrado')

    safe_num = (contrato.num_contrato or 'contrato').replace('/', '_')
    headers = get_download_headers(
        filename=f"certificado_publicacao_contrato_{safe_num}.pdf",
        content_length=len(certificado.data),
        disposition='attachment',
    )

    return StreamingResponse(
        iterfile(certificado.data),
        media_type='application/pdf',
        headers=headers,
    )


@router.delete('/{contrato_id}/certificado/')
async def delete_certificado_publicacao_contrato(
    request: Request,
    contrato_id: UUID,
):
    """Remove o certificado de publicação do contrato."""

    try:
        contrato = await Contrato.get(id=contrato_id)
    except DoesNotExist:
        raise NotFoundException('Contrato não encontrado')

    await contrato.fetch_related('certificado_publicacao')
    certificado = contrato.certificado_publicacao
    if certificado is None:
        raise NotFoundException('Certificado não encontrado')

    async with in_transaction() as connection:
        contrato.certificado_publicacao = None
        await contrato.save(using_db=connection)
        await certificado.delete(using_db=connection)

    return JSONResponse({'message': 'Certificado removido com sucesso'})


@router.delete('/{id}/')
async def delete_contrato(id: UUID):
    async with in_transaction() as connection:
        try:
            contrato = await Contrato.get(id=id)
            await contrato.fetch_related('certificado_publicacao')
            certificado = getattr(contrato, 'certificado_publicacao', None)
            if certificado is not None:
                contrato.certificado_publicacao = None
                await contrato.save(using_db=connection)
                await certificado.delete(using_db=connection)
            await contrato.delete(using_db=connection)
            return JSONResponse({
                'message': f'Contrato {contrato.id} deletado',
                'id': str(contrato.id)
            }, status_code=200)
        except DoesNotExist:
            raise NotFoundException('Contrato não encontrado')

@router.get('/estabelecimento/{estabelecimento_id}/exportar/')
async def exportar_contratos(
    request: Request,
    estabelecimento_id: UUID,
    type: str = 'csv',
    num_contrato: Optional[str] = Query(None),
    objeto: Optional[str] = Query(None),
    situacao: Optional[str] = Query(None),
    tipo_contrato: Optional[str] = Query(None),
    modalidade: Optional[str] = Query(None),
    fornecedor: Optional[str] = Query(None),
    pub_date_lte: Optional[date] = Query(None),
    pub_date_gte: Optional[date] = Query(None),
):
    params = {
        "estabelecimento": estabelecimento_id,
        "num_contrato__icontains": num_contrato,
        "objeto__icontains": objeto,
        "situacao__icontains": situacao,
        "tipo__icontains": tipo_contrato,
        "modalidade__nome__icontains": modalidade,
        "pub_date__lte": pub_date_lte,
        "pub_date__gte": pub_date_gte,
    }

    params = {k: v for k, v in params.items() if v}
    contratos = await Contrato.filter(**params).prefetch_related('modalidade', 'secao', 'fornecedor', 'fornecedor__pessoa_fisica', 'fornecedor__pessoa_juridica', 'licitacao', 'dispensa')
    
    import pandas as pd
    format_data = []
    for contrato in contratos:
        # Determinar o nome do fornecedor
        fornecedor_nome = ""
        if contrato.fornecedor:
            await contrato.fornecedor.fetch_related('pessoa_fisica', 'pessoa_juridica')
            if hasattr(contrato.fornecedor, 'pessoa_fisica') and contrato.fornecedor.pessoa_fisica:
                fornecedor_nome = contrato.fornecedor.pessoa_fisica.nome
            elif hasattr(contrato.fornecedor, 'pessoa_juridica') and contrato.fornecedor.pessoa_juridica:
                fornecedor_nome = contrato.fornecedor.pessoa_juridica.razao_social
        
        format_data.append({
            "Numero Contrato": contrato.num_contrato,
            "Objeto": contrato.objeto,
            "Tipo": contrato.tipo,
            "Situacao": contrato.situacao,
            "Modalidade": contrato.modalidade.nome if contrato.modalidade else "",
            "Fornecedor": fornecedor_nome,
            "Valor Estimado": str(contrato.valor_estimado),
            "Descricao": contrato.descricao,
            "Data Publicacao": contrato.pub_date.isoformat() if contrato.pub_date else "",
            "Data Inicio": contrato.data_inicio.isoformat() if contrato.data_inicio else "",
            "Data Vencimento": contrato.data_vencimento.isoformat() if contrato.data_vencimento else "",
            "Prazo Entrega": str(contrato.prazo_entrega) if contrato.prazo_entrega else "",
        })
    
    if format_data:
        data = {
            key: [d[key] for d in format_data]
            for key in format_data[0]
        }
        df = pd.DataFrame(data)
    else:
        df = pd.DataFrame(columns=["Numero Contrato", "Objeto", "Tipo", "Situacao", "Modalidade", "Fornecedor", "Valor Estimado", "Descricao", "Data Publicacao", "Data Inicio", "Data Vencimento", "Prazo Entrega"])
    
    if type == 'csv':
        csv_data = df.to_csv(index=False)
        csv_buffer = BytesIO(csv_data.encode('utf-8'))
        return StreamingResponse(csv_buffer, media_type='text/csv', headers={
            'Content-Disposition': f'attachment; filename="contratos_{date.today()}.csv"'
        })
    elif type == 'xml':
        df_xml = df.rename(columns=lambda x: x.replace(' ', '_'))
        xml_data = df_xml.to_xml(index=False)
        xml_buffer = BytesIO(xml_data.encode('utf-8'))
        return StreamingResponse(xml_buffer, media_type='application/xml', headers={
            'Content-Disposition': f'attachment; filename="contratos_{date.today()}.xml"'
        })
    elif type == 'pdf':
        from datetime import datetime
        
        # Preparar os dados de contrato para enviar ao pdf_service
        processos = []
        for contr in contratos:
            fornecedor_nome = ""
            if contr.fornecedor:
                if hasattr(contr.fornecedor, 'pessoa_fisica') and contr.fornecedor.pessoa_fisica:
                    fornecedor_nome = contr.fornecedor.pessoa_fisica.nome
                elif hasattr(contr.fornecedor, 'pessoa_juridica') and contr.fornecedor.pessoa_juridica:
                    fornecedor_nome = contr.fornecedor.pessoa_juridica.razao_social
            
            modalidade_tipo = ''
            num_processo = ''
            orgao = ''
            
            if contr.licitacao:
                modalidade_tipo = contr.modalidade.nome if contr.modalidade else ''
                num_processo = contr.licitacao.num_processo
                orgao = getattr(contr.licitacao, 'orgao', 'Órgão Municipal')
            elif contr.dispensa:
                modalidade_tipo = contr.dispensa.tipo_dispensa if hasattr(contr.dispensa, 'tipo_dispensa') else ''
                num_processo = contr.dispensa.num_processo if hasattr(contr.dispensa, 'num_processo') else ''
                orgao = getattr(contr.dispensa, 'orgao', 'Órgão Municipal')
            
            fiscal_nome = ""
            if contr.vigencia and hasattr(contr.vigencia, 'fiscal') and hasattr(contr.vigencia.fiscal, 'pessoa'):
                fiscal_nome = getattr(contr.vigencia.fiscal.pessoa, 'nome', '') or getattr(contr.vigencia.fiscal.pessoa, 'razao_social', '')
            
            processos.append({
                'num_contrato': contr.num_contrato,
                'objeto': contr.objeto,
                'situacao': contr.situacao,
                'data_inicio': str(contr.data_inicio) if contr.data_inicio else '',
                'valor_estimado': float(contr.valor_estimado) if contr.valor_estimado else 0,
                'finalidade': contr.finalidade or '',
                'modalidade_tipo': modalidade_tipo,
                'num_processo': num_processo,
                'orgao': orgao,
                'fornecedor': {'razao_social': fornecedor_nome},
                'fiscal_contrato': {'pessoa': {'nome': fiscal_nome}}  # chave mantida para compatibilidade com template PDF
            })
        
        date_now = datetime.now().date()
        pdf_service = PDFService(None)  # Sem AuthClient para PDF simples
        pdf_data = await pdf_service.gerar_pdf_simples_contrato(
            processos=processos,
            estabelecimento_id=estabelecimento_id,
            data_relatorio=date_now.strftime('%d/%m/%Y'),
            titulo='Relatório Municipal de Contratos'
        )
        
        pdf_buffer = BytesIO(pdf_data)
        return StreamingResponse(pdf_buffer, media_type='application/pdf', headers={
            'Content-Disposition': f'attachment; filename="contratos_{date.today()}.pdf"'
        })