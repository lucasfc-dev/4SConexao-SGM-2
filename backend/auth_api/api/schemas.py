from pydantic import BaseModel,EmailStr,field_serializer,field_validator
from uuid import UUID
from datetime import datetime
from typing import List,Optional
import base64
import re

class LoginSchema(BaseModel):
    username:str
    password:str

class EstabelecimentoConfigSchema(BaseModel):
    """Validado schema para configurações de estabelecimento"""
    url_site: Optional[str] = None
    numero_inicial_fiscalizacao_por_orgao: Optional[dict[str, int]] = None
    
    # DOEM
    data_lei: Optional[str] = None
    dia: Optional[str] = None
    mes: Optional[str] = None
    ano: Optional[str] = None
    
    # Ouvidoria
    logo_relatorio_esic: Optional[str] = None
    endereco: Optional[str] = None
    telefone: Optional[str] = None
    
    # PDF Service
    cargo: Optional[str] = None
    ano_romano: Optional[str] = None
    num_lei: Optional[str] = None
    tipo: Optional[str] = None

    @field_validator('numero_inicial_fiscalizacao_por_orgao')
    @classmethod
    def validate_numero_inicial_fiscalizacao_por_orgao(cls, value):
        if value is None:
            return value

        validated: dict[str, int] = {}
        for orgao_id, numero_inicial in value.items():
            try:
                UUID(str(orgao_id))
            except ValueError as exc:
                raise ValueError(f"ID de órgão inválido em numero_inicial_fiscalizacao_por_orgao: {orgao_id}") from exc

            if int(numero_inicial) < 1:
                raise ValueError(
                    f"Número inicial para o órgão {orgao_id} deve ser maior ou igual a 1"
                )
            validated[str(orgao_id)] = int(numero_inicial)

        return validated
    
    model_config = {
        "from_attributes": True
    }

class EstabelecimentoIn(BaseModel):
    nome:str
    cidade:str
    responsavel:str

class EstabelecimentoOut(BaseModel):
    id:UUID
    nome:str
    pacote_id:UUID
    cidade:str
    responsavel:str
    numero:int
    config:dict
    model_config = {
        "from_attributes": True
    }

class UpdatedEstabelecimento(BaseModel):
    nome:Optional[str] = None
    icone:Optional[bytes] = None
    cidade:Optional[str] = None
    responsavel:Optional[str] = None
    certificado:Optional[bytes] = None
    senha_cert:Optional[str] = None
    config:Optional[EstabelecimentoConfigSchema] = None
    
    model_config = {
        "from_attributes": True
    }

class UserIn(BaseModel):
    username:str
    email:EmailStr
    password:str
    nome:Optional[str]=None
    cpf:Optional[str]=None
    cargo:str
    is_admin:Optional[bool]=False
    orgaos_ids:Optional[List[UUID]] = []
    funcionalidades_ids:Optional[List[int]] = None
    estabelecimento:Optional[UUID] = None
    @field_validator("password")
    def validate_password(cls, value):
        if len(value) < 6:
            raise ValueError("A senha dever ter pelo menos 6 caracteres")
        if not any(char.isdigit() for char in value):
            raise ValueError("A senha deve conter pelo menos um número.")
        if not any(char.isalpha() for char in value):
            raise ValueError("A senha deve conter pelo menos uma letra.")
        if not any(char in "!@#.$%^&*()-_+=" for char in value):
            raise ValueError("A senha deve conter pelo menos um caractere especial (!@#$%^&*()-_+=).")
        return value

    @field_validator('cpf')
    def validade_cpf(cls,value):
        if not validate_cpf(value):
            return ValueError("CPF inválido.")
        return value




class ServerEstabelecimentoOut(BaseModel):
    id: UUID
    nome: str
    pacote_id: UUID
    icone: Optional[bytes] = None
    cidade: str
    responsavel: str
    numero: int
    certificado: Optional[bytes] = None
    senha_cert: Optional[str] = None
    config:dict

    @field_serializer('icone')
    def encode_icone(self, value):
        if value is not None:
            return base64.b64encode(value).decode('utf-8')
        return None
    @field_serializer('certificado')
    def encode_cert(self, value):
        if value is not None:
            return base64.b64encode(value).decode('utf-8')
        return None

    model_config = {
        "from_attributes": True
    }

class EstabelecimentoPublicData(BaseModel):
    """Schema para dados públicos do estabelecimento (sem autenticação)"""
    nome: str
    cidade: str
    icone: Optional[str] = None  # base64 encoded
    
    @classmethod
    def to_model(cls, estabelecimento) -> "EstabelecimentoPublicData":
        icone_b64 = None
        if estabelecimento.icone:
            icone_b64 = base64.b64encode(estabelecimento.icone).decode('utf-8')
        return cls(
            nome=estabelecimento.nome,
            cidade=estabelecimento.cidade,
            icone=icone_b64
        )

class FuncionalidadeOut(BaseModel):
    id:int
    nome:str


class OrgaoRefOut(BaseModel):
    """Órgão com referência apenas (sem estabelecimento)"""
    id:UUID
    nome:str
    # cnpj:str
    # endereco:str
    # poder:str
    # is_estabelecimento:Optional[bool]=False
    
    model_config = {
        "from_attributes": True
    }


class UserOut(BaseModel):
    """User com todas as relações encadeadas"""
    id:UUID
    username:str
    email:str
    nome:str
    cpf:str
    cargo:Optional[str]=None
    created_at:datetime
    is_admin:Optional[bool]=False
    is_super:Optional[bool]=False
    estabelecimento:Optional[EstabelecimentoOut] = None
    orgaos:Optional[List[OrgaoRefOut]] = []
    funcionalidades:Optional[List[FuncionalidadeOut]] = []
    
    model_config = {
        "from_attributes": True
    }


class SuperUserOut(BaseModel):
    """SuperUser com dados completos"""
    username:str
    email:str
    is_admin:Optional[bool]=False
    is_super:Optional[bool]=True
    created_at:datetime

class ServerUserOut(BaseModel):
    id:UUID
    username:str
    email:str
    created_at:datetime
    nome:str
    cpf:str
    cargo:Optional[str]=None
    is_admin:Optional[bool]=False
    is_super:Optional[bool]=False
    estabelecimento:Optional[ServerEstabelecimentoOut] = None
    orgaos:Optional[List[OrgaoRefOut]] = []
    funcionalidades:Optional[List[FuncionalidadeOut]] = []

    model_config = {
        "from_attributes": True
    }

class EstabelecimentoWithUsers(BaseModel):
    estabelecimento: EstabelecimentoOut
    users: List[UserOut]

    model_config = {
        "from_attributes": True
    }

class UptadedUser(BaseModel):
    username:Optional[str] = None
    email:Optional[str] = None
    nome:Optional[str] = None
    cpf:Optional[str] = None
    cargo:Optional[str] = None

class TokenData(BaseModel):
    username:str | None = None    

class RefreshToken(BaseModel):
    refresh_token: str


class PacoteIn(BaseModel):
    nome:Optional[str]
    func_ids:List[int]

class PacoteOut(BaseModel):
    id:UUID
    nome:str
    created_at:datetime
    funcionalidades:List[FuncionalidadeOut]

class FuncIds(BaseModel):
    func_ids:List[int]

class OrgaoIn(BaseModel):
    nome:str
    cnpj:str
    endereco:str
    poder:str
    is_estabelecimento:Optional[bool]=False
    estabelecimento_id:UUID

class OrgaoOut(BaseModel):
    id:UUID
    nome:str
    cnpj:str
    endereco:str
    poder:str
    is_estabelecimento:Optional[bool]=False
    estabelecimento:EstabelecimentoOut

class UpdatedOrgao(BaseModel):
    nome:Optional[str] = None
    cnpj:Optional[str] = None
    endereco:Optional[str] = None
    is_estabelecimento:Optional[bool]=None

class TokenResetIn(BaseModel):
    token_id:UUID

class EmailIn(BaseModel):
    email_address: EmailStr

class EmailOut(BaseModel):
    email: EmailStr
    subject:str
    keys:dict

class PassWordIn(BaseModel):
    password:str
    @field_validator("password")
    def validate_password(cls, value):
        if len(value) < 6:
            raise ValueError("A senha dever ter pelo menos 6 caracteres")
        if not any(char.isdigit() for char in value):
            raise ValueError("A senha deve conter pelo menos um número.")
        if not any(char.isalpha() for char in value):
            raise ValueError("A senha deve conter pelo menos uma letra.")
        if not any(char in "!@#.$%^&*()-_+=" for char in value):
            raise ValueError("A senha deve conter pelo menos um caractere especial (!.@#$%^&*()-_+=).")
        return value
def validate_cpf(cpf: str) -> bool:
    # Remove caracteres não numéricos
    cpf = re.sub(r'\D', '', cpf)
    
    # Verifica se tem 11 dígitos
    if len(cpf) != 11:
        return False
    
    # Verifica se todos os dígitos são iguais (ex.: 111.111.111-11)
    if cpf == cpf[0] * 11:
        return False

    # Calcula o primeiro dígito verificador
    def calculate_digit(cpf, multiplier):
        total = sum(int(cpf[i]) * (multiplier - i) for i in range(multiplier - 1))
        rest = (total * 10) % 11
        return rest if rest < 10 else 0

    if int(cpf[9]) != calculate_digit(cpf, 10):
        return False

    # Calcula o segundo dígito verificador
    if int(cpf[10]) != calculate_digit(cpf, 11):
        return False

    return True
