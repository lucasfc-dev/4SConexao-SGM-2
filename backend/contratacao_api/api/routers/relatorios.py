from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from tortoise.transactions import in_transaction
from tortoise.exceptions import DoesNotExist
from api.models import Relatorio,Licitacao,Dispensa,Contrato
from api.schemas import LicitacaoOut,DispensaOut,ContratoOut,QueryLicitacao,QueryDispensa,QueryContrato
from api.services.pdf.pdf_service import PDFService
from api.exceptions import NotFoundException
from io import BytesIO
from uuid import UUID
from datetime import datetime


router = APIRouter(prefix='/relatorio', tags=['Relatórios'])

@router.post('/licitacao/')
async def create_relatorio_licitacao(request:Request,query: QueryLicitacao):
    async with in_transaction() as connection:
        client = request.state.client
        pdf_service = PDFService(client)
        
        licitacoes = await Licitacao.filter(**query.model_dump(exclude_none=True))
        date_now = datetime.now().date()
        licitacoes_data = [LicitacaoOut(**await licitacao.include_relations(['orgao','modalidade'],client)) for licitacao in licitacoes]
        
        # Preparar dados para enviar ao pdf_service
        processos = [
            {
                'num_processo': lic.num_processo,
                'objeto': lic.objeto,
                'situacao': lic.situacao,
                'pub_date': lic.pub_date.strftime('%d/%m/%Y') if lic.pub_date else None,
                'julg_date': lic.julg_date.strftime('%d/%m/%Y') if lic.julg_date else None,
                'modalidade': {'nome': lic.modalidade.nome if lic.modalidade else ''},
                'orgao': {'nome': lic.orgao.nome if lic.orgao else ''}
            }
            for lic in licitacoes_data
        ]
        
        pdf = await pdf_service.gerar_relatorio_licitacao(
            processos=processos,
            data_relatorio=date_now.strftime('%d/%m/%Y'),
            titulo='Relatório Municipal de Procedimentos Licitatórios'
        )
        
        relatorio = await Relatorio.create(
            estabelecimento=client.estabelecimento.id,
            titulo='Relatório de Licitações de '+date_now.strftime('%d/%m/%Y'),
            data=pdf,
            tipo='licitacao',
            pub_date=date_now,
            using_db=connection
        )
        return relatorio.to_dict()

@router.post('/dispensa/')
async def create_relatorio_dispensa(request:Request,query: QueryDispensa):
    async with in_transaction() as connection:
        client = request.state.client
        pdf_service = PDFService(client)
        
        dispensas = await Dispensa.filter(**query.model_dump(exclude_none=True))
        date_now = datetime.now().date()
        dispensas_data = [DispensaOut(**await dispensa.include_relations(['orgao'],client)) for dispensa in dispensas]
        
        # Preparar dados para enviar ao pdf_service
        processos = [
            {
                'num_processo': disp.num_processo,
                'objeto': disp.objeto,
                'situacao': disp.situacao,
                'pub_date': disp.pub_date.strftime('%d/%m/%Y') if disp.pub_date else None,
                'julg_date': disp.julg_date.strftime('%d/%m/%Y') if disp.julg_date else None,
                'tipo_dispensa': disp.tipo_dispensa,
                'orgao': {'nome': disp.orgao.nome if disp.orgao else ''}
            }
            for disp in dispensas_data
        ]
        
        pdf = await pdf_service.gerar_relatorio_dispensa(
            processos=processos,
            data_relatorio=date_now.strftime('%d/%m/%Y'),
            titulo='Relatório Municipal de Procedimentos Licitatórios'
        )
        
        relatorio = await Relatorio.create(
            estabelecimento=client.estabelecimento.id,
            titulo='Relatório de Dispensas de '+date_now.strftime('%d/%m/%Y'),
            data=pdf,
            tipo='dispensa',
            pub_date=date_now,
            using_db=connection
        )
        return relatorio.to_dict()
    
@router.post('/contrato/')
async def create_contrato_contrato(request:Request,query: QueryContrato):
    async with in_transaction() as connection:
        client = request.state.client
        pdf_service = PDFService(client)
        
        contratos = await Contrato.filter(**query.model_dump(exclude_none=True))
        date_now = datetime.now().date()
        contratos_data = [ContratoOut(**await contrato.include_relations(['modalidade','licitacao__orgao','dispensa__orgao','fornecedor','vigencia__fiscal__pessoa'],client)) for contrato in contratos]

        # Preparar dados para enviar ao pdf_service
        processos = []
        for contr in contratos_data:
            fiscal_pessoa = contr.vigencia.fiscal.pessoa if contr.vigencia and contr.vigencia.fiscal else None
            fiscal_contrato = getattr(fiscal_pessoa, 'nome', None) or getattr(fiscal_pessoa, 'razao_social', '') if fiscal_pessoa else ''
            
            modalidade_tipo = ''
            num_processo = ''
            orgao = ''
            
            if contr.licitacao and contr.licitacao.num_processo:
                modalidade_tipo = contr.modalidade.nome if contr.modalidade else ''
                num_processo = str(contr.licitacao.num_processo)
                orgao = contr.licitacao.orgao.nome if contr.licitacao.orgao else ''
            elif contr.dispensa and hasattr(contr.dispensa, 'tipo_dispensa'):
                modalidade_tipo = contr.dispensa.tipo_dispensa
                num_processo = str(contr.dispensa.num_processo) if hasattr(contr.dispensa, 'num_processo') else ''
                orgao = contr.dispensa.orgao.nome if contr.dispensa.orgao else ''
            
            processos.append({
                'num_contrato': contr.num_contrato,
                'objeto': contr.objeto,
                'situacao': contr.situacao,
                'data_inicio': str(contr.data_inicio) if contr.data_inicio else '',
                'valor_estimado': float(contr.valor_estimado) if contr.valor_estimado else 0,
                'finalidade': contr.finalidade or '',
                'modalidade_tipo': modalidade_tipo,
                'num_processo': num_processo,
                'orgao': orgao,
                'fornecedor': {'razao_social': contr.fornecedor.razao_social if contr.fornecedor else ''},
                'fiscal_contrato': {'pessoa': {'nome': fiscal_contrato}}
            })
        
        pdf = await pdf_service.gerar_relatorio_contrato(
            processos=processos,
            data_relatorio=date_now.strftime('%d/%m/%Y'),
            titulo='Relatório Municipal de Contratos'
        )
        
        relatorio = await Relatorio.create(
            estabelecimento=client.estabelecimento.id,
            titulo='Relatório de Contratos de '+date_now.strftime('%d/%m/%Y'),
            data=pdf,
            tipo='contrato',
            pub_date=date_now,
            using_db=connection
        )
        return relatorio.to_dict()

@router.get('/')
async def get_relatorios(request: Request):
    client = request.state.client
    relatorios = await Relatorio.filter(estabelecimento=client.estabelecimento.id).order_by('-created_at')
    return [relatorio.to_dict() for relatorio in relatorios]

@router.get('/{id}/content/')
async def get_relatorio_content(id: UUID):
    try:
        # Otimização: carregar apenas campo 'data' necessário
        relatorio = await Relatorio.get(id=id).only('data')
        
        from api.utils.files import iterfile, get_download_headers
        
        headers = get_download_headers(
            filename=f"relatorio_{id}.pdf",
            content_length=len(relatorio.data),
            disposition='attachment'
        )
        
        return StreamingResponse(
            iterfile(relatorio.data),
            media_type='application/pdf',
            headers=headers
        )
    except DoesNotExist:
        raise NotFoundException('Relatório não encontrado')
    
@router.delete('/{id}/')
async def delete_relatorio(id: UUID):
    try:
        relatorio = await Relatorio.get(id=id)
        await relatorio.delete()
        return {'detail': 'Relatório deletado com sucesso'}
    except DoesNotExist:
        raise NotFoundException('Relatório não encontrado')
    
