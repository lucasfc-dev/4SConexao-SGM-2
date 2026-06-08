from fastapi import Request
from fastapi.routing import APIRouter
from fastapi.responses import StreamingResponse
from api.pdf_controller.relatorio_esic import create_pdf,relatorio_estatisticos_esic
from api.services.auth.auth_service import AuthClient
from api.exceptions import BadRequestException, InternalServerErrorException
from io import BytesIO
import base64
router = APIRouter(prefix="/ouvidoria", tags=["Ouvidoria"])

@router.post('/relatorio_esic/')
async def gerar_relatorio_esic(request: Request, dados_relatorio: dict):
    try:
        client = request.state.client
        estabelecimento = client.estabelecimento
        logo_relatorio = estabelecimento.model.config.get('logo_relatorio_esic')
        if logo_relatorio:
            dados_relatorio['header']['logo_relatorio'] = base64.b64decode(logo_relatorio)
        else:
            dados_relatorio['header']['logo_relatorio'] = await client.estabelecimento.get_icone_bytes()
        pdf_data = create_pdf(dados_relatorio)
        
        return  StreamingResponse(
            content=BytesIO(pdf_data),
            media_type="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=relatorio_esic.pdf"
            }
        )
    except Exception as e:
        print(f"Erro ao gerar relatório: {str(e)}")
        raise InternalServerErrorException(f"Erro ao gerar relatório: {str(e)}")
    
@router.post('/estatisticas_esic/exportar_pdf/')
async def exportar_relatorio_estatistico_esic(request: Request,dados_estatisticas: dict):
    try:
        estabelecimento_data = await AuthClient.get_estabelecimento_public_data(dados_estatisticas['estabelecimento_id'])
        header = {
            "nome_estabelecimento": estabelecimento_data.nome,
            "logo_relatorio": estabelecimento_data.icone
        }
        dados_estatisticas['header'] = header
        pdf_data = relatorio_estatisticos_esic(dados_estatisticas)
        return StreamingResponse(
            content=BytesIO(pdf_data),
            media_type="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=relatorio_estatistico_esic.pdf"
            }
        )
    except Exception as e:
        print(f"Erro ao exportar relatório estatístico: {str(e)}")
        raise InternalServerErrorException(f"Erro ao exportar relatório estatístico: {str(e)}")