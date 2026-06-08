from typing import List,Optional
from uuid import UUID
from fastapi import Request,UploadFile,File,Form,Query
from fastapi.responses import StreamingResponse
from fastapi.routing import APIRouter
from api.services.auth.auth_service import AuthClient
from api.models import Vereador
from api.schemas import VereadorOut,UpdatedVereador,UserOut
from api.exceptions import NotFoundException, InternalServerErrorException
from tortoise.exceptions import DoesNotExist
from io import BytesIO
from datetime import date

router = APIRouter(prefix='/vereador',tags=['vereador'])

@router.post('/',response_model=VereadorOut)
async def create_vereador(
    request:Request,
    nome:str = Form(...),
    nome_campanha:str = Form(...),
    partido: str = Form(None),
    email: str = Form(None),
    telefone: str = Form(None),
    biografia: str = Form(None),
    endereco: str = Form(None),
    foto: UploadFile = File(None),
    inicio_mandato: date = Form(None),
    fim_mandato: date = Form(None)
):
    try:
        client:AuthClient = request.state.client
        
        vereador = await Vereador.create(
            nome=nome,
            nome_campanha=nome_campanha,
            partido=partido,
            email=email,
            telefone=telefone,
            biografia=biografia,
            endereco=endereco,
            foto=await foto.read() if foto else None,
            inicio_mandato=inicio_mandato,
            fim_mandato=fim_mandato,
            estabelecimento=client.estabelecimento.id
        )
        return vereador
    except Exception as e:
        raise InternalServerErrorException(f'{e}')
    
@router.get('/',response_model=List[VereadorOut])
async def get_vereadores(request:Request):
    client:AuthClient = request.state.client
    vereadores = await Vereador.filter(estabelecimento=client.estabelecimento.id)
    return vereadores

@router.get('/{id}/',response_model=VereadorOut)
async def get_vereador(request:Request,id:UUID):
    try:
        vereador = await Vereador.get(id=id)
        return vereador
    except DoesNotExist:
        raise NotFoundException('Id de Vereador não encontrado.')

@router.get('/{id}/foto/')
async def get_vereador_foto(request:Request,id:UUID):
    try:
        # Otimização: carregar apenas campo 'foto'
        vereador = await Vereador.get(id=id).only('foto', 'nome')
        if not vereador.foto:
            raise NotFoundException('Vereador não possui foto.')
        
        from api.utils.files import iterfile, get_download_headers
        
        headers = get_download_headers(
            filename=f"{vereador.nome}.jpg",
            content_length=len(vereador.foto),
            cache_max_age=86400  # Cache de 24h para fotos
        )
        
        return StreamingResponse(
            iterfile(vereador.foto),
            media_type='image/jpeg',
            headers=headers
        )
    except DoesNotExist:
        raise NotFoundException('Id de Vereador não encontrado.')

@router.get('/estabelecimento/{estabelecimento_id}/',response_model=List[VereadorOut])
async def get_vereadores_by_estabelecimento(
    estabelecimento_id:UUID,
    inicio_legislatura:Optional[date]=Query(None),
    fim_legislatura:Optional[date]=Query(None)
):
    query_vereadores: dict = {
        'estabelecimento':estabelecimento_id
    }
    if inicio_legislatura and fim_legislatura:
        query_vereadores.update({
            'inicio_mandato__gte':inicio_legislatura,
            'fim_mandato__lte':fim_legislatura
        })
    vereadores = await Vereador.filter(**query_vereadores)
    return vereadores

@router.patch('/{id}/',response_model=VereadorOut)
async def update_vereador(request:Request,id:UUID,updated_vereador:UpdatedVereador):
    try:
        vereador = await Vereador.get(id=id)
        await vereador.update_from_dict(updated_vereador.model_dump(exclude_none=True)).save()
        return vereador
    except DoesNotExist:
        raise NotFoundException('Id de Vereador não encontrado.')

@router.put('/{id}/foto/',response_model=VereadorOut)
async def update_vereador_foto(request:Request,id:UUID,foto:UploadFile=File(...)):
    try:
        vereador = await Vereador.get(id=id)
        vereador.foto = await foto.read()
        await vereador.save()
        return vereador
    except DoesNotExist:
        raise NotFoundException('Id de Vereador não encontrado.')

@router.delete('/{id}/',response_model=VereadorOut)
async def delete_vereador(request:Request,id:UUID):
    try:
        vereador = await Vereador.get(id=id)
        await vereador.delete()
        return vereador
    except DoesNotExist:
        raise NotFoundException('Id de Vereador não encontrado.')