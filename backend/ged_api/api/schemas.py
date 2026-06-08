from typing import List, Optional,Union
from pydantic import BaseModel,field_validator
from uuid import UUID
from datetime import datetime,date

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

class UserOut(BaseModel):
    """Importado de auth_api - User simplificado"""
    id:UUID
    username:str
    email:str
    nome:Optional[str] = None
    cpf:Optional[str] = None
    is_admin:bool
    is_super:bool
    created_at:datetime
    estabelecimento:Optional[EstabelecimentoOut] = None
    orgaos:Optional[List[OrgaoRefOut]] = []
    funcionalidades:Optional[List[FuncionalidadeOut]] = []
    
    model_config = {
        "from_attributes": True
    }

class TipoIn(BaseModel):
    nome:str
    descricao:str

class TipoOut(BaseModel):
    id:UUID
    nome:str
    descricao:str
    estabelecimento:UUID
    created_at:datetime

class UpdatedTipo(BaseModel):
    nome:Optional[str] = None
    descricao:Optional[str] = None

class VereadorOut(BaseModel):
    id:UUID
    nome:str
    nome_campanha:str
    partido:Optional[str] = None
    email:Optional[str] = None
    telefone:Optional[str] = None
    biografia:Optional[str] = None
    endereco:Optional[str] = None
    fim_mandato:Optional[date] = None
    inicio_mandato:Optional[date] = None
    estabelecimento:UUID
    created_at:datetime

class UpdatedVereador(BaseModel):
    nome:Optional[str] = None
    nome_campanha:Optional[str] = None
    partido:Optional[str] = None
    email:Optional[str] = None
    telefone:Optional[str] = None
    biografia:Optional[str] = None
    endereco:Optional[str] = None
    inicio_mandato:Optional[date] = None
    fim_mandato:Optional[date] = None

class DocumentOut(BaseModel):
    id:UUID
    titulo:str
    descricao:str
    tipo:Union[TipoOut,UUID,None] = None
    situacao:str
    orgao:UUID
    vereador:Union[VereadorOut,UUID,None] = None
    estabelecimento:UUID
    pub_date:date
    created_at:datetime

class UpdatedDocument(BaseModel):
    titulo:Optional[str] = None
    descricao:Optional[str] = None
    tipo:Optional[UUID] = None
    situacao:Optional[str] = None
    orgao:Optional[UUID] = None
    vereador:Optional[UUID] = None
    pub_date:Optional[date] = None
    data:Optional[bytes] = None
    created_at:Optional[datetime] = None

    model_config = {
        "from_attributes": True
    }

class DocQuery(BaseModel):
    tipo:Optional[UUID] = None
    tipo__nome: Optional[str] = None
    pub_date__gte:Optional[date] = None
    pub_date__lte:Optional[date] = None
    titulo__icontains:Optional[str] = None
    descricao__icontains:Optional[str] = None
    orgao:Optional[UUID] = None
    situacao:Optional[str] = None
    vereador:Optional[UUID] = None

class RelatorioOut(BaseModel):
    id:UUID
    titulo:str
    estabelecimento:UUID
    created_at:datetime

class DocModelOut(BaseModel):
    id:UUID
    tipo:str
    descricao:str
    estabelecimento:UUID
    created_at:datetime


from fastapi import Form,File,UploadFile
def parse_update_doc_form(
    titulo: Optional[str] = Form(None),
    descricao: Optional[str] = Form(None),
    tipo_id: Optional[str] = Form(None),
    situacao: Optional[str] = Form(None),
    orgao_id: Optional[str] = Form(None),
    vereador_id: Optional[str] = Form(None),
    pub_date: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
):
    def parse_uuid(value):
        if value in (None, "", "null"):
            return None
        return UUID(value)
    
    return {
        "titulo": titulo,
        "descricao": descricao,
        "tipo_id": parse_uuid(tipo_id),
        "situacao": situacao,
        "orgao_id": parse_uuid(orgao_id),
        "vereador_id": parse_uuid(vereador_id),
        "pub_date": pub_date,
        "file": file,
    }
