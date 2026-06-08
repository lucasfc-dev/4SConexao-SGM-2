from pydantic import BaseModel
from typing import Optional
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
    nome:Optional[str]=None
    cpf:Optional[str]=None
    created_at:datetime
    is_super:Optional[bool]=False
    is_admin:bool
    estabelecimento:Optional[EstabelecimentoOut] = None
    orgaos:Optional[list[OrgaoRefOut]] = []
    funcionalidades:Optional[list[FuncionalidadeOut]] = []
    
    model_config = {
        "from_attributes": True
    }

from typing import TypeVar, Generic
T = TypeVar('T')
class BaseResponse(BaseModel,Generic[T]):
    data: Optional[T] = None
    meta: Optional[dict] = None


# ============================================================
# EMENDA PARLAMENTAR
# ============================================================

class EmendaParlamentarOut(BaseModel):
    id: UUID
    estabelecimento: UUID
    data_publicacao: date
    descricao: Optional[str] = None
    origem: str
    forma_repasse: str
    tipo: str
    numero: int
    autor: str
    valor_previsto: float
    valor_repassado: float
    ano_referencia: int
    objeto: str
    beneficiario: str
    funcao_governo: str
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }


class EmendaParlamentarCreate(BaseModel):
    data_publicacao: date
    objeto: Optional[str] = None
    origem: str
    forma_repasse: str
    tipo: str
    numero: int
    autor: str
    valor_previsto: float
    valor_repassado: float
    ano_referencia: int
    beneficiario: str
    funcao_governo: str


class EmendaParlamentarUpdate(BaseModel):
    data_publicacao: Optional[date] = None
    descricao: Optional[str] = None
    origem: Optional[str] = None
    forma_repasse: Optional[str] = None
    tipo: Optional[str] = None
    numero: Optional[int] = None
    autor: Optional[str] = None
    valor_previsto: Optional[float] = None
    valor_repassado: Optional[float] = None
    ano_referencia: Optional[int] = None
    objeto: Optional[str] = None
    beneficiario: Optional[str] = None
    funcao_governo: Optional[str] = None
