from tortoise.models import Model
from tortoise import fields
import uuid
from datetime import datetime,date,timezone

class Document(Model):
    id = fields.UUIDField(primary_key=True)
    titulo = fields.CharField(max_length=150)
    descricao = fields.TextField()
    tipo = fields.ForeignKeyField('models.Tipo')
    data = fields.BinaryField()
    situacao = fields.CharField(max_length=50)
    orgao = fields.UUIDField()
    vereador = fields.ForeignKeyField('models.Vereador',null=True,related_name='documentos_vereador',default=None)
    estabelecimento = fields.UUIDField()
    pub_date = fields.DateField(default=date.today) 
    created_at = fields.DatetimeField(default=datetime.now(timezone.utc))
    
    class Meta:
        indexes = [
            ("estabelecimento", "pub_date"),  # Índice composto para queries comuns
            ("estabelecimento", "created_at"),  # Índice composto para listagens
        ]

class DocModel(Model):
    id = fields.UUIDField(primary_key=True)
    tipo = fields.CharField(max_length=150)
    data = fields.BinaryField()
    descricao = fields.TextField()
    estabelecimento = fields.UUIDField()
    created_at = fields.DatetimeField(default=datetime.now(timezone.utc))

class Relatorio(Model):
    id = fields.UUIDField(primary_key=True)
    titulo = fields.CharField(max_length=150)
    data = fields.BinaryField(null=True,default=None)
    documents = fields.ManyToManyField('models.Document')
    estabelecimento = fields.UUIDField()
    created_at = fields.DatetimeField(default=datetime.now(timezone.utc))

class Tipo(Model):
    id = fields.UUIDField(primary_key=True)
    nome = fields.CharField(max_length=150)
    descricao = fields.TextField()
    estabelecimento = fields.UUIDField()
    created_at = fields.DatetimeField(default=datetime.now(timezone.utc))

class Vereador(Model):
    id = fields.UUIDField(primary_key=True,default=uuid.uuid1)
    nome = fields.CharField(max_length=150)
    nome_campanha = fields.CharField(max_length=100)
    partido = fields.CharField(max_length=100,null=True,default=None)
    email = fields.CharField(max_length=150,null=True,default=None)
    telefone = fields.CharField(max_length=15,null=True,default=None)
    biografia = fields.TextField(null=True,default=None)
    endereco = fields.CharField(max_length=255,null=True,default=None)
    foto = fields.BinaryField(null=True,default=None)
    inicio_mandato = fields.DateField(null=True,default=None)
    fim_mandato = fields.DateField(null=True,default=None)
    estabelecimento = fields.UUIDField()
    created_at = fields.DatetimeField(default=datetime.now(timezone.utc))

class Assinatura(Model):
    id = fields.UUIDField(primary_key=True)
    doc = fields.ForeignKeyField('models.Document')
    created_at = fields.DatetimeField(default=datetime.now(timezone.utc))
    link_ref = fields.CharField(max_length=50)