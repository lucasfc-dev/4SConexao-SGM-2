import { useState, useEffect } from 'react'

export default function FormularioEdital({ edital, onSubmit, orgaos, listaSecoes }) {
    const [valorEstimado, setValorEstimado] = useState('0,00')

    // Função para formatar valor monetário com dígitos empurrados da direita para esquerda
    const formatarValorMonetario = (valor) => {
        // Remove tudo que não é dígito
        const digits = valor.replace(/\D/g, '')
        
        if (digits.length === 0) return '0,00'
        
        // Converte para número e formata com 2 casas decimais
        const number = parseInt(digits) / 100
        return number.toFixed(2).replace('.', ',')
    }

    // Função para converter valor formatado para número
    const valorParaNumero = (valorFormatado) => {
        return parseFloat(valorFormatado.replace(',', '.'))
    }

    // Handler para campos de valor monetário
    const handleValorChange = (event) => {
        const inputValue = event.target.value
        const valorFormatado = formatarValorMonetario(inputValue)
        setValorEstimado(valorFormatado)
        event.target.value = valorFormatado
    }

    // Inicializar valor estimado quando edital mudar
    useEffect(() => {
        if (edital?.valor_estimado) {
            const valorFormatado = parseFloat(edital.valor_estimado).toFixed(2).replace('.', ',')
            setValorEstimado(valorFormatado)
        } else {
            setValorEstimado('0,00')
        }
    }, [edital])

    // Modificar o submit para converter valor formatado
    const handleSubmit = (e) => {
        e.preventDefault()
        const formData = new FormData(e.target)
        
        // Converte valor formatado de volta para número
        if (formData.get('valor_estimado')) {
            const valorNumerico = valorParaNumero(formData.get('valor_estimado'))
            formData.set('valor_estimado', valorNumerico)
        }
        
        onSubmit(e)
    }

    return (
        <form className="flex flex-col gap-4 p-4 overflow-auto" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4 overflow-auto">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Número de Publicação</label>
                    <input type="text" name="numero_publicacao" defaultValue={edital.numero_publicacao || ''} required placeholder="Informe o número de publicação" className="mt-1 p-2 border border-gray-300 rounded w-full" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Número do Edital</label>
                    <input type="text" name="numero_edital" defaultValue={edital.numero_edital || ''} required placeholder="Informe o número do edital" className="mt-1 p-2 border border-gray-300 rounded w-full" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Descrição</label>
                    <textarea rows={4} name="descricao" defaultValue={edital.descricao || ''} required placeholder="Descreva o edital" className="mt-1 p-2 border border-gray-300 rounded w-full" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Seção</label>
                    <select name="secao" required defaultValue={edital.secao?.id || ''} className="mt-1 p-2 border border-gray-300 rounded w-full">
                        <option value="">Selecione</option>
                        {listaSecoes.map(secao => (
                            <option key={secao.id} value={secao.id}>{secao.nome}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Valor estimado</label>
                    <input 
                        type="text" 
                        name="valor_estimado" 
                        value={valorEstimado}
                        onChange={handleValorChange}
                        required 
                        className="mt-1 p-2 border border-gray-300 rounded w-full"
                        placeholder="0,00"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Veículo de publicação</label>
                    <select name="veiculo_publicacao" defaultValue={edital.veiculo_publicacao || ''} required className="mt-1 p-2 border border-gray-300 rounded w-full">
                        <option value="">Selecione</option>
                        <option value="Diário">Diário</option>
                        <option value="Placar">Placar</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Órgão</label>
                    <select name="orgao" required defaultValue={edital.orgao?.id || ''} className="mt-1 p-2 border border-gray-300 rounded w-full">
                        <option value="">Selecione</option>
                        {orgaos.map(orgao => (
                            <option key={orgao.id} value={orgao.id}>{orgao.nome}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Data de Publicação</label>
                    <input type="date" name="data_publicacao" defaultValue={edital.data_publicacao || ''} required className="mt-1 p-2 border border-gray-300 rounded w-full" />
                </div>
                {!edital.id &&
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Anexos</label>
                        <input type="file" name="files" multiple accept=".pdf,.doc,.docx,.xls,.xlsx" className="mt-1 p-2 border border-gray-300 rounded w-full" />
                    </div>
                }
            </div>

            <div className="flex w-full gap-2 mt-4">
                <button type="submit" className="px-3 py-2 w-full rounded bg-azul_escuro text-white hover:bg-laranja_escuro">Salvar</button>
            </div>
        </form>
    )
}
