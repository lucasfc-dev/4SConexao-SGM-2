import os
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
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

from io import BytesIO
from reportlab.pdfgen import canvas

from api.config import FONTS_DIR

pdfmetrics.registerFont(TTFont('Calibri',os.path.join(FONTS_DIR,'Calibri.ttf')))
pdfmetrics.registerFont(TTFont('Calibri-Bold', os.path.join(FONTS_DIR,'Calibri-Bold.ttf')))

def truncar_texto(texto, max_length=160):
    """Trunca o texto se exceder o tamanho máximo"""
    if not texto:
        return ""
    if len(texto) > max_length:
        return texto[:max_length] + "..."
    return texto


def draw_header(canvas, doc, header_data: dict):
    """Desenha o cabeçalho do relatório no estilo formal"""
    canvas.saveState()
    
    # Para paisagem: width é maior que height
    page_width = doc.width + 2 * doc.leftMargin
    page_height = doc.height + 2 * doc.topMargin + 2 * doc.bottomMargin
    x_center = page_width / 2
    
    # Começa do topo da página
    y_base = page_height - 4*cm

    # Desenha os logos nas laterais
    if header_data.get('logo_relatorio'):
        icon_stream = BytesIO(header_data['logo_relatorio'])
        icon_stream.seek(0)
        logo = ImageReader(icon_stream)
        logo_width = 2.5*cm
        logo_height = 2.5*cm
        logo_y = y_base - 2.5*cm
        
        # Logo esquerda
        canvas.drawImage(logo, x=doc.leftMargin + 0.5*cm, y=logo_y, 
                        width=logo_width, height=logo_height, 
                        preserveAspectRatio=True, mask='auto')
        
        # Logo direita
        canvas.drawImage(logo, x=page_width - doc.rightMargin - logo_width - 0.5*cm, y=logo_y, 
                        width=logo_width, height=logo_height, 
                        preserveAspectRatio=True, mask='auto')

    # Nome do estabelecimento (centralizado)
    canvas.setFont("Calibri-Bold", 18)
    nome_estabelecimento = header_data.get('nome_estabelecimento', '').upper()
    text_width = canvas.stringWidth(nome_estabelecimento, "Calibri-Bold", 18)
    canvas.drawString(x_center - text_width/2, y_base - 1.5*cm, nome_estabelecimento)

    # Endereço (centralizado)
    canvas.setFont("Calibri-Bold", 14)
    endereco = header_data.get('endereco', '')
    telefone = header_data.get('telefone', '')
    texto_endereco_telefone = f"{endereco} | Fone {telefone}"
    text_width = canvas.stringWidth(texto_endereco_telefone, "Calibri-Bold", 14)
    canvas.drawString(x_center - text_width/2, y_base - 2.2*cm, texto_endereco_telefone)

    y_offset = 2.6*cm 

    # Título do relatório
    canvas.setFont("Calibri-Bold", 14)
    titulo_relatorio = "Relatório Solicitação de Informações - Esic"
    text_width = canvas.stringWidth(titulo_relatorio, "Calibri-Bold", 14)
    canvas.drawString(x_center - text_width/2, y_base - y_offset - 0.3*cm, titulo_relatorio)

    # Caixa com o período
    canvas.setFont("Calibri-Bold", 13)
    periodo = header_data.get('periodo_relatorio', '')
    periodo_text = f"ENTRE AS DATAS {periodo}"
    
    # Desenha retângulo cinza claro para o período (largura da tabela)
    table_width = doc.width - 0.5*cm  # Largura da tabela
    box_height = 1*cm
    box_x = doc.leftMargin + 0.25*cm
    box_y = y_base - y_offset - 2*cm
    
    canvas.setFillColor(colors.HexColor('#E8E8E8'))
    canvas.rect(box_x, box_y, table_width, box_height, fill=1, stroke=1)
    
    canvas.setFillColor(colors.black)
    text_width = canvas.stringWidth(periodo_text, "Calibri-Bold", 13)
    canvas.drawString(x_center - text_width/2, box_y + 0.35*cm, periodo_text)

    canvas.restoreState()


def create_pdf(dados_tabela: dict):
    """
    Cria o PDF do Relatório de Solicitações de Informações (e-SIC)
    
    Args:
        dados_tabela: Dicionário contendo 'header' e 'body' com os dados do relatório
    """
    buffer = BytesIO()
    height, width = A4
    reversed_A4 = (width, height)  # Paisagem
    margin = 1.5 * cm
    top_reserved = 5.5 * cm  # Espaço para o header compacto
    largura_util = width - 2 * margin 

    doc = BaseDocTemplate(buffer, pagesize=reversed_A4, 
                         leftMargin=margin, rightMargin=margin,
                         topMargin=margin, bottomMargin=margin)

    # Frames para primeira página (com header) e páginas seguintes
    frame1 = Frame(margin, margin, largura_util, height - top_reserved - margin, id='normal')
    frame2 = Frame(margin, margin, largura_util, height - 2*margin, id='normal')

    header_data = dados_tabela.get('header', {})
    
    # Template com cabeçalho para primeira página
    first_page = PageTemplate(
        id='WithHeader',
        frames=[frame1],
        onPage=lambda canvas, doc: draw_header(canvas, doc, header_data)
    )

    # Template sem cabeçalho para páginas seguintes
    other_pages = PageTemplate(
        id='NoHeader',
        frames=[frame2]
    )
    
    doc.addPageTemplates([first_page, other_pages])

    # Estilos
    styles = getSampleStyleSheet()

    story = []

    # Espaçamento inicial mínimo
    story.append(Spacer(1, 0.2*cm))
    
    # Muda para template sem header nas próximas páginas
    story.append(NextPageTemplate('NoHeader'))

    # Cabeçalho da tabela
    table_data = [[
        'Protocolo',
        'Solicitante',
        'Data Solicitação',
        'Detalhes da Solicitação',
        'Data da Resposta',
        'Resposta'
    ]]
    
    # Estilos para células
    header_style = ParagraphStyle(
        name="HeaderCell", 
        fontSize=10,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold',
        textColor=colors.white
    )
    
    centralized_style = ParagraphStyle(
        name="CenteredCell", 
        fontSize=9, 
        alignment=TA_CENTER,
        fontName='Helvetica'
    )
    
    left_aligned_style = ParagraphStyle(
        name="LeftCell", 
        fontSize=9, 
        alignment=TA_LEFT,
        fontName='Helvetica'
    )

    # Corpo da tabela
    body_data = dados_tabela.get('body', [])
    
    for registro in body_data:
        protocolo = registro.get('protocolo', 'N/A')
        solicitante = registro.get('solicitante', 'Anônimo')
        data_solicitacao = registro.get('data_solicitacao', 'N/A')
        detalhes = truncar_texto(registro.get('detalhes_solicitacao', ''), max_length=250)
        data_resposta = registro.get('data_resposta')
        resposta = registro.get('resposta')
        
        table_data.append([
            Paragraph(str(protocolo), centralized_style),
            Paragraph(solicitante, centralized_style),
            Paragraph(data_solicitacao, centralized_style),
            Paragraph(truncar_texto(detalhes, 250) if detalhes else '', left_aligned_style),
            Paragraph(data_resposta if data_resposta else '', centralized_style),
            Paragraph(truncar_texto(resposta, 250) if resposta else '', left_aligned_style)
        ])

    # Larguras das colunas - ocupar toda largura disponível
    column_widths = [3.5*cm, 3.5*cm, 3*cm, 6*cm, 3*cm, 6.5*cm]

    table = Table(table_data, column_widths, repeatRows=1)

    # Estilo da tabela
    table_style = TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Calibri-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('FONTNAME', (0, 1), (-1, -1), 'Calibri'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('VALIGN', (0, 0), (5, 0), 'MIDDLE'),  # Header centralizado verticalmente
        ('VALIGN', (0, 1), (-1, -1), 'TOP'),  # Body alinhado no topo
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 1), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 5),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('LINEBELOW', (0, 0), (-1, 0), 2, colors.black),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#E0E0E0')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
    ])

    table.setStyle(table_style)
    story.append(table)

    # Gera o PDF
    doc.build(story)
    buffer.seek(0)
    pdf_data = buffer.getvalue()
    buffer.close()
    return pdf_data

def relatorio_estatisticos_esic(dados_estatisticas: dict):
    """
    Cria o PDF do Relatório Estatístico de Solicitações (e-SIC)
    
    Args:
        dados_estatisticas: Dicionário contendo 'header' e 'body' com os dados estatísticos
    """
    buffer = BytesIO()
    height, width = A4
    reversed_A4 = (width, height)  # Paisagem
    margin = 1.5 * cm
    top_reserved = 5.5 * cm  # Espaço para o header
    largura_util = width - 2 * margin

    doc = BaseDocTemplate(buffer, pagesize=reversed_A4,
                         leftMargin=margin, rightMargin=margin,
                         topMargin=margin, bottomMargin=margin)

    # Frames para primeira página (com header) e páginas seguintes
    frame1 = Frame(margin, margin, largura_util, height - top_reserved - margin, id='normal')
    frame2 = Frame(margin, margin, largura_util, height - 2*margin, id='normal')

    header_data = dados_estatisticas.get('header', {})
    
    # Template com cabeçalho
    def draw_estatisticas_header(canvas, doc):
        canvas.saveState()
        
        page_width = doc.width + 2 * doc.leftMargin
        page_height = doc.height + 2 * doc.topMargin + 2 * doc.bottomMargin
        x_center = page_width / 2
        
        y_base = page_height - 4*cm

        # Desenha o logo
        if header_data.get('logo_relatorio'):
            icon_stream = BytesIO(header_data['logo_relatorio'])
            icon_stream.seek(0)
            logo = ImageReader(icon_stream)
            logo_width = 2.5*cm
            logo_height = 2.5*cm
            logo_y = y_base - 2.5*cm
            
            # Logo centralizado
            canvas.drawImage(logo, x=x_center - logo_width/2, y=logo_y,
                           width=logo_width, height=logo_height,
                           preserveAspectRatio=True, mask='auto')

        # Nome do estabelecimento
        canvas.setFont("Calibri-Bold", 18)
        nome_estabelecimento = header_data.get('nome_estabelecimento', '').upper()
        text_width = canvas.stringWidth(nome_estabelecimento, "Calibri-Bold", 18)
        canvas.drawString(x_center - text_width/2, y_base - 3.2*cm, nome_estabelecimento)

        # Título do relatório
        canvas.setFont("Calibri-Bold", 14)
        titulo_relatorio = "Relatório Estatístico - Solicitações e-SIC"
        text_width = canvas.stringWidth(titulo_relatorio, "Calibri-Bold", 14)
        canvas.drawString(x_center - text_width/2, y_base - 3.9*cm, titulo_relatorio)

        # Período
        periodo = header_data.get('periodo_relatorio', '')
        if periodo:
            canvas.setFont("Calibri-Bold", 12)
            periodo_text = f"Período: {periodo}"
            text_width = canvas.stringWidth(periodo_text, "Calibri-Bold", 12)
            canvas.drawString(x_center - text_width/2, y_base - 4.5*cm, periodo_text)

        canvas.restoreState()

    first_page = PageTemplate(
        id='WithHeader',
        frames=[frame1],
        onPage=draw_estatisticas_header
    )

    other_pages = PageTemplate(
        id='NoHeader',
        frames=[frame2]
    )
    
    doc.addPageTemplates([first_page, other_pages])

    # Estilos
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        name="TitleStyle",
        fontSize=12,
        alignment=TA_LEFT,
        fontName='Calibri-Bold',
        textColor=colors.black,
        spaceAfter=10
    )
    
    normal_style = ParagraphStyle(
        name="NormalStyle",
        fontSize=10,
        alignment=TA_LEFT,
        fontName='Calibri'
    )

    story = []
    story.append(Spacer(1, 0.5*cm))
    story.append(NextPageTemplate('NoHeader'))

    # Extrair dados do body
    body_data = dados_estatisticas.get('body', {})
    
    # Seção 1: Resumo Geral
    story.append(Paragraph("RESUMO GERAL", title_style))
    
    resumo_data = [
        ['Total de Solicitações:', str(body_data.get('total_solicitacoes', 0))],
        ['Solicitações Atendidas:', str(body_data.get('solicitacoes_atentidas', 0))],
        ['Solicitações Pendentes:', str(body_data.get('solicitacoes_pendentes', 0))],
        ['Solicitações Indeferidas:', str(body_data.get('solicitacoes_indeferidas', 0))]
    ]
    
    resumo_table = Table(resumo_data, colWidths=[12*cm, 4*cm])
    resumo_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Calibri-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Calibri'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F5F5F5')),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    
    story.append(resumo_table)
    story.append(Spacer(1, 0.8*cm))

    # Seção 2: Solicitações por Tipo
    story.append(Paragraph("SOLICITAÇÕES POR TIPO", title_style))
    
    tipos_data = [
        ['Tipo de Solicitação', 'Quantidade']
    ]
    
    tipos_mapeamento = [
        ('Informação', 'solicitacoes_de_informacao'),
        ('Elogio', 'solicitacoes_de_elogio'),
        ('Sugestão', 'solicitacoes_de_sugestao'),
        ('Reclamação', 'solicitacoes_de_reclamacao'),
        ('Comunicação', 'solicitacoes_de_comunicacao'),
        ('Irregularidade', 'solicitacoes_de_irregularidade'),
        ('Denúncia', 'solicitacoes_de_denuncia'),
        ('Representação', 'solicitacoes_de_representacao'),
        ('Demanda', 'solicitacoes_de_demanda'),
        ('Crítica', 'solicitacoes_de_critica')
    ]
    
    for tipo_nome, tipo_key in tipos_mapeamento:
        quantidade = body_data.get(tipo_key, 0)
        tipos_data.append([tipo_nome, str(quantidade)])
    
    tipos_table = Table(tipos_data, colWidths=[12*cm, 4*cm])
    tipos_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Calibri-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        ('FONTNAME', (0, 1), (-1, -1), 'Calibri'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('ALIGN', (0, 1), (0, -1), 'LEFT'),
        ('ALIGN', (1, 1), (1, -1), 'RIGHT'),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#E0E0E0')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    
    story.append(tipos_table)

    # Gera o PDF
    doc.build(story)
    buffer.seek(0)
    pdf_data = buffer.getvalue()
    buffer.close()
    return pdf_data