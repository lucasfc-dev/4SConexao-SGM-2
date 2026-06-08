from fastapi import APIRouter, Request, UploadFile,Query
from fastapi.responses import JSONResponse, StreamingResponse
from tortoise.exceptions import DoesNotExist
from tortoise.transactions import in_transaction
from tortoise.expressions import Q
from uuid import UUID
from datetime import datetime
from babel.dates import format_date
from io import BytesIO
from typing import Optional
from api.models import Contrato,RelatorioFiscalizacaoContrato,Documento
from api.exceptions import NotFoundException, BadRequestException
from api.schemas import (
    RelatorioFiscalizacaoContratoIn,
    RelatorioFiscalizacaoContratoOut,
)
from api.services.pdf.pdf_service import PDFService

router = APIRouter(prefix='/fiscalizacao_contrato', tags=['Fiscalização de Contratos'])


def _parse_numero_relatorio(numero: str) -> Optional[int]:
    try:
        sequencial = str(numero).split('/')[0].strip()
        return int(sequencial)
    except (TypeError, ValueError, IndexError):
        return None


def _get_numero_inicial_por_orgao(config: dict, orgao_id: UUID) -> int:
    if not isinstance(config, dict):
        return 1

    mapa_numeracao = config.get('numero_inicial_fiscalizacao_por_orgao', {})
    if not isinstance(mapa_numeracao, dict):
        return 1

    numero_inicial = mapa_numeracao.get(str(orgao_id), 1)
    try:
        numero_inicial = int(numero_inicial)
        return numero_inicial if numero_inicial >= 1 else 1
    except (TypeError, ValueError):
        return 1

def valor_monetario_para_extenso(valor):
    """Converte um valor monetário para extenso em português brasileiro"""
    import num2words
    try:
        # Usar apenas o número sem currency formatting
        extenso = num2words.num2words(valor, lang='pt')
        # Adicionar "reais" ao final se for número inteiro, ou tratar centavos
        if isinstance(valor, int) or valor == int(valor):
            return f"{extenso} reais"
        else:
            # Para valores com centavos
            reais = int(valor)
            centavos = int(round((valor - reais) * 100))
            
            if reais > 0 and centavos > 0:
                extenso_reais = num2words.num2words(reais, lang='pt')
                extenso_centavos = num2words.num2words(centavos, lang='pt')
                return f"{extenso_reais} reais e {extenso_centavos} centavos"
            elif reais > 0:
                extenso_reais = num2words.num2words(reais, lang='pt')
                return f"{extenso_reais} reais"
            else:
                extenso_centavos = num2words.num2words(centavos, lang='pt')
                return f"{extenso_centavos} centavos"
    except Exception as e:
        return f"R$ {valor:.2f}"


@router.post('/', response_model=RelatorioFiscalizacaoContratoOut)
async def create_relatorio_fiscalizacao(
    request: Request,
    relatorio_data: RelatorioFiscalizacaoContratoIn,
):
    client = request.state.client
    data_hoje_extenso = format_date(datetime.now(), format='long', locale='pt_BR')
    data_local = f"{client.estabelecimento.model.cidade}, {data_hoje_extenso}"
    try:
        contrato = await Contrato.get(id=relatorio_data.contrato_id).prefetch_related(
            'fornecedor',
            'fornecedor__pessoa_juridica',
            'vigencia',
            'vigencia__fiscal',
            'vigencia__fiscal__pessoa__pessoa_fisica',
            'licitacao',
            'dispensa'
        )
    except DoesNotExist:
        raise NotFoundException('Contrato não encontrado')

    orgao_id = None
    if contrato.licitacao_id and contrato.licitacao:
        orgao_id = contrato.licitacao.orgao
    elif contrato.dispensa_id and contrato.dispensa:
        orgao_id = contrato.dispensa.orgao
    elif contrato.vigencia:
        orgao_id = contrato.vigencia.fiscal.orgao

    if not orgao_id:
        raise BadRequestException('Contrato não possui órgão vinculado para gerar relatório de fiscalização')

    orgao = await client.estabelecimento.get_orgao(orgao_id)
    hoje = datetime.now()
    ano = hoje.year

    numero_inicial = _get_numero_inicial_por_orgao(
        client.estabelecimento.model.config or {},
        orgao_id
    )

    # Filtrar relatórios do ano atual usando range de datas
    inicio_ano = datetime(ano, 1, 1).date()
    fim_ano = datetime(ano, 12, 31).date()

    relatorios_orgao_ano = await RelatorioFiscalizacaoContrato.filter(
        Q(contrato__licitacao__orgao=orgao_id) | Q(contrato__dispensa__orgao=orgao_id),
        pub_date__gte=inicio_ano,
        pub_date__lte=fim_ano,
    ).only('numero')

    ultimo_numero = max(
        (
            numero_atual
            for relatorio in relatorios_orgao_ano
            for numero_atual in [_parse_numero_relatorio(relatorio.numero)]
            if numero_atual is not None
        ),
        default=None
    )

    proximo_numero = numero_inicial if ultimo_numero is None else ultimo_numero + 1
    num_relatorio = f"{str(proximo_numero)}/{str(ano)}"
    portaria_id = contrato.portaria
    try:
        portaria = await Documento.get(id=portaria_id) 
    except DoesNotExist:
        raise NotFoundException('Portaria não encontrada')
    titulo_portaria = (portaria.titulo).split('.')[0] 
    vigencia = f"{contrato.vigencia.data_inicio.strftime('%d/%m/%Y')} {'a '+contrato.vigencia.data_fim.strftime('%d/%m/%Y') if contrato.vigencia.data_fim else 'ao Presente Momento'}"
    dados_relatorio = {
        'num_relatorio': num_relatorio,
        'num_contrato': contrato.num_contrato,
        'competencia': relatorio_data.competencia,
        'fundamento_legal': relatorio_data.fundamento_legal,
        'constatacoes': relatorio_data.constatacoes,
        'conclusao': relatorio_data.conclusao,
        'objeto': contrato.objeto,
        'contratado': contrato.fornecedor.pessoa_juridica.razao_social,
        'cnpj_contratado': contrato.fornecedor.pessoa_juridica.cnpj,
        'valor': str(contrato.valor_estimado).replace('.',','),
        'valor_extenso': valor_monetario_para_extenso(contrato.valor_estimado),
        'portaria': titulo_portaria,
        'fiscal': contrato.vigencia.fiscal.pessoa.pessoa_fisica.nome,
        'vigencia': vigencia,
        'data_local': data_local,
        'cidade': client.estabelecimento.model.cidade,
        'orgao': orgao
    }
    
    # Chamar o pdf_service para gerar o PDF
    pdf_service = PDFService(client)
    pdf_data = await pdf_service.gerar_relatorio_fiscalizacao(dados_relatorio)
    
    relatorio = await RelatorioFiscalizacaoContrato.create(
        numero=num_relatorio,
        contrato=contrato,
        data=pdf_data,
        pub_date=hoje.date(),
        estabelecimento=client.estabelecimento.id
    )
    return relatorio.to_pydantic()

@router.get('/')
async def get_relatorios(request:Request):
    client = request.state.client
    orgaos_ids = client.user.orgaos
    if orgaos_ids:
        relatorios = await RelatorioFiscalizacaoContrato.filter(
            Q(contrato__licitacao__orgao__in=orgaos_ids) | Q(contrato__dispensa__orgao__in=orgaos_ids)
        ).order_by('-pub_date')
    else:
        relatorios = await RelatorioFiscalizacaoContrato.filter(estabelecimento=client.estabelecimento.id)
    return [r.to_pydantic() for r in relatorios]

@router.get('/{relatorio_id}/')
async def get_relatorio_fiscalizacao(
    request: Request,
    relatorio_id: UUID
):
    try:
        relatorio = await RelatorioFiscalizacaoContrato.get(id=relatorio_id)
    except DoesNotExist:
        raise NotFoundException('Relatório de fiscalização não encontrado')
    return relatorio.to_pydantic()

@router.get('/{relatorio_id}/content/')
async def get_relatorio_fiscalizacao(
    request: Request,
    relatorio_id: UUID
):
    # Otimização: carregar apenas campo 'data' necessário
    try:
        relatorio = await RelatorioFiscalizacaoContrato.get(id=relatorio_id).only('data', 'id')
    except DoesNotExist:
        raise NotFoundException('Relatório de fiscalização não encontrado')
    
    from api.utils.files import iterfile, get_download_headers
    
    headers = get_download_headers(
        filename=f"relatorio_fiscalizacao_{relatorio.id}.pdf",
        content_length=len(relatorio.data),
        disposition='attachment'
    )
    
    return StreamingResponse(
        iterfile(relatorio.data),
        media_type='application/pdf',
        headers=headers
    )

@router.delete('/{relatorio_id}/')
async def delete_relatorio_fiscalizacao(
    request: Request,
    relatorio_id: UUID
):
    async with in_transaction() as connection:
        try:
            relatorio = await RelatorioFiscalizacaoContrato.get(id=relatorio_id)
            await relatorio.delete(using_db=connection)
            return JSONResponse({
                'message': f'Relatório de fiscalização {relatorio.id} deletado',
                'id': str(relatorio.id)
            }, status_code=200)
        except DoesNotExist:
            raise NotFoundException('Relatório de fiscalização não encontrado')