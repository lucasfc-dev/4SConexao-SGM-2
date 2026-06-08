from io import BytesIO
from fastapi import HTTPException,Request,Query
from fastapi.routing import APIRouter
from fastapi.responses import StreamingResponse
from api.models import Chamado,Identificacao,Documento,RetornoChamado
from api.schemas import ChamadoIn,EmailOut,TipoAberturaChamadoEnum
from api.config import EMAIL_API_URL
from api.utils.limiter import limiter
from tortoise.transactions import in_transaction
from tortoise.exceptions import DoesNotExist
from uuid import UUID
from datetime import datetime,date
from typing import List,Optional
import httpx
import hashlib


router = APIRouter(prefix="/chamado",tags=["Chamados"])

async def send_email_protocolo(email: str, keys:dict):
    try:
        async with httpx.AsyncClient() as client:
            email_payload = {
                'email': email or "",
                'subject': 'Protocolo de Ouvidoria',
                'keys': {
                    'protocol_number': str(keys.get('protocol_number', '')),
                    'request_type': str(keys.get('request_type', '')),
                    'subject': str(keys.get('subject', '')),
                    'created_date': str(keys.get('created_date', '')),
                    'estabelecimento': str(keys.get('estabelecimento', ''))
                }
            }
            response = await client.post(
                f"{EMAIL_API_URL}/email/ouvidoria/protocolo/", 
                json=email_payload,
                timeout=10.0
            )
            response.raise_for_status()
    except Exception as e:
        print(f"ERRO ao enviar email de protocolo: {type(e).__name__}: {str(e)}")

@router.post("/")
@limiter.limit("5/day")
async def create_chamado(
    request: Request,
    chamado_data: ChamadoIn
):
    async with in_transaction() as connection:
        try:
            identificacao_model = None
            identificacao_data = chamado_data.identificacao
            if identificacao_data:
                identificacao_model = await Identificacao.create(
                    nome=identificacao_data.nome,
                    cpf=identificacao_data.cpf,
                    email=identificacao_data.email,
                    data_nasc=identificacao_data.data_nasc,
                    sexo=identificacao_data.sexo,
                    escolaridade=identificacao_data.escolaridade,
                    telefone=identificacao_data.telefone,
                    using_db=connection
                )
            hoje = datetime.now()
            ano = hoje.year
            inicio_ano = datetime(ano, 1, 1)
            fim_ano = datetime(ano, 12, 31)
            chamados_ano = await Chamado.filter(estabelecimento=chamado_data.estabelecimento, created_at__gte=inicio_ano, created_at__lte=fim_ano).count()
            
            # Gerar hash único do estabelecimento usando SHA-256 para evitar conflitos
            estabelecimento_hash = hashlib.sha256(str(chamado_data.estabelecimento).encode()).hexdigest()[:6].upper()
            num_protocolo = f"{estabelecimento_hash}-{ano}-{chamados_ano+1:04}"
            chamado = await Chamado.create(
                num_protocolo=num_protocolo,
                tipo_abertura=chamado_data.tipo_abertura,
                assunto=chamado_data.assunto,
                descricao=chamado_data.descricao,
                identificacao=identificacao_model,
                status='pendente',
                estabelecimento=chamado_data.estabelecimento,
                using_db=connection
            )
            if identificacao_model and identificacao_model.email:
                try:
                    from api.services.auth.auth_service import AuthClient
                    estabelecimento_public_data = await AuthClient.get_estabelecimento_public_data(chamado_data.estabelecimento)
                    await send_email_protocolo(
                        identificacao_model.email, {
                            'protocol_number': num_protocolo,
                            'request_type': chamado_data.tipo_abertura or "",
                            'subject': chamado_data.assunto or "",
                            'created_date': hoje.strftime('%d/%m/%Y'),
                            'estabelecimento': (estabelecimento_public_data.nome if estabelecimento_public_data else "") or ""
                        }
                    )
                except Exception as e:
                    print(f"ERRO ao enviar email de protocolo após criar chamado: {str(e)}")
            await chamado.fetch_related('identificacao')
            return chamado.to_dict()
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@router.get("/estabelecimento/")
async def list_chamados(
    request: Request,
    data_inicial: Optional[date] = Query(None),
    data_final: Optional[date] = Query(None)
):
    try:
        client = request.state.client
        
        # Construir filtros dinâmicos
        filtros = {"estabelecimento": client.estabelecimento.id}
        
        if data_inicial:
            # Converter data para datetime no início do dia
            data_inicial_dt = datetime.combine(data_inicial, datetime.min.time())
            filtros["created_at__gte"] = data_inicial_dt
            
        if data_final:
            # Converter data para datetime no final do dia
            data_final_dt = datetime.combine(data_final, datetime.max.time())
            filtros["created_at__lte"] = data_final_dt
        
        chamados = await Chamado.filter(**filtros).prefetch_related('identificacao','retornos').order_by('-created_at')
        
        result = []
        for chamado in chamados:
            # Buscar documentos do chamado
            docs = await Documento.filter(chamado=chamado)
            chamado_dict = chamado.to_dict()
            if docs:
                chamado_dict['anexos'] = [doc.to_dict() for doc in docs]
            
            # Buscar retornos com seus documentos
            retornos = await chamado.retornos.all()
            if retornos:
                retornos_list = []
                for retorno in retornos:
                    retorno_dict = retorno.to_dict()
                    # Buscar documentos específicos deste retorno
                    docs_retorno = await Documento.filter(retorno_chamado=retorno)
                    if docs_retorno:
                        retorno_dict['anexos'] = [doc.to_dict() for doc in docs_retorno]
                    retornos_list.append(retorno_dict)
                chamado_dict['retornos'] = retornos_list
                
            result.append(chamado_dict)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{chamado_id}/")
async def get_chamado(chamado_id: UUID):
    try:
        chamado = await Chamado.get(id=chamado_id).prefetch_related('identificacao')
        
        # Buscar documentos do chamado
        docs = await Documento.filter(chamado=chamado)
        chamado_dict = chamado.to_dict()
        if docs:
            chamado_dict['anexos'] = [doc.to_dict() for doc in docs]
        
        # Buscar retornos com seus documentos
        retornos = await RetornoChamado.filter(chamado=chamado)
        if retornos:
            retornos_list = []
            for retorno in retornos:
                retorno_dict = retorno.to_dict()
                # Buscar documentos específicos deste retorno
                docs_retorno = await Documento.filter(retorno_chamado=retorno)
                if docs_retorno:
                    retorno_dict['anexos'] = [doc.to_dict() for doc in docs_retorno]
                retornos_list.append(retorno_dict)
            chamado_dict['retornos'] = retornos_list
            
        return chamado_dict
    except DoesNotExist:
        raise HTTPException(status_code=404, detail="Chamado não encontrado")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@router.get("/protocolo/{num_protocolo}/")
async def get_chamado_por_protocolo(num_protocolo: str):
    try:
        chamado = await Chamado.get(num_protocolo=num_protocolo).prefetch_related('identificacao')
        
        # Buscar documentos do chamado
        docs = await Documento.filter(chamado=chamado)
        chamado_dict = chamado.to_dict()
        if docs:
            chamado_dict['anexos'] = [doc.to_dict() for doc in docs]
        
        # Buscar retornos com seus documentos
        retornos = await RetornoChamado.filter(chamado=chamado)
        if retornos:
            retornos_list = []
            for retorno in retornos:
                retorno_dict = retorno.to_dict()
                # Buscar documentos específicos deste retorno
                docs_retorno = await Documento.filter(retorno_chamado=retorno)
                if docs_retorno:
                    retorno_dict['anexos'] = [doc.to_dict() for doc in docs_retorno]
                retornos_list.append(retorno_dict)
            chamado_dict['retornos'] = retornos_list
            
        return chamado_dict
    except DoesNotExist:
        raise HTTPException(status_code=404, detail="Chamado não encontrado")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

async def get_estatisticas_chamados(estabelecimento_id: UUID, data_inicial: Optional[date] = None, data_final: Optional[date] = None):
    try:
        query_base = Chamado.filter(estabelecimento=estabelecimento_id)
    except DoesNotExist:
        raise HTTPException(status_code=404, detail="Estabelecimento não encontrado")
    # Aplicar filtros de data se fornecidos
    if data_inicial:
        data_inicial_dt = datetime.combine(data_inicial, datetime.min.time())
        query_base = query_base.filter(created_at__gte=data_inicial_dt)
        
    if data_final:
        data_final_dt = datetime.combine(data_final, datetime.max.time())
        query_base = query_base.filter(created_at__lte=data_final_dt)

    # Total de chamados no período
    total_chamados = await query_base.count()
    anonimos = await query_base.filter(identificacao=None).count()
    identificados = total_chamados - anonimos

    # Chamados por sexo
    masc = await query_base.filter(identificacao__sexo='M').count()
    fem = await query_base.filter(identificacao__sexo='F').count()
    outros = await query_base.filter(identificacao__sexo='O').count()

    # Chamados por status
    chamados_pendentes = await query_base.filter(status="pendente").count()
    chamados_encerrados = await query_base.filter(status="encerrado").count()

    # Chamados por Tipo de Resposta
    chamados_deferidos = await query_base.filter(tipo_resposta="deferido").count()
    chamados_indeferidos = await query_base.filter(tipo_resposta="indeferido").count()

    # Chamados por Tipo de Abertura
    chamados_por_tipo = {}
    for tipo_enum in TipoAberturaChamadoEnum:
        count = await query_base.filter(tipo_abertura =tipo_enum.value).count()
        chamados_por_tipo[tipo_enum.value] = count
    
    estatisticas = {
        "total": total_chamados,
        "por_identificacao": {
            "anonimos": anonimos,
            "identificados": identificados
        },
        "por_status": {
            "pendente": chamados_pendentes,
            "encerrado": chamados_encerrados
        },
        "por_tipo_resposta": {
            "deferido": chamados_deferidos,
            "indeferido": chamados_indeferidos
        },
        "por_tipo": chamados_por_tipo,
        "por_sexo": {
            "masculino": masc,
            "feminino": fem,
            "outro": outros
        }
    }
    return estatisticas

@router.get("/estabelecimento/{estabelecimento_id}/estatisticas/")
async def get_estatisticas(
    estabelecimento_id: UUID,
    data_inicial: Optional[date] = Query(None),
    data_final: Optional[date] = Query(None)
):
    try:
        estatisticas = await get_estatisticas_chamados(estabelecimento_id, data_inicial, data_final)
        return estatisticas
    except DoesNotExist:
        raise HTTPException(status_code=404, detail="Estabelecimento não encontrado")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/estabelecimento/{estabelecimento_id}/estatisticas/exportar/")
async def exportar_estatisticas(
    estabelecimento_id: UUID,
    data_inicial: Optional[date] = Query(None),
    data_final: Optional[date] = Query(None),
    formato: str = Query("csv")
):
    try:
        estatisticas = await get_estatisticas_chamados(estabelecimento_id, data_inicial, data_final)
        import pandas as pd
        campos_formatados = {}
        campos_formatados['total_solicitacoes'] = estatisticas['total']
        campos_formatados['solicitacoes_atentidas'] = estatisticas['por_status']['encerrado']
        campos_formatados['solicitacoes_pendentes'] = estatisticas['por_status']['pendente']
        campos_formatados['solicitacoes_indeferidas'] = estatisticas['por_tipo_resposta']['indeferido']
        for tipo, count in estatisticas['por_tipo'].items():
            campos_formatados[f'solicitacoes_de_{tipo}'] = count
        df = pd.DataFrame([campos_formatados])
        match formato.lower():
            case "csv":
                csv_data = df.to_csv(index=False)
                csv_buffer = BytesIO(csv_data.encode('utf-8'))
                return StreamingResponse(csv_buffer, media_type="text/csv", headers={"Content-Disposition": f"attachment; filename=estatisticas_esic.csv"})
            case "json":
                json_data = df.to_json(orient="records")
                json_buffer = BytesIO(json_data.encode('utf-8'))
                return StreamingResponse(json_buffer, media_type="application/json", headers={"Content-Disposition": f"attachment; filename=estatisticas_esic.json"})
            case "pdf":
                from api.services.pdf.pdf_service import PDFService
                pdf_service = PDFService()
                dados_estatisticas = {
                    "estabelecimento_id": str(estabelecimento_id),
                    'body': campos_formatados
                }
                pdf_bytes = await pdf_service.exportar_relatorio_estatistico_esic(dados_estatisticas)
                return StreamingResponse(
                    content=BytesIO(pdf_bytes),
                    media_type="application/pdf",
                    headers={"Content-Disposition": f"attachment; filename=estatisticas_esic.pdf"}
                )
            case _:
                raise HTTPException(status_code=400, detail="Formato de exportação inválido")
    except DoesNotExist:
        raise HTTPException(status_code=404, detail="Estabelecimento não encontrado")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))