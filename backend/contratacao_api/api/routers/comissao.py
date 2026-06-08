from fastapi import Request,Depends,Query
from fastapi.responses import JSONResponse
from fastapi.routing import APIRouter
from api.models import ComissaoLicitacao,MembroComissao
from api.schemas import ComissaoLicitacaoIn,ComissaoLicitacaoOut,UpdatedComissao
from api.exceptions import NotFoundException, BadRequestException
from tortoise.exceptions import DoesNotExist
from tortoise.transactions import in_transaction
from uuid import UUID
from typing import List

router = APIRouter(prefix='/comissao',tags=['Comissões'])

@router.post('/',response_model=ComissaoLicitacaoOut)
async def create_comissao(request:Request,comissao:ComissaoLicitacaoIn):
    async with in_transaction() as connection:
        client = request.state.client
        new_comissao = await ComissaoLicitacao.create(
            vigencia_inicio = comissao.vigencia_inicio,
            vigencia_fim = comissao.vigencia_fim,
            tipo_comissao =comissao.tipo_comissao,
            tipo_ato =comissao.tipo_ato,
            data_ato = comissao.data_ato,
            numero_ato =comissao.numero_ato,
            finalidade = comissao.finalidade,
            estabelecimento = client.estabelecimento.id
        ) 
        return new_comissao.to_pydantic()
    
@router.get('/',response_model=List[ComissaoLicitacaoOut])
async def get_comissoes(request:Request):
    client = request.state.client
    comissoes = await ComissaoLicitacao.filter(estabelecimento=client.estabelecimento.id)
    return [comissao.to_pydantic() for comissao in comissoes]

@router.get('/responsavel/')
async def get_comissao_responsavel(estabelecimento:UUID):
    try:
        membro = await MembroComissao.filter(atribuicao='Presidente',estabelecimento=estabelecimento).first()
        if membro:
            responsavel = await membro.include_relations(['pessoa'])
            responsavel = responsavel['pessoa']
            if responsavel['tipo'] =='fisica':
                return {'nome':responsavel['nome'], 'cpf':responsavel['cpf']}
            raise BadRequestException('Responsável não é pessoa física')
        raise NotFoundException('Responsável não encontrado')
    except DoesNotExist:
        raise NotFoundException('Comissão não encontrada')

@router.patch('/{id}/',response_model=ComissaoLicitacaoOut)
async def update_comissao(id:UUID,updated_comissao:UpdatedComissao):
    try:
        comissao = await ComissaoLicitacao.get(id=id)
        await comissao.update_from_dict(updated_comissao.model_dump(exclude_none=True)).save()
        return comissao.to_pydantic()
    except DoesNotExist:
        raise NotFoundException('Comissão não encontrada')


@router.delete('/{id}/')
async def delete_comissao(id:UUID):
    async with in_transaction() as connection:
        try:
            comissao = await ComissaoLicitacao.get(id=id)
            await comissao.delete(using_db=connection)
            return JSONResponse({
                'message':f'Comição {comissao.id} deletada',
                'id':str(comissao.id)
            },status_code=200)
        except DoesNotExist:
            raise NotFoundException('Comissão não encontrada')