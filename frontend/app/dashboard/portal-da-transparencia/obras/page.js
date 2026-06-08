'use client'
import { useState, useEffect } from 'react'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { FaEdit, FaPlus, FaSearch, FaDownload } from 'react-icons/fa'
import { MdDelete } from 'react-icons/md'
import { FiLoader } from 'react-icons/fi'
import Modal from '@/app/components/modal'
import PaginacaoAvancada from '@/app/components/PaginacaoAvancada'
import DescricaoTruncada from '@/app/components/DescricaoTruncada'
import { cadastrarObra, editarObra, excluirObra, listarObras, obterArquivoObra } from '../api/obras/obras'
import { useAuth } from '@/app/context/AuthContext'

const SITUACOES = [
    { value: 'nao_iniciada', label: 'Não Iniciada' },
    { value: 'em_andamento', label: 'Em Andamento' },
    { value: 'paralisada', label: 'Paralisada' },
    { value: 'concluida', label: 'Concluída' },
    { value: 'cancelada', label: 'Cancelada' },
]

const situacaoLabel = (valor) => SITUACOES.find(s => s.value === valor)?.label || valor

export default function Obras() {
    const [registros, setRegistros] = useState([])
    const [loading, setLoading] = useState(false)
    const [mostrarFormulario, setMostrarFormulario] = useState(false)
    const { user } = useAuth()
    const [editando, setEditando] = useState(false)
    const [modalEdicao, setModalEdicao] = useState(false)
    const [registroSelecionado, setRegistroSelecionado] = useState(null)
    const [filtros, setFiltros] = useState({
        empresaContratada: '', situacao: '',
        dataInicioInicial: '', dataInicioFinal: '',
        dataConclusaoInicial: '', dataConclusaoFinal: ''
    })
    const [paginaAtual, setPaginaAtual] = useState(1)
    const [itensPorPagina, setItensPorPagina] = useState(10)
    const [totalRegistros, setTotalRegistros] = useState(0)

    const [formData, setFormData] = useState({
        objeto: '', situacao: 'nao_iniciada', dataInicio: '', dataConclusao: '',
        empresaContratada: '', percentualConcluido: '', arquivo: null
    })

    const resetForm = () => setFormData({
        objeto: '', situacao: 'nao_iniciada', dataInicio: '', dataConclusao: '',
        empresaContratada: '', percentualConcluido: '', arquivo: null
    })

    const recarregarRegistros = async (filtrosParaPesquisa = {}, pagina = 1) => {
        if (user && user.estabelecimento) {
            try {
                setLoading(true)
                const filtrosAPI = {}
                if (filtrosParaPesquisa.empresaContratada) filtrosAPI.empresa_contratada = filtrosParaPesquisa.empresaContratada
                if (filtrosParaPesquisa.situacao) filtrosAPI.situacao = filtrosParaPesquisa.situacao
                if (filtrosParaPesquisa.dataInicioInicial) filtrosAPI.data_inicio__gte = filtrosParaPesquisa.dataInicioInicial
                if (filtrosParaPesquisa.dataInicioFinal) filtrosAPI.data_inicio__lte = filtrosParaPesquisa.dataInicioFinal
                if (filtrosParaPesquisa.dataConclusaoInicial) filtrosAPI.data_conclusao__gte = filtrosParaPesquisa.dataConclusaoInicial
                if (filtrosParaPesquisa.dataConclusaoFinal) filtrosAPI.data_conclusao__lte = filtrosParaPesquisa.dataConclusaoFinal

                const registrosData = await listarObras(user.estabelecimento.id, pagina, itensPorPagina, filtrosAPI)
                setRegistros(registrosData.data)
                setTotalRegistros(registrosData.total || 0)
                setPaginaAtual(pagina)
            } catch (error) {
                toast.error('Erro ao carregar registros: ' + error.message)
            } finally {
                setLoading(false)
            }
        }
    }

    useEffect(() => { recarregarRegistros({}, 1) }, [user])

    const handleInputChange = (e) => {
        const { name, value, type, files } = e.target
        if (type === 'file') {
            setFormData(prev => ({ ...prev, [name]: files[0] }))
        } else {
            setFormData(prev => ({ ...prev, [name]: value }))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const dadosEnvio = {
                objeto: formData.objeto,
                situacao: formData.situacao,
                dataInicio: formData.dataInicio,
                dataConclusao: formData.dataConclusao || null,
                empresaContratada: formData.empresaContratada,
                percentualConcluido: formData.percentualConcluido,
                arquivo: formData.arquivo
            }
            if (!editando) {
                await cadastrarObra(dadosEnvio)
                toast.success('Obra cadastrada com sucesso!')
            } else {
                await editarObra(registroSelecionado.id, dadosEnvio)
                toast.success('Obra atualizada com sucesso!')
            }
            await recarregarRegistros()
            resetForm()
            setMostrarFormulario(false)
            setModalEdicao(false)
            setEditando(false)
            setRegistroSelecionado(null)
        } catch (error) {
            toast.error('Erro ao salvar obra: ' + error.message)
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleEditar = (registro) => {
        setRegistroSelecionado(registro)
        setFormData({
            objeto: registro.objeto || '',
            situacao: registro.situacao || 'nao_iniciada',
            dataInicio: registro.data_inicio || '',
            dataConclusao: registro.data_conclusao || '',
            empresaContratada: registro.empresa_contratada || '',
            percentualConcluido: registro.percentual_concluido || '',
            arquivo: null
        })
        setEditando(true)
        setModalEdicao(true)
    }

    const handleDownload = async (registro) => {
        try {
            setLoading(true)
            const blob = await obterArquivoObra(registro.id)
            if (blob && blob.size > 0) {
                const url = URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = `${registro.empresa_contratada}.pdf`
                link.style.display = 'none'
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                URL.revokeObjectURL(url)
                toast.success('Download realizado com sucesso!')
            } else {
                toast.error('Arquivo não disponível ou vazio')
            }
        } catch (error) {
            toast.error('Erro ao fazer download: ' + error.message)
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleDeletar = async (registro) => {
        if (window.confirm('Tem certeza que deseja deletar esta obra?')) {
            try {
                setLoading(true)
                await excluirObra(registro.id)
                await recarregarRegistros(filtros, paginaAtual)
                toast.success('Obra deletada com sucesso!')
            } catch (error) {
                toast.error('Erro ao deletar obra: ' + error.message)
                console.error(error)
            } finally {
                setLoading(false)
            }
        }
    }

    const handleFiltroChange = (campo, valor) => setFiltros(prev => ({ ...prev, [campo]: valor }))
    const handlePesquisar = async () => { setPaginaAtual(1); await recarregarRegistros(filtros, 1) }
    const handleLimparFiltros = async () => {
        const filtrosLimpos = { empresaContratada: '', situacao: '', dataInicioInicial: '', dataInicioFinal: '', dataConclusaoInicial: '', dataConclusaoFinal: '' }
        setFiltros(filtrosLimpos)
        setPaginaAtual(1)
        await recarregarRegistros(filtrosLimpos, 1)
    }
    const handleMudancaPagina = async (novaPagina) => { setPaginaAtual(novaPagina); await recarregarRegistros(filtros, novaPagina) }

    const acoes = [
        { nome: <FaEdit size={28} className="text-green-800 hover:text-green-900 transition-colors" />, handler: handleEditar },
        { nome: <FaDownload size={28} className="text-azul_escuro hover:text-blue-800 transition-colors" />, handler: handleDownload },
        { nome: <MdDelete size={28} className="text-red-600 hover:text-red-800 transition-colors" />, handler: handleDeletar },
    ]

    const camposFormulario = (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Objeto da Obra *</label>
                <textarea name="objeto" value={formData.objeto} onChange={handleInputChange} rows={3} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none" />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Situação *</label>
                <select name="situacao" value={formData.situacao} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none">
                    {SITUACOES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Empresa Contratada *</label>
                <input type="text" name="empresaContratada" value={formData.empresaContratada} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none" />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Data de Início *</label>
                <input type="date" name="dataInicio" value={formData.dataInicio} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none" />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Data de Conclusão</label>
                <input type="date" name="dataConclusao" value={formData.dataConclusao} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none" />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Percentual Concluído (%) *</label>
                <input type="number" name="percentualConcluido" value={formData.percentualConcluido} onChange={handleInputChange} min="0" max="100" step="0.01" className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none" />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Arquivo (opcional)</label>
                <input type="file" name="arquivo" onChange={handleInputChange} accept=".pdf" className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none" />
                {formData.arquivo && <p className="text-sm text-gray-600 mt-1">Arquivo selecionado: {formData.arquivo.name}</p>}
            </div>
        </div>
    )

    return (
        <section className="flex flex-col flex-grow overflow-auto text-azul_escuro gap-4 bg-gradient-to-br from-gray-200 to-gray-300 p-4">
            <ToastContainer />

            <div className="flex gap-4">
                <button onClick={() => { setMostrarFormulario(true); resetForm() }} className={`px-4 py-2 rounded-md flex items-center gap-2 ${mostrarFormulario ? 'bg-orange-600 text-white' : 'bg-gray-300 text-black'}`}>
                    <FaPlus size={16} /> Cadastro
                </button>
                <button onClick={() => setMostrarFormulario(false)} className={`px-4 py-2 rounded-md flex items-center gap-2 ${!mostrarFormulario ? 'bg-orange-600 text-white' : 'bg-gray-300 text-black'}`}>
                    <FaSearch size={16} /> Registros
                </button>
            </div>

            <div className="flex flex-col w-full mx-auto bg-white shadow-lg rounded-lg p-4">
                {mostrarFormulario ? (
                    <>
                        <h1 className="text-lg font-bold mb-4">Cadastro de Obras</h1>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            {camposFormulario}
                            <div className="flex gap-4 justify-end mt-6">
                                <button type="button" onClick={() => { resetForm(); setMostrarFormulario(false); setEditando(false); setRegistroSelecionado(null) }} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors">Cancelar</button>
                                <button type="submit" disabled={loading} className="px-4 py-2 bg-azul_escuro text-white rounded hover:bg-laranja_escuro transition-colors disabled:opacity-50 flex items-center gap-2">
                                    {loading && <FiLoader className="animate-spin" />}
                                    {loading ? 'Salvando...' : 'Salvar'}
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <>
                        <h1 className="text-lg font-bold mb-4">Obras</h1>
                        <div className="bg-gray-50 rounded p-4 mb-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Empresa Contratada</label>
                                    <input type="text" value={filtros.empresaContratada} onChange={(e) => handleFiltroChange('empresaContratada', e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none" placeholder="Filtrar por empresa..." />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Situação</label>
                                    <select value={filtros.situacao} onChange={(e) => handleFiltroChange('situacao', e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none">
                                        <option value="">Todas</option>
                                        {SITUACOES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Início De</label>
                                    <input type="date" value={filtros.dataInicioInicial} onChange={(e) => handleFiltroChange('dataInicioInicial', e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Início Até</label>
                                    <input type="date" value={filtros.dataInicioFinal} onChange={(e) => handleFiltroChange('dataInicioFinal', e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Conclusão De</label>
                                    <input type="date" value={filtros.dataConclusaoInicial} onChange={(e) => handleFiltroChange('dataConclusaoInicial', e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Conclusão Até</label>
                                    <input type="date" value={filtros.dataConclusaoFinal} onChange={(e) => handleFiltroChange('dataConclusaoFinal', e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none" />
                                </div>
                            </div>
                            <div className="flex gap-2 justify-end mt-4">
                                <button type="button" onClick={handleLimparFiltros} disabled={loading} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50">Limpar</button>
                                <button type="button" onClick={handlePesquisar} disabled={loading} className="px-4 py-2 bg-azul_escuro text-white rounded hover:bg-laranja_escuro transition-colors disabled:opacity-50 flex items-center gap-2">
                                    <FaSearch size={16} /> {loading ? 'Pesquisando...' : 'Pesquisar'}
                                </button>
                            </div>
                        </div>

                        <div>
                            <table className="min-w-full bg-white mt-4 shadow-md rounded-lg">
                                <thead>
                                    <tr className="bg-azul_escuro bg-opacity-90 text-branco_cinza uppercase text-sm leading-normal">
                                        <th className="py-3 px-6 text-left">Objeto</th>
                                        <th className="py-3 px-6 text-left">Situação</th>
                                        <th className="py-3 px-6 text-left">Empresa Contratada</th>
                                        <th className="py-3 px-6 text-left">Data Início</th>
                                        <th className="py-3 px-6 text-left">Data Conclusão</th>
                                        <th className="py-3 px-6 text-left">% Concluído</th>
                                        <th className="py-3 px-6 text-center">Ações</th>
                                    </tr>
                                </thead>
                                {loading ? (
                                    <tfoot><tr><td colSpan="7" className="py-3 px-6 text-center"><div className="flex justify-center items-center"><FiLoader size={24} className="animate-spin text-4xl text-azul_escuro" /></div></td></tr></tfoot>
                                ) : registros.length === 0 ? (
                                    <tfoot><tr><td colSpan="7" className="py-3 px-6 text-center text-gray-500">Nenhum registro encontrado</td></tr></tfoot>
                                ) : (
                                    <tbody className="text-gray-800 text-sm font-light">
                                        {registros.map((registro) => (
                                            <tr key={registro.id} className="border-b border-gray-200 hover:bg-gray-100">
                                                <td className="py-3 px-6 text-left max-w-xs"><DescricaoTruncada texto={registro.objeto} maxLength={60} /></td>
                                                <td className="py-3 px-6 text-left">{situacaoLabel(registro.situacao)}</td>
                                                <td className="py-3 px-6 text-left">{registro.empresa_contratada}</td>
                                                <td className="py-3 px-6 text-left">{registro.data_inicio ? registro.data_inicio.split('-').reverse().join('/') : '-'}</td>
                                                <td className="py-3 px-6 text-left">{registro.data_conclusao ? registro.data_conclusao.split('-').reverse().join('/') : '-'}</td>
                                                <td className="py-3 px-6 text-left">{registro.percentual_concluido}%</td>
                                                <td className="flex flex-wrap items-center justify-center py-3 px-6">
                                                    {acoes.map((acao, index) => (
                                                        <button key={index} onClick={() => acao.handler(registro)} className="py-1 mx-1 disabled:opacity-50" disabled={loading}>{acao.nome}</button>
                                                    ))}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                )}
                            </table>
                        </div>

                        {totalRegistros > 0 && (
                            <PaginacaoAvancada paginaAtual={paginaAtual} totalItens={totalRegistros} itensPorPagina={itensPorPagina} onMudarPagina={handleMudancaPagina} onMudarItensPorPagina={(novoLimite) => { setItensPorPagina(novoLimite); recarregarRegistros(filtros, 1) }} />
                        )}
                    </>
                )}
            </div>

            {modalEdicao && registroSelecionado && (
                <Modal isOpen={modalEdicao} onClose={() => { setModalEdicao(false); setEditando(false); resetForm(); setRegistroSelecionado(null) }} title={`Editar Obra - ${registroSelecionado.empresa_contratada}`}>
                    <div className="p-6 overflow-auto">
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            {camposFormulario}
                            <div className="flex gap-4 justify-end mt-6">
                                <button type="button" onClick={() => { setModalEdicao(false); setEditando(false); resetForm(); setRegistroSelecionado(null) }} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors">Cancelar</button>
                                <button type="submit" disabled={loading} className="px-4 py-2 bg-azul_escuro text-white rounded hover:bg-laranja_escuro transition-colors disabled:opacity-50">{loading ? 'Atualizando...' : 'Atualizar'}</button>
                            </div>
                        </form>
                    </div>
                </Modal>
            )}
        </section>
    )
}
