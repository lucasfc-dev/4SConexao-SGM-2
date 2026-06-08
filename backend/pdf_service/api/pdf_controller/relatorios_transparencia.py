from __future__ import annotations

from datetime import datetime
from io import BytesIO
from typing import Any

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.lib.utils import ImageReader
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    NextPageTemplate,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


def _safe_str(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, (datetime,)):
        return value.isoformat(sep=" ")
    return str(value)


def _trunc(text: str, limit: int = 220) -> str:
    text = text or ""
    if len(text) > limit:
        return text[:limit] + "..."
    return text


def _draw_header(canvas, doc, icone_bytes: bytes | None, nome_estabelecimento: str, data_relatorio: str):
    canvas.saveState()

    x = doc.leftMargin
    y = doc.height + 2 * cm

    if icone_bytes:
        try:
            icon_stream = BytesIO(icone_bytes)
            icon_stream.seek(0)
            logo = ImageReader(icon_stream)
            canvas.drawImage(
                logo,
                x=x,
                y=y,
                width=3 * cm,
                height=3 * cm,
                preserveAspectRatio=True,
                mask="auto",
            )
        except Exception:
            pass

    canvas.setFont("Helvetica-Bold", 12)
    canvas.drawString(x + 3.3 * cm, y + 2.2 * cm, (nome_estabelecimento or "").upper())

    canvas.setFont("Helvetica", 9)
    canvas.drawString(x + 3.3 * cm, y + 1.8 * cm, f"{data_relatorio}")

    canvas.restoreState()


def _infer_columns(rows: list[dict[str, Any]]) -> list[str]:
    if not rows:
        return ["Sem dados"]

    columns: list[str] = list(rows[0].keys())
    seen = set(columns)

    for row in rows[1:]:
        for key in row.keys():
            if key not in seen:
                seen.add(key)
                columns.append(key)

    return columns or ["Sem dados"]


def create_pdf_relatorio_transparencia(
    *,
    rows: list[dict[str, Any]],
    title: str = "Relatório",
    context: dict | None = None,
    columns: list[str] | None = None,
) -> bytes:
    buffer = BytesIO()

    height, width = A4
    reversed_a4 = (width, height)  # landscape

    margin = 1 * cm
    top_reserved = 3 * cm
    largura_util = width - 2 * margin

    doc = BaseDocTemplate(buffer, pagesize=reversed_a4)

    frame1 = Frame(margin, margin, largura_util, height - top_reserved - margin, id="normal")
    frame2 = Frame(margin, margin, largura_util, height - margin, id="normal")

    if context:
        icone_bytes = context.get("icone_bytes")
        nome_estabelecimento = context.get("nome_estabelecimento")
        data_relatorio = context.get("data_relatorio")

        first_page = PageTemplate(
            id="WithHeader",
            frames=[frame1],
            onPage=lambda canvas, doc: _draw_header(canvas, doc, icone_bytes, nome_estabelecimento, data_relatorio),
        )
        other_pages = PageTemplate(id="NoHeader", frames=[frame2])
        doc.addPageTemplates([first_page, other_pages])
    else:
        doc.addPageTemplates([PageTemplate(id="NoHeader", frames=[frame2])])

    styles = getSampleStyleSheet()

    story: list[Any] = []
    story.append(Spacer(1, 12))
    story.append(Paragraph(f"<b>{title}</b>", styles["Title"]))
    story.append(Spacer(1, 12))
    story.append(NextPageTemplate("NoHeader"))

    resolved_columns = columns or _infer_columns(rows)

    font_size = 7 if len(resolved_columns) >= 9 else (8 if len(resolved_columns) >= 6 else 9)

    header_style = ParagraphStyle(
        name="HeaderText",
        alignment=TA_CENTER,
        fontSize=8,
        textColor=colors.white,
        fontName="Helvetica-Bold",
        leading=9,
    )
    body_center = ParagraphStyle(
        name="BodyCenter",
        alignment=TA_CENTER,
        fontSize=font_size,
        fontName="Helvetica",
        leading=font_size + 1,
    )
    body_left = ParagraphStyle(
        name="BodyLeft",
        alignment=TA_LEFT,
        fontSize=font_size,
        fontName="Helvetica",
        leading=font_size + 1,
    )

    table_data: list[list[Any]] = [
        [Paragraph(_safe_str(col), header_style) for col in resolved_columns]
    ]

    for row in rows or [{}]:
        row_cells: list[Any] = []
        for col in resolved_columns:
            raw = row.get(col, "")
            value = _trunc(_safe_str(raw))

            # Heurística simples: se parecer número curto/data, centraliza.
            if isinstance(raw, (int, float)):
                row_cells.append(Paragraph(value, body_center))
            else:
                row_cells.append(Paragraph(value, body_left))

        table_data.append(row_cells)

    col_width = largura_util / max(len(resolved_columns), 1)
    column_widths = [col_width for _ in resolved_columns]

    table = Table(table_data, column_widths, repeatRows=1)

    table_style = TableStyle(
        [
            ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
            ("FONTSIZE", (0, 0), (-1, -1), font_size),
            ("ALIGN", (0, 0), (-1, 0), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 2),
            ("RIGHTPADDING", (0, 0), (-1, -1), 2),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ("GRID", (0, 0), (-1, -1), 0.3, colors.grey),
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#4A4A4A")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ]
    )

    for i in range(1, len(table_data)):
        if i % 2 == 0:
            table_style.add("BACKGROUND", (0, i), (-1, i), colors.HexColor("#F2F2F2"))

    table.setStyle(table_style)
    story.append(table)

    doc.build(story)
    buffer.seek(0)
    pdf_data = buffer.getvalue()
    buffer.close()
    return pdf_data
