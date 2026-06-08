from __future__ import annotations

from typing import Any
from uuid import UUID

import httpx

from api.config import INTER_SERVICE_API_KEY, PDF_SERVICE_URL
from api.exceptions import BadRequestException, InternalServerErrorException


class PDFService:
    """Cliente do PDF Service para relatórios de Transparência."""

    def __init__(self):
        self.base_url = PDF_SERVICE_URL

    def _headers(self) -> dict[str, str]:
        headers: dict[str, str] = {}
        if INTER_SERVICE_API_KEY:
            headers["X-API-Key"] = INTER_SERVICE_API_KEY
        return headers

    def _extract_error_detail(self, response: httpx.Response) -> str:
        try:
            data = response.json()
            if isinstance(data, dict):
                return str(data.get("detail") or data.get("error") or data)
            return str(data)
        except Exception:
            text = (response.text or "").strip()
            return text[:2000] if text else "Resposta sem corpo"

    async def gerar_relatorio_tabela(
        self,
        *,
        estabelecimento_id: UUID,
        title: str,
        rows: list[dict[str, Any]],
        columns: list[str] | None = None,
        timeout: float = 60.0,
    ) -> bytes:
        if not self.base_url:
            raise InternalServerErrorException("PDF_SERVICE não configurado")

        payload: dict[str, Any] = {
            "title": title or "Relatório",
            "rows": rows or [],
            "columns": columns,
            "estabelecimento_id": str(estabelecimento_id),
        }
            
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/transparencia/relatorio/",
                    headers=self._headers(),
                    json=payload,
                    timeout=timeout,
                )
                response.raise_for_status()
                return response.content
        except httpx.HTTPStatusError as exc:
            detail = self._extract_error_detail(exc.response)
            raise BadRequestException(
                f"Erro ao gerar PDF no PDF Service: {exc.response.status_code} - {detail}"
            )
        except httpx.HTTPError as exc:
            raise InternalServerErrorException(f"Erro ao gerar PDF no PDF Service: {exc}")
