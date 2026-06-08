from __future__ import annotations

import csv
from datetime import date, datetime
from decimal import Decimal
from enum import Enum
from io import BytesIO, StringIO
from typing import Any
from uuid import UUID
import xml.etree.ElementTree as ET

from fastapi.responses import StreamingResponse
from api.exceptions import BadRequestException
from api.services.pdf.pdf_service import PDFService


MIME_BY_TYPE = {
    "csv": "text/csv",
    "xml": "application/xml",
    "pdf": "application/pdf",
}


def _serialize_value(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, Decimal):
        return str(value)
    if isinstance(value, UUID):
        return str(value)
    if isinstance(value, Enum):
        return str(value.value)
    return str(value)


def to_csv_bytes(rows: list[dict[str, Any]]) -> bytes:
    if rows:
        fieldnames = list(rows[0].keys())
    else:
        fieldnames = ["Sem dados"]

    output = StringIO()
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()

    for row in rows:
        writer.writerow({key: _serialize_value(value) for key, value in row.items()})

    return output.getvalue().encode("utf-8")


def to_xml_bytes(rows: list[dict[str, Any]], root_tag: str = "dados", item_tag: str = "item") -> bytes:
    root = ET.Element(root_tag)

    for row in rows:
        item = ET.SubElement(root, item_tag)
        for key, value in row.items():
            field = ET.SubElement(item, key.replace(" ", "_").lower())
            field.text = _serialize_value(value)

    xml_bytes = ET.tostring(root, encoding="utf-8", xml_declaration=True)
    return xml_bytes


async def gerar_pdf_publico(
    estabelecimento_id: UUID,
    rows: list[dict[str, Any]],
    *,
    title: str = "Relatório",
    columns: list[str] | None = None,
) -> bytes:
    normalized_rows = [
        {key: _serialize_value(value) for key, value in row.items()}
        for row in (rows or [])
    ]

    pdf_client = PDFService()
    return await pdf_client.gerar_relatorio_tabela(
        estabelecimento_id=estabelecimento_id,
        title=title,
        rows=normalized_rows,
        columns=columns,
    )


async def exportar_em_formato(
    export_type: str,
    estabelecimento_id: UUID,
    rows: list[dict[str, Any]],
    filename_prefix: str,
    title: str | None = None,
) -> StreamingResponse:
    export_type = (export_type or "csv").lower()
    if export_type not in MIME_BY_TYPE:
        raise BadRequestException("Parâmetro type deve ser csv, xml ou pdf")

    if export_type == "csv":
        data = to_csv_bytes(rows)
    elif export_type == "xml":
        data = to_xml_bytes(rows)
    else:
        data = await gerar_pdf_publico(
            estabelecimento_id,
            rows,
            title=title or filename_prefix,
        )

    buffer = BytesIO(data)
    return StreamingResponse(
        buffer,
        media_type=MIME_BY_TYPE[export_type],
        headers={
            "Content-Disposition": f'attachment; filename="{filename_prefix}.{export_type}"',
        },
    )
