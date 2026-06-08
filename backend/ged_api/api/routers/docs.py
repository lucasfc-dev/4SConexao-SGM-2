from base64 import b64encode
from fastapi import Request,Query,Depends,Form,File,UploadFile
from fastapi.responses import StreamingResponse,JSONResponse
from fastapi.routing import APIRouter
from api.models import Document,Tipo,Vereador,Assinatura
from api.schemas import DocumentOut,UpdatedDocument,parse_update_doc_form,DocQuery
from api.config import NEXT_FRONTEND_URL
from api.services.auth.auth_service import AuthClient
from api.services.pdf.pdf_service import PDFService
from api.exceptions import (
    BadRequestException,
    NotFoundException,
    InternalServerErrorException,
    APIException
)
from tortoise.transactions import in_transaction
from tortoise.exceptions import DoesNotExist
from uuid import UUID
from typing import List,Optional
from datetime import date, datetime
from io import BytesIO

router = APIRouter(prefix='/docs',tags=['docs'])

@router.post('/',response_model=DocumentOut)
async def create_document(
request:Request,
compartilhar:bool=False,
titulo:str=Form(...),
descricao:str=Form(...),
tipo_id:UUID=Form(...),
file:UploadFile=File(...),
situacao:str=Form(...),
orgao_id:UUID=Form(...),
vereador_id:Optional[UUID]=Form(None),
pub_date:date=Form(...)):
    client:AuthClient = request.state.client
    tipo = await Tipo.get(id=tipo_id)
    vereador = await Vereador.get(id=vereador_id) if vereador_id else None
    file_bytes = await file.read()
    document = await Document.create(
        titulo=titulo,
        descricao=descricao,
        tipo=tipo,
        data=file_bytes,
        situacao=situacao,
        vereador=vereador,
        orgao=orgao_id,
        estabelecimento=client.estabelecimento.id,
        pub_date=pub_date
    )
    if compartilhar:
        from api.services.doem.doem_service import DoemClient
        import httpx
        try:
            doem_client = DoemClient(token=client.token)
            form_data = {
                'titulo': titulo,
                'tipo': str(tipo.nome),
                'orgao_id': str(orgao_id),
            }
            files = {
                'file': (file.filename, BytesIO(file_bytes), file.content_type)
            }
            await doem_client.post_document(form_data, files=files)
        except httpx.HTTPStatusError as e:
            response = e.response
            try:
                detail = response.json().get('detail', str(response.text))
            except Exception:
                detail = str(response.text)
            raise APIException(
                status_code=response.status_code,
                message=f'Erro ao compartilhar documento: {detail}'
            )
        except Exception as e:
            raise InternalServerErrorException(f'Erro ao compartilhar documento: {e}')
    return document

@router.post('/multifiles/',response_model=List[DocumentOut])
async def post_multi_docs(
    request:Request,
    tipo_id:UUID=Form(...),
    orgao_id:UUID=Form(...),
    pub_date:date=Form(...),
    files:List[UploadFile]=File(...),
):
    client = request.state.client
    async with in_transaction("default") as connection:
        try:
            docs_list = []
            for file in files:
                titulo = file.filename.replace(".pdf","")
                data = await file.read()
                tipo = await Tipo.get(id=tipo_id)
                doc = await Document.create(
                    titulo=titulo,
                    descricao='',
                    data=data,
                    situacao='Vigente',
                    tipo=tipo,
                    orgao=orgao_id,
                    vereador=None,
                    estabelecimento=client.estabelecimento.id,
                    pub_date=pub_date,
                    using_db=connection
                )
                docs_list.append(doc)
            return docs_list
        except Exception as e:
            connection.rollback()
            raise InternalServerErrorException(f'Erro inesperado ao tentar cadastrar arquivos: {e}')

@router.get('/')
async def get_documents(request:Request):
    client = request.state.client
    orgaos_ids = client.user.orgaos
    documents = await Document.filter(orgao__in=orgaos_ids) \
            .prefetch_related('tipo','vereador') \
                .order_by('pub_date','created_at') \
                    .values(
                        "id",
                        "titulo",
                        "descricao",
                        "tipo__nome",  
                        "situacao",
                        "orgao",
                        "vereador__id",
                        "tipo__id",
                        "pub_date",
                        "vereador__nome",  
                        "estabelecimento",
                        "created_at"
                    )
    return documents

@router.get('/{id}/')
async def get_document(request:Request,id:UUID):
    try:
        document = await Document.get(id=id).prefetch_related('tipo','vereador').values(
        "id",
        "titulo",
        "descricao",
        "tipo__nome",  
        "situacao",
        "orgao",
        "vereador__nome",  
        "estabelecimento",
        "created_at"
    )
        return document
    except DoesNotExist:
        raise NotFoundException('Id de Documento não encontrado') 
    
@router.get('/{id}/content/')
async def get_content(request:Request,id:UUID):
    try:
        # Otimização: carregar apenas o campo 'data' necessário
        doc = await Document.get(id=id).only('data', 'titulo')
        
        # Função geradora para streaming em chunks
        from api.utils.files import iterfile, get_download_headers
        
        # Headers otimizados para download
        headers = get_download_headers(
            filename=f"{doc.titulo}.pdf",
            content_length=len(doc.data)
        )
        
        return StreamingResponse(
            iterfile(doc.data),
            media_type='application/pdf',
            headers=headers
        )
    except DoesNotExist:
        raise NotFoundException('Id de Documento não encontrado.')

@router.patch('/{id}/',response_model=DocumentOut)
async def update_document(
    request:Request,
    id: UUID,
    form_data: dict = Depends(parse_update_doc_form)    
):
    
    try:
        doc = await Document.get(id=id)
        if 'vereador_id' in form_data:
            if form_data['vereador_id'] is None:
                doc.vereador = None  # Limpa o campo
            else:
                vereador = await Vereador.get(id=form_data['vereador_id'])
                doc.vereador = vereador

        if form_data['tipo_id']:
            tipo = await Tipo.get(id=form_data['tipo_id'])
            doc.tipo=tipo
        file= form_data['file']
        updated_data = UpdatedDocument(
            titulo=form_data['titulo'],
            descricao=form_data['descricao'],
            situacao=form_data['situacao'],
            orgao=form_data['orgao_id'],
            pub_date=form_data['pub_date'],
            data= await file.read() if file is not None else None
        )

        if updated_data:
            doc.update_from_dict(updated_data.model_dump(exclude_none=True))
            await doc.save() 
            await doc.fetch_related('vereador','tipo')
            return doc
        
    except DoesNotExist:
        raise NotFoundException('Não foi possível encontrar documento.')

@router.delete('/{id}/',response_model=DocumentOut)
async def delete_document(request:Request,id:UUID):
    try:
        document = await Document.get(id=id)
        await document.delete()
        await document.fetch_related('vereador','tipo')
        return document
    except DoesNotExist:
        raise NotFoundException('Id de documento não encontrado')

@router.post('/sign/{id}/')
async def assinar_documento(request:Request,id:UUID): 
    client = request.state.client
    from erpbrasil.assinatura.excecoes import CertificadoSenhaInvalida
    from erpbrasil.assinatura.excecoes import CertificadoExpirado

    async with in_transaction("default") as connection:
        try:
            doc = await Document.get(id=id)
        except DoesNotExist:
            raise NotFoundException('Id de documento não encontrado')
        datetime_obj = datetime.fromisoformat(str(doc.created_at))
        timestamp_str = str(datetime_obj.strftime("%d%m%Y%H%M%S%f"))
        assinatura = await Assinatura.get_or_none(doc=doc)
        if assinatura:
            await assinatura.delete(using_db=connection)
        doc_ref = timestamp_str+'-'+str(id)[9:13]
        assinatura = await Assinatura.create(doc=doc,link_ref=doc_ref,using_db=connection)
        url_qrcode = f'{NEXT_FRONTEND_URL}/validar_doc/{doc_ref}'
        pdf_service = PDFService(client)
        try:
            resultado_assinatura = await pdf_service.assinar_pdf(doc.data, url_qrcode, doc_ref)
            doc.data = resultado_assinatura
            await doc.save(using_db=connection) 
        except CertificadoExpirado:
            raise BadRequestException('Certificado expirado')
        except CertificadoSenhaInvalida:
            raise BadRequestException('Certificado ou senha inválidos')
        await doc.save(using_db=connection)
        return "Documento assinado."


@router.get('/valida/{assinatura_ref}/')
async def get_doc_by_ass(request:Request,assinatura_ref:str):
    try:
        assinatura =  await Assinatura.get(link_ref=assinatura_ref)
        await assinatura.fetch_related('doc')
        doc = await assinatura.doc
        return {'doc_id':doc.id,'signed_at':assinatura.created_at.date()}
    except DoesNotExist:
        raise NotFoundException('Assinatura não existente')
    

@router.get('/estabelecimento/{estabelecimento_id}/')
async def get_doc_by_estabelecimento(
    estabelecimento_id:UUID,
    query:DocQuery=Depends(),
    count:bool=False,
    limit:int = 10,
    offset:int = 0
    ):
    filters = query.model_dump(exclude_none=True)
    if count:
        return await Document.filter(estabelecimento=estabelecimento_id,**filters).count()
    docs = await Document.filter(estabelecimento=estabelecimento_id,**filters) \
        .prefetch_related('tipo','vereador')\
        .order_by('-pub_date')\
        .limit(limit)\
        .offset(offset)\
        .values(
        "id",
        "titulo",
        "descricao",
        "tipo__nome",  
        "situacao",
        "orgao",
        "vereador__nome",  
        "estabelecimento",
        "created_at",
        "pub_date",
        'tipo__id'
    )
    return docs

@router.get('/estabelecimento/{estabelecimento_id}/exportar/')
async def exportar_documentos(
    request:Request,
    estabelecimento_id:UUID,
    type:str='csv',
    titulo: Optional[str] = Query(None),
    descricao: Optional[str] = Query(None),
    orgao: Optional[str] = Query(None),
    situacao: Optional[str] = Query(None),
    tipo: Optional[str] = Query(None),
    pub_date_lte: Optional[date] = Query(None),
    pub_date__gte: Optional[date] = Query(None),
):
    params = {
        "estabelecimento": estabelecimento_id,
        "titulo__icontains": titulo,
        "descricao__icontains": descricao,
        "orgao": orgao,
        "situacao__icontains": situacao,
        "tipo__nome__icontains": tipo,
        "pub_date__lte": pub_date_lte,
        "pub_date__gte": pub_date__gte,
    }

    params = {k: v for k, v in params.items() if v}
    # Otimização: usar select_related para ForeignKeys (JOIN em vez de queries separadas)
    # exclude 'data' binário
    docs = await Document.filter(**params).select_related('tipo', 'vereador').only(
        'id', 'titulo', 'descricao', 'situacao', 'pub_date', 'tipo_id', 'vereador_id'
    )
    
    import pandas as pd
    format_data = [
        {
            "Titulo": doc.titulo,
            "Descricao": doc.descricao,
            "Tipo": doc.tipo.nome,
            "Situacao": doc.situacao,
            "Data Publicacao": doc.pub_date.isoformat() if isinstance(doc.pub_date, datetime) else doc.pub_date
        } for doc in docs
    ]
    if format_data:
        data = {
            key: [d[key] for d in format_data]
            for key in format_data[0]
        }
        df = pd.DataFrame(data)
    else:
        # create empty DataFrame with expected columns
        df = pd.DataFrame(columns=["Titulo", "Descricao", "Tipo", "Situacao", "Data Publicacao"])
    if type == 'csv':
        csv_data = df.to_csv(index=False)
        csv_buffer = BytesIO(csv_data.encode('utf-8'))
        return StreamingResponse(csv_buffer, media_type='text/csv')
    elif type == 'xml':
        df_xml = df.rename(columns=lambda x: x.replace(' ', '_'))
        xml_data = df_xml.to_xml(index=False)
        xml_buffer = BytesIO(xml_data.encode('utf-8'))
        return StreamingResponse(xml_buffer, media_type='application/xml')
    elif type == 'pdf':
        # Usar PDFService para gerar PDF via API key
        pdf_service = PDFService()
        pdf_data = await pdf_service.generate_relatorio_pdf_public(docs,estabelecimento_id)     
        pdf_buffer = BytesIO(pdf_data)
        return StreamingResponse(pdf_buffer, media_type='application/pdf', headers={
            'Content-Disposition': f'attachment; filename="documentos_{date.today()}.pdf"'
        })

@router.get('/vereador/{vereador_id}/')
async def get_docs_by_vereador(
    vereador_id:UUID
):
    try:
        vereador = await Vereador.get(id=vereador_id)
    except DoesNotExist:
        raise NotFoundException('Id de Vereador não encontrado.')
    documentos = await Document.filter(vereador=vereador)\
    .prefetch_related('tipo','vereador')\
    .values(
        "id",
        "titulo",
        "descricao",
        "tipo__nome",  
        "situacao",
        "vereador__nome",  
        "pub_date"
    )
    for documento in documentos:
        documento['file_url'] = f'/docs/{documento["id"]}/content/'
    return documentos 