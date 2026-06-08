import httpx
from api.config import DOEM_API_URL, INTER_SERVICE_API_KEY

class DoemClient:
    def __init__(self, token: str):
        self.token = token
        self.base_url = DOEM_API_URL  
        self.headers = {"Authorization": f"Bearer {self.token}"}
        if INTER_SERVICE_API_KEY:
            self.headers["X-API-Key"] = INTER_SERVICE_API_KEY

    async def post_document(self, form_data: dict, files: dict = None) -> dict:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/docs/uploadfile/",
                headers=self.headers,
                data=form_data,
                files=files
            )
            response.raise_for_status()
            return response.json()
