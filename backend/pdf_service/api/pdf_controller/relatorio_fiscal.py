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
from typing import List, Union
from api.schemas import LicitacaoOut, DispensaOut, ContratoOut

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


def create_pdf(processos_licitatorios:Union[List[LicitacaoOut], List[DispensaOut],List[ContratoOut]], context:dict=None):
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
    titulo = context.get("titulo", "Relatorio Municipal de Procedimentos Licitatórios") if context else "Relatorio Municipal de Procedimentos Licitatórios"
    story.append(Paragraph(f'<b>{titulo}</b>', styles['Title']))
    story.append(Spacer(1, 12))
    story.append(NextPageTemplate('NoHeader'))

    centralized_style = ParagraphStyle(name="CenteredBodyText", alignment=TA_CENTER)
    left_aligned_style = ParagraphStyle(name="LeftAlignedBodyText", alignment=TA_LEFT)
    # Estilo com indentação para texto alinhado à esquerda
    indented_left_style = ParagraphStyle(
        name="IndentedLeftBodyText", 
        alignment=TA_LEFT,
        leftIndent=20,  # Indenta 20 pontos da margem esquerda
        firstLineIndent=0,  # Primeira linha sem indentação extra
        spaceAfter=0,    # Sem espaço após o parágrafo
        spaceBefore=0,   # Sem espaço antes do parágrafo
        leading=10  
    )
    header_style = ParagraphStyle(name="HeaderText", alignment=TA_CENTER, fontSize=8, textColor=colors.white)

    tipo = context.get('tipo')
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
    for i, processo_licitatorio in enumerate(processos_licitatorios):
        if tipo == 'contrato':
            fiscal_contrato = processo_licitatorio.fiscal_contrato.pessoa.nome if getattr(processo_licitatorio.fiscal_contrato.pessoa,'nome') else processo_licitatorio.fiscal_contrato.pessoa.razao_social
            
            # Determinar modalidade/tipo dispensa
            modalidade_tipo = ""
            if hasattr(processo_licitatorio, 'licitacao') and processo_licitatorio.licitacao and processo_licitatorio.licitacao.num_processo:
                modalidade_tipo = processo_licitatorio.modalidade.nome if processo_licitatorio.modalidade else ""
            elif hasattr(processo_licitatorio, 'dispensa') and hasattr(processo_licitatorio.dispensa, 'tipo_dispensa'):
                modalidade_tipo = processo_licitatorio.dispensa.tipo_dispensa
            else:
                modalidade_tipo = processo_licitatorio.modalidade.nome if processo_licitatorio.modalidade else ""
            
            # Determinar número do processo (licitação ou dispensa)
            num_processo = ""
            orgao = ""
            if hasattr(processo_licitatorio, 'licitacao') and processo_licitatorio.licitacao and processo_licitatorio.licitacao.num_processo:
                num_processo = str(processo_licitatorio.licitacao.num_processo)
                orgao = processo_licitatorio.licitacao.orgao.nome
            elif hasattr(processo_licitatorio, 'dispensa') and hasattr(processo_licitatorio.dispensa, 'num_processo'):
                num_processo = str(processo_licitatorio.dispensa.num_processo)
                orgao = processo_licitatorio.dispensa.orgao.nome
            
            table_data.append([
                Paragraph(processo_licitatorio.num_contrato, centralized_style),
                Paragraph(modalidade_tipo, centralized_style),
                Paragraph(num_processo, centralized_style),
                Paragraph(str(processo_licitatorio.data_inicio), centralized_style),
                Paragraph(str(orgao), centralized_style),
                Paragraph(processo_licitatorio.fornecedor.razao_social, centralized_style),
                Paragraph(f"R$ {processo_licitatorio.valor_estimado:.2f}", centralized_style),
                Paragraph(fiscal_contrato, centralized_style),
                Paragraph(processo_licitatorio.situacao, centralized_style),
                Paragraph(processo_licitatorio.finalidade, centralized_style),
                Paragraph(truncar_texto(processo_licitatorio.objeto), indented_left_style)
            ])
        else:
            tipo_modalidade = processo_licitatorio.modalidade.nome if tipo == 'licitacao' else processo_licitatorio.tipo_dispensa
            formated_julg_date = processo_licitatorio.julg_date.strftime('%d/%m/%Y') if processo_licitatorio.julg_date else 'Não Julgado'
            formated_pub_date = processo_licitatorio.pub_date.strftime('%d/%m/%Y') if processo_licitatorio.pub_date else 'Não Publicado'

            table_data.append([
                Paragraph(processo_licitatorio.num_processo, centralized_style),
                Paragraph(str(processo_licitatorio.orgao.nome), centralized_style),
                Paragraph(tipo_modalidade, centralized_style),
                Paragraph(processo_licitatorio.situacao, centralized_style),
                Paragraph(formated_pub_date, centralized_style),
                Paragraph(formated_julg_date, centralized_style),
                Paragraph(truncar_texto(processo_licitatorio.objeto), left_aligned_style)
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

def create_relatorio_contrato(dados_relatorio:dict={}):
    buffer = BytesIO()
    width, height = A4
    margin = 2 * cm
    top_reserved = 6 * cm  # Aumentado o espaço reservado para o header (era 2cm)
    largura_util = width - 2 * margin

    doc = BaseDocTemplate(buffer, pagesize=(width, height))
    
    # Frame principal para o conteúdo - ajustado para não sobrepor o header
    frame = Frame(margin, margin, largura_util, height - top_reserved - margin, id='normal')
    
    def draw_header_relatorio(canvas, doc):
        canvas.saveState()
        
        # Posição do header - mais próximo do topo da página
        x = margin
        y = height  # Posicionado mais próximo ao topo
        
        # Adiciona o ícone no canto superior esquerdo
        icone_bytes = dados_relatorio.get('icone_bytes')
        if icone_bytes:
            icon_stream = BytesIO(icone_bytes)
            icon_stream.seek(0)
            logo = ImageReader(icon_stream)
            canvas.drawImage(logo, x=x, y=y-5*cm, width=6*cm, height=5*cm, preserveAspectRatio=True, mask='auto')
        
        # Informações da secretaria - ajustadas para ficarem ao lado do logo
        orgao:dict = dados_relatorio.get('orgao', {})
        canvas.setFont("Helvetica-Bold", 12)
        canvas.drawString(x + 8*cm, y-1*cm, orgao.get('nome', ''))
        
        canvas.setFont("Helvetica", 10)
        canvas.drawString(x + 8*cm, y-1.5*cm, orgao.get('endereco', ''))
        canvas.drawString(x + 8*cm, y-2*cm, dados_relatorio.get('cidade', ''))
        
        canvas.restoreState()
    
    # Template da página com header
    page_template = PageTemplate(
        id='RelatorioContrato',
        frames=[frame],
        onPage=draw_header_relatorio
    )
    doc.addPageTemplates([page_template])

    # Estilos
    styles = getSampleStyleSheet()
    
    # Estilo para título centralizado
    titulo_style = ParagraphStyle(
        name="TituloRelatorio",
        parent=styles['Heading1'],
        alignment=TA_CENTER,
        fontSize=14,
        fontName='Helvetica-Bold',
        spaceAfter=12,
        spaceBefore=0
    )
    
    # Estilo para subtítulo centralizado
    subtitulo_style = ParagraphStyle(
        name="SubtituloRelatorio",
        parent=styles['Heading2'],
        alignment=TA_CENTER,
        fontSize=12,
        fontName='Helvetica-Bold',
        spaceAfter=15,
        spaceBefore=5
    )
    
    # Estilo para texto normal
    texto_style = ParagraphStyle(
        name="TextoRelatorio",
        parent=styles['Normal'],
        alignment=TA_LEFT,
        fontSize=10,
        fontName='Helvetica',
        spaceAfter=8,
        leading=12
    )
    
    # Estilo para texto em negrito
    texto_bold_style = ParagraphStyle(
        name="TextoBoldRelatorio",
        parent=styles['Normal'],
        alignment=TA_CENTER,
        fontSize=10,
        fontName='Helvetica-Bold',
        spaceAfter=8,
        leading=12
    )
    
    # Estilo para assinatura centralizada
    assinatura_style = ParagraphStyle(
        name="AssinaturaRelatorio",
        parent=styles['Normal'],
        alignment=TA_CENTER,
        fontSize=10,
        fontName='Helvetica',
        spaceAfter=6,
    )

    # Construindo o conteúdo do relatório
    story = []
    
    # Título principal
    story.append(Paragraph("RELATÓRIO DE FISCALIZAÇÃO MENSAL COM PRESTAÇÃO DE SERVIÇO", titulo_style))
    story.append(Paragraph("EXECUÇÃO REGULAR", subtitulo_style))
    
    # Informações do relatório

    story.append(Paragraph(f"<b>Número do relatório:</b> {dados_relatorio.get('numero_relatorio', '144/2025')}", texto_style))
    story.append(Paragraph(f"<b>Número do contrato:</b> {dados_relatorio.get('num_contrato')}", texto_style))
    story.append(Paragraph(f"<b>Objeto ou serviço contratado:</b> {dados_relatorio.get('objeto')}", texto_style))
    story.append(Paragraph(f"<b>Contratado:</b> {dados_relatorio.get('contratado')} - CNPJ: {dados_relatorio.get('cnpj_contratado')}", texto_style))
    story.append(Paragraph(f"<b>Competência:</b> {dados_relatorio.get('competencia')}", texto_style))
    story.append(Paragraph(f"<b>Valor:</b> R$ {dados_relatorio.get('valor')} ({dados_relatorio.get('valor_extenso')})", texto_style))
    story.append(Paragraph(f"<b>Vigência Contratual:</b> {dados_relatorio.get('vigencia')}", texto_style))
    story.append(Paragraph(f"<b>Fiscal de Contratos:</b> {dados_relatorio.get('fiscal')} – {dados_relatorio.get('portaria')}", texto_style))
    story.append(Paragraph(f"<b>Fundamentação Legal:</b> {dados_relatorio.get('fundamento_legal')}", texto_style))
    story.append(Paragraph(f"<b>Constatações:</b> {dados_relatorio.get('constatacoes')}", texto_style))
    story.append(Paragraph(f"<b>Conclusão:</b> {dados_relatorio.get('conclusao')}", texto_style))
    
    story.append(Spacer(1, 15))
      
    story.append(Spacer(1, 30))
    
    # Data e local
    data_local = dados_relatorio.get('data_local','')
    story.append(Paragraph(data_local, assinatura_style))
    
    story.append(Spacer(1, 30))
    
    # Assinatura
    fiscal_nome = dados_relatorio.get('fiscal','')
    portaria = dados_relatorio.get('portaria','')
    
    story.append(Paragraph("_" * 50, assinatura_style))
    story.append(Paragraph(fiscal_nome, assinatura_style))
    story.append(Paragraph("FISCAL DE CONTRATOS", assinatura_style))
    story.append(Paragraph(f"{portaria.capitalize()}", assinatura_style))

    # Construir o PDF
    doc.build(story)
    buffer.seek(0)
    pdf_data = buffer.getvalue()
    buffer.close()
    return pdf_data