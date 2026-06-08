export default function FormularioPessoaFisica({ defaultValues = {}, onChange, ...props }) {
  // Funções de formatação baseadas no formulario.js
  const formatCPF = (value) => {
    const v = value.replace(/\D/g, '').slice(0, 11);
    return v
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3}\.\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3}\.\d{3}\.\d{3})(\d)/, '$1-$2');
  };

  const formatRG = (value) => {
    const v = value.replace(/\D/g, '').slice(0, 7);
    return v
      .replace(/^(\d{1})(\d)/, '$1.$2')
      .replace(/^(\d{1}\.\d{3})(\d)/, '$1.$2');
  };

  const formatTituloEleitor = (value) => {
    const v = value.replace(/\D/g, '').slice(0, 12);
    return v
      .replace(/^(\d{4})(\d)/, '$1 $2')
      .replace(/^(\d{4} \d{4})(\d)/, '$1 $2');
  };

  // Função para formatar Telefone
  const formatTelefone = (value) => {
    const v = value.replace(/\D/g, '').slice(0, 11);
    if (v.length <= 10) {
      // Telefone fixo: (XX) XXXX-XXXX
      return v
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/^(\(\d{2}\) \d{4})(\d)/, '$1-$2');
    } else {
      // Celular: (XX) XXXXX-XXXX
      return v
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/^(\(\d{2}\) \d{5})(\d)/, '$1-$2');
    }
  };

  // Handlers baseados no formulario.js
  const handleCPFChange = (e) => {
    const { name, value } = e.target;
    const raw = value.replace(/\D/g, '');
    // Atualiza o valor visual formatado
    e.target.value = formatCPF(raw);
    
    if (onChange) {
      const cleanEvent = {
        ...e,
        target: { ...e.target, name, value: raw }
      };
      onChange(cleanEvent);
    }
  };

  const handleRGChange = (e) => {
    const { name, value } = e.target;
    const raw = value.replace(/\D/g, '');
    // Atualiza o valor visual formatado
    e.target.value = formatRG(raw);
    
    if (onChange) {
      const cleanEvent = {
        ...e,
        target: { ...e.target, name, value: raw }
      };
      onChange(cleanEvent);
    }
  };

  const handleTituloEleitorChange = (e) => {
    const { name, value } = e.target;
    const raw = value.replace(/\D/g, '');
    // Atualiza o valor visual formatado
    e.target.value = formatTituloEleitor(raw);
    
    if (onChange) {
      const cleanEvent = {
        ...e,
        target: { ...e.target, name, value: raw }
      };
      onChange(cleanEvent);
    }
  };

  const handleTelefoneChange = (e) => {
    const { name, value } = e.target;
    const raw = value.replace(/\D/g, '');
    // Atualiza o valor visual formatado
    e.target.value = formatTelefone(raw);
    
    if (onChange) {
      const cleanEvent = {
        ...e,
        target: { ...e.target, name, value: raw }
      };
      onChange(cleanEvent);
    }
  };

  return (
    <div className="grid grid-cols-1 overflow-auto md:grid-cols-2 p-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Nome</label>
        <input type="text" name="nome" required defaultValue={defaultValues.nome || ''} className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all" onChange={onChange} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">CPF</label>
        <input 
          type="text" 
          name="cpf" 
          required 
          defaultValue={defaultValues.cpf ? formatCPF(defaultValues.cpf) : ''} 
          onChange={handleCPFChange}
          maxLength="14"
          className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all" 
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Gênero</label>
        <select name="genero" required defaultValue={defaultValues.genero || ''} className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all" onChange={onChange}>
          <option value="">Selecione</option>
          <option value="masculino">Masculino</option>
          <option value="feminino">Feminino</option>
          <option value="outro">Outro</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Matrícula (Opcional)</label>
        <input type="text" name="matricula" defaultValue={defaultValues.matricula || ''} className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all" onChange={onChange} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Data de Nascimento</label>
        <input type="date" name="data_nascimento" required defaultValue={defaultValues.data_nascimento || ''} className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all" onChange={onChange} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">RG (Opcional)</label>
        <input 
          type="text" 
          name="rg"  
          defaultValue={defaultValues.rg ? formatRG(defaultValues.rg) : ''} 
          onChange={handleRGChange}
          maxLength="9"
          className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all" 
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Órgão Expedidor (Opcional)</label>
        <input type="text" name="orgao_expedidor" defaultValue={defaultValues.orgao_expedidor || ''} className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all" onChange={onChange} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Título de Eleitor (Opcional)</label>
        <input 
          type="text" 
          name="titulo_eleitor" 
          defaultValue={defaultValues.titulo_eleitor ? formatTituloEleitor(defaultValues.titulo_eleitor) : ''} 
          onChange={handleTituloEleitorChange}
          maxLength="14"
          className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all" 
        />
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700">Cargo</label>
        <input type="text" name="cargo" required defaultValue={defaultValues.cargo || ''} className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all" onChange={onChange} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input type="email" name="email" required defaultValue={defaultValues.email || ''} className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all" onChange={onChange} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Telefone</label>
        <input 
          type="text" 
          name="telefone" 
          required 
          defaultValue={defaultValues.telefone ? formatTelefone(defaultValues.telefone) : ''} 
          onChange={handleTelefoneChange}
          maxLength="15"
          className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all" 
        />
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700">Endereço</label>
        <input type="text" name="endereco" required defaultValue={defaultValues.endereco || ''} className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all" onChange={onChange} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Complemento</label>
        <input type="text" name="complemento" defaultValue={defaultValues.complemento || ''} className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all" onChange={onChange} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Bairro</label>
        <input type="text" name="bairro" required defaultValue={defaultValues.bairro || ''} className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all" onChange={onChange} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Cidade</label>
        <input type="text" name="cidade" required defaultValue={defaultValues.cidade || ''} className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all" onChange={onChange} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Estado</label>
        <input type="text" name="estado" required defaultValue={defaultValues.estado || ''} className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all" onChange={onChange} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">CEP</label>
        <input type="text" name="cep" required defaultValue={defaultValues.cep || ''} className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all" onChange={onChange} />
      </div>
    </div>
  );
}
