'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/context/AuthContext'
import Cookies from 'js-cookie'
import { MdDownload, MdUploadFile, MdAdd, MdClose, MdPictureAsPdf, MdSettings, MdDelete, MdOutlineAssessment } from 'react-icons/md'
import { FiLoader } from 'react-icons/fi'
import { toast } from 'react-toastify'
import { motion, AnimatePresence } from 'framer-motion'

const ouvidoriaUrl = process.env.NEXT_PUBLIC_OUVIDORIA_ENDPOINT_URL

export default function RelatoriosOuvidoria() {
    const { user } = useAuth()
    const token = Cookies.get('auth-token')
    const [loading, setLoading] = useState(true)
    const [relatorios, setRelatorios] = useState([])
    const [showModalGerar, setShowModalGerar] = useState(false)
    const [showModalUpload, setShowModalUpload] = useState(false)
    const [showModalConfig, setShowModalConfig] = useState(false)
    const [loadingGerar, setLoadingGerar] = useState(false)
    const [loadingUpload, setLoadingUpload] = useState(false)

    const [configRelatorio, setConfigRelatorio] = useState({
        telefone: '',
        endereco: '',
        logo_relatorio_esic: null
    })

    const [dadosRelatorio, setDadosRelatorio] = useState({
        data_i: '',
        data_f: ''
    })

    const [dadosUpload, setDadosUpload] = useState({
        titulo: '',
        tipo_relatorio: '',
        data_inicio: '',
        data_fim: '',
        gerado_em: '',
        arquivo: null
    })

    useEffect(() => {
        if (user?.estabelecimento?.id) {
            fetchRelatorios()
            if (user?.estabelecimento?.config) {
                setConfigRelatorio({
                    telefone: user.estabelecimento.config.telefone || '',
                    endereco: user.estabelecimento.config.endereco || '',
                    logo_relatorio_esic: user.estabelecimento.config.logo_relatorio_esic || null
                })
            }
        } else {
            setLoading(false)
        }
    }, [user])

    const fetchRelatorios = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${ouvidoriaUrl}/relatorio/estabelecimento/${user.estabelecimento.id}/`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })
            if (!response.ok) throw new Error('Erro ao carregar relatórios')
            const data = await response.json()
            setRelatorios(data)
        } catch (error) {
            console.error('Erro ao buscar relatórios:', error)
            toast.error('Erro ao carregar relatórios')
        } finally {
            setLoading(false)
        }
    }

    const gerarRelatorioEsic = async () => {
        if (!dadosRelatorio.data_i || !dadosRelatorio.data_f) {
            toast.error('Preencha as datas')
            return
        }
        const config = user?.estabelecimento?.config
        if (!config?.telefone || !config?.endereco) {
            toast.error('Configure telefone e endereço antes de gerar o relatório')
            return
        }
        try {
            setLoadingGerar(true)
            const payload = {
                ...dadosRelatorio,
                telefone: config.telefone,
                endereco: config.endereco,
                logo_relatorio: config.logo_relatorio_esic
            }
            const response = await fetch(`${ouvidoriaUrl}/relatorio/esic/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            if (!response.ok) throw new Error('Erro ao gerar relatório')
            toast.success('Relatório gerado com sucesso!')
            setShowModalGerar(false)
            setDadosRelatorio({ data_i: '', data_f: '' })
            fetchRelatorios()
        } catch (error) {
            console.error('Erro ao gerar relatório:', error)
            toast.error('Erro ao gerar relatório')
        } finally {
            setLoadingGerar(false)
        }
    }

    const salvarConfiguracao = async () => {
        try {
            const authUrl = process.env.NEXT_PUBLIC_AUTH_ENDPOINT_URL
            const response = await fetch(`${authUrl}/estabelecimento/${user.estabelecimento.id}/config/`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    config: {
                        telefone: configRelatorio.telefone,
                        endereco: configRelatorio.endereco,
                        logo_relatorio_esic: configRelatorio.logo_relatorio_esic
                    }
                })
            })
            if (!response.ok) throw new Error('Erro ao salvar configuração')
            toast.success('Configurações salvas com sucesso!')
            setShowModalConfig(false)
            window.location.reload()
        } catch (error) {
            console.error('Erro ao salvar configuração:', error)
            toast.error('Erro ao salvar configuração')
        }
    }

    const uploadRelatorio = async () => {
        if (!dadosUpload.titulo || !dadosUpload.tipo_relatorio || !dadosUpload.data_inicio || !dadosUpload.data_fim || !dadosUpload.gerado_em || !dadosUpload.arquivo) {
            toast.error('Preencha todos os campos e selecione um arquivo')
            return
        }
        try {
            setLoadingUpload(true)
            const formData = new FormData()
            formData.append('file', dadosUpload.arquivo)
            formData.append('titulo', dadosUpload.titulo)
            formData.append('tipo_relatorio', dadosUpload.tipo_relatorio)
            formData.append('data_inicio', dadosUpload.data_inicio)
            formData.append('data_fim', dadosUpload.data_fim)
            formData.append('gerado_em', dadosUpload.gerado_em)
            const response = await fetch(`${ouvidoriaUrl}/relatorio/upload/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            })
            if (!response.ok) throw new Error('Erro ao fazer upload do relatório')
            toast.success('Relatório enviado com sucesso!')
            setShowModalUpload(false)
            setDadosUpload({ titulo: '', tipo_relatorio: '', data_inicio: '', data_fim: '', gerado_em: '', arquivo: null })
            fetchRelatorios()
        } catch (error) {
            console.error('Erro ao fazer upload:', error)
            toast.error('Erro ao fazer upload do relatório')
        } finally {
            setLoadingUpload(false)
        }
    }

    const downloadRelatorio = async (relatorioId, titulo) => {
        try {
            const response = await fetch(`${ouvidoriaUrl}/relatorio/${relatorioId}/download/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (!response.ok) throw new Error('Erro ao baixar relatório')
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${titulo}.pdf`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
            toast.success('Relatório baixado com sucesso!')
        } catch (error) {
            console.error('Erro ao baixar relatório:', error)
            toast.error('Erro ao baixar relatório')
        }
    }

    const deletarRelatorio = async (relatorioId, titulo) => {
        if (!confirm(`Tem certeza que deseja deletar o relatório "${titulo}"?`)) return
        try {
            const response = await fetch(`${ouvidoriaUrl}/relatorio/${relatorioId}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (!response.ok) throw new Error('Erro ao deletar relatório')
            toast.success('Relatório deletado com sucesso!')
            fetchRelatorios()
        } catch (error) {
            console.error('Erro ao deletar relatório:', error)
            toast.error('Erro ao deletar relatório')
        }
    }

    const formatarData = (dataString) => dataString?.split('-').reverse().join('/') ?? '-'

    const inputClass = "w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-azul_escuro/30 focus:border-azul_escuro transition-colors"
    const labelClass = "block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5"

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-branco_cinza">
                <FiLoader className="animate-spin text-4xl text-azul_escuro" />
            </div>
        )
    }

    return (
        <section className="flex flex-col flex-grow bg-branco_cinza overflow-auto text-azul_escuro p-4 md:p-8">

            {/* Header */}
            <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-azul_escuro rounded-lg">
                        <MdOutlineAssessment className="text-2xl text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-azul_escuro">Relatórios</h1>
                        <p className="text-sm text-gray-500 mt-0.5">{relatorios.length} relatório{relatorios.length !== 1 ? 's' : ''} cadastrado{relatorios.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setShowModalConfig(true)}
                        className="flex items-center gap-2 border border-gray-300 bg-white text-azul_escuro text-sm px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors shadow-sm font-semibold"
                    >
                        <MdSettings size={18} />
                        Configurar ESIC
                    </button>
                    <button
                        onClick={() => setShowModalUpload(true)}
                        className="flex items-center gap-2 border border-gray-300 bg-white text-azul_escuro text-sm px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors shadow-sm font-semibold"
                    >
                        <MdUploadFile size={18} />
                        Upload
                    </button>
                    <button
                        onClick={() => setShowModalGerar(true)}
                        className="flex items-center gap-2 bg-laranja_escuro text-white text-sm px-4 py-2 rounded-xl hover:opacity-90 transition-opacity shadow-sm font-semibold"
                    >
                        <MdAdd size={18} />
                        Gerar Relatório
                    </button>
                </div>
            </div>

            {/* Tabela */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                {relatorios.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <MdPictureAsPdf size={56} className="mb-3 text-gray-300" />
                        <p className="font-semibold text-base text-gray-500">Nenhum relatório encontrado</p>
                        <p className="text-sm mt-1">Gere ou faça upload de relatórios para começar</p>
                    </div>
                ) : (
                    <table className="min-w-full">
                        <thead>
                            <tr className="bg-azul_escuro bg-opacity-90 text-branco_cinza uppercase text-xs">
                                <th className="px-4 py-3 text-left font-semibold tracking-wider">Título</th>
                                <th className="px-4 py-3 text-left font-semibold tracking-wider">Período</th>
                                <th className="px-4 py-3 text-left font-semibold tracking-wider">Gerado em</th>
                                <th className="px-4 py-3 text-left font-semibold tracking-wider">Tipo</th>
                                <th className="px-4 py-3 text-right font-semibold tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            <AnimatePresence>
                                {relatorios.map((relatorio, i) => (
                                    <motion.tr
                                        key={relatorio.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2, delay: i * 0.04 }}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <MdPictureAsPdf className="text-red-500 shrink-0" size={20} />
                                                <span className="text-sm font-semibold text-azul_escuro">{relatorio.titulo}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {formatarData(relatorio.data_inicio)} — {formatarData(relatorio.data_fim)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {formatarData(relatorio.gerado_em)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-azul_escuro/10 text-azul_escuro">
                                                {relatorio.tipo_relatorio}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => downloadRelatorio(relatorio.id, relatorio.titulo)}
                                                    className="p-1.5 rounded-lg text-azul_escuro hover:bg-azul_escuro/10 transition-colors"
                                                    title="Baixar"
                                                >
                                                    <MdDownload size={18} />
                                                </button>
                                                <button
                                                    onClick={() => deletarRelatorio(relatorio.id, relatorio.titulo)}
                                                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                                                    title="Deletar"
                                                >
                                                    <MdDelete size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal Configurar ESIC */}
            <AnimatePresence>
                {showModalConfig && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.18 }}
                            className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
                        >
                            <div className="bg-azul_escuro px-5 py-3 flex items-center justify-between rounded-t-xl">
                                <h2 className="text-base font-bold text-white flex items-center gap-2">
                                    <MdSettings size={18} /> Configurar Relatório ESIC
                                </h2>
                                <button onClick={() => setShowModalConfig(false)} className="text-white/70 hover:text-white transition-colors">
                                    <MdClose size={20} />
                                </button>
                            </div>
                            <div className="p-5 space-y-4">
                                <div>
                                    <label className={labelClass}>Telefone</label>
                                    <input type="text" value={configRelatorio.telefone}
                                        onChange={(e) => setConfigRelatorio({ ...configRelatorio, telefone: e.target.value })}
                                        className={inputClass} placeholder="(00) 00000-0000" />
                                </div>
                                <div>
                                    <label className={labelClass}>Endereço</label>
                                    <input type="text" value={configRelatorio.endereco}
                                        onChange={(e) => setConfigRelatorio({ ...configRelatorio, endereco: e.target.value })}
                                        className={inputClass} placeholder="Rua, número, cidade - UF" />
                                </div>
                                <div>
                                    <label className={labelClass}>Logo</label>
                                    <input type="file" accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files[0]
                                            if (file) {
                                                const reader = new FileReader()
                                                reader.onloadend = () => {
                                                    const base64 = reader.result.split(',')[1]
                                                    setConfigRelatorio({ ...configRelatorio, logo_relatorio_esic: base64 })
                                                }
                                                reader.readAsDataURL(file)
                                            }
                                        }}
                                        className={inputClass} />
                                </div>
                            </div>
                            <div className="px-5 pb-5 flex justify-end gap-2">
                                <button onClick={() => setShowModalConfig(false)}
                                    className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors font-semibold">
                                    Cancelar
                                </button>
                                <button onClick={salvarConfiguracao}
                                    className="px-4 py-2 text-sm rounded-xl bg-laranja_escuro text-white hover:opacity-90 transition-opacity font-semibold">
                                    Salvar
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal Gerar Relatório */}
            <AnimatePresence>
                {showModalGerar && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.18 }}
                            className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
                        >
                            <div className="bg-azul_escuro px-5 py-3 flex items-center justify-between rounded-t-xl">
                                <h2 className="text-base font-bold text-white flex items-center gap-2">
                                    <MdAdd size={18} /> Gerar Relatório ESIC
                                </h2>
                                <button onClick={() => setShowModalGerar(false)} className="text-white/70 hover:text-white transition-colors">
                                    <MdClose size={20} />
                                </button>
                            </div>
                            <div className="p-5 space-y-4">
                                <div>
                                    <label className={labelClass}>Data Início</label>
                                    <input type="date" value={dadosRelatorio.data_i}
                                        onChange={(e) => setDadosRelatorio({ ...dadosRelatorio, data_i: e.target.value })}
                                        className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Data Fim</label>
                                    <input type="date" value={dadosRelatorio.data_f}
                                        onChange={(e) => setDadosRelatorio({ ...dadosRelatorio, data_f: e.target.value })}
                                        className={inputClass} />
                                </div>
                            </div>
                            <div className="px-5 pb-5 flex justify-end gap-2">
                                <button onClick={() => setShowModalGerar(false)} disabled={loadingGerar}
                                    className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50">
                                    Cancelar
                                </button>
                                <button onClick={gerarRelatorioEsic} disabled={loadingGerar}
                                    className="px-4 py-2 text-sm rounded-xl bg-laranja_escuro text-white hover:opacity-90 transition-opacity font-semibold disabled:opacity-50 flex items-center gap-2">
                                    {loadingGerar ? <><FiLoader className="animate-spin" /> Gerando...</> : 'Gerar Relatório'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal Upload Relatório */}
            <AnimatePresence>
                {showModalUpload && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.18 }}
                            className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
                        >
                            <div className="bg-azul_escuro px-5 py-3 flex items-center justify-between rounded-t-xl">
                                <h2 className="text-base font-bold text-white flex items-center gap-2">
                                    <MdUploadFile size={18} /> Upload de Relatório
                                </h2>
                                <button onClick={() => setShowModalUpload(false)} className="text-white/70 hover:text-white transition-colors">
                                    <MdClose size={20} />
                                </button>
                            </div>
                            <div className="p-5 space-y-4">
                                <div>
                                    <label className={labelClass}>Título</label>
                                    <input type="text" value={dadosUpload.titulo}
                                        onChange={(e) => setDadosUpload({ ...dadosUpload, titulo: e.target.value })}
                                        className={inputClass} placeholder="Ex: Relatório ESIC Mensal" />
                                </div>
                                <div>
                                    <label className={labelClass}>Tipo</label>
                                    <select value={dadosUpload.tipo_relatorio}
                                        onChange={(e) => setDadosUpload({ ...dadosUpload, tipo_relatorio: e.target.value })}
                                        className={inputClass}>
                                        <option value="">Selecione o tipo</option>
                                        <option value="ESIC">ESIC</option>
                                        <option value="Classificados">Classificados</option>
                                        <option value="Desclassificados">Desclassificados</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Data Início</label>
                                        <input type="date" value={dadosUpload.data_inicio}
                                            onChange={(e) => setDadosUpload({ ...dadosUpload, data_inicio: e.target.value })}
                                            className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Data Fim</label>
                                        <input type="date" value={dadosUpload.data_fim}
                                            onChange={(e) => setDadosUpload({ ...dadosUpload, data_fim: e.target.value })}
                                            className={inputClass} />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>Gerado em</label>
                                    <input type="date" value={dadosUpload.gerado_em}
                                        onChange={(e) => setDadosUpload({ ...dadosUpload, gerado_em: e.target.value })}
                                        className={inputClass} />
                                </div>
                                <div>
                                    <label className={labelClass}>Arquivo PDF</label>
                                    <input type="file" accept=".pdf"
                                        onChange={(e) => setDadosUpload({ ...dadosUpload, arquivo: e.target.files[0] })}
                                        className={inputClass} />
                                    {dadosUpload.arquivo && (
                                        <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                                            <MdPictureAsPdf className="text-red-400" /> {dadosUpload.arquivo.name}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="px-5 pb-5 flex justify-end gap-2">
                                <button onClick={() => setShowModalUpload(false)} disabled={loadingUpload}
                                    className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50">
                                    Cancelar
                                </button>
                                <button onClick={uploadRelatorio} disabled={loadingUpload}
                                    className="px-4 py-2 text-sm rounded-xl bg-laranja_escuro text-white hover:opacity-90 transition-opacity font-semibold disabled:opacity-50 flex items-center gap-2">
                                    {loadingUpload ? <><FiLoader className="animate-spin" /> Enviando...</> : 'Enviar Relatório'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </section>
    )
}
