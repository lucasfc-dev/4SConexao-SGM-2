from api.services.auth.auth_service import AuthClient
from api.config import PDF_SERVICE_URL
from typing import Optional
import httpx

class PDFService():
    def __init__(self,auth_client:Optional[AuthClient]=None):
        self.base_url = PDF_SERVICE_URL
        self.auth_client = auth_client

    async def gerar_relatorio_esic(self, dados_relatorio: dict):
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{self.base_url}/ouvidoria/relatorio_esic/", headers=self.auth_client.headers, json=dados_relatorio)
            response.raise_for_status()
            return response.content
    
    async def exportar_relatorio_estatistico_esic(self, dados_estatisticas: dict):
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{self.base_url}/ouvidoria/estatisticas_esic/exportar_pdf/",json=dados_estatisticas)
            response.raise_for_status()
            return response.content