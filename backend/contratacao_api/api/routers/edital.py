from urllib import request
from fastapi import Request,Query
from fastapi.routing import APIRouter
from fastapi.responses import JSONResponse
from api.models import EditalLicitacao,Secao
from api.schemas import EditalLicitacaoIn,EditalLicitacaoOut,UpdatedEdital
from api.exceptions import NotFoundException
from tortoise.exceptions import DoesNotExist
from tortoise.transactions import in_transaction
from uuid import UUID
from typing import List

router = APIRouter(prefix='/edital',tags=['Editais Licitação'])

@router.post('/',response_model=EditalLicitacaoOut)
async def create_edital(request:Request,edital:EditalLicitacaoIn):
    try:
        async with in_transaction() as connection:
            client = request.state.client
            secao = await Secao.get(id=edital.secao)
            new_edital = await EditalLicitacao.create(
                numero_edital = edital.numero_edital,
                data_publicacao = edital.data_publicacao,
                numero_publicacao = edital.numero_publicacao,
                orgao = edital.orgao,
                veiculo_publicacao = edital.veiculo_publicacao,
                secao = secao,
                descricao = edital.descricao,
                valor_estimado = edital.valor_estimado,
                estabelecimento=client.estabelecimento.id,
                using_db=connection
            )
            return new_edital.to_pydantic()
    except DoesNotExist:
        raise NotFoundException('Edital não encontrado')
    
@router.get('/',response_model=List[EditalLicitacaoOut])
async def get_editais(request:Request,relations:List[str]=Query(default=[])):
    client = request.state.client
    orgaos_ids = client.user.orgaos
    editais = await EditalLicitacao.filter(orgao__in=orgaos_ids)
    if relations:
        client = request.state.client if 'orgao' in relations else None
        return [await edital.include_relations(relations,client) for edital in editais]
    return [edital.to_pydantic() for edital in editais]

@router.get('/{id}/',response_model=EditalLicitacaoOut)
async def get_edital(request:Request,id:UUID,relations:List[str]=Query(default=[])):
    try:
        edital = await EditalLicitacao.get(id=id)
        if relations:
            client = request.state.client if 'orgao' in relations else None
            return await edital.include_relations(relations,client)
        return edital.to_pydantic()
    except DoesNotExist:
        raise NotFoundException('Edital não encontrado')
    
@router.get('/{id}/docs/')
async def get_edital_docs(id:UUID):
    try:
        edital = await EditalLicitacao.get(id=id).prefetch_related('documentos')
        return [doc.to_pydantic() for doc in edital.documentos]
    except DoesNotExist:
        raise NotFoundException('Edital não encontrado')

    
@router.patch('/{id}/',response_model=EditalLicitacaoOut)
async def update_edital(id:UUID,updated_edital:UpdatedEdital):
    try:
        edital = await EditalLicitacao.get(id=id)      
        updated_dict = updated_edital.model_dump(exclude_none=True)
        if 'secao' in updated_dict:
            try:
                secao = await Secao.get(id=updated_dict['secao'])
            except:
                raise NotFoundException('Seção não encontrada')
            updated_dict['secao'] = secao
        await edital.update_from_dict(updated_dict).save()
        return edital.to_pydantic()
    except DoesNotExist:
        raise NotFoundException('Edital não encontrado')
    
@router.delete('/{id}/')
async def delete_edital(id:UUID):
    async with in_transaction() as connection:
        try:
            edital = await EditalLicitacao.get(id=id)
            await edital.delete(using_db=connection)
            return JSONResponse({
                'message':f'Edital {edital.id} deletado',
                'id':str(edital.id)
            },status_code=200)
        except DoesNotExist:
            raise NotFoundException('Edital não encontrado')