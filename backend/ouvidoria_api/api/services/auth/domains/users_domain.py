from __future__ import annotations
from api.schemas import UserOut
from typing import Optional
import httpx

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from auth_service import AuthClient

class UserDomain:
    def __init__(self, model: UserOut, client:"AuthClient"):
        self.model = model
        self.client = client

    @property
    def id(self):
        return self.model.id

    def is_admin(self) -> bool:
        return self.model.is_admin or False

    def has_funcionalidade(self, funcionalidade_nome: str) -> bool:
        funcionalidades = self.model.funcionalidades or []
        for funcionalidade in funcionalidades:
            if isinstance(funcionalidade, dict):
                nome = funcionalidade.get("nome")
            else:
                nome = getattr(funcionalidade, "nome", None)
            if nome == funcionalidade_nome:
                return True
        return False

    def nome_estabelecimento(self) -> Optional[str]:
        return self.model.estabelecimento.nome if self.model.estabelecimento else None

