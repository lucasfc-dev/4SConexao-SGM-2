from fastapi.routing import APIRouter
from fastapi import Request,Query,File,UploadFile
from fastapi.responses import StreamingResponse
from tortoise.exceptions import DoesNotExist
from tortoise.transactions import in_transaction
from uuid import UUID
from typing import List,Optional
from datetime import date
from io import BytesIO
from api.models import FiscalContrato,Pessoa,Documento,Contrato
from api.schemas import FiscalContratoIn, FiscalContratoOut, UpdatedFiscalContrato
from api.exceptions import NotFoundException
from api.services.pdf.pdf_service import PDFService

router = APIRouter(prefix='/fiscal_contrato', tags=['Fiscal de Contrato'])

@router.post('/', response_model=FiscalContratoOut)
async def create_fiscal_contrato(request:Request,fc: FiscalContratoIn):
    async with in_transaction() as connection:
        try:
            client = request.state.client
            pessoa = await Pessoa.get(id=fc.pessoa)
        except DoesNotExist:
            raise NotFoundException('Pessoa não encontrado.')
        fiscal_contrato = await FiscalContrato.create(
            orgao=fc.orgao,
            pessoa=pessoa,
            estabelecimento=client.estabelecimento.id,
            using_db=connection
        )
        return fiscal_contrato.to_pydantic()

@router.post('/{id}/comprovante_nomeacao/')
async def create_comprovante_nomeacao(request:Request, id: UUID, file: UploadFile = File(...)):
    try:
        data = await file.read()
        fiscal_contrato = await FiscalContrato.get(id=id)
        documento = await Documento.create(titulo=file.filename, data=data)
        fiscal_contrato.comprovante_nomeacao = documento
        await fiscal_contrato.save()
        return documento.to_pydantic()
    except DoesNotExist:
        raise NotFoundException('Fiscal de contrato não encontrado')

@router.get('/', response_model=List[FiscalContratoOut])
async def get_fiscal_contratos(
    request:Request,
    relations:List[str]=Query(default=[]),
    ):
    client = request.state.client
    orgaos_ids = client.user.orgaos
    fiscais_contratos = await FiscalContrato.filter(orgao__in=orgaos_ids)
    if relations:
        client = request.state.client if 'orgao' in relations else None
        return [await fc.include_relations(relations,client) for fc in fiscais_contratos]
    return [fc.to_pydantic() for fc in fiscais_contratos]

@router.get('/estabelecimento/{id}/', response_model=List[FiscalContratoOut])
async def get_fiscal_contratos_estabelecimento(id,relations:List[str]=Query(default=[])):
    fiscal_contratos = await FiscalContrato.filter(estabelecimento=id)
    if relations:
        return [await fc.include_relations(relations) for fc in fiscal_contratos]
    return [fc.to_pydantic() for fc in fiscal_contratos]

@router.get('/{id}/', response_model=FiscalContratoOut)
async def get_fiscal_contrato(request:Request, id: UUID):
    try:
        fiscal_contrato = await FiscalContrato.get(id=id)
        return fiscal_contrato.to_pydantic()
    except DoesNotExist:
        raise NotFoundException('Fiscal de contrato não encontrado')
    
@router.get('/{id}/docs/')
async def get_fiscal_contrato_docs(id: UUID):
    try:
        fiscal_contrato = await FiscalContrato.get(id=id).prefetch_related('portarias','comprovante_nomeacao')
        portarias = [doc.to_pydantic() for doc in fiscal_contrato.portarias]
        comprovante_nomeacao = fiscal_contrato.comprovante_nomeacao.to_pydantic() if fiscal_contrato.comprovante_nomeacao else None
        return {"portarias": portarias, "comprovante_nomeacao": comprovante_nomeacao}
    except DoesNotExist:
        raise NotFoundException('Fiscal de contrato não encontrado')
    
@router.patch('/{id}/', response_model=FiscalContratoOut)
async def update_fiscal_contrato(id: UUID, fc: UpdatedFiscalContrato):
    try:
        fiscal_contrato = await FiscalContrato.get(id=id)
        await fiscal_contrato.update_from_dict(fc.model_dump(exclude_none=True)).save()
        return fiscal_contrato.to_pydantic()
    except DoesNotExist:
        raise NotFoundException('Fiscal de contrato não encontrado')
    
@router.delete('/{id}/', response_model=FiscalContratoOut)
async def delete_fiscal_contrato(id: UUID):
    try:
        fiscal_contrato = await FiscalContrato.get(id=id)
        await fiscal_contrato.delete()
        return fiscal_contrato.to_pydantic()
    except DoesNotExist:
        raise NotFoundException('Fiscal de contrato não encontrado')

@router.get('/estabelecimento/{estabelecimento_id}/exportar/')
async def exportar_fiscais_contrato(
    request: Request,
    estabelecimento_id: UUID,
    type: str = 'csv',
    nome: Optional[str] = Query(None),
):
    fiscais = await FiscalContrato.filter(estabelecimento=estabelecimento_id).prefetch_related(
        'pessoa', 'pessoa__pessoa_fisica', 'vigencias'
    )

    import pandas as pd
    from datetime import datetime

    format_data = []
    for fiscal in fiscais:
        pessoa_fisica = getattr(fiscal.pessoa, 'pessoa_fisica', None)
        nome_fiscal = pessoa_fisica.nome if pessoa_fisica else ""
        cpf_fiscal = pessoa_fisica.cpf if pessoa_fisica else ""
        cargo_fiscal = pessoa_fisica.cargo if pessoa_fisica else ""

        if nome and nome.lower() not in nome_fiscal.lower():
            continue

        vigencias = list(fiscal.vigencias)
        vigencia_inicio = ""
        vigencia_fim = ""
        if vigencias:
            starts = [v.data_inicio for v in vigencias if v.data_inicio]
            ends = [v.data_fim for v in vigencias if v.data_fim]
            if starts:
                vigencia_inicio = min(starts).isoformat()
            if ends:
                vigencia_fim = max(ends).isoformat()

        contratos = await Contrato.filter(vigencia__fiscal_id=fiscal.id)
        contratos_nums = ", ".join([c.num_contrato or "" for c in contratos if c.num_contrato])

        format_data.append({
            "Nome": nome_fiscal,
            "CPF": cpf_fiscal,
            "Cargo": cargo_fiscal,
            "Vigencia Inicio": vigencia_inicio,
            "Vigencia Fim": vigencia_fim,
            "Contratos Vinculados": contratos_nums,
        })

    columns = ["Nome", "CPF", "Cargo", "Vigencia Inicio", "Vigencia Fim", "Contratos Vinculados"]
    if format_data:
        df = pd.DataFrame({key: [d[key] for d in format_data] for key in format_data[0]})
    else:
        df = pd.DataFrame(columns=columns)

    if type == 'csv':
        csv_data = df.to_csv(index=False)
        csv_buffer = BytesIO(csv_data.encode('utf-8'))
        return StreamingResponse(csv_buffer, media_type='text/csv', headers={
            'Content-Disposition': f'attachment; filename="fiscais_{date.today()}.csv"'
        })
    elif type == 'xml':
        df_xml = df.rename(columns=lambda x: x.replace(' ', '_'))
        xml_data = df_xml.to_xml(index=False)
        xml_buffer = BytesIO(xml_data.encode('utf-8'))
        return StreamingResponse(xml_buffer, media_type='application/xml', headers={
            'Content-Disposition': f'attachment; filename="fiscais_{date.today()}.xml"'
        })
    elif type == 'pdf':
        processos = [
            {
                'nome': d['Nome'],
                'cpf': d['CPF'],
                'cargo': d['Cargo'],
                'vigencia_inicio': d['Vigencia Inicio'],
                'vigencia_fim': d['Vigencia Fim'],
                'contratos_vinculados': d['Contratos Vinculados'],
            }
            for d in format_data
        ]
        date_now = datetime.now().date()
        pdf_service = PDFService(None)
        pdf_data = await pdf_service.gerar_pdf_simples_fiscal(
            processos=processos,
            estabelecimento_id=estabelecimento_id,
            data_relatorio=date_now.strftime('%d/%m/%Y'),
            titulo='Relatório Municipal de Fiscais de Contrato'
        )
        pdf_buffer = BytesIO(pdf_data)
        return StreamingResponse(pdf_buffer, media_type='application/pdf', headers={
            'Content-Disposition': f'attachment; filename="fiscais_{date.today()}.pdf"'
        })