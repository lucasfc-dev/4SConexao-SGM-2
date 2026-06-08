// Utility function to format CPF for display
const formatCPF = (value) => {
    if (!value) return '';
    const v = value.replace(/\D/g, '').slice(0, 11);
    return v
        .replace(/^(\d{3})(\d)/, '$1.$2')
        .replace(/^(\d{3}\.\d{3})(\d)/, '$1.$2')
        .replace(/^(\d{3}\.\d{3}\.\d{3})(\d)/, '$1-$2');
};

// Example of how to use in the pessoas.map:
{pessoas.map(pessoa => (
    <option key={pessoa.pessoa_id} value={pessoa.pessoa_id}>
        {pessoa.nome} 
        {pessoa.cpf && ` - CPF: ${formatCPF(pessoa.cpf)}`}
    </option>
))}
