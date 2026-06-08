'use client'

import { useState } from 'react'
import { FaSearch, FaFilter, FaTimes, FaChevronDown, FaChevronUp } from 'react-icons/fa'

export default function FormularioFiltrosAvancado({
    titulo = "Filtros",
    filtros,
    onFiltroChange,
    onLimparFiltros,
    labelsMap = {},
    children
}) {
    const [expandido, setExpandido] = useState(false)
    const [filtrosAtivos, setFiltrosAtivos] = useState(0)

    console.log(filtros)
    // Conta quantos filtros estão ativos
    const contarFiltrosAtivos = () => {
        if (!filtros) return 0
        return Object.values(filtros).filter(valor => valor && valor !== '').length
    }

    const handleLimparTodos = () => {
        if (onLimparFiltros) {
            onLimparFiltros()
        }
    }

    return (
        <div className="bg-gradient-to-br from-white overflow-auto via-gray-50 to-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Header do formulário */}
            <div className=" bg-azul_escuro px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <FaFilter className="text-white text-lg" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{titulo}</h2>
                            <p className="text-blue-100 text-sm">
                                {contarFiltrosAtivos()} filtro(s) ativo(s)
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {contarFiltrosAtivos() > 0 && (
                            <button
                                onClick={handleLimparTodos}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl"
                            >
                                <FaTimes size={12} />
                                Limpar Filtros
                            </button>
                        )}

                        <button
                            onClick={() => setExpandido(!expandido)}
                            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-200"
                        >
                            {expandido ? (
                                <FaChevronUp className="text-white" />
                            ) : (
                                <FaChevronDown className="text-white" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Conteúdo do formulário */}
            <div className={`transition-all overflow-auto duration-300 ease-in-out ${expandido ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
                }`}>
                <div className="p-6 md:p-8">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                        {children}
                    </div>

                    {/* Indicadores visuais de filtros ativos */}
                    {contarFiltrosAtivos() > 0 && (
                        <div className="mt-6 pt-4 border-t border-gray-200">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <FaSearch className="text-laranja_escuro" />
                                <span className="font-medium">Filtros ativos:</span>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(filtros || {}).map(([key, value]) => {
                                        if (value && value !== '') {
                                            const keysHashMap = {
                                                'titulo__icontains': 'Título',
                                                'descricao': 'Descrição',
                                                'tipo': 'Tipo',
                                                'situacao': 'Situação',
                                                'orgao': 'Órgão',
                                                'orgaoId': 'Órgão',
                                                'pub_date__gte': 'Data de Publicação (Início)',
                                                'pub_date__lte': 'Data de Publicação (Fim)',
                                                'julg_date__gte': 'Data de Julgamento (Início)',
                                                'julg_date__lte': 'Data de Julgamento (Fim)',
                                                'data_inicio__gte': 'Data de Vigência (Início)',
                                                'data_inicio__lte': 'Data de Vigência (Fim)',
                                                'data_vencimento__gte': 'Data de Vencimento (Início)',
                                                'data_vencimento__lte': 'Data de Vencimento (Fim)',
                                                'homolog_date__gte': 'Data de Homologação (Início)',
                                                'homolog_date__lte': 'Data de Homologação (Fim)',
                                                'objeto': 'Objeto',
                                                'num_processo__icontains': 'Número do Processo',
                                                'num_contrato__icontains': 'Número do Contrato',
                                                'objeto__icontains': 'Objeto',
                                                'fiscal_contrato': 'Fiscal do Contrato'
                                            }
                                            const displayValue = labelsMap?.[key]?.[value] ?? String(value)
                                            return (
                                                <span
                                                    key={key}
                                                    className="px-3 py-1 bg-gradient-to-r from-laranja_escuro to-laranja_claro text-white text-xs rounded-full font-medium shadow-md"
                                                >
                                                    {keysHashMap[key]}: {displayValue.substring(0, 30)}
                                                    {displayValue.length > 30 && '...'}
                                                </span>
                                            )
                                        }
                                        return null
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// Componente para campo de input
export function CampoInput({
    label,
    name,
    value,
    onChange,
    placeholder,
    nameVisible,
    type = "text",
    colSpan = "md:col-span-3",
    icone
}) {
    return (
        <div className={`${colSpan} flex flex-col group`}>
            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                {icone && <span className="text-laranja_escuro">{icone}</span>}
                {label}
            </label>
            <div className="relative">
                <input
                    type={type}
                    name={nameVisible}
                    value={value || ''}
                    onChange={(e) => onChange(name, e.target.value)}
                    placeholder={placeholder}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm 
                             focus:ring-2 focus:ring-laranja_escuro focus:border-laranja_escuro 
                             focus:outline-none transition-all duration-200 
                             hover:border-gray-400 shadow-sm hover:shadow-md
                             group-hover:shadow-md"
                />
                {value && (
                    <button
                        onClick={() => onChange(name, '')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                        <FaTimes size={12} />
                    </button>
                )}
            </div>
        </div>
    )
}

// Componente para campo de select
export function CampoSelect({
    label,
    name,
    value,
    onChange,
    options,
    placeholder = "Selecione...",
    colSpan = "md:col-span-2",
    icone
}) {
    return (
        <div className={`${colSpan} flex flex-col group`}>
            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                {icone && <span className="text-laranja_escuro">{icone}</span>}
                {label}
            </label>
            <div className="relative">
                <select
                    name={name}
                    value={value || ''}
                    onChange={(e) => onChange(name, e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm 
                             focus:ring-2 focus:ring-laranja_escuro focus:border-laranja_escuro 
                             focus:outline-none transition-all duration-200 
                             hover:border-gray-400 shadow-sm hover:shadow-md
                             group-hover:shadow-md appearance-none cursor-pointer"
                >
                    <option value="">{placeholder}</option>
                    {options?.map(option => (
                        <option key={option.id || option.value} value={option.pessoa?.pessoa_id || option.id || option.value}>
                            {option.nome || option.label || option.text || option.pessoa?.razao_social || option.pessoa?.nome}
                        </option>
                    ))}
                </select>
                <FaChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                {value && (
                    <button
                        onClick={() => onChange(name, '')}
                        className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors z-10"
                    >
                        <FaTimes size={12} />
                    </button>
                )}
            </div>
        </div>
    )
}

// Componente para campo de data
export function CampoData({
    label,
    name,
    value,
    onChange,
    colSpan,
    icone
}) {
    return (
        <div className={`${colSpan} flex flex-col group`}>
            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                {icone && <span className="text-laranja_escuro">{icone}</span>}
                {label}
            </label>
            <div className="relative">
                <input
                    type="date"
                    name={name}
                    value={value || ''}
                    onChange={(e) => onChange(name, e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm 
                             focus:ring-2 focus:ring-laranja_escuro focus:border-laranja_escuro 
                             focus:outline-none transition-all duration-200 
                             hover:border-gray-400 shadow-sm hover:shadow-md
                             group-hover:shadow-md"
                />
                {value && (
                    <button
                        onClick={() => onChange(name, '')}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                        <FaTimes size={12} />
                    </button>
                )}
            </div>
        </div>
    )
}
