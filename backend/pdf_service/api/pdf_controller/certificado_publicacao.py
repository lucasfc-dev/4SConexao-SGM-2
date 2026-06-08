from __future__ import annotations

from io import BytesIO
from typing import Any, Dict
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.lib.utils import ImageReader
from reportlab.platypus import BaseDocTemplate, Frame, HRFlowable, PageTemplate, Paragraph, Spacer


def _safe(value: Any) -> str:
    return escape(str(value or "").strip())


def _uline(text: str) -> str:
    # underline with HTML-like tag supported by ReportLab Paragraph
    return f"<u>{_safe(text)}</u>"


def _link_like(text: str) -> str:
    # simple visual link (blue + underline) without requiring actual hyperlink annotation
    safe = _safe(text)
    return f"<font color='blue'><u>{safe}</u></font>"


def _create_certificado_publicacao(
    dados: Dict[str, Any],
    *,
    icone_bytes: bytes | None,
    nome_estabelecimento: str,
    cidade: str,
    doc_label: str,
    numero_key: str,
) -> bytes:
    """Gera um PDF de Certificado de Publicação (layout próximo ao modelo fornecido)."""

    buffer = BytesIO()
    width, height = A4

    margin = 2 * cm
    header_reserved = 6.2 * cm
    doc = BaseDocTemplate(buffer, pagesize=(width, height))

    frame = Frame(
        margin,
        margin,
        width - 2 * margin,
        height - header_reserved - margin,
        id="normal",
    )

    # Header semelhante ao modelo: brasão central, 3 linhas de texto e uma linha horizontal
    def draw_header(canvas, _doc):
        canvas.saveState()

        center_x = width / 2
        top_y = height - 1.3 * cm

        if icone_bytes:
            try:
                icon_stream = BytesIO(icone_bytes)
                icon_stream.seek(0)
                logo = ImageReader(icon_stream)
                canvas.drawImage(
                    logo,
                    x=center_x - 1.65 * cm,
                    y=top_y - 3.4 * cm,
                    width=3.3 * cm,
                    height=3.3 * cm,
                    preserveAspectRatio=True,
                    mask="auto",
                )
            except Exception:
                pass

        canvas.setFont("Helvetica-Bold", 10)
        canvas.drawCentredString(center_x, top_y - 3.8 * cm, _safe("ESTADO DO TOCANTINS"))

        # "nome_estabelecimento" costuma ser algo como "Prefeitura Municipal de ..."
        canvas.setFont("Helvetica-Bold", 10)
        canvas.drawCentredString(center_x, top_y - 4.25 * cm, _safe(nome_estabelecimento).upper())

        # Linha horizontal
        canvas.setLineWidth(1)
        canvas.line(margin, top_y - 5.25 * cm, width - margin, top_y - 5.25 * cm)

        canvas.restoreState()

    doc.addPageTemplates([PageTemplate(id="Certificado", frames=[frame], onPage=draw_header)])

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        name="CertTitle",
        parent=styles["Title"],
        alignment=TA_CENTER,
        fontName="Helvetica-Bold",
        fontSize=16,
        leading=18,
        spaceAfter=20,
    )

    body_style = ParagraphStyle(
        name="CertBody",
        parent=styles["BodyText"],
        alignment=TA_JUSTIFY,
        fontName="Helvetica",
        fontSize=12,
        leading=18,
        firstLineIndent=0,
    )

    sign_style = ParagraphStyle(
        name="CertSign",
        parent=styles["BodyText"],
        alignment=TA_CENTER,
        fontName="Helvetica",
        fontSize=11,
        leading=14,
        spaceBefore=6,
    )

    footer_style = ParagraphStyle(
        name="CertFooter",
        parent=styles["BodyText"],
        alignment=TA_CENTER,
        fontName="Helvetica",
        fontSize=12,
        leading=18,
    )

    numero_doc = _safe(dados.get(numero_key))
    objeto = _safe(dados.get("objeto"))
    nome = _safe(dados.get("nome"))
    cargo = _safe(dados.get("cargo", ""))
    data_extenso = _safe(dados.get("data_extenso"))

    # URL do site é opcional (quando houver em config/inputs); mantém compatibilidade
    url_site = _safe(dados.get("url_site") or "")
    site_str = ""
    if url_site:
        site_str = f" ({_link_like(url_site)})"

    story = []
    story.append(Spacer(1, 0.8 * cm))
    story.append(Paragraph("CERTIFICADO DE PUBLICAÇÃO", title_style))

    texto = (
        f"Certifico para os devidos fins do direito, que o(a) {_uline(doc_label + ' ' + numero_doc)}, "
        f"que tem por objeto {_uline(objeto)}, foi devidamente publicado no site da {_safe(nome_estabelecimento)}{site_str}, "
        f"em data de {_uline(data_extenso)}, cumprindo assim, os ditames legais."
    )
    story.append(Paragraph(texto, body_style))

    # Espaço grande como no modelo
    story.append(Spacer(1, 6.0 * cm))

    # Linha de assinatura + identificação
    story.append(HRFlowable(width=9.5 * cm, thickness=1, color=colors.black, spaceBefore=0, spaceAfter=0, hAlign='CENTER'))
    story.append(Paragraph(f"{_safe(nome)}", sign_style))
    story.append(Paragraph(f"{_safe(cargo)}", sign_style))

    story.append(Spacer(1, 1.0 * cm))

    # Rodapé como no modelo: "Cidade, data."
    story.append(Paragraph(f"{_safe(cidade)}, {data_extenso}.", footer_style))

    doc.build(story)

    buffer.seek(0)
    pdf_data = buffer.getvalue()
    buffer.close()
    return pdf_data


def create_certificado_publicacao_contrato(
    dados: Dict[str, Any],
    *,
    icone_bytes: bytes | None,
    nome_estabelecimento: str,
    cidade: str,
) -> bytes:
    """Gera um PDF de Certificado de Publicação de contrato (layout próximo ao modelo fornecido)."""

    return _create_certificado_publicacao(
        dados,
        icone_bytes=icone_bytes,
        nome_estabelecimento=nome_estabelecimento,
        cidade=cidade,
        doc_label="CONTRATO Nº",
        numero_key="num_contrato",
    )


def create_certificado_publicacao_licitacao(
    dados: Dict[str, Any],
    *,
    icone_bytes: bytes | None,
    nome_estabelecimento: str,
    cidade: str,
) -> bytes:
    """Gera um PDF de Certificado de Publicação de licitação."""

    return _create_certificado_publicacao(
        dados,
        icone_bytes=icone_bytes,
        nome_estabelecimento=nome_estabelecimento,
        cidade=cidade,
        doc_label=f"{dados.get('modalidade', '').upper()} Nº",
        numero_key="num_processo",
    )


def create_certificado_publicacao_dispensa(
    dados: Dict[str, Any],
    *,
    icone_bytes: bytes | None,
    nome_estabelecimento: str,
    cidade: str,
) -> bytes:
    """Gera um PDF de Certificado de Publicação de dispensa."""

    return _create_certificado_publicacao(
        dados,
        icone_bytes=icone_bytes,
        nome_estabelecimento=nome_estabelecimento,
        cidade=cidade,
        doc_label=f"{dados.get('tipo_dispensa', '').upper()} Nº",
        numero_key="num_processo",
    )
