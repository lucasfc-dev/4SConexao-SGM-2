from fastapi import APIRouter, Request, Query
from fastapi.responses import JSONResponse
from tortoise.exceptions import DoesNotExist
from uuid import UUID
from typing import List

from api.models import Vigencia, FiscalContrato
from api.schemas import VigenciaIn, VigenciaOut, UpdatedVigencia
from api.exceptions import NotFoundException

router = APIRouter(prefix='/vigencia', tags=['Vigência'])


@router.post('/', response_model=VigenciaOut)
async def create_vigencia(request: Request, v: VigenciaIn):
    client = request.state.client
    try:
        fiscal = await FiscalContrato.get(id=v.fiscal)
    except DoesNotExist:
        raise NotFoundException('Fiscal não encontrado.')
    vigencia = await Vigencia.create(
        fiscal=fiscal,
        data_inicio=v.data_inicio,
        data_fim=v.data_fim,
        estabelecimento=client.estabelecimento.id,
    )
    return vigencia.to_pydantic()


@router.get('/', response_model=List[VigenciaOut])
async def get_vigencias(request: Request, relations: List[str] = Query(default=[])):
    client = request.state.client
    vigencias = await Vigencia.filter(estabelecimento=client.estabelecimento.id)
    if relations:
        return [await v.include_relations(relations) for v in vigencias]
    return [v.to_pydantic() for v in vigencias]


@router.get('/fiscal/{fiscal_id}/', response_model=List[VigenciaOut])
async def get_vigencias_por_fiscal(
    fiscal_id: UUID,
    relations: List[str] = Query(default=[]),
):
    vigencias = await Vigencia.filter(fiscal_id=fiscal_id)
    if relations:
        return [await v.include_relations(relations) for v in vigencias]
    return [v.to_pydantic() for v in vigencias]


@router.get('/{id}/', response_model=VigenciaOut)
async def get_vigencia(id: UUID, relations: List[str] = Query(default=[])):
    try:
        vigencia = await Vigencia.get(id=id)
        if relations:
            return await vigencia.include_relations(relations)
        return vigencia.to_pydantic()
    except DoesNotExist:
        raise NotFoundException('Vigência não encontrada.')


@router.patch('/{id}/', response_model=VigenciaOut)
async def update_vigencia(id: UUID, updated: UpdatedVigencia):
    try:
        vigencia = await Vigencia.get(id=id)
        await vigencia.update_from_dict(updated.model_dump(exclude_none=True)).save()
        return vigencia.to_pydantic()
    except DoesNotExist:
        raise NotFoundException('Vigência não encontrada.')


@router.delete('/{id}/')
async def delete_vigencia(id: UUID):
    try:
        vigencia = await Vigencia.get(id=id)
        await vigencia.delete()
        return JSONResponse({'message': f'Vigência {vigencia.id} deletada', 'id': str(vigencia.id)})
    except DoesNotExist:
        raise NotFoundException('Vigência não encontrada.')
