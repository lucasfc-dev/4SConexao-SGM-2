from tortoise.models import Model
from tortoise import fields
from tortoise.fields.relational import ReverseRelation, BackwardFKRelation
from api.schemas import (
                            LicitacaoOut, DocumentoOut, SecaoOut, PessoaFisicaOut,
                            PessoaJuridicaOut, PessoaFisicaOutSimple,
                            PessoaJuridicaOutSimple, DispensaOut, ModalidadeOut,
                            EditalLicitacaoOut, ComissaoLicitacaoOut, MembroComissaoOut, ContratoOut,
                            FiscalContratoOut, VigenciaOut, CertificadoPublicacaoOut
                        )
from api.enums import LicitacaoSituacaoEnum, DispensaSituacaoEnum, TipoCertificado
import uuid


class BaseModel(Model):
    created_at = fields.DatetimeField(auto_now_add=True)
    class Meta:
        abstract = True  

    def to_dict(self):
        pass

    def to_pydantic(self):
        pass

    async def include_relations(self,relations,client=None,estabelecimento=None):
        data = self.to_dict()
        for relation in relations:
            if relation == 'orgao':
                orgao = await client.estabelecimento.get_orgao(self.orgao)
                orgao.pop('estabelecimento')
                data['orgao'] = orgao 
                continue
            if "__" in relation:
                relation_parts = relation.split('__')
                base_relation = relation_parts[0]
                nested_relations = '__'.join(relation_parts[1:])                
                await self.fetch_related(base_relation)
                relation_obj = getattr(self, base_relation, None)
                if relation_obj:
                    relation_data = await relation_obj.include_relations([nested_relations], client)
                    data[base_relation] = relation_data
                continue
            
            await self.fetch_related(relation)
            if relation in ('pessoa','responsavel','fornecedor'):
                pessoa = getattr(self, relation)
                data[relation] = await pessoa.include_relations(['pessoa_fisica', 'pessoa_juridica'])
                continue
            relation_obj = getattr(self,relation)
            if relation_obj is not None:
                relation_dict = relation_obj.to_dict()
                data[relation] = relation_dict
            else:
                data[relation] = None
        return data

    @classmethod
    def get_campos_limpos(cls):
        campos_limpos = [
            nome for nome, field in cls._meta.fields_map.items()
            if not isinstance(field, (ReverseRelation, BackwardFKRelation))
        ]
        campos_limpos.remove('id')
        return campos_limpos

class Licitacao(BaseModel):
    REGIME_EXECUCAO_CHOICES = [
        ('NA', 'Não se Aplica'),
        ('global', 'Empreitada por preço global'),
        ('unitario', 'Empreitada por preço unitário'),
        ('integral', 'Empreitada integral'),
        ('tarefas', 'Tarefa'),
        ('execucao_direta', 'Execução direta')
    ]

    NATUREZA_PROCEDIMENTO_CHOICES = [
        ('normal', 'Normal'),
        ('registro_precos', 'Registro de Preços'),
        ('credenciamento_chamamento', 'Credenciamento/Chamamento'),
        ('adesao_registro_precos', 'Adesão de Registro de Preços'),
    ]

    id = fields.UUIDField(primary_key=True,default=uuid.uuid1)
    orgao = fields.UUIDField()
    modalidade = fields.ForeignKeyField('models.Modalidade',on_delete=fields.CASCADE)
    secao = fields.ForeignKeyField('models.Secao', on_delete=fields.CASCADE)
    regime_execucao = fields.CharField(max_length=100, choices=REGIME_EXECUCAO_CHOICES)
    natureza_procedimento = fields.CharField(max_length=100, choices=NATUREZA_PROCEDIMENTO_CHOICES)
    situacao = fields.CharEnumField(LicitacaoSituacaoEnum, max_length=100)
    valor_estimado = fields.DecimalField(max_digits=20, decimal_places=2) 
    valor_vencedor = fields.DecimalField(max_digits=20, decimal_places=2)
    pub_date = fields.DateField()
    homolog_date = fields.DateField(null=True)
    julg_date = fields.DateField(null=True)
    num_processo = fields.CharField(max_length=100)
    objeto = fields.TextField()
    fundamento_legal = fields.TextField(null=True, blank=True)
    documentos = fields.ManyToManyField('models.Documento', related_name='licitacoes',null=True)
    estabelecimento = fields.UUIDField()
    published_by = fields.UUIDField(null=True)
    certificado_publicacao = fields.OneToOneField(
        'models.CertificadoPublicacao',
        related_name='licitacao',
        null=True,
        on_delete=fields.SET_NULL,
    )

    def to_dict(self):
        return {
            "id": self.id,
            "orgao": self.orgao,
            "modalidade": self.modalidade_id,
            "secao": self.secao_id,
            "regime_execucao": self.regime_execucao,
            "natureza_procedimento": self.natureza_procedimento,
            "situacao": self.situacao,
            "valor_estimado": self.valor_estimado,
            "valor_vencedor": self.valor_vencedor,
            "pub_date": self.pub_date.strftime("%Y-%m-%d"),
            "homolog_date": self.homolog_date.strftime("%Y-%m-%d") if self.homolog_date else None,
            "julg_date": self.julg_date.strftime("%Y-%m-%d") if self.julg_date else None,
            "num_processo": self.num_processo,
            "objeto": self.objeto,
            "fundamento_legal": self.fundamento_legal,
            "created_at": self.created_at,
            "estabelecimento": self.estabelecimento
        }
    
    def to_pydantic(self):
        return LicitacaoOut(**self.to_dict())
    

class Documento(BaseModel):
    id = fields.UUIDField(primary_key=True, default=uuid.uuid1)
    titulo = fields.CharField(max_length=255)   
    data = fields.BinaryField()
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)
    
    def to_dict(self):
        return {
            "id": self.id,
            "titulo": self.titulo,
            "created_at": self.created_at.strftime("%Y-%m-%d"),
            "updated_at": self.updated_at.strftime("%Y-%m-%d"),
        }
    
    def to_pydantic(self):
        return DocumentoOut(**self.to_dict())




class Modalidade(BaseModel):
    id = fields.UUIDField(primary_key=True, default=uuid.uuid1)
    nome = fields.CharField(max_length=100)
    observacao = fields.TextField(null=True)
    estabelecimento = fields.UUIDField()

    def to_dict(self):
        return {
            "id": self.id,
            "nome": self.nome,
            "observacao": self.observacao,
            "created_at": self.created_at,
            "estabelecimento": self.estabelecimento
        }
    
    def to_pydantic(self):
        return ModalidadeOut(**self.to_dict())

class Secao(BaseModel):
    id = fields.UUIDField(primary_key=True, default=uuid.uuid1)
    orgao = fields.UUIDField()
    nome = fields.CharField(max_length=100)
    responsavel = fields.ForeignKeyField(
        'models.Pessoa',
        related_name='secao_responsavel',
        on_delete=fields.CASCADE,
    )
    estabelecimento = fields.UUIDField()


    def to_dict(self):
        return {
            "id": self.id,
            "orgao": self.orgao,
            "nome": self.nome,
            "responsavel": self.responsavel_id,
            "created_at": self.created_at,
            "estabelecimento": self.estabelecimento
        }
    
    def to_pydantic(self):
        return SecaoOut(**self.to_dict())

class Dispensa(BaseModel):
    TIPO_DISPENSA_CHOICES = [
        ('dispensa', 'Dispensa'),
        ('inexigibilidade', 'Inexigibilidade'),
        ('inexigibilidade_credenciamento_chamada_publica', 'Inexigibilidade por credenciamento/chamada pública'),
        ('dispensa_chamada_publica', 'Dispensa por chamada pública'),
    ]
    
    id = fields.UUIDField(primary_key=True, default=uuid.uuid1)
    tipo_dispensa = fields.CharField(max_length=100, choices=TIPO_DISPENSA_CHOICES)
    pub_date = fields.DateField()
    homolog_date = fields.DateField(null=True)
    julg_date = fields.DateField(null=True)
    orgao = fields.UUIDField()
    num_processo = fields.CharField(max_length=100)
    secao = fields.ForeignKeyField('models.Secao', on_delete=fields.CASCADE)
    natureza_objeto = fields.CharField(max_length=255)
    regime_execucao = fields.CharField(max_length=100)
    situacao = fields.CharEnumField(DispensaSituacaoEnum, max_length=100)
    valor_estimado = fields.DecimalField(max_digits=10, decimal_places=2)
    valor_vencedor = fields.DecimalField(max_digits=10, decimal_places=2)
    objeto = fields.TextField()
    fundamento_legal = fields.TextField(null=True, blank=True)
    documentos = fields.ManyToManyField('models.Documento', related_name='dispensas', null=True)
    estabelecimento = fields.UUIDField()
    published_by = fields.UUIDField(null=True)
    certificado_publicacao = fields.OneToOneField(
        'models.CertificadoPublicacao',
        related_name='dispensa',
        null=True,
        on_delete=fields.SET_NULL,
    )

    def to_dict(self):
        return {
            "id":self.id,
            "tipo_dispensa":self.tipo_dispensa,
            "pub_date":self.pub_date.strftime("%Y-%m-%d"),
            "homolog_date":self.homolog_date.strftime("%Y-%m-%d") if self.homolog_date else None,
            "julg_date":self.julg_date.strftime("%Y-%m-%d") if self.julg_date else None,
            "orgao":self.orgao,
            "num_processo":self.num_processo,
            "secao":self.secao_id,
            "natureza_objeto":self.natureza_objeto,
            "regime_execucao":self.regime_execucao,
            "situacao":self.situacao,
            "valor_estimado":self.valor_estimado,
            "valor_vencedor":self.valor_vencedor,
            "objeto":self.objeto,
            "fundamento_legal":self.fundamento_legal,
            "estabelecimento":self.estabelecimento,
            "created_at":self.created_at
        }
    
    def to_pydantic(self):
        return DispensaOut(**self.to_dict())
    

class Pessoa(BaseModel):
    id = fields.UUIDField(primary_key=True, default=uuid.uuid1)
    email = fields.CharField(max_length=255)
    telefone = fields.CharField(max_length=20)
    endereco = fields.CharField(max_length=255)
    complemento = fields.CharField(max_length=255)
    estado = fields.CharField(max_length=100)
    cidade = fields.CharField(max_length=100)
    cep = fields.CharField(max_length=20)
    bairro = fields.CharField(max_length=100)
    estabelecimento = fields.UUIDField()

    @classmethod
    def to_dict_list(cls,pessoas):
        return [pessoa.to_dict() for pessoa in pessoas]
    
    def build_pessoa_out(self,pessoa_obj):
        campos_pessoa_base = Pessoa.get_campos_limpos()
        pessoa_dict = pessoa_obj.__dict__.copy()
        for field in campos_pessoa_base:
            pessoa_dict[field] = getattr(self, field, None)
        pessoa_dict['pessoa_id'] = self.id
        if pessoa_dict['tipo'] == 'fisica':
            return PessoaFisicaOut(**pessoa_dict)
        return PessoaJuridicaOut(**pessoa_dict)
    
    async def include_relations(self, relations, client=None):
            data = self.to_dict()
            for relation in relations:
                if "__" in relation:
                    relation_parts = relation.split('__')
                    base_relation = relation_parts[0]
                    nested_relations = '__'.join(relation_parts[1:])
                    
                    await self.fetch_related(base_relation)
                    relation_obj = getattr(self, base_relation, None)
                    
                    if relation_obj:
                        relation_data = await relation_obj.include_relations([nested_relations], client)
                        data[base_relation] = relation_data
                    continue
                    
                if relation in ('pessoa_fisica', 'pessoa_juridica'):
                    await self.fetch_related(relation)
                    rel_obj = getattr(self, relation)
                    if rel_obj:
                        rel_dict = rel_obj.to_dict(self.created_at)
                        # Preserva o id original da Pessoa e remove o id da classe filha
                        pessoa_id = data['id']  # Salva o id da Pessoa
                        data = data | rel_dict
                        data['pessoa_id'] = pessoa_id  # Restaura o id da Pessoa como pessoa_id
                else:
                    await self.fetch_related(relation)
                    rel_obj = getattr(self, relation)
                    if rel_obj:
                        data[relation] = rel_obj.to_dict()
            return data

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "telefone": self.telefone,
            "endereco": self.endereco,
            "complemento": self.complemento,
            "estado": self.estado,
            "cidade": self.cidade,
            "cep": self.cep,
            "bairro": self.bairro,
            "created_at": self.created_at,
            "estabelecimento": self.estabelecimento
        }

class PessoaFisica(BaseModel):
    id = fields.UUIDField(primary_key=True, default=uuid.uuid1)
    nome = fields.CharField(max_length=255)
    cpf = fields.CharField(max_length=14)
    genero = fields.CharField(max_length=20)
    matricula = fields.CharField(max_length=50,null=True)
    data_nascimento = fields.DateField()
    rg = fields.CharField(max_length=20, null=True)
    orgao_expedidor = fields.CharField(max_length=50, null=True)
    titulo_eleitor = fields.CharField(max_length=20, null=True)
    cargo = fields.CharField(max_length=100)
    pessoa = fields.OneToOneField('models.Pessoa', related_name='pessoa_fisica', on_delete=fields.CASCADE)
    tipo = fields.CharField(max_length=50, default='fisica')

    def to_dict(self,created_at=None):
        return {
            "id":self.id,
            "nome":self.nome,
            "cpf":self.cpf,
            "genero":self.genero,
            "matricula":self.matricula,
            "data_nascimento":self.data_nascimento.strftime("%Y-%m-%d"),
            "rg":self.rg,
            "orgao_expedidor":self.orgao_expedidor,
            "titulo_eleitor":self.titulo_eleitor,
            "cargo":self.cargo,
            "pessoa_id":self.pessoa_id,
            "tipo":self.tipo,
            "created_at":self.pessoa.created_at if created_at is None else created_at 
        }
    
    def to_pydantic(self,created_at=None):
        return PessoaFisicaOutSimple(**self.to_dict(created_at))
    
    async def include_relations(self, relations=['pessoa'], client=None):
            data = self.to_dict()
            for relation in relations:
                if "__" in relation:
                    relation_parts = relation.split('__')
                    base_relation = relation_parts[0]
                    nested_relations = '__'.join(relation_parts[1:])
                    print(f"PessoaFisica - Base relation: {base_relation}, Nested relations: {nested_relations}")
                    
                    await self.fetch_related(base_relation)
                    relation_obj = getattr(self, base_relation, None)
                    
                    if relation_obj:
                        relation_data = await relation_obj.include_relations([nested_relations], client)
                        data[base_relation] = relation_data
                    continue
                    
                if relation == 'pessoa':
                    await self.fetch_related(relation)
                    pessoa = self.pessoa.to_dict()
                    pessoa.pop('id')
                    data = data | pessoa
                else:
                    await self.fetch_related(relation)
                    rel_obj = getattr(self, relation)
                    if rel_obj:
                        data[relation] = rel_obj.to_dict()
            return data


class PessoaJuridica(BaseModel):
    id = fields.UUIDField(primary_key=True, default=uuid.uuid1)
    razao_social = fields.CharField(max_length=255)
    cnpj = fields.CharField(max_length=18)
    nome_fantasia = fields.CharField(max_length=250,null=True)
    data_fundacao = fields.DateField()
    telefone_comercial = fields.CharField(max_length=20,null=True)
    pessoa = fields.OneToOneField('models.Pessoa', related_name='pessoa_juridica', on_delete=fields.CASCADE)
    tipo = fields.CharField(max_length=50, default='juridica')

    def to_dict(self,created_at=None):
        return {
            "id":self.id,
            "razao_social":self.razao_social,
            "cnpj":self.cnpj,
            "nome_fantasia":self.nome_fantasia,
            "data_fundacao":self.data_fundacao.strftime("%Y-%m-%d"),
            "telefone_comercial":self.telefone_comercial,
            "pessoa_id":self.pessoa_id,
            "tipo":self.tipo,
            "created_at":self.pessoa.created_at if created_at is None else created_at 
        }  
    
    def to_pydantic(self,created_at=None):
        return PessoaJuridicaOutSimple(**self.to_dict(created_at))
    
    async def include_relations(self, relations=['pessoa'], client=None):
            data = self.to_dict()
            for relation in relations:
                if "__" in relation:
                    relation_parts = relation.split('__')
                    base_relation = relation_parts[0]
                    nested_relations = '__'.join(relation_parts[1:])
                    
                    await self.fetch_related(base_relation)
                    relation_obj = getattr(self, base_relation, None)
                    
                    if relation_obj:
                        relation_data = await relation_obj.include_relations([nested_relations], client)
                        data[base_relation] = relation_data
                    continue
                    
                if relation == 'pessoa':
                    await self.fetch_related(relation)
                    pessoa = self.pessoa.to_dict()
                    pessoa.pop('id')
                    data = data | pessoa
                else:
                    await self.fetch_related(relation)
                    rel_obj = getattr(self, relation)
                    if rel_obj:
                        data[relation] = rel_obj.to_dict()
            return data

class ComissaoLicitacao(BaseModel):
    COMISSAO_TIPO_CHOICES = [
        ('comissao_especial', 'Comissao Especial'),
        ('comissao_permanente', 'Comissao Permanente'),
    ]

    ATO_TIPO_CHOICES = [
        ('decreto', 'Decreto'),
        ('portaria', 'Portaria'),
    ]

    id = fields.UUIDField(primary_key=True, default=uuid.uuid1)
    vigencia_inicio = fields.DateField()
    vigencia_fim = fields.DateField()
    tipo_comissao = fields.CharField(max_length=100,choices=COMISSAO_TIPO_CHOICES)
    tipo_ato = fields.CharField(max_length=100,choices=ATO_TIPO_CHOICES)
    data_ato = fields.DateField()
    numero_ato = fields.CharField(max_length=100)
    finalidade = fields.TextField()
    estabelecimento = fields.UUIDField()

    def to_dict(self):
        return {
            "id": self.id,
            "vigencia_inicio": self.vigencia_inicio,
            "vigencia_fim": self.vigencia_fim,
            "tipo_comissao": self.tipo_comissao,
            "tipo_ato": self.tipo_ato,
            "data_ato": self.data_ato.strftime("%Y-%m-%d"),
            "numero_ato": self.numero_ato,
            "finalidade": self.finalidade,
            "created_at": self.created_at,
            "estabelecimento": self.estabelecimento
        }

    def to_pydantic(self):
        return ComissaoLicitacaoOut(**self.to_dict())

class MembroComissao(BaseModel):
    id = fields.UUIDField(primary_key=True, default=uuid.uuid1)
    comissao = fields.ForeignKeyField('models.ComissaoLicitacao', related_name='membros', on_delete=fields.CASCADE)
    pessoa = fields.ForeignKeyField('models.Pessoa', related_name='membro_comissao', on_delete=fields.CASCADE)
    atribuicao = fields.CharField(max_length=100)
    cargo = fields.CharField(max_length=100)
    natureza_cargo = fields.CharField(max_length=100, null=True, blank=True)
    ato_pessoal = fields.CharField(max_length=100)
    vigencia_inicial = fields.DateField()
    vigencia_final = fields.DateField(null=True)
    estabelecimento = fields.UUIDField()

    def to_dict(self):
        return {
            "id": self.id,
            "comissao": self.comissao_id,
            "pessoa": self.pessoa_id,
            "atribuicao": self.atribuicao,
            "cargo": self.cargo,
            "natureza_cargo": self.natureza_cargo,
            "ato_pessoal": self.ato_pessoal,
            "vigencia_inicial": self.vigencia_inicial,
            "vigencia_final": self.vigencia_final,
            "created_at": self.created_at,
            "estabelecimento": self.estabelecimento
        }
    
    def to_pydantic(self):
        return MembroComissaoOut(**self.to_dict())

class EditalLicitacao(BaseModel):
    VEICULO_PUBLICACAO_CHOICES = [
        ('diario', 'Diário Oficial'),
        ('placar', 'Placar')
    ]

    id = fields.UUIDField(primary_key=True, default=uuid.uuid1)
    numero_edital = fields.CharField(max_length=100)
    data_publicacao = fields.DateField()
    numero_publicacao = fields.CharField(max_length=100)
    orgao = fields.UUIDField()
    veiculo_publicacao = fields.CharField(max_length=100)
    secao = fields.ForeignKeyField('models.Secao', on_delete=fields.CASCADE)
    descricao = fields.TextField(null=True, blank=True)
    valor_estimado = fields.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    documentos = fields.ManyToManyField('models.Documento', related_name='editais', null=True)
    estabelecimento = fields.UUIDField()

    def to_dict(self):
        return {
            "id": self.id,
            "numero_edital": self.numero_edital,
            "data_publicacao": self.data_publicacao.strftime("%Y-%m-%d"),
            "numero_publicacao": self.numero_publicacao,
            "orgao": self.orgao,
            "veiculo_publicacao": self.veiculo_publicacao,
            "secao": self.secao_id,
            "descricao": self.descricao,
            "valor_estimado": self.valor_estimado,
            "created_at": self.created_at,
            "estabelecimento": self.estabelecimento
        }

    def to_pydantic(self):
        return EditalLicitacaoOut(**self.to_dict())
    
class Contrato(BaseModel):
    id = fields.UUIDField(primary_key=True, default=uuid.uuid1)
    num_contrato = fields.CharField(max_length=100, null=True)
    published_by = fields.UUIDField(null=True)
    modalidade = fields.ForeignKeyField('models.Modalidade', on_delete=fields.CASCADE)
    secao = fields.ForeignKeyField('models.Secao', on_delete=fields.CASCADE)
    valor_estimado = fields.DecimalField(max_digits=20, decimal_places=2, default=0.00)
    tipo = fields.CharField(max_length=100, null=True)
    situacao = fields.CharField(max_length=100, null=True)
    descricao = fields.TextField(null=True, blank=True)
    pub_date = fields.DateField()
    data_inicio = fields.DateField(null=True)
    data_vencimento = fields.DateField(null=True)
    prazo_entrega = fields.IntField(null=True)
    finalidade = fields.TextField(null=True)
    dispensa = fields.ForeignKeyField('models.Dispensa', on_delete=fields.CASCADE, null=True)
    licitacao = fields.ForeignKeyField('models.Licitacao', on_delete=fields.CASCADE, null=True)
    fornecedor = fields.ForeignKeyField('models.Pessoa', on_delete=fields.CASCADE, null=True)
    vigencia = fields.ForeignKeyField(
        'models.Vigencia', null=True, on_delete=fields.CASCADE
    )
    portaria = fields.UUIDField(null=True)
    objeto = fields.TextField(null=True, blank=True)
    documentos = fields.ManyToManyField('models.Documento', related_name='contratos', null=True)
    estabelecimento = fields.UUIDField()
    certificado_publicacao = fields.OneToOneField(
        'models.CertificadoPublicacao',
        related_name='contrato',
        null=True,
        on_delete=fields.SET_NULL,
    )

    def to_dict(self):
        return {
            "id": self.id,
            "num_contrato": self.num_contrato,
            "published_by": self.published_by,
            "modalidade": self.modalidade_id,
            "secao": self.secao_id,
            "valor_estimado": self.valor_estimado,
            "tipo": self.tipo,
            "situacao": self.situacao,
            "descricao": self.descricao,
            "pub_date": self.pub_date.strftime("%Y-%m-%d") if self.pub_date else None,
            "data_inicio": self.data_inicio.strftime("%Y-%m-%d") if self.data_inicio else None,
            "data_vencimento": self.data_vencimento.strftime("%Y-%m-%d") if self.data_vencimento else None,
            "prazo_entrega": self.prazo_entrega,
            "finalidade": self.finalidade,
            "licitacao": self.licitacao_id if hasattr(self, 'licitacao_id') else None,
            "dispensa": self.dispensa_id if hasattr(self, 'dispensa_id') else None,
            "fornecedor": self.fornecedor_id,
            "vigencia": self.vigencia_id,
            "portaria": self.portaria,
            "objeto": self.objeto,
            "created_at": self.created_at,
            "estabelecimento": self.estabelecimento
        }
    
    def to_pydantic(self):
        return ContratoOut(**self.to_dict())
    
    async def include_relations(self, relations, client=None, estabelecimento=None):
        """
        Complementar include_relations do BaseModel com certificado_publicacao
        """
        data = self.to_dict()
        
        for relation in relations:
            # Tratar categoria especial: certificado_publicacao
            if relation == 'certificado_publicacao':
                await self.fetch_related('certificado_publicacao')
                certificado = getattr(self, 'certificado_publicacao', None)
                data['certificado_publicacao'] = certificado.to_pydantic() if certificado else None
                continue
            
            # Delegar para lógica do BaseModel para outras relações
            if relation == 'orgao':
                orgao = await client.estabelecimento.get_orgao(self.orgao)
                orgao.pop('estabelecimento')
                data['orgao'] = orgao 
                continue
            if "__" in relation:
                relation_parts = relation.split('__')
                base_relation = relation_parts[0]
                nested_relations = '__'.join(relation_parts[1:])                
                await self.fetch_related(base_relation)
                relation_obj = getattr(self, base_relation, None)
                if relation_obj:
                    relation_data = await relation_obj.include_relations([nested_relations], client)
                    data[base_relation] = relation_data
                continue
            
            await self.fetch_related(relation)
            if relation in ('pessoa','responsavel','fornecedor'):
                pessoa = getattr(self, relation)
                data[relation] = await pessoa.include_relations(['pessoa_fisica', 'pessoa_juridica'])
                continue
            
            relation_obj = getattr(self,relation)
            if relation_obj is not None:
                relation_dict = relation_obj.to_dict()
                data[relation] = relation_dict
            else:
                data[relation] = None
        
        return data
    
class FiscalContrato(BaseModel):
    id = fields.UUIDField(primary_key=True, default=uuid.uuid1)
    pessoa = fields.ForeignKeyField('models.Pessoa', related_name='fiscal_contrato', on_delete=fields.CASCADE)
    orgao = fields.UUIDField()
    comprovante_nomeacao = fields.ForeignKeyField('models.Documento', related_name='fiscais_nomeacao', on_delete=fields.CASCADE, null=True)
    portarias = fields.ManyToManyField('models.Documento', null=True)
    estabelecimento = fields.UUIDField()

    def to_dict(self):
        return {
            "id": self.id,
            "pessoa": self.pessoa_id,
            "orgao": self.orgao,
            "estabelecimento": self.estabelecimento,
            "created_at": self.created_at
        }

    def to_pydantic(self):
        return FiscalContratoOut(**self.to_dict())

    async def include_relations(self, relations, client=None, estabelecimento=None):
        other_relations = [r for r in relations if r != 'vigencias']
        data = await super().include_relations(other_relations, client, estabelecimento)
        if 'vigencias' in relations:
            await self.fetch_related('vigencias')
            data['vigencias'] = [v.to_dict() for v in self.vigencias]
        return data


class Vigencia(BaseModel):
    id = fields.UUIDField(primary_key=True, default=uuid.uuid1)
    fiscal = fields.ForeignKeyField('models.FiscalContrato', related_name='vigencias', on_delete=fields.CASCADE)
    data_inicio = fields.DateField()
    data_fim = fields.DateField(null=True)
    estabelecimento = fields.UUIDField()

    def to_dict(self):
        return {
            "id": self.id,
            "fiscal": self.fiscal_id,
            "data_inicio": self.data_inicio.strftime("%Y-%m-%d"),
            "data_fim": self.data_fim.strftime("%Y-%m-%d") if self.data_fim else None,
            "estabelecimento": self.estabelecimento,
            "created_at": self.created_at
        }

    def to_pydantic(self):
        return VigenciaOut(**self.to_dict())
    
class Relatorio(Model):
    id = fields.UUIDField(primary_key=True, default=uuid.uuid1)
    titulo = fields.CharField(max_length=255)
    data = fields.BinaryField()
    tipo = fields.CharField(max_length=100,default='dispensa')
    pub_date = fields.DateField()
    estabelecimento = fields.UUIDField()
    created_at = fields.DatetimeField(auto_now_add=True)
    
    class Meta:
        indexes = [
            ("estabelecimento", "pub_date"),
        ]

    def to_dict(self):
        return {
            "id": self.id,
            "titulo": self.titulo,
            "tipo": self.tipo,
            "pub_date": self.pub_date.strftime("%Y-%m-%d"),
            "created_at": self.created_at,
            "estabelecimento": self.estabelecimento
        }

class RelatorioFiscalizacaoContrato(BaseModel):
    id = fields.UUIDField(primary_key=True, default=uuid.uuid1)
    numero = fields.CharField(max_length=50)
    data = fields.BinaryField()
    contrato = fields.ForeignKeyField('models.Contrato', related_name='relatorios_fiscalizacao', on_delete=fields.CASCADE)
    pub_date = fields.DateField()
    estabelecimento = fields.UUIDField()
    
    class Meta:
        indexes = [
            ("estabelecimento", "pub_date"),
        ]

    def to_dict(self):
        return {
            'id': self.id,
            'numero': self.numero,
            'contrato': self.contrato_id,
            'pub_date': self.pub_date.strftime("%Y-%m-%d"),
            'estabelecimento': self.estabelecimento,
            'created_at': self.created_at
        }

    def to_pydantic(self):
        from api.schemas import RelatorioFiscalizacaoContratoOut
        return RelatorioFiscalizacaoContratoOut(
            id=self.id,
            numero=self.numero,
            contrato=self.contrato_id,
            pub_date=self.pub_date,
            estabelecimento=self.estabelecimento,
            created_at=self.created_at
        )


class CertificadoPublicacao(Model):
    id = fields.UUIDField(primary_key=True, default=uuid.uuid1)
    data = fields.BinaryField()
    pub_date = fields.DateField(auto_now_add=True)
    tipo = fields.CharEnumField(TipoCertificado, max_length=20)

    def to_dict(self):
        return {
            'id': self.id,
            'pub_date': self.pub_date.strftime("%Y-%m-%d"),
            'tipo': self.tipo,
        }

    def to_pydantic(self):
        return CertificadoPublicacaoOut(
            id=self.id,
            pub_date=self.pub_date,
            tipo=self.tipo,
        )