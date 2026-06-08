from fastapi import HTTPException,Request,Form,File,UploadFile
from fastapi.routing import APIRouter
from api.models import Chamado,Documento,RetornoChamado
from api.schemas import TipoClassificacaoChamadoEnum, TipoRespostaChamadoEnum,TipoClassificacaoChamadoEnum,StatusClassificacaoChamadoEnum
from api.config import EMAIL_API_URL,AUTH_API_URL
from tortoise.transactions import in_transaction
from tortoise.exceptions import DoesNotExist
from uuid import UUID
from datetime import datetime
from typing import List,Optional
import httpx
import base64

router = APIRouter(prefix="/retorno_chamado",tags=["RetornoChamado"])

async def get_estabelecimento_nome(estabelecimento_id) -> str:
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{AUTH_API_URL}/estabelecimento/{estabelecimento_id}/nome/",
            )
            response.raise_for_status()
            data = response.json()
            return data.get("nome", "SGM")
    except httpx.HTTPError:
        return "SGM"

@router.post("/{chamado_id}/encerrar/")
async def create_retorno_chamado(
    request: Request,
    chamado_id: UUID,
    anexos: Optional[List[UploadFile]] = File(None),
    resposta: str = Form(...),
    tipo_resposta: TipoRespostaChamadoEnum = Form(...),
    status_classificacao: StatusClassificacaoChamadoEnum = Form(...),
    tipo_classificacao: Optional[TipoClassificacaoChamadoEnum] = Form(None)
):
    try:
        chamado = await Chamado.get(id=chamado_id).prefetch_related('identificacao')
        if chamado.status == "encerrado":
            raise HTTPException(status_code=400, detail="Chamado já foi encerrado")
        chamado.status = "encerrado"
        chamado.tipo_resposta = tipo_resposta
        chamado.status_classificacao = status_classificacao

        if status_classificacao == 'classificado':
            if tipo_classificacao is None:
                raise HTTPException(status_code=400, detail="Classificação é obrigatória para chamados classificados")
            chamado.tipo_classificacao = tipo_classificacao
        await chamado.save()
    
        retorno = await RetornoChamado.create(
            chamado=chamado,
            mensagem=resposta
        )
        
        # Prepara os anexos se existirem
        attachments_data = []
        if anexos:
            for anexo in anexos:
                if anexo.filename:  # Verifica se o arquivo tem nome
                    content = await anexo.read()
                    await Documento.create(
                        retorno_chamado=retorno,
                        filename=anexo.filename,
                        arquivo=content,
                        tipo=anexo.content_type
                    )
                    # Converte para base64 para envio via JSON
                    content_base64 = base64.b64encode(content).decode('utf-8')
                    attachments_data.append({
                        "filename": anexo.filename,
                        "file": content_base64
                    })
        if not chamado.identificacao:
            # Busca os anexos do retorno para incluir na resposta
            anexos_retorno = await Documento.filter(retorno_chamado=retorno)
            retorno_dict = retorno.to_dict()
            retorno_dict['anexos'] = [doc.to_dict() for doc in anexos_retorno]
            return {"message": "Retorno enviado com sucesso","retorno":retorno_dict}
        
        # Prepara o payload do email
        estabelecimento_nome = await get_estabelecimento_nome(chamado.estabelecimento)
        email_payload = {
            "email": chamado.identificacao.email,
            "subject": f"Retorno do Chamado {chamado.num_protocolo}",
            "keys": {
                "protocol_number": chamado.num_protocolo,
                "status": chamado.status,
                "response_date": datetime.now().strftime("%d/%m/%Y"),
                "resposta": resposta,
                "estabelecimento": estabelecimento_nome,
                "anexos": [{"filename": anexo["filename"]} for anexo in attachments_data] if attachments_data else [],
                "tem_anexos": len(attachments_data) > 0
            }
        }
        
        # Adiciona anexos ao payload se existirem
        if attachments_data:
            email_payload["attachment"] = attachments_data
        
        # Envia o email
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{EMAIL_API_URL}/email/ouvidoria/resposta/",
                json=email_payload
            )
            response.raise_for_status()
        
        # Busca os anexos do retorno para incluir na resposta
        anexos_retorno = await Documento.filter(retorno_chamado=retorno)
        retorno_dict = retorno.to_dict()
        retorno_dict['anexos'] = [doc.to_dict() for doc in anexos_retorno]

        return {"message": "Retorno enviado com sucesso","retorno":retorno_dict}
        
    except DoesNotExist:
        raise HTTPException(status_code=404, detail="Chamado não encontrado")
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"Erro ao enviar email: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

 
# @router.post("/{chamado_id}/encerrar/")
# async def indeferimento_chamado(
#     request: Request,
#     chamado_id: UUID,
#     resposta: str = Form(...),
#     tipo_resposta: TipoRespostaChamadoEnum = Form(...)
# ):
#     try:
#         chamado = await Chamado.get(id=chamado_id)    
#         chamado.status = "encerrado"

#         chamado.tipo_resposta = tipo_resposta
#         await chamado.save()
#         retorno = await RetornoChamado.create(
#             chamado=chamado,
#             mensagem=resposta
#         )

#         return {"message": "Chamado indeferido com sucesso","retorno":retorno.to_dict()}
#     except DoesNotExist:
#         raise HTTPException(status_code=404, detail="Chamado não encontrado")
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")