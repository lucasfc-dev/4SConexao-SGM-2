from tortoise.models import Model
from tortoise import fields
from datetime import datetime
import uuid

class User(Model):
    id = fields.UUIDField(primary_key=True,default=uuid.uuid4)
    username = fields.CharField(max_length=30)
    email = fields.CharField(max_length=100)
    password = fields.CharField(max_length=128)
    nome = fields.CharField(max_length=121,null=True)
    cpf = fields.CharField(max_length=11,null=True)
    cargo = fields.CharField(max_length=85, null=True, default=None)
    estabelecimento = fields.ForeignKeyField('models.Estabelecimento',related_name='users',on_delete=fields.OnDelete.CASCADE,null=True)
    orgaos = fields.ManyToManyField('models.Orgao',related_name='users',through='users_orgaos')
    funcionalidades = fields.ManyToManyField('models.Funcionalidade',related_name='users',through='users_funcionalidades')
    is_admin = fields.BooleanField(default=False,null=True)
    is_super = fields.BooleanField(default=False)
    created_at = fields.DatetimeField(auto_now_add=True)

    def __str__(self):
        return self.username

class Funcionalidade(Model):
    id = fields.IntField(primary_key=True)
    nome = fields.CharField(max_length=100)
    
class Pacote(Model):
    id = fields.UUIDField(primary_key=True,default=uuid.uuid4)
    nome = fields.CharField(max_length=100)
    funcionalidades = fields.ManyToManyField('models.Funcionalidade',related_name='funcionalidades')
    created_at = fields.DatetimeField(auto_now_add=True)

class Estabelecimento(Model):
    id = fields.UUIDField(primary_key=True,default=uuid.uuid4)
    nome = fields.CharField(max_length=80)
    icone = fields.BinaryField(null=True,default=None)
    pacote = fields.OneToOneField('models.Pacote')
    created_at = fields.DatetimeField(auto_now_add=True)
    cidade = fields.CharField(max_length=100)
    responsavel = fields.CharField(max_length=120)
    numero = fields.IntField(default=0)
    certificado = fields.BinaryField(null=True,default=None)
    senha_cert = fields.CharField(max_length=255,null=True,default=None)
    config = fields.JSONField(default={},null=True)

class Orgao(Model):
    id = fields.UUIDField(primary_key=True,default=uuid.uuid4)
    nome = fields.CharField(max_length=80)
    estabelecimento = fields.ForeignKeyField('models.Estabelecimento',related_name='orgaos',on_delete=fields.OnDelete.CASCADE)
    cnpj = fields.CharField(max_length=14)
    endereco = fields.CharField(max_length=150)
    poder = fields.CharField(max_length=60)
    icone = fields.BinaryField(null=True,default=None)
    is_estabelecimento = fields.BooleanField(default=False,null=True)

class TokenReset(Model):
    id = fields.UUIDField(primary_key=True,default=uuid.uuid4)
    created_at = fields.DatetimeField(auto_now_add=True)
    expires_at = fields.DatetimeField(auto_now_add=True)
    user = fields.OneToOneField('models.User')

class ModuloTransparencia(Model):
    id = fields.UUIDField(primary_key=True, default=uuid.uuid4)
    nome = fields.CharField(max_length=255)
    descricao = fields.TextField(null=True)
    created_at = fields.DatetimeField(auto_now_add=True)

    def to_dict(self):
        return {
            "id": str(self.id),
            "nome": self.nome,
            "descricao": self.descricao,
            "created_at": self.created_at
        }

class PacoteTransparencia(Model):
    id = fields.UUIDField(primary_key=True, default=uuid.uuid4)
    estabelecimento = fields.OneToOneField('models.Estabelecimento', related_name='pacote_transparencia', on_delete=fields.CASCADE)
    modulos = fields.ManyToManyField('models.ModuloTransparencia', related_name='pacotes', through='pacote_transparencia_modulo')
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    def to_dict(self):
        return {
            "id": str(self.id),
            "estabelecimento_id": str(self.estabelecimento_id),
            "modulos": [modulo.to_dict() for modulo in self.modulos],
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }