'use client'
import { useEffect, useState } from 'react'

export default function Formulario({ campos, dadosIniciais = {}, onSubmit }) {
    const [formData, setFormData] = useState(dadosIniciais)

    useEffect(() => {
        setFormData(dadosIniciais)
    }, [dadosIniciais])

    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target
        let novoValor

        if (type === 'checkbox') {
            novoValor = checked
        } else if (type === 'file') {
            novoValor = files && files.length > 0 ? files[0] : null
        } else {
            novoValor = value
        }

        setFormData(prev => ({ ...prev, [name]: novoValor }))
    }

    // Add CPF formatting helper and change handler
    const formatCPF = (value) => {
        const v = value.replace(/\D/g, '').slice(0, 11)
        return v
            .replace(/^(\d{3})(\d)/, '$1.$2')
            .replace(/^(\d{3}\.\d{3})(\d)/, '$1.$2')
            .replace(/^(\d{3}\.\d{3}\.\d{3})(\d)/, '$1-$2')
    }

    const handleCPFChange = (e) => {
        const { name, value } = e.target
        const raw = value.replace(/\D/g, '')
        setFormData(prev => ({ ...prev, [name]: raw }))
    }
    // Add CNPJ formatting helper and change handler
    const formatCNPJ = (value) => {
        const v = value.replace(/\D/g, '').slice(0, 14)
        return v
            .replace(/^(\d{2})(\d)/, '$1.$2')
            .replace(/^(\d{2}\.\d{3})(\d)/, '$1.$2')
            .replace(/^(\d{2}\.\d{3}\.\d{3})(\d)/, '$1/$2')
            .replace(/^(\d{2}\.\d{3}\.\d{3}\/\d{4})(\d)/, '$1-$2')
    }

    const handleCNPJChange = (e) => {
        const { name, value } = e.target
        const raw = value.replace(/\D/g, '')
        setFormData(prev => ({ ...prev, [name]: raw }))
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        const dadosAlterados = Object.keys(formData).reduce((acc, key) => {
            // Para arquivos, sempre incluir se existir
            if (formData[key] instanceof File) {
                acc[key] = formData[key]
            } else if (formData[key] !== dadosIniciais[key] && formData[key] !== undefined && formData[key] !== '') {
                acc[key] = formData[key]
            }
            return acc
        }, {})

        // Se não há dados iniciais (novo registro), incluir todos os campos preenchidos
        if (Object.keys(dadosIniciais).length === 0) {
            Object.keys(formData).forEach(key => {
                if (formData[key] !== undefined && formData[key] !== '' && formData[key] !== null) {
                    dadosAlterados[key] = formData[key]
                }
            })
        }

        onSubmit(dadosAlterados)
    }
    return (
        <form onSubmit={handleSubmit} className="flex w-full flex-col p-4 overflow-auto gap-4">
            <div className='flex flex-col gap-2 p-2 overflow-auto'>
                {campos.map((campo) => (
                    <div className="flex flex-col gap-1" key={campo.name}>
                        <label className="text-sm font-medium text-gray-700">{campo.label}</label>

                        {campo.type === 'select' ? (
                            <select
                                key={campo.id}
                                name={campo.name}
                                value={formData[campo.name] || ''}
                                onChange={handleChange}
                                required={campo.required || false}
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul_escuro focus:border-azul_escuro"
                            >
                                <option value="">Selecione</option>
                                {campo.options?.map(option => (
                                    <option key={option.id || option.value} value={option.value || option.pessoa_id || option.id}>
                                        {option.label || option.nome || option.nome_fantasia}
                                    </option>
                                ))}
                            </select>
                        ) : campo.type === 'checkbox' ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    name={campo.name}
                                    checked={formData[campo.name] || false}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-azul_escuro border-gray-300 rounded focus:ring-azul_escuro"
                                />
                            </div>
                        ) : campo.type === 'cpf' ? (
                            <input
                                type="text"
                                name={campo.name}
                                value={formatCPF(formData[campo.name] || '')}
                                onChange={handleCPFChange}
                                required={campo.required || false}
                                maxLength={14}
                                minLength={14}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul_escuro focus:border-azul_escuro"
                            />
                        ) : campo.type === 'cnpj' ? (
                            <input
                                type="text"
                                name={campo.name}
                                value={formatCNPJ(formData[campo.name] || '')}
                                onChange={handleCNPJChange}
                                required={campo.required || false}
                                maxLength={18}
                                minLength={18}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul_escuro focus:border-azul_escuro"
                            />
                        ) : campo.type === 'file' ? (
                            <>
                                {campo.customButton && campo.customButton}
                                <input
                                    type="file"
                                    name={campo.name}
                                    onChange={handleChange}
                                    required={campo.required || false}
                                    accept={campo.accept || "image/*"}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul_escuro focus:border-azul_escuro file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-azul_escuro file:text-white hover:file:bg-azul_claro"
                                />
                            </>
                        )
                            : campo.type === 'textarea' ? (
                                <textarea
                                    type={campo.type || 'text'}
                                    name={campo.name}
                                    readOnly={campo.readOnly}
                                    placeholder={campo.placeholder || ''}
                                    value={formData[campo.name] || ''}
                                    onChange={handleChange}
                                    required={campo.required || false}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul_escuro focus:border-azul_escuro"
                                />

                            ) : (
                                <input
                                    type={campo.type || 'text'}
                                    name={campo.name}
                                    readOnly={campo.readOnly}
                                    placeholder={campo.placeholder || ''}
                                    value={formData[campo.name] || ''}
                                    onChange={handleChange}
                                    required={campo.required || false}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul_escuro focus:border-azul_escuro"
                                />
                            )}
                    </div>
                ))}
            </div>

            <div className="flex w-full gap-3 pt-2">
                <button
                    type="submit"
                    className="px-2 py-3 w-full bg-azul_escuro text-white font-medium rounded hover:bg-laranja_escuro transition-colors"
                >
                    {formData.id ? 'Salvar Alterações' : 'Adicionar'}
                </button>
            </div>
        </form>

    )
}
