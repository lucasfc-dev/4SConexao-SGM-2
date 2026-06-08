'use client'

import { useState, useEffect } from 'react'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { FiLoader } from 'react-icons/fi'
import { FaDownload, FaTrash } from 'react-icons/fa'
import Cookies from 'js-cookie'
import { useAuth } from '@/app/context/AuthContext'

const acUrl = process.env.NEXT_PUBLIC_AC_ENDPOINT_URL

export default function FiscalizacaoContrato() {
    const { user } = useAuth()
    const token = Cookies.get('auth-token')
    const [contratosSelectList, setContratosSelectList] = useState([])
    const [loading, setLoading] = useState(false)
    const [loadingRelatorios, setLoadingRelatorios] = useState(false)
    const [relatoriosFiscalizacao, setRelatoriosFiscalizacao] = useState([])
    
    const [formData, setFormData] = useState({
        contrato_id: '',
        competencia: '',
        fundamento_legal: '',
        constatacoes: '',
        conclusao: ''
    })

    useEffect(() => {
        fetchRelatoriosFiscalizacao()
    }, [])

    useEffect(() => {
        if (!token) return
        const url = `${acUrl}/contrato/?relations=secao__orgao&limit=500`
        fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data) setContratosSelectList(Array.isArray(data) ? data : (data.results || []))
            })
            .catch(() => {})
    }, [token])

    const fetchRelatoriosFiscalizacao = async () => {
        try {
            setLoadingRelatorios(true)
            const url = `${acUrl}/fiscalizacao_contrato/`
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            })
            
            if (response.ok) {
                const relatorios = await response.json()
                setRelatoriosFiscalizacao(relatorios)
            }
        } catch (error) {
            console.error('Erro ao carregar relatórios:', error)
            toast.error('Erro ao carregar relatórios de fiscalização')
        } finally {
            setLoadingRelatorios(false)
        }
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (!formData.contrato_id) {
            toast.error('Selecione um contrato')
            return
        }

        try {
            setLoading(true)
            const response = await fetch(`${acUrl}/fiscalizacao_contrato/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })

            if (response.ok) {
                const novoRelatorio = await response.json()
                toast.success('Relatório de fiscalização criado com sucesso!')
                
                setFormData({
                    contrato_id: '',
                    competencia: '',
                    fundamento_legal: '',
                    constatacoes: '',
                    conclusao: ''
                })
                
                // Atualizar lista de relatórios
                await fetchRelatoriosFiscalizacao()
            } else {
                const errorData = await response.json()
                toast.error('Erro ao criar relatório: ' + (errorData.detail || 'Erro desconhecido'))
            }
        } catch (error) {
            console.error('Erro ao criar relatório:', error)
            toast.error('Erro ao criar relatório de fiscalização')
        } finally {
            setLoading(false)
        }
    }

    const handleDownloadRelatorio = async (relatorio) => {
        try {
            const response = await fetch(`${acUrl}/fiscalizacao_contrato/${relatorio.id}/content/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            })

            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `relatorio_fiscalizacao_${relatorio.numero}.pdf`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
                toast.success('Download iniciado!')
            } else {
                throw new Error('Erro ao baixar relatório')
            }
        } catch (error) {
            console.error('Erro ao baixar relatório:', error)
            toast.error('Erro ao fazer download do relatório')
        }
    }

    const handleDeleteRelatorio = async (relatorio) => {
        if (!confirm(`Tem certeza que deseja deletar o relatório ${relatorio.numero}?`)) {
            return
        }

        try {
            const response = await fetch(`${acUrl}/fiscalizacao_contrato/${relatorio.id}/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            })

            if (response.ok) {
                toast.success('Relatório deletado com sucesso!')
                // Atualizar lista de relatórios
                await fetchRelatoriosFiscalizacao()
            } else {
                const errorData = await response.json()
                throw new Error(errorData.detail || 'Erro ao deletar relatório')
            }
        } catch (error) {
            console.error('Erro ao deletar relatório:', error)
            toast.error('Erro ao deletar relatório: ' + error.message)
        }
    }

    const getContratoById = (contratoId) => {
        return contratosSelectList.find(contrato => contrato.id === contratoId)
    }

    return (
        <section className="flex flex-col flex-grow overflow-auto text-azul_escuro gap-4 bg-gradient-to-br from-gray-200 to-gray-300 p-4">
            <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
            
            <div className="flex flex-col w-full mx-auto bg-white shadow-lg rounded-lg p-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-azul_escuro">Fiscalização de Contratos</h1>
                </div>

                {/* Formulário de Fiscalização */}
                <div className="bg-gray-50 rounded-lg p-6 mb-8">
                    <h2 className="text-xl font-semibold text-azul_escuro mb-4">Criar Relatório de Fiscalização</h2>
                    
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Contrato *
                            </label>
                            <select
                                name="contrato_id"
                                value={formData.contrato_id}
                                onChange={handleInputChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul_escuro focus:border-azul_escuro"
                            >
                                <option value="">Selecione um contrato</option>
                                {contratosSelectList.map(contrato => (
                                    <option key={contrato.id} value={contrato.id}>
                                        {contrato.num_contrato} - {contrato.objeto}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Competência *
                            </label>
                            <input
                                type="text"
                                name="competencia"
                                value={formData.competencia}
                                onChange={handleInputChange}
                                required
                                placeholder="Ex: Janeiro/2025"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul_escuro focus:border-azul_escuro"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Fundamento Legal *
                            </label>
                            <input
                                type="text"
                                name="fundamento_legal"
                                value={formData.fundamento_legal}
                                onChange={handleInputChange}
                                required
                                placeholder="Ex: Lei 8.666/93, Art. 67"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul_escuro focus:border-azul_escuro"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Constatações *
                            </label>
                            <textarea
                                name="constatacoes"
                                value={formData.constatacoes}
                                onChange={handleInputChange}
                                required
                                rows={4}
                                placeholder="Descreva as constatações durante a fiscalização..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul_escuro focus:border-azul_escuro resize-vertical"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Conclusão *
                            </label>
                            <textarea
                                name="conclusao"
                                value={formData.conclusao}
                                onChange={handleInputChange}
                                required
                                rows={4}
                                placeholder="Descreva a conclusão da fiscalização..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul_escuro focus:border-azul_escuro resize-vertical"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-azul_escuro text-white px-6 py-3 rounded-lg hover:bg-laranja_escuro transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading && <FiLoader className="animate-spin" />}
                                {loading ? 'Criando Relatório...' : 'Criar Relatório de Fiscalização'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Lista de Relatórios */}
                <div>
                    <h2 className="text-xl font-semibold text-azul_escuro mb-4">Relatórios de Fiscalização</h2>
                    
                    {loadingRelatorios ? (
                        <div className="flex items-center justify-center py-8">
                            <FiLoader className="animate-spin text-azul_escuro" size={24} />
                            <span className="ml-2 text-azul_escuro">Carregando relatórios...</span>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                            {relatoriosFiscalizacao.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    <p>Nenhum relatório de fiscalização encontrado.</p>
                                    <p className="text-sm mt-2">Crie seu primeiro relatório usando o formulário acima.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full">
                                        <thead className="bg-azul_escuro bg-opacity-90 text-white">
                                            <tr>
                                                <th className="py-3 px-6 text-left font-medium">Número</th>
                                                <th className="py-3 px-6 text-left font-medium">Contrato</th>
                                                <th className="py-3 px-6 text-left font-medium">Data</th>
                                                <th className="py-3 px-6 text-center font-medium">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {relatoriosFiscalizacao.map((relatorio) => {
                                                const contrato = getContratoById(relatorio.contrato)
                                                return (
                                                    <tr key={relatorio.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="py-4 px-6 text-sm font-medium text-gray-900">
                                                            {relatorio.numero}
                                                        </td>
                                                        <td className="py-4 px-6 text-sm text-gray-600">
                                                            {contrato ? `${contrato.num_contrato} - ${contrato.objeto}` : 'Contrato não encontrado'}
                                                        </td>
                                                        <td className="py-4 px-6 text-sm text-gray-600">
                                                            {String(relatorio.pub_date).split('-').reverse().join('/')}
                                                        </td>
                                                        <td className="py-4 px-6 text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <button
                                                                    onClick={() => handleDownloadRelatorio(relatorio)}
                                                                    className="inline-flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                                                                    title="Baixar Relatório PDF"
                                                                >
                                                                    <FaDownload size={14} />
                                                                    Download
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteRelatorio(relatorio)}
                                                                    className="inline-flex items-center gap-2 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                                                                    title="Deletar Relatório"
                                                                >
                                                                    <FaTrash size={14} />
                                                                    Deletar
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}