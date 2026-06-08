from pydantic import BaseModel, field_validator
from typing import List, Optional, Union, Dict, Any
from uuid import UUID
from datetime import date, datetime
import base64


class EstabelecimentoOut(BaseModel):
    id:UUID
    nome:str
    pacote_id:UUID
    cidade:str
    responsavel:str
    numero:int
    certificado:Optional[bytes]=None
    senha_cert: Optional[str]=None
    config:dict={}

class FuncionalidadeOut(BaseModel):
    id:int
    nome:str

class OrgaoRefOut(BaseModel):
    """Órgão com referência apenas (sem estabelecimento)"""
    id:UUID
    nome:str

    model_config = {
        "from_attributes": True
    }

class UserOut(BaseModel):
    """Importado de auth_api - User simplificado com relações"""
    id:UUID
    username:str
    email:str
    nome:Optional[str] = None
    cpf:Optional[str] = None
    created_at:datetime
    is_super:Optional[bool] = False
    is_admin:bool
    estabelecimento:Optional[EstabelecimentoOut] = None
    orgaos:Optional[list[OrgaoRefOut]] = []
    funcionalidades:Optional[list[FuncionalidadeOut]] = []
    
    model_config = {
        "from_attributes": True
    }

class DocumentPDFDiario(BaseModel):
    """Schema para receber documentos codificados em base64 para geração de PDF"""
    id: UUID
    titulo: str
    filename: str
    tipo: str
    data: str  # base64 encoded content
    sender: UUID
    orgao: UUID
    uploaded_at: datetime
    force_scan: bool = False  # Indica se o PDF deve ser escaneado como imagem
    
    @field_validator('data')
    @classmethod
    def validate_base64_data(cls, v):
        """Valida se o data está em formato base64 válido"""
        try:
            base64.b64decode(v)
            return v
        except Exception:
            raise ValueError('data deve estar em formato base64 válido')
    
    def get_decoded_data(self) -> bytes:
        """Retorna o conteúdo decodificado do documento"""
        return base64.b64decode(self.data)

class DocumentPDFRelatorio(BaseModel):
    titulo:str
    descricao:str
    tipo:str
    situacao:str
    pub_date:date

class PDFRelatorioRequest(BaseModel):
    """Schema para requisição de geração de PDF do relatório"""
    documents: List[DocumentPDFRelatorio]
    estabelecimento_id: Optional[UUID] = None


class PDFRelatorioTransparenciaRequest(BaseModel):
    """Schema para relatório tabular de Transparência (colunas variáveis)."""

    title: str = "Relatório"
    rows: List[Dict[str, Any]]
    columns: Optional[List[str]] = None
    estabelecimento_id: Optional[UUID] = None

class DiarioPDFRequest(BaseModel):
    """Schema para requisição de geração de PDF do diário"""
    documents: List[DocumentPDFDiario]
    data_publicacao_full: str
    data_lei: str
    edicao: int


class DiarioPDFResponse(BaseModel):
    """Schema para resposta da geração de PDF do diário"""
    pdf_data: str  # base64 encoded PDF
    success: bool
    message: Optional[str] = None
    
    @classmethod
    def create_success(cls, pdf_bytes: bytes, message: str = "PDF gerado com sucesso"):
        """Cria uma resposta de sucesso com o PDF codificado em base64"""
        return cls(
            pdf_data=base64.b64encode(pdf_bytes).decode('utf-8'),
            success=True,
            message=message
        )
    
    @classmethod
    def create_error(cls, message: str):
        """Cria uma resposta de erro"""
        return cls(
            pdf_data="",
            success=False,
            message=message
        )


class OrgaoForPDF(BaseModel):
    """Schema para dados do órgão necessários para o PDF"""
    id: UUID
    nome: str
    cnpj: str
    endereco: str
    poder: str
    is_estabelecimento: bool

class DocumentProcessed(BaseModel):
    """Schema para documentos processados internamente no PDF service"""
    id: UUID
    titulo: str
    filename: str
    tipo: str
    data: bytes  # Dados decodificados do documento
    sender: UUID
    orgao: OrgaoForPDF
    uploaded_at: datetime
    force_scan: bool = False  # Indica se o PDF deve ser escaneado como imagem
    
    # Dicionário de prioridades para ordenação
    _PRIORIDADES = {
        'lei': 1,
        'decreto': 2,
        'contrato': 3,
        'edital': 4,
        'portaria': 5,
        'extrato': 6,
        'ato': 7,
        'aviso': 8,
        'termo': 9,
        'resolucao': 10,
        'imagem': 11
    }
    
    class Config:
        # Permite tipos arbitrários como bytes
        arbitrary_types_allowed = True
    
    def _get_prioridade(self) -> float:
        """Retorna a prioridade numérica do documento baseada no tipo"""
        try:
            tipo_lower = self.tipo.lower() if self.tipo else 'desconhecido'
            return self._PRIORIDADES.get(tipo_lower, float('inf'))
        except Exception:
            return float('inf')
    
    def __lt__(self, other: "DocumentProcessed") -> bool:
        """Operador menor que (<) para ordenação"""
        if not isinstance(other, DocumentProcessed):
            return NotImplemented
        return self._get_prioridade() < other._get_prioridade()
    
    def __le__(self, other: "DocumentProcessed") -> bool:
        """Operador menor ou igual (<=) para ordenação"""
        if not isinstance(other, DocumentProcessed):
            return NotImplemented
        return self._get_prioridade() <= other._get_prioridade()
    
    def __gt__(self, other: "DocumentProcessed") -> bool:
        """Operador maior que (>) para ordenação"""
        if not isinstance(other, DocumentProcessed):
            return NotImplemented
        return self._get_prioridade() > other._get_prioridade()
    
    def __ge__(self, other: "DocumentProcessed") -> bool:
        """Operador maior ou igual (>=) para ordenação"""
        if not isinstance(other, DocumentProcessed):
            return NotImplemented
        return self._get_prioridade() >= other._get_prioridade()
    
    def __eq__(self, other: object) -> bool:
        """Operador de igualdade (==) para ordenação"""
        if not isinstance(other, DocumentProcessed):
            return NotImplemented
        return self._get_prioridade() == other._get_prioridade()
    
    @classmethod
    def from_dict(cls, doc_dict: dict, orgao_data: dict) -> "DocumentProcessed":
        """Cria um DocumentProcessed a partir de um dicionário"""
        return cls(
            id=doc_dict['id'],
            titulo=doc_dict['titulo'],
            filename=doc_dict['filename'],
            tipo=doc_dict['tipo'],
            data=doc_dict['data'],
            sender=doc_dict['sender'],
            orgao=OrgaoForPDF(**orgao_data),
            uploaded_at=doc_dict['uploaded_at'],
            force_scan=doc_dict.get('force_scan', False)
        )

class AssinaturaRequest(BaseModel):
    """Schema para receber dados para adicionar assinatura visual ao PDF"""
    pdf_data: str  # PDF em base64
    proprietario: str  # Nome do proprietário do certificado
    dados_assinatura: Dict[str, Any]  # Dados da assinatura (location, reason, contact, signingdate)
    
    @field_validator('pdf_data')
    @classmethod
    def validate_pdf_data(cls, v: str) -> str:
        """Valida se os dados estão em base64"""
        try:
            base64.b64decode(v, validate=True)
            return v
        except Exception:
            raise ValueError('PDF data deve estar em formato base64 válido')
    
    def get_decoded_pdf(self) -> bytes:
        """Decodifica os dados do PDF de base64 para bytes"""
        return base64.b64decode(self.pdf_data)


class AssinaturaCompletaDiarioRequest(BaseModel):
    """Schema para adicionar assinatura visual + QR code ao diário"""
    pdf_data: str  # PDF em base64
    proprietario: str
    dados_assinatura: Dict[str, Any]
    url_qrcode: str

    @field_validator('pdf_data')
    @classmethod
    def validate_pdf_data(cls, v: str) -> str:
        try:
            base64.b64decode(v, validate=True)
            return v
        except Exception:
            raise ValueError('PDF data deve estar em formato base64 válido')

    def get_decoded_pdf(self) -> bytes:
        return base64.b64decode(self.pdf_data)

    
class AssinaturaDocQrcodeRequest(BaseModel):
    """Schema para receber dados para assinar PDF com QR Code"""
    documento: str 
    url_qrcode: str
    proprietario: Optional[str] = None
    dados_assinatura: Optional[Dict[str, Any]] = None
    
    @field_validator('documento')
    @classmethod
    def validate_documento(cls, v: str) -> str:
        """Valida se os dados estão em base64"""
        try:
            base64.b64decode(v, validate=True)
            return v
        except Exception:
            raise ValueError('Documento deve estar em formato base64 válido')
    
    def get_decoded_documento(self) -> bytes:
        """Decodifica os dados do PDF de base64 para bytes"""
        return base64.b64decode(self.documento)


class RelatorioEsic(BaseModel):
    data_i: date
    data_f: date
    endereco:str
    telefone:str

class EstabelecimentoOut(BaseModel):
    id:UUID
    nome:str
    icone:Optional[bytes]=None
    pacote_id:UUID
    cidade:str
    responsavel:str
    numero:int
    certificado:Optional[bytes]=None
    senha_cert: Optional[str]=None
    config:dict={}

    @field_validator("icone", mode='before')
    def decode_icone(cls, value):
        if isinstance(value, str):
            return base64.b64decode(value)
        return value
    
    @field_validator("certificado", mode='after')
    def decode_cert(cls, value):
        if isinstance(value, str):
            return base64.b64decode(value)
        return value


class EstabelecimentoPublicData(BaseModel):
    """Schema para dados públicos do estabelecimento"""
    nome: str
    cidade: str
    icone: Optional[bytes] = None
    
    @field_validator("icone", mode='before')
    def decode_icone(cls, value):
        if isinstance(value, str):
            return base64.b64decode(value)
        return value


class UserOut(BaseModel):
    """Importado de auth_api - User simplificado"""
    id: UUID
    username: str
    email: str
    nome: Optional[str] = None
    cpf: Optional[str] = None
    created_at: datetime
    is_admin: bool
    is_super: bool
    estabelecimento: Optional[EstabelecimentoOut] = None
    
    model_config = {
        "from_attributes": True
    }

