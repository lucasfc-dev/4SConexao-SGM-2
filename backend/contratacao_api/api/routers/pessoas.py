from fastapi import Request
from fastapi.routing import APIRouter
from fastapi.responses import JSONResponse
from api.schemas import PessoaFisicaIn, PessoaJuridicaIn, PessoaFisicaOut,PessoaFisicaOutSimple, PessoaJuridicaOut,PessoaJuridicaOutSimple,UpdatedPessoaFisica,UpdatedPessoaJuridica
from api.models import Pessoa, PessoaFisica, PessoaJuridica
from api.exceptions import NotFoundException, BadRequestException
from tortoise.transactions import in_transaction
from tortoise.exceptions import DoesNotExist, IntegrityError
from asyncpg.exceptions import UniqueViolationError
from uuid import UUID
from typing import List,Union

router = APIRouter(prefix="/pessoa", tags=["Pessoas"])

def _is_unique_violation(exc: IntegrityError, campo: str) -> bool:
    cause = exc.__cause__
    if isinstance(cause, UniqueViolationError):
        return (cause.column_name or '') == campo or campo in (cause.constraint_name or '')
    return False


@router.post("/juridica/",response_model=PessoaJuridicaOutSimple)
async def create_pessoa(request: Request, p: PessoaJuridicaIn):
    try:
        async with in_transaction("default") as connection:
            client = request.state.client
            pessoa = await Pessoa.create(**p.model_dump(), estabelecimento=client.estabelecimento.id)
            pessoa_juridica = await PessoaJuridica.create(
                pessoa=pessoa,
                razao_social=p.razao_social,
                cnpj=p.cnpj,
                nome_fantasia=p.nome_fantasia,
                data_fundacao=p.data_fundacao,
                telefone_comercial=p.telefone_comercial,
                using_db=connection
            )
            return pessoa_juridica.to_pydantic(pessoa.created_at)
    except IntegrityError as exc:
        if _is_unique_violation(exc, 'cnpj'):
            raise BadRequestException(f'Já existe uma pessoa jurídica cadastrada com o CNPJ {p.cnpj}.')
        raise


@router.post("/fisica/",response_model=PessoaFisicaOutSimple)
async def create_pessoa(request: Request, p: PessoaFisicaIn):
    try:
        async with in_transaction() as connection:
            client = request.state.client
            pessoa = await Pessoa.create(**p.model_dump(), estabelecimento=client.estabelecimento.id)
            pessoa_fisica = await PessoaFisica.create(
                pessoa=pessoa,
                nome=p.nome,
                cpf=p.cpf,
                genero=p.genero,
                matricula=p.matricula,
                data_nascimento=p.data_nascimento,
                rg=p.rg,
                orgao_expedidor=p.orgao_expedidor,
                titulo_eleitor=p.titulo_eleitor,
                cargo=p.cargo,
                using_db=connection
            )
            return pessoa_fisica.to_pydantic(pessoa.created_at)
    except IntegrityError as exc:
        if _is_unique_violation(exc, 'cpf'):
            raise BadRequestException(f'Já existe uma pessoa física cadastrada com o CPF {p.cpf}.')
        raise


@router.get('/',response_model=Union[
    List[Union[PessoaFisicaOut,PessoaJuridicaOut]],
    List[Union[PessoaFisicaOutSimple,PessoaJuridicaOutSimple]]
])
async def get_pessoas(request: Request,include_pessoa: bool = False):
    client = request.state.client
    pessoas_f = await PessoaFisica.filter(
        pessoa__estabelecimento=client.estabelecimento.id
    ).prefetch_related('pessoa')
    pessoas_j = await PessoaJuridica.filter(
        pessoa__estabelecimento=client.estabelecimento.id
    ).prefetch_related('pessoa')
    if include_pessoa:
        pessoas_f = [await p.include_relations() for p in pessoas_f]
        pessoas_j = [await p.include_relations() for p in pessoas_j]
        return pessoas_f + pessoas_j
    pessoas = pessoas_f + pessoas_j
    return [pessoa.to_pydantic() for pessoa in pessoas]

@router.get('/estabelecimento/{id}/',response_model=Union[
    List[Union[PessoaFisicaOut,PessoaJuridicaOut]],
    List[Union[PessoaFisicaOutSimple,PessoaJuridicaOutSimple]]
])
async def get_pessoas_estabelecimento(id,include_pessoa: bool = False):
    pessoas_f = await PessoaFisica.filter(
        pessoa__estabelecimento=id
    ).prefetch_related('pessoa')
    pessoas_j = await PessoaJuridica.filter(
        pessoa__estabelecimento=id
    ).prefetch_related('pessoa')
    if include_pessoa:
        pessoas_f = [await p.include_relations() for p in pessoas_f]
        pessoas_j = [await p.include_relations() for p in pessoas_j]
        return pessoas_f + pessoas_j
    pessoas = pessoas_f + pessoas_j
    return [pessoa.to_pydantic() for pessoa in pessoas]

@router.get('/fisica/')
async def get_pessoas_fisicas(request:Request,include_pessoa:bool=False):
    client = request.state.client
    pessoas_f = await PessoaFisica.filter(
        pessoa__estabelecimento=client.estabelecimento.id
    ).prefetch_related('pessoa')
    if include_pessoa:
        pessoas_f = [await p.include_relations() for p in pessoas_f]
    return pessoas_f

@router.get('/juridica/')
async def get_pessoas_juridicas(request:Request,include_pessoa:bool=False):
    client = request.state.client
    pessoas_j = await PessoaJuridica.filter(
        pessoa__estabelecimento=client.estabelecimento.id
    ).prefetch_related('pessoa')
    if include_pessoa:
        pessoas_j = [await p.include_relations() for p in pessoas_j]
    return pessoas_j


@router.get(
    '/{id}/',
    response_model=Union[
        PessoaFisicaOut,
        PessoaFisicaOutSimple,
        PessoaJuridicaOut,
        PessoaJuridicaOutSimple
    ]
)
async def get_pessoa(request: Request, id: UUID, include_pessoa: bool = False, tipo_id: str = 'branch'):
    from tortoise.expressions import Q
    try:
        if tipo_id == 'branch':
            pessoa = await Pessoa.get(
                Q(pessoa_fisica=id) | Q(pessoa_juridica=id)
            ).prefetch_related('pessoa_fisica', 'pessoa_juridica')
        else:
            pessoa = await Pessoa.get(id=id).prefetch_related('pessoa_fisica', 'pessoa_juridica')

        if include_pessoa:
            return await pessoa.include_relations(['pessoa_fisica', 'pessoa_juridica'])

        if pessoa.pessoa_fisica:
            return pessoa.pessoa_fisica.to_pydantic(pessoa.created_at)

        return pessoa.pessoa_juridica.to_pydantic(pessoa.created_at)

    except DoesNotExist:
        raise NotFoundException('Pessoa não encontrada')


@router.patch('/fisica/{id}/')
async def update_pessoa_fisica(id:UUID,updated_pf:UpdatedPessoaFisica):
        pessoa = await Pessoa.get(pessoa_fisica=id
        ).prefetch_related('pessoa_fisica')
        updated_pf_dict = updated_pf.model_dump(exclude_none=True)
        pf = pessoa.pessoa_fisica
        for campo in updated_pf_dict:
            if campo in pf.get_campos_limpos():
                setattr(pf,campo,updated_pf_dict[campo])
            elif campo in pessoa.get_campos_limpos():
                setattr(pessoa,campo,updated_pf_dict[campo])
        try:
            await pf.save()
            await pessoa.save()
        except IntegrityError as exc:
            if _is_unique_violation(exc, 'cpf'):
                raise BadRequestException(f'Já existe uma pessoa física cadastrada com o CPF {pf.cpf}.')
            raise
        return pessoa.build_pessoa_out(pf)

@router.patch('/juridica/{id}/')
async def update_pessoa_fisica(id:UUID,updated_pj:UpdatedPessoaJuridica):
    pessoa = await Pessoa.get(pessoa_juridica=id
    ).prefetch_related('pessoa_juridica')
    updated_pj_dict = updated_pj.model_dump(exclude_none=True)
    pj = pessoa.pessoa_juridica
    for campo in updated_pj_dict:
        if campo in pj.get_campos_limpos():
            setattr(pj,campo,updated_pj_dict[campo])
        elif campo in pessoa.get_campos_limpos():
            setattr(pessoa,campo,updated_pj_dict[campo])
    try:
        await pj.save()
        await pessoa.save()
    except IntegrityError as exc:
        if _is_unique_violation(exc, 'cnpj'):
            raise BadRequestException(f'Já existe uma pessoa jurídica cadastrada com o CNPJ {pj.cnpj}.')
        raise
    return pessoa.build_pessoa_out(pj)


@router.delete('/{id}/')
async def delete_pessoa(id:UUID):
    async with in_transaction() as connection:
        try:
            pessoa = await Pessoa.get(id=id)
            await pessoa.delete(using_db=connection)
            return JSONResponse({
                'message':f'Pessoa {pessoa.id} deletada',
                'id':str(pessoa.id)
            },status_code=200)
        except DoesNotExist:
            raise NotFoundException('Pessoa não encontrada') 