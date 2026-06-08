from enum import Enum
from decimal import Decimal

from tortoise.models import Model
from tortoise import fields
import uuid


# ============================================================
# ENUMS
# ============================================================

class CategoriaPublicacao(str, Enum):
    estoque_medicamentos = "estoque_medicamentos"
    horarios_profissionais_saude = "horarios_profissionais_saude"
    lista_espera_regulacao = "lista_espera_regulacao"
    lista_espera_creches = "lista_espera_creches"
    lista_estagiarios = "lista_estagiarios"
    lista_terceirizados = "lista_terceirizados"
    objetivos_estrategicos = "objetivos_estrategicos"
    plano_educacao = "plano_educacao"
    plano_saude = "plano_saude"
    relatorio_gestao = "relatorio_gestao"
    licitantes_sancionados = "licitantes_sancionados"
    politica_nacional_abfc = "politica_nacional_abfc"
    lei_paulo_gustavo = "lei_paulo_gustavo"
    tabela_valores_diarias = "tabela_valores_diarias"
    lista_inscritos_divida_ativa = "lista_inscritos_divida_ativa"


class CategoriaDocumentoNumerado(str, Enum):
    acordos_firmados = "acordos_firmados"
    incentivos_culturais = "incentivos_culturais"
    documentos_meio_ambiente = "documentos_meio_ambiente"
    plano_anual_contratacao = "plano_anual_contratacao"
    conselho_saude = "conselho_saude"
    conselho_educacao = "conselho_educacao"
    conselho_assistencia_social = "conselho_assistencia_social"
    cota_parlamentar = "cota_parlamentar"


class TipoProcessoConcurso(str, Enum):
    concurso_publico = "concurso_publico"
    selecao_publica = "selecao_publica"


class SituacaoObra(str, Enum):
    em_andamento = "em_andamento"
    paralisada = "paralisada"
    concluida = "concluida"
    cancelada = "cancelada"
    nao_iniciada = "nao_iniciada"


class SituacaoConcurso(str, Enum):
    previsto = "previsto"
    aberto = "aberto"
    em_andamento = "em_andamento"
    homologado = "homologado"
    encerrado = "encerrado"
    cancelado = "cancelado"
    suspenso = "suspenso"


# ============================================================
# HIERARQUIA DE BASES ABSTRATAS
# ============================================================
# BaseTransparencia          → id, estabelecimento, timestamps
#   └─ BaseDocumento         → + data_publicacao, arquivo
#       └─ BaseDocTitulado   → + titulo, descricao
# ============================================================


class BaseTransparencia(Model):
    id = fields.UUIDField(primary_key=True, default=uuid.uuid4)
    estabelecimento = fields.UUIDField(index=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        abstract = True

    def to_dict(self):
        return {
            "id": self.id,
            "estabelecimento": self.estabelecimento,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }


class BaseDocumento(BaseTransparencia):
    data_publicacao = fields.DateField(null=True)
    arquivo = fields.BinaryField(null=True)

    class Meta:
        abstract = True
        ordering = ["-data_publicacao"]

    def to_dict(self):
        base = super().to_dict()
        base.update({
            "data_publicacao": self.data_publicacao,
        })
        return base


class BaseDocTitulado(BaseDocumento):
    titulo = fields.CharField(max_length=255, null=True)
    descricao = fields.TextField(null=True, blank=True)

    class Meta:
        abstract = True
        ordering = ["-data_publicacao"]

    def to_dict(self):
        base = super().to_dict()
        base.update({
            "titulo": self.titulo,
            "descricao": self.descricao,
        })
        return base


# ============================================================
# 1. PUBLICAÇÃO SIMPLES (tabela única com categoria)
# ============================================================

class PublicacaoSimples(BaseDocTitulado):
    categoria = fields.CharEnumField(enum_type=CategoriaPublicacao, max_length=50, index=True)

    class Meta:
        table = "publicacao_simples"
        ordering = ["-data_publicacao"]

    def to_dict(self):
        base = super().to_dict()
        base["categoria"] = self.categoria
        return base


# ============================================================
# 2. DOCUMENTO NUMERADO (tabela única com categoria)
# ============================================================

class DocumentoNumerado(BaseDocTitulado):
    categoria = fields.CharEnumField(enum_type=CategoriaDocumentoNumerado, max_length=50, index=True)
    num_doc = fields.CharField(max_length=50, null=True)

    class Meta:
        table = "documento_numerado"
        ordering = ["-data_publicacao"]

    def to_dict(self):
        base = super().to_dict()
        base.update({
            "categoria": self.categoria,
            "num_doc": self.num_doc,
            "ano": self.data_publicacao.year if self.data_publicacao else None,
        })
        return base


# ============================================================
# 3. APRECIAÇÃO DAS CONTAS PELO TRIBUNAL DE CONTAS
# ============================================================

class ApreciacaoContas(BaseTransparencia):
    data_registro = fields.DateField(null=True)
    data_resultado = fields.DateField(null=True)
    modalidade = fields.CharField(max_length=100, null=True)
    status = fields.CharField(max_length=100, null=True)
    nome = fields.CharField(max_length=255, null=True)
    descricao = fields.TextField(null=True, blank=True)
    arquivo = fields.BinaryField(null=True)

    class Meta:
        table = "apreciacao_contas"
        ordering = ["-data_registro"]

    def to_dict(self):
        base = super().to_dict()
        base.update({
            "data_registro": self.data_registro,
            "data_resultado": self.data_resultado,
            "modalidade": self.modalidade,
            "status": self.status,
            "nome": self.nome,
            "descricao": self.descricao,
        })
        return base


# ============================================================
# 4. CONCURSO PÚBLICO E SELEÇÕES PÚBLICAS
# ============================================================

class ConcursoPublico(BaseDocumento):
    tipo_processo = fields.CharEnumField(enum_type=TipoProcessoConcurso, max_length=50, null=True)
    numero_edital = fields.CharField(max_length=50, null=True)
    data_inicio_inscricoes = fields.DateField(null=True)
    data_homologacao = fields.DateField(null=True)
    data_validade = fields.DateField(null=True)
    veiculo_publicacao = fields.CharField(max_length=255, null=True, blank=True)
    situacao = fields.CharEnumField(enum_type=SituacaoConcurso, max_length=50, null=True)

    class Meta:
        table = "concurso_publico"
        ordering = ["-data_publicacao"]

    def to_dict(self):
        base = super().to_dict()
        base.update({
            "tipo_processo": self.tipo_processo,
            "numero_edital": self.numero_edital,
            "data_inicio_inscricoes": self.data_inicio_inscricoes,
            "data_homologacao": self.data_homologacao,
            "data_validade": self.data_validade,
            "veiculo_publicacao": self.veiculo_publicacao,
            "situacao": self.situacao,
        })
        return base


# ============================================================
# 5. LISTA DE APROVADOS EM CONCURSOS E PROCESSOS SELETIVOS
# ============================================================

class AprovadoConcurso(BaseDocTitulado):
    concurso = fields.ForeignKeyField(
        "models.ConcursoPublico",
        related_name="aprovados",
        on_delete=fields.CASCADE,
        null=True,
    )

    class Meta:
        table = "aprovado_concurso"
        ordering = ["-data_publicacao"]

    def to_dict(self):
        base = super().to_dict()
        base["concurso_id"] = self.concurso_id
        return base


# ============================================================
# 7. EMENDAS PARLAMENTARES
# ============================================================

class EmendaParlamentar(BaseDocumento):
    origem = fields.CharField(max_length=150, null=True)
    forma_repasse = fields.CharField(max_length=150, null=True)
    tipo = fields.CharField(max_length=150, null=True)
    numero = fields.BigIntField(null=True)
    autor = fields.CharField(max_length=255, null=True)
    valor_previsto = fields.DecimalField(max_digits=15, decimal_places=2, null=True, default=Decimal("0.00"))
    valor_repassado = fields.DecimalField(max_digits=15, decimal_places=2, null=True, default=Decimal("0.00"))
    ano_referencia = fields.IntField(null=True)
    objeto = fields.TextField(null=True)
    beneficiario = fields.CharField(max_length=255, null=True)
    funcao_governo = fields.CharField(max_length=255, null=True)

    class Meta:
        table = "emenda_parlamentar"
        ordering = ["-data_publicacao"]

    def to_dict(self):
        base = super().to_dict()
        base.update({
            "origem": self.origem,
            "forma_repasse": self.forma_repasse,
            "tipo": self.tipo,
            "numero": self.numero,
            "autor": self.autor,
            "valor_previsto": float(self.valor_previsto) if self.valor_previsto is not None else None,
            "valor_repassado": float(self.valor_repassado) if self.valor_repassado is not None else None,
            "ano_referencia": self.ano_referencia,
            "objeto": self.objeto,
            "beneficiario": self.beneficiario,
            "funcao_governo": self.funcao_governo,
        })
        return base


# ============================================================
# 8. LISTA DE MEDICAMENTOS FORNECIDOS PELO SUS
# ============================================================

class MedicamentoSUS(BaseTransparencia):
    nome_unidade = fields.CharField(max_length=255, null=True)
    endereco = fields.CharField(max_length=200, null=True)
    telefone = fields.CharField(max_length=30, null=True)
    arquivo = fields.BinaryField(null=True)

    class Meta:
        table = "medicamento_sus"
        ordering = ["nome_unidade"]

    def to_dict(self):
        base = super().to_dict()
        base.update({
            "nome_unidade": self.nome_unidade,
            "endereco": self.endereco,
            "telefone": self.telefone,
        })
        return base


# ============================================================
# 9. JULGAMENTO DAS CONTAS DO CHEFE DO EXECUTIVO PELO LEGISLATIVO
# ============================================================

class JulgamentoContasExecutivo(BaseDocumento):
    numero = fields.CharField(max_length=50, null=True)
    ano_processo = fields.IntField(null=True)
    status = fields.CharField(max_length=100, null=True)
    data_resultado = fields.DateField(null=True)

    class Meta:
        table = "julgamento_contas_executivo"
        ordering = ["-data_publicacao"]

    def to_dict(self):
        base = super().to_dict()
        base.update({
            "numero": self.numero,
            "ano_processo": self.ano_processo,
            "status": self.status,
            "data_resultado": self.data_resultado,
        })
        return base


# ============================================================
# 10. RENÚNCIAS FISCAIS
# ============================================================

class RenunciaFiscal(BaseDocumento):
    tipo_receita = fields.CharField(max_length=255, null=True)
    tipo_renuncia = fields.CharField(max_length=255, null=True)

    class Meta:
        table = "renuncia_fiscal"
        ordering = ["-data_publicacao"]

    def to_dict(self):
        base = super().to_dict()
        base.update({
            "ano": self.data_publicacao.year if self.data_publicacao else None,
            "tipo_receita": self.tipo_receita,
            "tipo_renuncia": self.tipo_renuncia,
        })
        return base


class ObrasParalisadas(BaseTransparencia):
    titulo = fields.CharField(max_length=255, null=True)
    objeto_obra = fields.TextField(null=True)
    data_paralisacao = fields.DateField(null=True)
    data_previsao_retorno = fields.DateField(null=True)
    responsavel = fields.CharField(max_length=255, null=True)
    justificativa = fields.TextField(null=True)
    arquivo = fields.BinaryField(null=True)

    class Meta:
        table = "obras_paralisadas"
        ordering = ["-data_paralisacao"]

    def to_dict(self):
        base = super().to_dict()
        base.update({
            "titulo": self.titulo,
            "objeto_obra": self.objeto_obra,
            "data_paralisacao": self.data_paralisacao,
            "data_previsao_retorno": self.data_previsao_retorno,
            "responsavel": self.responsavel,
            "justificativa": self.justificativa,
        })
        return base


# ============================================================
# TRANSFERÊNCIAS RECEBIDAS / REALIZADAS CONVÊNIOS
# ============================================================

class BaseConvenio(BaseTransparencia):
    numero_convenio = fields.CharField(max_length=50, null=True)
    ano_convenio = fields.IntField(null=True)
    objeto = fields.TextField(null=True)
    valor_total = fields.DecimalField(max_digits=15, decimal_places=2, null=True, default=Decimal("0.00"))
    valor_repassado = fields.DecimalField(max_digits=15, decimal_places=2, null=True, default=Decimal("0.00"))
    data_inicio_vigencia = fields.DateField(null=True)
    data_fim_vigencia = fields.DateField(null=True)
    arquivo = fields.BinaryField(null=True)

    class Meta:
        abstract = True

    def to_dict(self):
        base = super().to_dict()
        base.update({
            "numero_convenio": self.numero_convenio,
            "ano_convenio": self.ano_convenio,
            "objeto": self.objeto,
            "valor_total": float(self.valor_total) if self.valor_total is not None else None,
            "valor_repassado": float(self.valor_repassado) if self.valor_repassado is not None else None,
            "data_inicio_vigencia": self.data_inicio_vigencia,
            "data_fim_vigencia": self.data_fim_vigencia,
        })
        return base


class TransferenciaRecebidaConvenio(BaseConvenio):
    orgao_repassador = fields.CharField(max_length=255, null=True)

    class Meta:
        table = "transferencia_recebida_convenio"
        ordering = ["-ano_convenio"]

    def to_dict(self):
        base = super().to_dict()
        base["orgao_repassador"] = self.orgao_repassador
        return base


class TransferenciaRealizadaConvenio(BaseConvenio):
    beneficiario = fields.CharField(max_length=255, null=True)

    class Meta:
        table = "transferencia_realizada_convenio"
        ordering = ["-ano_convenio"]

    def to_dict(self):
        base = super().to_dict()
        base["beneficiario"] = self.beneficiario
        return base


# ============================================================
# OBRAS (10.1)
# ============================================================

class Obra(BaseTransparencia):
    objeto = fields.TextField(null=True)
    situacao = fields.CharEnumField(enum_type=SituacaoObra, max_length=20, null=True)
    data_inicio = fields.DateField(null=True)
    data_conclusao = fields.DateField(null=True)
    empresa_contratada = fields.CharField(max_length=255, null=True)
    percentual_concluido = fields.DecimalField(max_digits=5, decimal_places=2, null=True, default=Decimal("0.00"))
    arquivo = fields.BinaryField(null=True)

    class Meta:
        table = "obra"
        ordering = ["-data_inicio"]

    def to_dict(self):
        base = super().to_dict()
        base.update({
            "objeto": self.objeto,
            "situacao": self.situacao,
            "data_inicio": self.data_inicio,
            "data_conclusao": self.data_conclusao,
            "empresa_contratada": self.empresa_contratada,
            "percentual_concluido": float(self.percentual_concluido) if self.percentual_concluido is not None else None,
        })
        return base
