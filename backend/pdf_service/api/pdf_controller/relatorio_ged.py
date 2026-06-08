from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageTemplate,
    Spacer,
    Paragraph,
    Table,
    TableStyle,
    NextPageTemplate,
)
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import (BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, Table, TableStyle, Image)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER,TA_LEFT
from typing import List
from reportlab.lib.utils import ImageReader
from datetime import datetime


def truncar_texto(texto):
    if len(texto) > 160:
        return texto[:160]+"..."
    return texto

def draw_header(canvas, doc, icone_bytes: bytes, nome_estabelecimento: str, data_inicio: str):
    canvas.saveState()

    x = doc.leftMargin
    y = doc.height + 2*cm

    if icone_bytes:
        icon_stream = BytesIO(icone_bytes)
        icon_stream.seek(0)
        logo = ImageReader(icon_stream)
        canvas.drawImage(logo, x=x, y=y, width=3*cm, height=3*cm, preserveAspectRatio=True, mask='auto')

    canvas.setFont("Helvetica-Bold", 12)
    canvas.drawString(x + 3.3*cm, y + 2.2*cm, nome_estabelecimento.upper())

    canvas.setFont("Helvetica", 9)

    canvas.drawString(x + 3.3*cm, y + 1.8*cm, f"{data_inicio}")

    canvas.restoreState()


def create_pdf(documents, context:dict={}):
    buffer = BytesIO()
    height,width  = A4
    reversed_A4 = (width,height)
    margin = 1 * cm
    top_reserved = 3 * cm  
    largura_util = width - 2 * margin 

    doc = BaseDocTemplate(buffer, pagesize=reversed_A4)

    frame1 = Frame(margin, margin, largura_util , height - top_reserved - margin, id='normal')
    frame2 = Frame(margin, margin, largura_util , height - margin, id='normal')
    if context:
        icone_bytes = context.get('icone_bytes')
        nome_estabelecimento = context.get('nome_estabelecimento')
        data_relatorio = context.get('data_relatorio')
 
        first_page = PageTemplate(
            id='WithHeader',
            frames=[frame1],
            onPage=lambda canvas, doc: draw_header(canvas, doc, icone_bytes, nome_estabelecimento, data_relatorio)
        )

        other_pages = PageTemplate(
            id='NoHeader',
            frames=[frame2]
        )
        doc.addPageTemplates([first_page, other_pages])
    else:
       page_template = PageTemplate(id='NoHeader',frames=[frame2])
       doc.addPageTemplates([page_template])

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="HeaderTitle", fontSize=12, alignment=1, spaceAfter=6))
    styles.add(ParagraphStyle(name="Small", fontSize=9, alignment=1))

    story = []

    story.append(Spacer(1, 12))
    story.append(Paragraph('<b>Relatório Municipal de Documentos</b>', styles['Title']))
    story.append(Spacer(1, 12))
    story.append(NextPageTemplate('NoHeader'))

    table_data = [['Título', 'Situação', 'Data da Publicação', 'Tipo do Documento', 'Descrição']]
    
    centralized_style = ParagraphStyle(name="CenteredBodyText", alignment=TA_CENTER)
    left_aligned_style = ParagraphStyle(name="LeftAlignedBodyText", alignment=TA_LEFT)

    for i, document in enumerate(documents):
        table_data.append([
            Paragraph(document.titulo, centralized_style),
            Paragraph(document.situacao, centralized_style),
            Paragraph(str(document.pub_date.strftime('%d/%m/%Y')), centralized_style),
            Paragraph(document.tipo, centralized_style),
            Paragraph(truncar_texto(document.descricao), left_aligned_style)
        ])

    column_widths = [4.5*cm, 3*cm, 3*cm, 4*cm, 8*cm]

    table = Table(table_data, column_widths, repeatRows=1)

    table_style = TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('GRID', (0, 0), (-1, -1), 0.3, colors.grey),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4A4A4A')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ])
    for i in range(1, len(table_data)):
        if i % 2 == 0:
            table_style.add('BACKGROUND', (0, i), (-1, i), colors.HexColor('#F2F2F2'))

    table.setStyle(table_style)
    story.append(table)

    doc.build(story)
    buffer.seek(0)
    pdf_data = buffer.getvalue()
    buffer.close()
    return pdf_data

from reportlab.pdfgen import canvas
from PyPDF2 import PdfReader, PdfWriter


def _format_signature_datetime(raw_value):
    if not raw_value:
        return ""

    original_value = str(raw_value).strip()
    normalized_value = original_value[2:] if original_value.startswith("D:") else original_value
    normalized_value = normalized_value.replace("'", "")

    if len(normalized_value) < 14 or not normalized_value[:14].isdigit():
        return original_value

    try:
        parsed_datetime = datetime.strptime(normalized_value[:14], "%Y%m%d%H%M%S")
    except ValueError:
        return original_value

    timezone_suffix = ""
    timezone_offset = normalized_value[14:]
    if timezone_offset.startswith("Z"):
        timezone_suffix = " UTC"
    elif (
        len(timezone_offset) >= 5
        and timezone_offset[0] in "+-"
        and timezone_offset[1:5].isdigit()
    ):
        timezone_suffix = f" UTC{timezone_offset[:3]}:{timezone_offset[3:5]}"

    return f"{parsed_datetime.strftime('%d/%m/%Y %H:%M')}{timezone_suffix}"


def _merge_overlay_on_last_page(pdf_bytes: bytes, overlay_bytes: bytes) -> bytes:
    overlay_pdf = PdfReader(BytesIO(overlay_bytes))
    source_pdf = PdfReader(BytesIO(pdf_bytes))
    writer = PdfWriter()

    source_pdf.pages[-1].merge_page(overlay_pdf.pages[0])
    for page in source_pdf.pages:
        writer.add_page(page)

    output = BytesIO()
    writer.write(output)
    output.seek(0)
    return output.read()


def adicionar_dados_assinatura_footer(doc_bytes: bytes, emissor=None, dados_assinatura=None):
    assinatura_texto = (
        "DOCUMENTO ASSINADO DIGITALMENTE CONFORME MP N° 2.200-2 DE 24/08/2001, "
        "QUE INSTITUI A INFRAESTRUTURA DE CHAVES PÚBLICAS BRASILEIRA - ICP-BRASIL."
    )

    dados_assinatura = dados_assinatura or {}
    emissor = emissor or dados_assinatura.get("proprietario") or ""
    codigo_referencia = str(dados_assinatura.get("cod_ref") or "").strip()
    signingdate = _format_signature_datetime(dados_assinatura.get("signingdate"))

    width, _ = A4
    overlay_buffer = BytesIO()
    canv = canvas.Canvas(overlay_buffer, pagesize=A4)

    # Mantem a mesma estrutura de layout do Diario, fixada no rodape.
    canv.setStrokeColor(colors.black)
    canv.setLineWidth(1)
    canv.line(1 * cm, 1 * cm, width - 1 * cm, 1 * cm)

    ass_style = ParagraphStyle(
        "GedFooterAssinatura",
        fontName="Helvetica-Bold",
        fontSize=6,
        leading=6,
        spaceAfter=0,
        alignment=TA_LEFT,
    )
    emissor_style = ParagraphStyle(
        "GedFooterEmissor",
        fontName="Helvetica",
        fontSize=7,
        leading=6,
        spaceAfter=0,
        alignment=TA_LEFT,
    )
    dados_style = ParagraphStyle(
        "GedFooterDados",
        fontName="Helvetica",
        fontSize=5,
        leading=5,
        spaceAfter=0,
        alignment=TA_LEFT,
    )

    assinatura_paragraph = Paragraph(assinatura_texto, ass_style)
    emissor_paragraph = Paragraph(str(emissor), emissor_style)

    if codigo_referencia:
        dados_texto = codigo_referencia
    else:
        dados_texto = f"Assinado Digitalmente por {emissor} Dados: {signingdate}" if signingdate else ""
    dados_paragraph = Paragraph(dados_texto, dados_style)

    x, y = 0.8 * cm, 0 * cm
    largura = 10 * cm
    altura = 1 * cm
    frame = Frame(x, y, largura, altura)
    frame.addFromList([assinatura_paragraph], canv)

    x2 = x + largura
    frame2 = Frame(x2, y, 3.5 * cm, altura)
    frame2.addFromList([emissor_paragraph], canv)

    frame3 = Frame(x2 + 3.5 * cm, y, 3.5 * cm, altura)
    if dados_texto:
        frame3.addFromList([dados_paragraph], canv)

    canv.save()
    return _merge_overlay_on_last_page(doc_bytes, overlay_buffer.getvalue())


def adicionar_qrcode(doc_bytes, qr_img_buffer,url_qrcode):
    width, height = A4
    pdf_qrcode = BytesIO()
    canv = canvas.Canvas(pdf_qrcode, pagesize=(21 * cm, 29.7 * cm)) 

    with qr_img_buffer as qr_image:
        try:
            qr_img_buffer.seek(0)
            image = ImageReader(qr_img_buffer)
            image_width = 2.5 * cm
            image_height = 2.5 * cm
            padding = 0.2 * cm
            text_width = 8 * cm
            total_width = image_width + text_width + 2 * padding
            total_height = image_height + 2 * padding
            
            x = width/2 - total_width/2
            y = 4 * cm

            canv.setStrokeColor(colors.black)
            canv.rect(x, y, total_width, total_height, stroke=1, fill=0)

            canv.drawImage(image, x + padding, y + padding,
                           width=image_width, height=image_height,
                           preserveAspectRatio=True, mask='auto')

            # Estilo do texto
            styles = getSampleStyleSheet()
            style = styles["Normal"]
            style.fontSize = 8
            style.leading = 10

            texto = (
                "A autenticidade deste documento pode ser conferida "
                "pelo QR Code ao lado ou acessando o link:<br/> "
                f"<a href='{url_qrcode}'>{url_qrcode}</a>"
            )

            # Frame para o texto
            frame_x = x + image_width + 2 * padding
            frame = Frame(frame_x, y + padding, text_width, image_height, showBoundary=0)
            paragraph = Paragraph(texto, style)
            frame.addFromList([paragraph], canv)


        except Exception as e:
            print(f"Erro ao carregar a imagem ou desenhar o quadro: {e}")

    canv.showPage()
    canv.save()

    return _merge_overlay_on_last_page(doc_bytes, pdf_qrcode.getvalue())


def adicionar_assinatura_ged_completa(doc_bytes, qr_img_buffer, url_qrcode, emissor=None, dados_assinatura=None):
    doc_com_footer = adicionar_dados_assinatura_footer(doc_bytes, emissor, dados_assinatura)
    return adicionar_qrcode(doc_com_footer, qr_img_buffer, url_qrcode)
