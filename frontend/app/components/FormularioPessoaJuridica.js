export default function FormularioPessoaJuridica({ defaultValues = {}, onChange, ...props }) {
  // Função de formatação CNPJ baseada no formulario.js
  const formatCNPJ = (value) => {
    const v = value.replace(/\D/g, '').slice(0, 14);
    return v
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2}\.\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{2}\.\d{3}\.\d{3})(\d)/, '$1/$2')
      .replace(/^(\d{2}\.\d{3}\.\d{3}\/\d{4})(\d)/, '$1-$2');
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

  // Handler baseado no formulario.js
  const handleCNPJChange = (e) => {
    const { name, value } = e.target;
    const raw = value.replace(/\D/g, '');
    // Atualiza o valor visual formatado
    e.target.value = formatCNPJ(raw);
    
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
        <label className="block text-sm font-medium text-gray-700">Razão Social</label>
        <input type="text" name="razao_social" required defaultValue={defaultValues.razao_social || ''} className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all" onChange={onChange} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Nome Fantasia (Opcional)</label>
        <input type="text" name="nome_fantasia" defaultValue={defaultValues.nome_fantasia || ''} className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all" onChange={onChange} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">CNPJ</label>
        <input 
          type="text" 
          name="cnpj" 
          required 
          defaultValue={defaultValues.cnpj ? formatCNPJ(defaultValues.cnpj) : ''} 
          onChange={handleCNPJChange}
          maxLength="18"
          className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all" 
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Data de Fundação</label>
        <input type="date" name="data_fundacao" required defaultValue={defaultValues.data_fundacao || ''} className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all" onChange={onChange} />
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
      <div>
        <label className="block text-sm font-medium text-gray-700">Telefone Comercial (Opcional)</label>
        <input 
          type="text" 
          name="telefone_comercial" 
          defaultValue={defaultValues.telefone_comercial ? formatTelefone(defaultValues.telefone_comercial) : ''} 
          onChange={handleTelefoneChange}
          maxLength="15"
          className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all" 
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input type="email" name="email" required defaultValue={defaultValues.email || ''} className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all" onChange={onChange} />
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
