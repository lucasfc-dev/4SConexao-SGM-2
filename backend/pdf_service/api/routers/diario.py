from fastapi import Request
from fastapi.routing import APIRouter
from fastapi.responses import StreamingResponse
from api.pdf_controller.diario import create_pdf, adicionar_dados_assinatura_footer, adicionar_assinatura_completa
from api.schemas import DiarioPDFRequest, AssinaturaRequest, AssinaturaCompletaDiarioRequest, DocumentProcessed
from api.exceptions import BadRequestException, InternalServerErrorException
from io import BytesIO

router = APIRouter(prefix="/diario", tags=["diario"])

@router.post("/generate_pdf/")
async def generate_diario_pdf(request: Request, diario_request: DiarioPDFRequest):
    """
    Gera PDF do diário oficial a partir dos documentos e dados fornecidos
    """
    try:        
        # Obtém AuthClient do middleware
        auth_client = request.state.client
        
        # Converte os documentos para objetos DocumentProcessed
        documents = []
        
        # Cache para órgãos já buscados
        orgaos_cache = {}
        
        for i, doc in enumerate(diario_request.documents):
            # Verifica se o documento tem todos os atributos necessários
            if not hasattr(doc, 'tipo') or doc.tipo is None:
                raise BadRequestException(f"Documento {doc.titulo} não possui tipo válido")
            
            # Busca dados do órgão usando o AuthClient
            orgao_id = str(doc.orgao)
            if orgao_id not in orgaos_cache:
                try:
                    orgao_data = await auth_client.estabelecimento.get_orgao(orgao_id)
                    orgaos_cache[orgao_id] = {
                        'id': orgao_data['id'],
                        'nome': orgao_data['nome'],
                        'cnpj': orgao_data['cnpj'],
                        'endereco': orgao_data['endereco'],
                        'poder': orgao_data['poder'],
                        'is_estabelecimento': orgao_data['is_estabelecimento']
                    }
                except Exception as e:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Erro ao buscar dados do órgão com ID {orgao_id}: {str(e)}"
                    )
            
            # Decodifica e valida os dados do documento
            try:
                decoded_data = doc.get_decoded_data()
                if decoded_data is None or len(decoded_data) == 0:
                    raise ValueError(f"Dados decodificados estão vazios")
            except Exception as e:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Erro ao decodificar dados do documento '{doc.titulo}': {str(e)}"
                )
            
            doc_processed = DocumentProcessed(
                id=doc.id,
                titulo=doc.titulo,
                filename=doc.filename,
                tipo=doc.tipo,
                data=decoded_data,
                sender=doc.sender,
                orgao=orgaos_cache[orgao_id],
                uploaded_at=doc.uploaded_at,
                force_scan=doc.force_scan  # Passa o atributo force_scan
            )
            documents.append(doc_processed)
        
        # Não é mais necessário ordenar aqui - a ordenação acontece automaticamente
        # dentro da função create_pdf() usando sorted() que utiliza os métodos __lt__, __gt__, etc.
        # definidos em DocumentProcessed
        
        # Prepara o contexto para geração do PDF
        estabelecimento = auth_client.estabelecimento
        
        context = {
            'cidade': estabelecimento.model.cidade,
            'data-publicacao': diario_request.data_publicacao_full,
            'responsavel': estabelecimento.model.responsavel,
            'cargo': estabelecimento.model.config.get('cargo'),
            'brasao': await estabelecimento.get_icone_bytes(),  # Decodifica base64 para bytes
            'ano_romano': estabelecimento.model.config.get('ano_romano'),
            'data_lei': diario_request.data_lei,
            'num_lei': estabelecimento.model.config.get('num_lei'),
            'tipo': estabelecimento.model.config.get('tipo'),
            'edicao': diario_request.edicao
        }
        
        # Gera o PDF
        pdf_data = create_pdf(documents, context=context)
        
        # Retorna como StreamingResponse
        pdf_stream = BytesIO(pdf_data)
        return StreamingResponse(
            pdf_stream,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=diario_edicao_{diario_request.edicao}.pdf"
            }
        )
        
    except BadRequestException:
        # Re-raise BadRequestExceptions
        raise
    except Exception as e:
        raise InternalServerErrorException(
            f"Erro ao gerar PDF: {str(e)}"
        )


@router.post("/add_signature/")
async def add_signature_to_pdf(assinatura_request: AssinaturaRequest):
    """
    Adiciona assinatura visual (footer) a um PDF já gerado
    """
    try:
        pdf_bytes = assinatura_request.get_decoded_pdf()
        
        pdf_com_assinatura = adicionar_dados_assinatura_footer(
            pdf_bytes, 
            assinatura_request.proprietario, 
            assinatura_request.dados_assinatura
        )
        
        return StreamingResponse(
            BytesIO(pdf_com_assinatura),
            media_type="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=diario_assinado.pdf"
            }
        )
        
    except Exception as e:
        raise InternalServerErrorException(
            f"Erro ao adicionar assinatura: {str(e)}"
        )


@router.post("/add_full_signature/")
async def add_full_signature_to_pdf(request: AssinaturaCompletaDiarioRequest):
    """
    Adiciona assinatura visual (footer) + página final com QR code ao diário
    """
    try:
        pdf_bytes = request.get_decoded_pdf()

        pdf_completo = adicionar_assinatura_completa(
            pdf_bytes,
            request.proprietario,
            request.dados_assinatura,
            request.url_qrcode
        )

        return StreamingResponse(
            BytesIO(pdf_completo),
            media_type="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=diario_assinado.pdf"
            }
        )

    except Exception as e:
        raise InternalServerErrorException(
            f"Erro ao adicionar assinatura completa: {str(e)}"
        )