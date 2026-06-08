from tortoise.models import Model
from tortoise import fields

class Document(Model):
    id = fields.UUIDField(primary_key=True)
    titulo = fields.CharField(max_length=80)
    filename = fields.CharField(max_length=100)
    data = fields.BinaryField()
    sender = fields.UUIDField()
    uploaded_at = fields.DatetimeField(auto_now_add=True)
    orgao = fields.UUIDField()
    tipo = fields.CharField(max_length=30)
    force_scan = fields.BooleanField(default=False)
    estabelecimento = fields.UUIDField()
    
    class Meta:
        indexes = [
            ("estabelecimento", "uploaded_at"),
        ]

class DiarioOficial(Model):
    id = fields.UUIDField(primary_key=True)
    titulo = fields.CharField(max_length=80)
    data = fields.BinaryField()
    created_at = fields.DatetimeField(auto_now_add=True)
    published_at = fields.DateField(null=True)
    is_published = fields.BooleanField(default=False)
    signed = fields.BooleanField(default=False)
    estabelecimento = fields.UUIDField()
    documents = fields.ManyToManyField('models.Document',related_name='documentos')
    
    class Meta:
        indexes = [
            ("estabelecimento", "published_at"),
            ("estabelecimento", "created_at"),
        ]

class Assinatura(Model):
    id = fields.UUIDField(primary_key=True)
    diario = fields.ForeignKeyField('models.DiarioOficial', related_name='assinatura')
    meta_data = fields.JSONField()
    created_at = fields.DatetimeField(auto_now_add=True)
    cod_ref = fields.CharField(max_length=50)