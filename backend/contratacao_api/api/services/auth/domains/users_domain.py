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

    @property
    def orgaos(self):
        return [orgao.id for orgao in self.model.orgaos] if self.model.orgaos else []

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

    async def get_user_by_id(self, user_id: str) -> Optional[UserOut]:
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.client.base_url}/user/{user_id}/",
                    headers=self.client.headers
                )
                response.raise_for_status()
                user_data = response.json()
                return UserOut(**user_data)
        except httpx.HTTPError as e:
            print(f"Error fetching user by ID: {e}")
            raise

