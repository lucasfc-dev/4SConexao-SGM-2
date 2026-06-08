from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageTemplate,
    Spacer,
    Paragraph,
    Table,
    TableStyle,
    NextPageTemplate,
    Image
)
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.utils import ImageReader
from io import BytesIO
from typing import List, Union, Dict, Any


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


def create_pdf_relatorio(processos_licitatorios: List[Dict[str, Any]], context: dict = None):
    """
    Cria um PDF com relatório de licitações, dispensas ou contratos.
    
    Args:
        processos_licitatorios: Lista de dicionários com os dados dos processos
        context: Dicionário com contexto (icone_bytes, nome_estabelecimento, data_relatorio, tipo, titulo)
    """
    buffer = BytesIO()
    height, width = A4
    reversed_A4 = (width, height)
    margin = 1 * cm
    top_reserved = 3 * cm  
    largura_util = width - 2 * margin 

    doc = BaseDocTemplate(buffer, pagesize=reversed_A4)

    frame1 = Frame(margin, margin, largura_util, height - top_reserved - margin, id='normal')
    frame2 = Frame(margin, margin, largura_util, height - margin, id='normal')
    
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
        page_template = PageTemplate(id='NoHeader', frames=[frame2])
        doc.addPageTemplates([page_template])

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="HeaderTitle", fontSize=12, alignment=1, spaceAfter=6))
    styles.add(ParagraphStyle(name="Small", fontSize=9, alignment=1))

    story = []

    story.append(Spacer(1, 12))
    titulo = context.get("titulo", "Relatorio Municipal de Procedimentos Licitatórios") if context else "Relatorio Municipal de Procedimentos Licitatórios"
    story.append(Paragraph(f'<b>{titulo}</b>', styles['Title']))
    story.append(Spacer(1, 12))
    story.append(NextPageTemplate('NoHeader'))

    centralized_style = ParagraphStyle(name="CenteredBodyText", alignment=TA_CENTER)
    left_aligned_style = ParagraphStyle(name="LeftAlignedBodyText", alignment=TA_LEFT)
    indented_left_style = ParagraphStyle(
        name="IndentedLeftBodyText", 
        alignment=TA_LEFT,
        leftIndent=20,
        firstLineIndent=0,
        spaceAfter=0,
        spaceBefore=0,
        leading=10  
    )
    header_style = ParagraphStyle(name="HeaderText", alignment=TA_CENTER, fontSize=8, textColor=colors.white)

    tipo = context.get('tipo') if context else None
    
    if tipo == 'licitacao':
        table_data = [[
            Paragraph('Número/Ano', header_style),
            Paragraph('Órgão', header_style),
            Paragraph('Modalidade', header_style),
            Paragraph('Situação', header_style),
            Paragraph('Data de<br/>Publicação', header_style),
            Paragraph('Data de<br/>Julgamento', header_style),
            Paragraph('Objeto', header_style)
        ]]
    elif tipo == 'dispensa':
        table_data = [[
            Paragraph('Número/Ano', header_style),
            Paragraph('Órgão', header_style),
            Paragraph('Tipo<br/>Dispensa', header_style),
            Paragraph('Situação', header_style),
            Paragraph('Data de<br/>Publicação', header_style),
            Paragraph('Data de<br/>Julgamento', header_style),
            Paragraph('Objeto', header_style)
        ]]
    elif tipo == 'contrato':
        table_data = [[
            Paragraph('Número<br/>Contrato', header_style),
            Paragraph('Modalidade/<br/>Tipo Dispensa', header_style),
            Paragraph('Licitação/<br/>Dispensa', header_style),
            Paragraph('Data<br/>Vigência', header_style),
            Paragraph('Órgão', header_style),
            Paragraph('Contratado(a)', header_style),
            Paragraph('Valor', header_style),
            Paragraph('Fiscal do<br/>Contrato', header_style),
            Paragraph('Situação', header_style),
            Paragraph('Finalidade', header_style),
            Paragraph('Objeto', header_style)
        ]]
    elif tipo == 'fiscal':
        table_data = [[
            Paragraph('Nome', header_style),
            Paragraph('CPF', header_style),
            Paragraph('Cargo', header_style),
            Paragraph('Vigência<br/>Início', header_style),
            Paragraph('Vigência<br/>Fim', header_style),
            Paragraph('Contratos<br/>Vinculados', header_style),
        ]]
    else:
        table_data = [[]]
    
    for processo in processos_licitatorios:
        if tipo == 'contrato':
            fiscal_contrato = processo.get('fiscal_contrato', {}).get('pessoa', {}).get('nome', '') or \
                            processo.get('fiscal_contrato', {}).get('pessoa', {}).get('razao_social', '')

            modalidade_tipo = processo.get('modalidade_tipo', '')
            num_processo = processo.get('num_processo', '')
            orgao = processo.get('orgao', '')

            table_data.append([
                Paragraph(processo.get('num_contrato', ''), centralized_style),
                Paragraph(modalidade_tipo, centralized_style),
                Paragraph(num_processo, centralized_style),
                Paragraph(str(processo.get('data_inicio', '')), centralized_style),
                Paragraph(str(orgao), centralized_style),
                Paragraph(processo.get('fornecedor', {}).get('razao_social', ''), centralized_style),
                Paragraph(f"R$ {processo.get('valor_estimado', 0):.2f}", centralized_style),
                Paragraph(fiscal_contrato, centralized_style),
                Paragraph(processo.get('situacao', ''), centralized_style),
                Paragraph(processo.get('finalidade', ''), centralized_style),
                Paragraph(truncar_texto(processo.get('objeto', '')), indented_left_style)
            ])
        elif tipo == 'fiscal':
            table_data.append([
                Paragraph(processo.get('nome', ''), left_aligned_style),
                Paragraph(processo.get('cpf', ''), centralized_style),
                Paragraph(processo.get('cargo', ''), centralized_style),
                Paragraph(processo.get('vigencia_inicio', ''), centralized_style),
                Paragraph(processo.get('vigencia_fim', ''), centralized_style),
                Paragraph(processo.get('contratos_vinculados', ''), left_aligned_style),
            ])
        else:
            tipo_modalidade = processo.get('modalidade', {}).get('nome', '') if tipo == 'licitacao' else processo.get('tipo_dispensa', '')
            
            pub_date = processo.get('pub_date')
            julg_date = processo.get('julg_date')
            
            formated_pub_date = pub_date if pub_date else 'Não Publicado'
            formated_julg_date = julg_date if julg_date else 'Não Julgado'

            table_data.append([
                Paragraph(processo.get('num_processo', ''), centralized_style),
                Paragraph(str(processo.get('orgao', {}).get('nome', '')), centralized_style),
                Paragraph(tipo_modalidade, centralized_style),
                Paragraph(processo.get('situacao', ''), centralized_style),
                Paragraph(formated_pub_date, centralized_style),
                Paragraph(formated_julg_date, centralized_style),
                Paragraph(truncar_texto(processo.get('objeto', '')), left_aligned_style)
            ])

    weights = [1] * (len(table_data[0]) - 1) + [2]
    total = sum(weights)
    column_widths = [largura_util * w / total for w in weights]

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


def create_relatorio_fiscal_contrato(dados_relatorio: dict = {}):
    """
    Cria um relatório de fiscalização mensal de contrato.
    
    Args:
        dados_relatorio: Dicionário com os dados do relatório
    """
    buffer = BytesIO()
    width, height = A4
    margin = 2 * cm
    top_reserved = 6 * cm
    largura_util = width - 2 * margin

    doc = BaseDocTemplate(buffer, pagesize=(width, height))
    
    frame = Frame(margin, margin, largura_util, height - top_reserved - margin, id='normal')
    
    def draw_header_relatorio(canvas, doc):
        canvas.saveState()
        
        x = margin
        y = height
        
        icone_bytes = dados_relatorio.get('icone_bytes')
        if icone_bytes and isinstance(icone_bytes, bytes):
            try:
                icon_stream = BytesIO(icone_bytes)
                icon_stream.seek(0)
                logo = ImageReader(icon_stream)
                canvas.drawImage(logo, x=x, y=y-5*cm, width=6*cm, height=5*cm, preserveAspectRatio=True, mask='auto')
            except Exception as e:
                # Se houver erro ao carregar a imagem, continua sem ela
                print(f"Aviso: Erro ao carregar ícone do órgão: {str(e)}")
        
        orgao = dados_relatorio.get('orgao', {})
        canvas.setFont("Helvetica-Bold", 12)
        canvas.drawString(x + 8*cm, y-1*cm, orgao.get('nome', ''))
        
        canvas.setFont("Helvetica", 10)
        canvas.drawString(x + 8*cm, y-1.5*cm, orgao.get('endereco', ''))
        canvas.drawString(x + 8*cm, y-2*cm, dados_relatorio.get('cidade', ''))
        
        canvas.restoreState()
    
    page_template = PageTemplate(
        id='RelatorioContrato',
        frames=[frame],
        onPage=draw_header_relatorio
    )
    doc.addPageTemplates([page_template])

    styles = getSampleStyleSheet()
    
    titulo_style = ParagraphStyle(
        name="TituloRelatorio",
        parent=styles['Heading1'],
        alignment=TA_CENTER,
        fontSize=14,
        fontName='Helvetica-Bold',
        spaceAfter=12,
        spaceBefore=0
    )
    
    subtitulo_style = ParagraphStyle(
        name="SubtituloRelatorio",
        parent=styles['Heading2'],
        alignment=TA_CENTER,
        fontSize=12,
        fontName='Helvetica-Bold',
        spaceAfter=15,
        spaceBefore=5
    )
    
    texto_style = ParagraphStyle(
        name="TextoRelatorio",
        parent=styles['Normal'],
        alignment=TA_LEFT,
        fontSize=10,
        fontName='Helvetica',
        spaceAfter=8,
        leading=12
    )
    
    assinatura_style = ParagraphStyle(
        name="AssinaturaRelatorio",
        parent=styles['Normal'],
        alignment=TA_CENTER,
        fontSize=10,
        fontName='Helvetica',
        spaceAfter=6,
    )

    story = []
    
    story.append(Paragraph("RELATÓRIO DE FISCALIZAÇÃO MENSAL COM PRESTAÇÃO DE SERVIÇO", titulo_style))
    story.append(Paragraph("EXECUÇÃO REGULAR", subtitulo_style))
    
    story.append(Paragraph(f"<b>Número do relatório:</b> {dados_relatorio.get('num_relatorio', '')}", texto_style))
    story.append(Paragraph(f"<b>Número do contrato:</b> {dados_relatorio.get('num_contrato', '')}", texto_style))
    story.append(Paragraph(f"<b>Objeto ou serviço contratado:</b> {dados_relatorio.get('objeto', '')}", texto_style))
    story.append(Paragraph(f"<b>Contratado:</b> {dados_relatorio.get('contratado', '')} - CNPJ: {dados_relatorio.get('cnpj_contratado', '')}", texto_style))
    story.append(Paragraph(f"<b>Competência:</b> {dados_relatorio.get('competencia', '')}", texto_style))
    story.append(Paragraph(f"<b>Valor:</b> R$ {dados_relatorio.get('valor', '')} ({dados_relatorio.get('valor_extenso', '')})", texto_style))
    story.append(Paragraph(f"<b>Vigência Contratual:</b> {dados_relatorio.get('vigencia', '')}", texto_style))
    story.append(Paragraph(f"<b>Fiscal de Contratos:</b> {dados_relatorio.get('fiscal', '')} – {dados_relatorio.get('portaria', '')}", texto_style))
    story.append(Paragraph(f"<b>Fundamentação Legal:</b> {dados_relatorio.get('fundamento_legal', '')}", texto_style))
    story.append(Paragraph(f"<b>Constatações:</b> {dados_relatorio.get('constatacoes', '')}", texto_style))
    story.append(Paragraph(f"<b>Conclusão:</b> {dados_relatorio.get('conclusao', '')}", texto_style))
    
    story.append(Spacer(1, 15))
    story.append(Spacer(1, 30))
    
    data_local = dados_relatorio.get('data_local', '')
    story.append(Paragraph(data_local, assinatura_style))
    
    story.append(Spacer(1, 30))
    
    fiscal_nome = dados_relatorio.get('fiscal', '')
    portaria = dados_relatorio.get('portaria', '')
    
    story.append(Paragraph("_" * 50, assinatura_style))
    story.append(Paragraph(fiscal_nome, assinatura_style))
    story.append(Paragraph("FISCAL DE CONTRATOS", assinatura_style))
    story.append(Paragraph(f"{portaria.capitalize()}", assinatura_style))

    doc.build(story)
    buffer.seek(0)
    pdf_data = buffer.getvalue()
    buffer.close()
    return pdf_data
