from tortoise import Model,fields
from datetime import datetime
import uuid

class Chamado(Model):
    id = fields.UUIDField(primary_key=True,default=uuid.uuid4)
    num_protocolo = fields.CharField(max_length=20)
    tipo_abertura = fields.CharField(max_length=50)
    tipo_resposta = fields.CharField(max_length=50,null=True)
    assunto = fields.CharField(max_length=100)
    descricao = fields.TextField()
    identificacao = fields.OneToOneField('models.Identificacao',null=True)
    status_classificacao = fields.CharField(max_length=50,null=True)
    tipo_classificacao = fields.CharField(max_length=50,null=True)
    status = fields.CharField(max_length=30)
    estabelecimento = fields.UUIDField()
    created_at = fields.DatetimeField(auto_now_add=True)
    
    class Meta:
        indexes = [
            ("estabelecimento", "created_at"),
            ("estabelecimento", "num_protocolo"),
        ]

    def to_dict(self):
        return {
            "id": str(self.id),
            "num_protocolo": self.num_protocolo,
            "tipo_abertura": self.tipo_abertura,
            "tipo_resposta": self.tipo_resposta,
            "assunto": self.assunto,
            "descricao": self.descricao,
            "status_classificacao": self.status_classificacao,
            "tipo_classificacao": self.tipo_classificacao,
            "identificacao": self.identificacao.to_dict() if self.identificacao else None,
            "status": self.status,
            "estabelecimento": str(self.estabelecimento),
            "data_envio": self.created_at.date(),
            "created_at": self.created_at
        }

class Identificacao(Model):
    id = fields.UUIDField(primary_key=True,default=uuid.uuid4)
    nome = fields.CharField(max_length=100)
    cpf = fields.CharField(max_length=11)
    email = fields.CharField(max_length=100)
    data_nasc = fields.DateField(null=True)
    sexo = fields.CharField(max_length=1,null=True)
    escolaridade = fields.CharField(max_length=100,null=True)
    telefone = fields.CharField(max_length=15,null=True)

    def to_dict(self):
        return {
            "id": str(self.id),
            "nome": self.nome,
            "cpf": self.cpf,
            "email": self.email,
            "data_nasc": self.data_nasc.isoformat() if self.data_nasc else None,
            "sexo": self.sexo,
            "escolaridade": self.escolaridade,
            "telefone": self.telefone
        }
    
class Documento(Model):
    id = fields.UUIDField(primary_key=True,default=uuid.uuid4)
    filename = fields.CharField(max_length=255,null=True)
    tipo = fields.CharField(max_length=50)
    arquivo = fields.BinaryField()
    chamado = fields.ForeignKeyField('models.Chamado',related_name='documentos',null=True)
    retorno_chamado = fields.ForeignKeyField('models.RetornoChamado',related_name='documentos',null=True)

    def to_dict(self):
        return {
            "id": str(self.id),
            "filename": self.filename,
            "tipo": self.tipo,
            "chamado_id": str(self.chamado_id) if self.chamado else None,
            "retorno_chamado_id": str(self.retorno_chamado_id) if self.retorno_chamado else None
        }
    
class RetornoChamado(Model):
    id = fields.UUIDField(primary_key=True,default=uuid.uuid4)
    chamado = fields.ForeignKeyField('models.Chamado',related_name='retornos')
    mensagem = fields.TextField()
    created_at = fields.DatetimeField(auto_now_add=True)

    def to_dict(self):
        return {
            "id": str(self.id),
            "chamado_id": str(self.chamado_id) if self.chamado else None,
            "mensagem": self.mensagem,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
    
class RelatorioEsic(Model):
    id = fields.UUIDField(primary_key=True,default=uuid.uuid4)
    titulo = fields.CharField(max_length=200,null=True)
    data_inicio = fields.DateField()
    data_fim = fields.DateField()
    gerado_em = fields.DateField(default=datetime.now)
    pdf_bytes = fields.BinaryField()
    tipo_relatorio = fields.CharField(max_length=50)
    estabelecimento = fields.UUIDField()

    def to_dict(self):
        return {
            "id": str(self.id),
            "titulo": self.titulo,
            "estabelecimento": str(self.estabelecimento),
            "data_inicio": self.data_inicio.isoformat() if self.data_inicio else None,
            "data_fim": self.data_fim.isoformat() if self.data_fim else None,
            "gerado_em": self.gerado_em.isoformat() if self.gerado_em else None,
            "tipo_relatorio": self.tipo_relatorio
        }