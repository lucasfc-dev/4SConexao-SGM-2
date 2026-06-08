from pydantic import BaseModel,EmailStr,field_serializer,field_validator
from typing import Optional,List,Union,Literal
import base64
from uuid import UUID
from datetime import date, datetime
from enum import Enum

class EstabelecimentoOut(BaseModel):
    id:UUID
    icone:Optional[bytes]=None
    pacote_id:UUID
    cidade:str
    responsavel:str
    nome:str
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
    """Importado de auth_api - User simplificado"""
    id:UUID
    username:str
    email:str
    created_at:datetime
    nome:Optional[str] = None
    cpf:Optional[str] = None
    is_admin:bool
    is_super:bool
    estabelecimento:Optional[EstabelecimentoOut] = None
    orgaos:Optional[List[OrgaoRefOut]] = []
    funcionalidades:Optional[List[FuncionalidadeOut]] = []
    
    model_config = {
        "from_attributes": True
    }

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

class IdentificacaoIn(BaseModel):
    nome: str
    cpf: str
    email:str
    data_nasc: Optional[str] = None
    sexo: Optional[Literal['M','F','O']] = None
    escolaridade: Optional[str] = None
    telefone: Optional[str] = None

class TipoAberturaChamadoEnum(str, Enum):
    INFORMACAO = 'informacao'
    ELOGIO = 'elogio'
    SUGESTAO = 'sugestao'
    RECLAMACAO = 'reclamacao'
    COMUNICACAO = 'comunicacao'
    IRREGULARIDADE = 'irregularidade'
    DENUNCIA = 'denuncia'
    REPRESENTACAO = 'representacao'
    DEMANDA = 'demanda'
    CRITICA = 'critica'

class TipoRespostaChamadoEnum(str, Enum):
    DEFERIDO = 'deferido'
    INDEFERIDO = 'indeferido'

class TipoClassificacaoChamadoEnum(str, Enum):
    ULTRA_SECRETO = 'ultra_secreto'
    SECRETO = 'secreto'
    RESERVADO = 'reservado'

class StatusClassificacaoChamadoEnum(str, Enum):
    NAO_CLASSIFICADO = 'nao_classificado'
    CLASSIFICADO = 'classificado'
    DESCLASSIFICADO = 'desclassificado'

class ChamadoIn(BaseModel):
    assunto:str
    tipo_abertura:TipoAberturaChamadoEnum
    descricao: str
    identificacao: Optional[IdentificacaoIn] = None
    estabelecimento:UUID

class EmailOut(BaseModel):
    email:EmailStr
    subject:str
    keys:dict

class EmailIn(BaseModel):
    email_address: Union[EmailStr,List[EmailStr]]

class AttachmentSchema(BaseModel):
    file:bytes
    filename:str
    
    @field_serializer('file')
    def serialize_file(self, value):
        return base64.b64encode(value).decode('utf-8')
    
class RelatorioEsicRequest(BaseModel):
    data_i: date
    data_f: date