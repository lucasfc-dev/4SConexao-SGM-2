from fastapi import Request,Depends,Query
from fastapi.routing import APIRouter
from fastapi.responses import StreamingResponse,JSONResponse
from api.models import Documento,Licitacao,Dispensa,EditalLicitacao,Contrato,FiscalContrato
from api.schemas import DocumentoIn,DocumentoOut
from api.exceptions import BadRequestException, NotFoundException
from tortoise.exceptions import DoesNotExist
from tortoise.transactions import in_transaction
from typing import List
from uuid import UUID
from io import BytesIO

router = APIRouter(prefix='/docs',tags=['Documentos'])

@router.post('/',response_model=List[DocumentoOut])
async def create_document(request:Request,form_data:DocumentoIn=Depends(DocumentoIn.documento_form)):
    async with in_transaction() as connection:
        try:
                model_map = {
                    'dispensa': Dispensa,
                    'licitacao': Licitacao,
                    'edital': EditalLicitacao,
                    'contrato': Contrato,
                    'fiscal_contrato': FiscalContrato,
                }
                target_type = form_data.target_type.lower()
                model = model_map.get(target_type)
                if not model:
                    raise BadRequestException(f'Tipo de documento inválido: {form_data.target_type}')
                parent = await model.get(id=form_data.target_id)
                documents = []
                for file in form_data.files:
                    document = await Documento.create(
                        titulo=file.filename,
                        data=await file.read(),
                        using_db=connection
                    )
                    if target_type == 'fiscal_contrato':
                        await parent.portarias.add(document, using_db=connection)
                    else:
                        await parent.documentos.add(document, using_db=connection)
                    documents.append(document)
                return [doc.to_pydantic() for doc in documents]
        except DoesNotExist:
            raise NotFoundException('Documento não encontrado')

@router.get('/',response_model=List[DocumentoOut])
async def get_docs(request:Request,relations:List[str]=Query(default=[])):
    docs = await Documento.all()
    if relations:
        return [await doc.include_relations(relations) for doc in docs]
    return [doc.to_pydantic() for doc in docs]

@router.get('/{id}/',response_model=DocumentoOut)
async def get_doc(id:UUID,relations:List[str]=Query(default=[])):
    try:
        doc = await Documento.get(id=id)
        if relations:
            return await doc.include_relations(relations)
        return doc.to_pydantic()
    except DoesNotExist:
        raise NotFoundException('Documento não encontrado')

@router.get('/{id}/content/')
async def get_content(id:UUID):
    try:
        # Otimização: carregar apenas campo 'data' necessário
        document = await Documento.get(id=id).only('data', 'titulo')
        
        from api.utils.files import iterfile, get_download_headers
        
        headers = get_download_headers(
            filename=document.titulo,
            content_length=len(document.data)
        )
        
        return StreamingResponse(
            iterfile(document.data),
            media_type='application/pdf',
            headers=headers
        )
    except DoesNotExist:
        raise NotFoundException('Documento não encontrado')

@router.delete('/{id}/')
async def delete_doc(id:UUID):
    async with in_transaction() as connection:
        try:
            documento = await Documento.get(id=id)
            await documento.delete(using_db=connection)
            return JSONResponse({
                'message':f'documento {documento.id} deletado',
                'id':str(documento.id)
            },status_code=200)
        except DoesNotExist:
            raise NotFoundException('Documento não encontrado')