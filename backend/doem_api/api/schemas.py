from pydantic import BaseModel,EmailStr,field_serializer,field_validator
from datetime import datetime,date
from uuid import UUID
from typing import Optional,Union,List
import base64
from api.config import AUTH_API_URL

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
    
    @field_validator("icone",mode='before')
    def decode_icone(cls, value):
        if isinstance(value, str):
            return base64.b64decode(value)
        return value
    @field_validator("certificado",mode='after')
    def decode_cert(cls, value):
        if isinstance(value, str):
            return base64.b64decode(value)
        return value

class UserIn(BaseModel):
    username:str
    email:str
    password:str

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
    orgaos:Optional[list[OrgaoRefOut]] = []
    funcionalidades:Optional[list[FuncionalidadeOut]] = []
    
    model_config = {
        "from_attributes": True
    }

class OrgaoOut(BaseModel):
    id:UUID
    nome:str
    cnpj:str
    endereco:str
    poder:str
    estabelecimento:EstabelecimentoOut


class LoginSchema(BaseModel):
    username:str
    password:str

class DiarioIn(BaseModel):
    document_ids: List[UUID]
    date: date

class DocumentOut(BaseModel):
    id: UUID
    titulo:str
    filename:str
    tipo:str
    sender:UUID
    orgao:UUID
    uploaded_at:datetime
    force_scan:bool = False

class UpdatedDiario(BaseModel):
    document_ids: List[UUID]

prioridade = {
    'lei':1, 
    'decreto':2,
    'contrato':3, 
    'edital':4,
    'portaria':5,
    'extrato':6, 
    'ato':7,
    'aviso':8,
    'termo':9,
    'resolucao':10,
    'imagem':11  # Adicionado tipo 'imagem' com baixa prioridade (final do diário)
}

class ServerDocumentOut(BaseModel):
    id: UUID
    titulo:str
    filename:str
    tipo:str
    data:Optional[str]=None
    sender:UUID
    orgao:Union[UUID,OrgaoOut]
    uploaded_at:date
    force_scan:bool = False

    def __lt__(self, other):
        prioridade_self = prioridade.get(self.tipo.lower(), float('inf'))
        prioridade_other = prioridade.get(other.tipo.lower(), float('inf'))
        return prioridade_self < prioridade_other
    
    @classmethod
    def from_orm(cls, model,orgao:OrgaoOut):
        return cls(
            id=model.id,
            titulo=model.titulo,
            filename=model.filename,
            tipo=model.tipo,
            data=base64.b64encode(model.data).decode('utf-8') if model.data else None,
            sender=model.sender,
            orgao=orgao,
            uploaded_at=model.uploaded_at,
            force_scan=model.force_scan
        )

class DiarioOut(BaseModel):
    id: UUID
    titulo:str
    created_at:datetime
    published_at:Optional[date] = None
    is_published:bool
    signed:bool
    estabelecimento:UUID
    
class TokenData(BaseModel):
    username:str | None = None

class RefreshToken(BaseModel):
    refresh_token: str

class EmailIn(BaseModel):
    email_address: Union[EmailStr,List[EmailStr]]

class AttachmentSchema(BaseModel):
    file:bytes
    filename:str
    
    @field_serializer('file')
    def serialize_file(self, value):
        return base64.b64encode(value).decode('utf-8')


class EmailOut(BaseModel):
    email:Union[EmailStr,List[EmailStr]]
    subject:str
    keys:dict
    attachment:Optional[AttachmentSchema] = None
