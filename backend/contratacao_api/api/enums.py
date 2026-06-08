from enum import Enum


class TipoCertificado(str, Enum):
    CONTRATO = "contrato"
    LICITACAO = "licitacao"
    DISPENSA = "dispensa"


class LicitacaoSituacaoEnum(str, Enum):
    ABERTA = "aberta"
    JULGADA = "julgada"
    ADJUDICADA = "adjudicada"
    HOMOLOGADA = "homologada"
    DESERTA = "deserta"
    FRACASSADA = "fracassada"
    POSTERGADA = "postergada"
    REVOGADA = "revogada"
    CANCELADA = "cancelada"
    ANULADA = "anulada"
    SUSPENSA = "suspensa"
    AGUARDANDO_FASE_RECURSAL = "aguardando_fase_recursal"
    SESSAO_INICIADA = "sessao_iniciada"
    SESSAO_ENCERRADA = "sessao_encerrada"
    EM_ANDAMENTO = "em_andamento"


class DispensaSituacaoEnum(str, Enum):
    ABERTA = "aberta"
    JULGADA = "julgada"
    ADJUDICADA = "adjudicada"
    HOMOLOGADA = "homologada"
    DESERTA = "deserta"
    FRACASSADA = "fracassada"
    POSTERGADA = "postergada"
    REVOGADA = "revogada"
    CANCELADA = "cancelada"
    ANULADA = "anulada"
    SUSPENSA = "suspensa"
    AGUARDANDO_FASE_RECURSAL = "aguardando_fase_recursal"
    SESSAO_INICIADA = "sessao_iniciada"
    SESSAO_ENCERRADA = "sessao_encerrada"
    EM_ANDAMENTO = "em_andamento"
