from typing import List, Optional
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


# ----------------- Auth mirrors (importados de auth_api) -----------------

class EstabelecimentoOut(BaseModel):
    id: UUID
    nome: str
    pacote_id: UUID
    cidade: str
    responsavel: str
    numero: int
    certificado: Optional[bytes] = None
    senha_cert: Optional[str] = None
    config: dict = {}


class FuncionalidadeOut(BaseModel):
    id: int
    nome: str


class OrgaoRefOut(BaseModel):
    id: UUID
    nome: str


class UserOut(BaseModel):
    id: UUID
    username: str
    email: str
    nome: Optional[str] = None
    cpf: Optional[str] = None
    is_admin: bool
    is_super: bool
    created_at: datetime
    estabelecimento: Optional[EstabelecimentoOut] = None
    orgaos: Optional[List[OrgaoRefOut]] = []
    funcionalidades: Optional[List[FuncionalidadeOut]] = []

    model_config = {"from_attributes": True}


# ----------------- Folder -----------------

class FolderIn(BaseModel):
    nome: str
    parent_id: UUID


class FolderOut(BaseModel):
    id: UUID
    nome: str
    parent_id: Optional[UUID] = None
    estabelecimento: UUID
    is_root: bool
    orgao: Optional[UUID] = None
    owner_user: UUID
    created_at: datetime

    @classmethod
    def from_model(cls, folder) -> "FolderOut":
        return cls(
            id=folder.id,
            nome=folder.nome,
            parent_id=folder.parent_id,
            estabelecimento=folder.estabelecimento,
            is_root=folder.is_root,
            orgao=folder.orgao,
            owner_user=folder.owner_user,
            created_at=folder.created_at,
        )


class UpdatedFolder(BaseModel):
    nome: Optional[str] = None


# ----------------- File -----------------

class FileOut(BaseModel):
    id: UUID
    nome: str
    folder_id: UUID
    estabelecimento: UUID
    content_type: str
    size_bytes: int
    owner_user: UUID
    created_at: datetime

    @classmethod
    def from_model(cls, file_obj) -> "FileOut":
        return cls(
            id=file_obj.id,
            nome=file_obj.nome,
            folder_id=file_obj.folder_id,
            estabelecimento=file_obj.estabelecimento,
            content_type=file_obj.content_type,
            size_bytes=file_obj.size_bytes,
            owner_user=file_obj.owner_user,
            created_at=file_obj.created_at,
        )


class UpdatedFile(BaseModel):
    nome: Optional[str] = None


# ----------------- Permission -----------------

class PermissionIn(BaseModel):
    user_id: UUID
    folder_id: UUID
    cascade: bool = False
    can_read: bool = True
    can_write: bool = False


class PermissionOut(BaseModel):
    id: UUID
    folder_id: UUID
    user_id: UUID
    cascade: bool
    can_read: bool
    can_write: bool
    granted_by: UUID
    estabelecimento: UUID
    created_at: datetime

    @classmethod
    def from_model(cls, perm) -> "PermissionOut":
        return cls(
            id=perm.id,
            folder_id=perm.folder_id,
            user_id=perm.user_id,
            cascade=perm.cascade,
            can_read=perm.can_read,
            can_write=perm.can_write,
            granted_by=perm.granted_by,
            estabelecimento=perm.estabelecimento,
            created_at=perm.created_at,
        )


class UpdatedPermission(BaseModel):
    cascade: Optional[bool] = None
    can_read: Optional[bool] = None
    can_write: Optional[bool] = None


class FolderUserAccessOut(BaseModel):
    """Acesso efetivo (calculado) de um usuário a uma pasta.

    - `can_read/can_write/cascade`: efetivo (herdado OU grant) — para exibição.
    - `locked_*`: a dimensão vem de fonte herdada (admin/dono/órgão/cascade de
      ancestral) e NÃO é editável pelo grant desta pasta — toggle travado.
    - `grant_*` + `grant_id`: a camada editável (linha FolderPermission desta pasta).
    `source`: 'admin' | 'owner' | 'orgao' | 'herdado' | 'grant' | 'none'.
    """
    user_id: UUID
    nome: str
    source: str
    can_read: bool
    can_write: bool
    cascade: bool
    locked_read: bool
    locked_write: bool
    locked_cascade: bool
    grant_id: Optional[UUID] = None
    grant_read: bool = False
    grant_write: bool = False
    grant_cascade: bool = False


# ----------------- Composições de resposta -----------------

class FolderTreeNode(BaseModel):
    """Resposta de GET /pastas/{id}/conteudo/."""
    folder: FolderOut
    breadcrumb: List[FolderOut]
    subpastas: List[FolderOut]
    arquivos: List[FileOut]
    can_write: bool


# ----------------- Webhooks (push do auth_api) -----------------

class WebhookOrgao(BaseModel):
    id: UUID
    nome: str


class AcervoAtivadoIn(BaseModel):
    estabelecimento_id: UUID
    orgaos: List[WebhookOrgao] = []
    granted_by: UUID


class OrgaoCriadoIn(BaseModel):
    estabelecimento_id: UUID
    orgao: WebhookOrgao
    granted_by: UUID
