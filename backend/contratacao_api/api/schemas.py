from datetime import datetime,date,timedelta
from typing import Optional,Union,List
from pydantic import BaseModel
from uuid import UUID
from api.enums import LicitacaoSituacaoEnum, DispensaSituacaoEnum, TipoCertificado

class EstabelecimentoOut(BaseModel):
    id:UUID
    icone:Optional[bytes]=None
    pacote_id:UUID
    cidade:str
    responsavel:str
    numero:int
    nome:str
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
    created_at:datetime
    nome:Optional[str] = None
    cpf:Optional[str] = None
    cargo:Optional[str] = None
    is_admin:bool
    is_super:bool
    estabelecimento:Optional[EstabelecimentoOut] = None
    orgaos:Optional[List[OrgaoRefOut]] = [] 
    funcionalidades:Optional[List[FuncionalidadeOut]] = []
    
    model_config = {
        "from_attributes": True
    }

class OrgaoOut(BaseModel):
    id:UUID
    nome:str
    cnpj:str
    endereco:str
    poder:str

class ModalidadeIn(BaseModel):
    nome: str
    observacao: str
    
class ModalidadeOut(BaseModel):
    id: UUID
    nome: str
    observacao: str
    estabelecimento: UUID 
    created_at: datetime

class UpdatedModalidade(BaseModel):
    nome: Optional[str] = None
    observacao: Optional[str] = None 


class PessoaBase(BaseModel):
    pessoa_id: UUID    
    email: str
    telefone: str
    endereco: str
    complemento: str
    estado: str
    cidade: str
    cep: str
    bairro: str
    created_at:datetime

class PessoaBaseIn(BaseModel):
    email: str
    telefone: str
    endereco: str
    complemento: str
    estado: str
    cidade: str
    cep: str
    bairro: str

class PessoaFisicaIn(PessoaBaseIn):
    nome: str
    cpf: str
    genero: str
    matricula: Optional[str] = None
    data_nascimento: date
    rg: Optional[str] = None
    orgao_expedidor: Optional[str] = None
    titulo_eleitor: Optional[str] = None
    cargo: str

class PessoaJuridicaIn(PessoaBaseIn):
    razao_social: str
    cnpj: str
    nome_fantasia: Optional[str] = None
    data_fundacao: date
    telefone_comercial: Optional[str] = None

class PessoaFisicaOut(PessoaBase):
    id: UUID
    nome: str
    cpf: str
    genero: str
    matricula: Optional[str] = None
    data_nascimento: date
    rg: Optional[str] = None
    orgao_expedidor: Optional[str] = None
    titulo_eleitor: Optional[str] = None
    cargo: str
    tipo: str = "fisica"
    created_at: datetime

class PessoaJuridicaOut(PessoaBase):
    id: UUID
    razao_social: str
    cnpj: str
    nome_fantasia: Optional[str] = None
    data_fundacao: date
    telefone_comercial: Optional[str] = None
    tipo:str = "juridica"
    created_at: datetime

class PessoaFisicaOutSimple(BaseModel):
    id: UUID
    pessoa_id: UUID
    nome: str
    cpf: str
    genero: str
    matricula: Optional[str] = None
    data_nascimento: date
    rg: Optional[str] = None
    orgao_expedidor: Optional[str] = None
    titulo_eleitor: Optional[str] = None
    cargo: str
    tipo: str = "fisica"
    created_at: datetime

class PessoaJuridicaOutSimple(BaseModel):
    id: UUID
    pessoa_id: UUID
    razao_social: str
    cnpj: str
    nome_fantasia: Optional[str] = None
    data_fundacao: date
    telefone_comercial: Optional[str] = None
    tipo:str = "juridica"
    created_at: datetime

class UpdatedPessoaFisica(BaseModel):
    email: Optional[str] = None
    telefone: Optional[str] = None
    endereco: Optional[str] = None
    complemento: Optional[str] = None
    estado: Optional[str] = None
    cidade: Optional[str] = None
    cep: Optional[str] = None
    bairro: Optional[str] = None
    nome: Optional[str] = None
    cpf: Optional[str] = None
    genero: Optional[str] = None
    matricula: Optional[str] = None
    data_nascimento: Optional[date] = None
    rg: Optional[str] = None
    orgao_expedidor: Optional[str] = None
    titulo_eleitor: Optional[str] = None
    cargo: Optional[str] = None

class UpdatedPessoaJuridica(BaseModel):
    email: Optional[str] = None
    telefone: Optional[str] = None
    endereco: Optional[str] = None
    complemento: Optional[str] = None
    estado: Optional[str] = None
    cidade: Optional[str] = None
    cep: Optional[str] = None
    bairro: Optional[str] = None
    razao_social: Optional[str] = None
    cnpj: Optional[str] = None
    nome_fantasia: Optional[str] = None
    data_fundacao: Optional[date] = None
    telefone_comercial: Optional[str] = None

class SecaoIn(BaseModel):
    orgao: UUID
    nome: str
    responsavel: UUID

class SecaoOut(BaseModel):
    id: UUID
    orgao: Union[UUID,OrgaoOut]
    nome: str
    responsavel: Union[UUID, PessoaFisicaOut, PessoaJuridicaOut]
    created_at: datetime
    estabelecimento: UUID       
    
class UpdatedSecao(BaseModel):
    orgao: Optional[UUID] = None
    nome: Optional[str] = None
    responsavel: Optional[UUID] = None

class LicitacaoIn(BaseModel):
    orgao:UUID
    modalidade:UUID
    secao:UUID
    regime_execucao:str
    natureza_procedimento:str
    situacao:LicitacaoSituacaoEnum
    valor_estimado:float
    valor_vencedor:float
    pub_date:date
    homolog_date:Optional[date] = None
    julg_date:Optional[date] = None
    num_processo:str
    objeto:str
    fundamento_legal:Optional[str] = None

class LicitacaoOut(BaseModel):
    id: UUID
    orgao: Union[UUID,OrgaoOut]
    modalidade: Union[UUID,ModalidadeOut] 
    secao: Union[UUID,SecaoOut]
    regime_execucao:str
    natureza_procedimento:str 
    situacao:str
    valor_estimado:float
    valor_vencedor:float
    pub_date:date
    homolog_date:Optional[date] = None
    julg_date:Optional[date] = None
    num_processo:str
    objeto:str
    fundamento_legal:Optional[str] = None
    created_at:datetime
    estabelecimento:UUID
    certificado_publicacao: Optional["CertificadoPublicacaoOut"] = None

class UpdatedLicitacao(BaseModel):
    orgao: Optional[UUID] = None
    modalidade: Optional[UUID] = None
    secao: Optional[UUID] = None
    regime_execucao: Optional[str] = None
    natureza_procedimento: Optional[str] = None
    situacao: Optional[LicitacaoSituacaoEnum] = None
    valor_estimado: Optional[float] = None
    valor_vencedor: Optional[float] = None
    pub_date: Optional[date] = None
    homolog_date: Optional[date] = None
    julg_date: Optional[date] = None
    num_processo: Optional[str] = None
    objeto: Optional[str] = None
    fundamento_legal: Optional[str] = None

class DispensaIn(BaseModel):
    tipo_dispensa:str
    pub_date:date   
    homolog_date:Optional[date] = None
    julg_date:Optional[date] = None
    orgao:UUID
    num_processo:str
    secao:UUID
    natureza_objeto:str
    regime_execucao:str
    situacao:DispensaSituacaoEnum
    valor_estimado:float
    valor_vencedor:float
    objeto:str
    fundamento_legal:Optional[str] = None

class DispensaOut(BaseModel):
    id:UUID
    tipo_dispensa:str
    pub_date:date
    homolog_date:Optional[date] = None
    julg_date:Optional[date] = None
    orgao:Union[UUID, OrgaoOut]
    num_processo:str
    secao:Union[UUID, SecaoOut]
    natureza_objeto:str
    regime_execucao:str
    situacao:str
    valor_estimado:float
    valor_vencedor:float
    objeto:str
    fundamento_legal:Optional[str] = None
    estabelecimento:UUID
    created_at:datetime
    certificado_publicacao: Optional["CertificadoPublicacaoOut"] = None

class UpdatedDispensa(BaseModel):
    tipo_dispensa:Optional[str] = None
    pub_date:Optional[date] = None
    homolog_date:Optional[date] = None
    julg_date:Optional[date] = None
    orgao:Optional[UUID] = None
    num_processo:Optional[str] = None
    secao:Optional[UUID] = None
    natureza_objeto:Optional[str] = None
    regime_execucao:Optional[str] = None
    situacao:Optional[DispensaSituacaoEnum] = None
    valor_estimado:Optional[float] = None
    valor_vencedor:Optional[float] = None
    objeto:Optional[str] = None
    fundamento_legal:Optional[str] = None

class DocumentoOut(BaseModel):
    id:UUID
    titulo:str
    licitacao:Optional[Union[UUID,LicitacaoOut,None]] = None
    dispensa:Optional[Union[UUID,DispensaOut,None]] = None
    created_at:date
    updated_at:date


from fastapi import Form,File,UploadFile
class DocumentoIn(BaseModel):
    target_type: str
    target_id: UUID
    files: List[UploadFile]

    @classmethod
    def documento_form(
        cls,
        target_type: str = Form(...),
        target_id: UUID = Form(...),
        files: List[UploadFile] = File(...)
    ):
        return cls(
            target_type=target_type,
            target_id=target_id,
            files=files
        )

class EditalLicitacaoIn(BaseModel):
    numero_edital:str
    data_publicacao:date
    numero_publicacao:str
    orgao:UUID
    veiculo_publicacao:str
    secao:UUID
    descricao:str
    valor_estimado:float

class EditalLicitacaoOut(BaseModel):
    id: UUID
    numero_edital: str
    data_publicacao: date
    numero_publicacao: str
    orgao: Union[UUID,OrgaoOut]
    veiculo_publicacao: str
    secao: Union[UUID,SecaoOut]
    descricao: str
    valor_estimado: float
    created_at: datetime
    estabelecimento: UUID

class UpdatedEdital(BaseModel):
    numero_edital:Optional[str] = None
    data_publicacao:Optional[date] = None
    numero_publicacao:Optional[str] = None
    orgao:Optional[UUID] = None
    veiculo_publicacao:Optional[str] = None
    secao:Optional[UUID] = None
    descricao:Optional[str] = None
    valor_estimado:Optional[float] = None 

class ComissaoLicitacaoIn(BaseModel):
    vigencia_inicio:date
    vigencia_fim:date
    tipo_comissao:str 
    tipo_ato:str 
    data_ato:date 
    numero_ato:str    
    finalidade:str

class ComissaoLicitacaoOut(BaseModel):
    id: UUID
    vigencia_inicio: date
    vigencia_fim: date
    tipo_comissao: str
    tipo_ato: str
    data_ato: date
    numero_ato: str
    finalidade: str
    created_at: datetime
    estabelecimento: UUID

class UpdatedComissao(BaseModel):
    vigencia_inicio:Optional[date] = None
    vigencia_fim:Optional[date] = None
    tipo_comissao:Optional[str] = None
    tipo_ato:Optional[str] = None
    data_ato:Optional[date] = None
    numero_ato:Optional[str] = None
    finalidade:Optional[str] = None

class MembroComissaoIn(BaseModel):
    comissao:UUID
    pessoa:UUID
    atribuicao:str
    cargo:str
    ato_pessoal:Optional[str] = None
    natureza_cargo:Optional[str] = None
    vigencia_inicial:date
    vigencia_final:Optional[date] = None

class MembroComissaoOut(BaseModel):
    id: UUID
    comissao: Union[UUID, ComissaoLicitacaoOut]
    pessoa: Union[UUID, PessoaFisicaOut, PessoaJuridicaOut]
    atribuicao: str
    cargo: str
    natureza_cargo: Optional[str] = None
    ato_pessoal: Optional[str] = None
    vigencia_inicial: date
    vigencia_final: Optional[date] = None
    created_at: datetime
    estabelecimento: UUID

class UpdatedMembroComissao(BaseModel):
    comissao: Optional[UUID] = None
    pessoa: Optional[UUID] = None
    orgao: Optional[UUID] = None
    atribuicao: Optional[str] = None
    cargo: Optional[str] = None
    ato_pessoal: Optional[str] = None
    natureza_cargo: Optional[str] = None
    vigencia_inicial: Optional[date] = None
    vigencia_final: Optional[date] = None

class VigenciaSimpleOut(BaseModel):
    id: UUID
    data_inicio: date
    data_fim: Optional[date] = None
    estabelecimento: UUID
    created_at: datetime

class FiscalContratoIn(BaseModel):
    pessoa: UUID
    orgao: UUID

class FiscalContratoOut(BaseModel):
    id: UUID
    pessoa: Union[UUID, PessoaFisicaOut, PessoaJuridicaOut]
    orgao: Union[UUID, OrgaoOut]
    vigencias: Optional[List[VigenciaSimpleOut]] = None
    estabelecimento: UUID
    created_at: datetime

class UpdatedFiscalContrato(BaseModel):
    pessoa: Optional[UUID] = None
    orgao: Optional[UUID] = None

class VigenciaIn(BaseModel):
    fiscal: UUID
    data_inicio: date
    data_fim: Optional[date] = None

class VigenciaOut(BaseModel):
    id: UUID
    fiscal: Union[UUID, FiscalContratoOut]
    data_inicio: date
    data_fim: Optional[date] = None
    estabelecimento: UUID
    created_at: datetime

class UpdatedVigencia(BaseModel):
    data_inicio: Optional[date] = None
    data_fim: Optional[date] = None

class ContratoIn(BaseModel):
    num_contrato: str
    modalidade: UUID
    secao: UUID
    valor_estimado: float
    tipo: str
    situacao: str
    descricao: str
    pub_date: date
    data_inicio: date
    data_vencimento: date
    prazo_entrega: int
    finalidade: str
    licitacao: Optional[UUID] = None
    dispensa: Optional[UUID] = None
    fornecedor: UUID
    vigencia: UUID
    portaria: Optional[UUID] = None
    objeto: str

class CertificadoPublicacaoOut(BaseModel):
    id: UUID
    pub_date: date
    tipo: TipoCertificado

    
class ContratoOut(BaseModel):
    id: UUID
    num_contrato: Optional[str] = None
    published_by: Optional[UUID] = None
    modalidade: Union[UUID, ModalidadeOut]
    secao: Union[UUID, SecaoOut]
    valor_estimado: Optional[float] = None
    tipo: Optional[str] = None
    situacao: Optional[str] = None
    descricao: Optional[str] = None
    pub_date: Optional[date] = None
    data_inicio: Optional[date] = None
    data_vencimento: Optional[date] = None
    prazo_entrega: Optional[int] = None
    finalidade: Optional[str] = None
    licitacao: Union[UUID, LicitacaoOut, None] = None
    dispensa: Union[UUID, DispensaOut, None] = None
    fornecedor: Union[UUID, PessoaJuridicaOut, None] = None
    vigencia: Union[UUID, VigenciaOut, None] = None
    portaria: Optional[UUID] = None
    objeto: Optional[str] = None
    created_at: datetime
    estabelecimento: UUID
    certificado_publicacao: Optional[CertificadoPublicacaoOut] = None


class UpdatedContrato(BaseModel):
    num_contrato: Optional[str] = None
    modalidade: Optional[UUID] = None
    secao: Optional[UUID] = None
    valor_estimado: Optional[float] = None
    tipo: Optional[str] = None
    situacao: Optional[str] = None
    descricao: Optional[str] = None
    pub_date: Optional[date] = None
    data_inicio: Optional[date] = None
    data_vencimento: Optional[date] = None
    prazo_entrega: Optional[int] = None
    finalidade: Optional[str] = None
    licitacao: Optional[UUID] = None
    dispensa: Optional[UUID] = None
    fornecedor: Optional[UUID] = None
    vigencia: Optional[UUID] = None
    portaria: Optional[UUID] = None
    objeto: Optional[str] = None

class QueryLicitacao(BaseModel):
    objeto__icontains: Optional[str] = None
    num_processo__icontains: Optional[str] = None
    modalidade: Optional[UUID] = None
    orgao: Optional[UUID] = None
    pub_date__gte: Optional[date] = None
    pub_date__lte: Optional[date] = None
    homolog_date__gte: Optional[date] = None
    homolog_date__lte: Optional[date] = None
    julg_date__gte: Optional[date] = None
    julg_date__lte: Optional[date] = None
    situacao: Optional[str] = None
    fornecedor: Optional[UUID] = None

class QueryDispensa(BaseModel):
    objeto__icontains: Optional[str] = None
    num_processo__icontains: Optional[str] = None
    tipo: Optional[str] = None
    orgao: Optional[UUID] = None
    pub_date__gte: Optional[date] = None
    pub_date__lte: Optional[date] = None
    homolog_date__gte: Optional[date] = None
    homolog_date__lte: Optional[date] = None
    julg_date__gte: Optional[date] = None
    julg_date__lte: Optional[date] = None
    tipo_dispensa: Optional[str] = None
    situacao: Optional[str] = None
    natureza_objeto: Optional[str] = None
    

class QueryContrato(BaseModel):
    licitacao: Optional[UUID] = None
    dispensa: Optional[UUID] = None
    tipo: Optional[str] = None
    vigencia__fiscal__pessoa: Optional[UUID] = None
    vigencia__fiscal: Optional[UUID] = None
    modalidade: Optional[UUID] = None
    secao__orgao: Optional[UUID] = None
    pub_date__gte: Optional[date] = None
    pub_date__lte: Optional[date] = None
    data_inicio__gte: Optional[date] = None
    data_inicio__lte: Optional[date] = None
    data_vencimento__gte: Optional[date] = None
    data_vencimento__lte: Optional[date] = None
    situacao: Optional[str] = None
    fornecedor: Optional[UUID] = None
    objeto__icontains: Optional[str] = None
    num_contrato__icontains: Optional[str] = None

# Schemas para Relatórios de Fiscalização de Contrato
class RelatorioFiscalizacaoContratoIn(BaseModel):
    contrato_id: UUID
    competencia: str
    fundamento_legal: str
    constatacoes: str
    conclusao: str


class CertificadoPublicacaoContratoIn(BaseModel):
    contrato_id: UUID
    nome: str
    cargo: Optional[str] = None


class RelatorioFiscalizacaoContratoOut(BaseModel):
    id: UUID
    numero: str
    contrato: Union[UUID, ContratoOut]
    pub_date: date
    estabelecimento: UUID
    created_at: datetime

class UpdatedRelatorioFiscalizacaoContrato(BaseModel):
    competencia: Optional[str] = None
    fundamento_legal: Optional[str] = None
    constatacoes: Optional[str] = None
    conclusao: Optional[str] = None

class QueryRelatorioFiscalizacaoContrato(BaseModel):
    numero__icontains: Optional[str] = None
    contrato__num_contrato__icontains: Optional[str] = None
    pub_date__gte: Optional[date] = None
    pub_date__lte: Optional[date] = None
    created_at__gte: Optional[date] = None
    created_at__lte: Optional[date] = None