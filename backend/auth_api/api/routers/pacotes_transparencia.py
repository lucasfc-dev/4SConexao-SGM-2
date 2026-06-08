from fastapi import APIRouter, Request, HTTPException
from api.models import PacoteTransparencia, ModuloTransparencia, Estabelecimento
from tortoise.exceptions import DoesNotExist
from uuid import UUID
from typing import List

router = APIRouter(prefix="/pacote_transparencia", tags=["Pacotes"])

@router.post("/estabelecimento/{estabelecimento_id}/")
async def create_pacote(request: Request, estabelecimento_id: UUID):
    user = request.state.user
    if not user.is_super:
        raise HTTPException(status_code=401, detail="Sem permissões")
    try:
        estabelecimento = await Estabelecimento.get(id=estabelecimento_id)
    except DoesNotExist:
        raise HTTPException(status_code=404, detail="Estabelecimento não encontrado")

    pacote = await PacoteTransparencia.create(estabelecimento=estabelecimento)
    return {"message": "Pacote criado com sucesso", "pacote_id": pacote.id}

@router.post("/{pacote_id}/modulo/{modulo_id}/")
async def add_modulo_to_pacote(request: Request, pacote_id: UUID, modulo_id: UUID):
    user = request.state.user
    if not user.is_super:
        raise HTTPException(status_code=401, detail="Sem permissões")  
    try:
        pacote = await PacoteTransparencia.get(id=pacote_id)
    except DoesNotExist:
        raise HTTPException(status_code=404, detail="Pacote não encontrado")
    try:
        modulo = await ModuloTransparencia.get(id=modulo_id)
        await pacote.modulos.add(modulo)
        return {"message": "Módulo adicionado ao pacote com sucesso"}
    except DoesNotExist:
        raise HTTPException(status_code=404, detail="Módulo não encontrado")

@router.get("/{pacote_id}/")
async def get_pacote(request: Request, pacote_id: UUID):
    user = request.state.user
    if not user.is_super:
        raise HTTPException(status_code=401, detail="Sem permissões")
    try:
        pacote = await PacoteTransparencia.get(id=pacote_id).prefetch_related("modulos")
        return pacote.to_dict()
    except DoesNotExist:
        raise HTTPException(status_code=404, detail="Pacote não encontrado")    

@router.get("/estabelecimento/{estabelecimento_id}/")
async def get_pacotes_by_estabelecimento(request: Request, estabelecimento_id: UUID):
    try:
        estabelecimento = await Estabelecimento.get(id=estabelecimento_id)
    except DoesNotExist:
        raise HTTPException(status_code=404, detail="Estabelecimento não encontrado")
    try:
        pacote = await PacoteTransparencia.get(estabelecimento=estabelecimento).prefetch_related("modulos")
        return pacote.to_dict()
    except DoesNotExist:
        raise HTTPException(status_code=404, detail="Pacote não encontrado para o estabelecimento")

@router.delete("/{pacote_id}/modulo/{modulo_id}/")
async def remove_module(request: Request, pacote_id: UUID, modulo_id: UUID):
    user = request.state.user
    if not user.is_super:
        raise HTTPException(status_code=401, detail="Sem permissões")
    try:
        pacote = await PacoteTransparencia.get(id=pacote_id)
    except DoesNotExist:
        raise HTTPException(status_code=404, detail="Pacote não encontrado")
    try:
        modulo = await ModuloTransparencia.get(id=modulo_id)
    except DoesNotExist:
        raise HTTPException(status_code=404, detail="Módulo não encontrado")
    await pacote.modulos.remove(modulo)
    return {"message": "Módulo removido do pacote com sucesso"}

@router.get("/modulos/all/")
async def get_modulos_transparencia():
    modulos = await ModuloTransparencia.all()
    return {
        "message": "Módulos de transparência carregados com sucesso",
        "total": len(modulos),
        "modulos": [modulo.to_dict() for modulo in modulos]
    }
