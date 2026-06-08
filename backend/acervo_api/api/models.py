from tortoise.models import Model
from tortoise import fields
from datetime import datetime, timezone


class Folder(Model):
    id = fields.UUIDField(primary_key=True)
    nome = fields.CharField(max_length=255)
    parent = fields.ForeignKeyField(
        'models.Folder',
        null=True,
        default=None,
        related_name='children',
        on_delete=fields.CASCADE,
    )
    estabelecimento = fields.UUIDField()
    is_root = fields.BooleanField(default=False)
    orgao = fields.UUIDField(null=True, default=None)
    owner_user = fields.UUIDField()
    created_at = fields.DatetimeField(default=datetime.now(timezone.utc))

    class Meta:
        unique_together = [("estabelecimento", "parent", "nome")]
        indexes = [
            ("estabelecimento", "parent_id"),
            ("estabelecimento", "is_root"),
        ]


class FileObject(Model):
    id = fields.UUIDField(primary_key=True)
    nome = fields.CharField(max_length=255)
    folder = fields.ForeignKeyField(
        'models.Folder',
        related_name='arquivos',
        on_delete=fields.CASCADE,
    )
    estabelecimento = fields.UUIDField()
    r2_key = fields.CharField(max_length=512)
    content_type = fields.CharField(max_length=150, default='application/octet-stream')
    size_bytes = fields.BigIntField()
    owner_user = fields.UUIDField()
    created_at = fields.DatetimeField(default=datetime.now(timezone.utc))

    class Meta:
        unique_together = [("folder", "nome")]
        indexes = [("estabelecimento", "folder_id")]


class FolderPermission(Model):
    id = fields.UUIDField(primary_key=True)
    folder = fields.ForeignKeyField(
        'models.Folder',
        related_name='permissoes',
        on_delete=fields.CASCADE,
    )
    user_id = fields.UUIDField()
    estabelecimento = fields.UUIDField()
    cascade = fields.BooleanField(default=False)
    can_read = fields.BooleanField(default=True)
    can_write = fields.BooleanField(default=False)
    granted_by = fields.UUIDField()
    created_at = fields.DatetimeField(default=datetime.now(timezone.utc))

    class Meta:
        unique_together = [("folder", "user_id")]
        indexes = [("estabelecimento", "user_id")]
