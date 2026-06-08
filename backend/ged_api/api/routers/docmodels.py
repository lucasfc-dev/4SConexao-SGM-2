from fastapi import Request,UploadFile,File,Form
from fastapi.routing import APIRouter
from api.models import DocModel
from api.schemas import DocModelOut,UserOut 
from api.services.auth.auth_service import AuthClient
from api.exceptions import NotFoundException
from tortoise.exceptions import DoesNotExist
from uuid import UUID
from typing import List
from base64 import b64encode

router = APIRouter(prefix='/docmodel',tags=['doc_model'])

@router.post('/',response_model=DocModelOut)
async def create_docmodel(
    request:Request,
    tipo:str=Form(...),
    file:UploadFile=File(...),
    descricao:str=Form(...),
    ):
    client:AuthClient = request.state.client
  
    data = await file.read()
    docmodel = await DocModel.create(tipo=tipo,data=data,descricao=descricao,estabelecimento=client.estabelecimento.id)
    return docmodel

@router.get('/',response_model=List[DocModelOut])
async def get_docmodels(request:Request):
    client:AuthClient = request.state.client
    docmodels = await DocModel.filter(estabelecimento=client.estabelecimento.id)
    return docmodels

@router.get('/{id}/',response_model=DocModelOut)
async def get_docmodel(request:Request,id:UUID):
    try:
        docmodel = await DocModel.get(id=id)
        return docmodel
    except DoesNotExist:
        raise NotFoundException('Id de Model de Documento não existe')
    
@router.get('/{id}/content/')
async def get_content(request:Request,id:UUID):
    try:
        docmodel = await DocModel.get(id=id)
        content = b64encode(docmodel.data).decode()
        return {'content':content}
    except DoesNotExist:
        raise NotFoundException('Id de Model de Documento não existe')
@router.delete('/{id}/',response_model=DocModelOut)
async def delete_docmodel(request:Request,id:UUID):
    try:
        docmodel = await DocModel.get(id=id)
        await docmodel.delete()
        return docmodel
    except DoesNotExist:
        raise NotFoundException('Id de Model de Documento não existe')