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
import { cadastrarTransferenciaRealizadaConvenio, editarTransferenciaRealizadaConvenio, excluirTransferenciaRealizadaConvenio, listarTransferenciasRealizadasConvenios, obterArquivoTransferenciaRealizada } from '../api/transferencias_realizadas_convenios/transferencias_realizadas_convenios'
import { useAuth } from '@/app/context/AuthContext'
import { formatarMoeda, formatarMoedaInput, desformatarMoeda, numeroParaInput } from '@/app/utils/formatarMoeda'

export default function TransferenciasRealizadasConvenios() {
    const [registros, setRegistros] = useState([])
    const [loading, setLoading] = useState(false)
    const [mostrarFormulario, setMostrarFormulario] = useState(false)
    const { user } = useAuth()
    const [editando, setEditando] = useState(false)
    const [modalEdicao, setModalEdicao] = useState(false)
    const [registroSelecionado, setRegistroSelecionado] = useState(null)
    const [filtros, setFiltros] = useState({
        beneficiario: '', numeroConvenio: '', anoConvenio: '',
        dataInicioVigenciaInicial: '', dataInicioVigenciaFinal: '',
        dataFimVigenciaInicial: '', dataFimVigenciaFinal: ''
    })
    const [paginaAtual, setPaginaAtual] = useState(1)
    const [itensPorPagina, setItensPorPagina] = useState(10)
    const [totalRegistros, setTotalRegistros] = useState(0)

    const [formData, setFormData] = useState({
        beneficiario: '', numeroConvenio: '', anoConvenio: '', objeto: '',
        valorTotal: '', valorRepassado: '', dataInicioVigencia: '', dataFimVigencia: '', arquivo: null
    })

    const resetForm = () => setFormData({
        beneficiario: '', numeroConvenio: '', anoConvenio: '', objeto: '',
        valorTotal: '', valorRepassado: '', dataInicioVigencia: '', dataFimVigencia: '', arquivo: null
    })

    const recarregarRegistros = async (filtrosParaPesquisa = {}, pagina = 1) => {
        if (user && user.estabelecimento) {
            try {
                setLoading(true)
                const filtrosAPI = {}
                if (filtrosParaPesquisa.beneficiario) filtrosAPI.beneficiario = filtrosParaPesquisa.beneficiario
                if (filtrosParaPesquisa.numeroConvenio) filtrosAPI.numero_convenio = filtrosParaPesquisa.numeroConvenio
                if (filtrosParaPesquisa.anoConvenio) filtrosAPI.ano_convenio = filtrosParaPesquisa.anoConvenio
                if (filtrosParaPesquisa.dataInicioVigenciaInicial) filtrosAPI.data_inicio_vigencia__gte = filtrosParaPesquisa.dataInicioVigenciaInicial
                if (filtrosParaPesquisa.dataInicioVigenciaFinal) filtrosAPI.data_inicio_vigencia__lte = filtrosParaPesquisa.dataInicioVigenciaFinal
                if (filtrosParaPesquisa.dataFimVigenciaInicial) filtrosAPI.data_fim_vigencia__gte = filtrosParaPesquisa.dataFimVigenciaInicial
                if (filtrosParaPesquisa.dataFimVigenciaFinal) filtrosAPI.data_fim_vigencia__lte = filtrosParaPesquisa.dataFimVigenciaFinal

                const registrosData = await listarTransferenciasRealizadasConvenios(user.estabelecimento.id, pagina, itensPorPagina, filtrosAPI)
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

    const handleMoneyInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: formatarMoedaInput(value) }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const dadosEnvio = {
                beneficiario: formData.beneficiario,
                numeroConvenio: formData.numeroConvenio,
                anoConvenio: formData.anoConvenio,
                objeto: formData.objeto,
                valorTotal: desformatarMoeda(formData.valorTotal),
                valorRepassado: desformatarMoeda(formData.valorRepassado),
                dataInicioVigencia: formData.dataInicioVigencia,
                dataFimVigencia: formData.dataFimVigencia || null,
                arquivo: formData.arquivo
            }
            if (!editando) {
                await cadastrarTransferenciaRealizadaConvenio(dadosEnvio)
                toast.success('Transferência cadastrada com sucesso!')
            } else {
                await editarTransferenciaRealizadaConvenio(registroSelecionado.id, dadosEnvio)
                toast.success('Transferência atualizada com sucesso!')
            }
            await recarregarRegistros()
            resetForm()
            setMostrarFormulario(false)
            setModalEdicao(false)
            setEditando(false)
            setRegistroSelecionado(null)
        } catch (error) {
            toast.error('Erro ao salvar transferência: ' + error.message)
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleEditar = (registro) => {
        setRegistroSelecionado(registro)
        setFormData({
            beneficiario: registro.beneficiario || '',
            numeroConvenio: registro.numero_convenio || '',
            anoConvenio: registro.ano_convenio || '',
            objeto: registro.objeto || '',
            valorTotal: numeroParaInput(registro.valor_total),
            valorRepassado: numeroParaInput(registro.valor_repassado),
            dataInicioVigencia: registro.data_inicio_vigencia || '',
            dataFimVigencia: registro.data_fim_vigencia || '',
            arquivo: null
        })
        setEditando(true)
        setModalEdicao(true)
    }

    const handleDownload = async (registro) => {
        try {
            setLoading(true)
            const blob = await obterArquivoTransferenciaRealizada(registro.id)
            if (blob && blob.size > 0) {
                const url = URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = `convenio_${registro.numero_convenio}_${registro.ano_convenio}.pdf`
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
        if (window.confirm('Tem certeza que deseja deletar esta transferência realizada?')) {
            try {
                setLoading(true)
                await excluirTransferenciaRealizadaConvenio(registro.id)
                await recarregarRegistros(filtros, paginaAtual)
                toast.success('Transferência deletada com sucesso!')
            } catch (error) {
                toast.error('Erro ao deletar transferência: ' + error.message)
                console.error(error)
            } finally {
                setLoading(false)
            }
        }
    }

    const handleFiltroChange = (campo, valor) => setFiltros(prev => ({ ...prev, [campo]: valor }))
    const handlePesquisar = async () => { setPaginaAtual(1); await recarregarRegistros(filtros, 1) }
    const handleLimparFiltros = async () => {
        const filtrosLimpos = { beneficiario: '', numeroConvenio: '', anoConvenio: '', dataInicioVigenciaInicial: '', dataInicioVigenciaFinal: '', dataFimVigenciaInicial: '', dataFimVigenciaFinal: '' }
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
                <label className="block text-sm font-medium mb-1">Beneficiário *</label>
                <input type="text" name="beneficiario" value={formData.beneficiario} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none" />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Número do Convênio *</label>
                <input type="text" name="numeroConvenio" value={formData.numeroConvenio} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none" />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Ano do Convênio *</label>
                <input type="number" name="anoConvenio" value={formData.anoConvenio} onChange={handleInputChange} min="2000" max="2030" className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none" />
            </div>
            <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Objeto *</label>
                <textarea name="objeto" value={formData.objeto} onChange={handleInputChange} rows={3} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none" />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Valor Total *</label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">R$</span>
                    <input type="text" inputMode="decimal" name="valorTotal" value={formData.valorTotal} onChange={handleMoneyInputChange} placeholder="0,00" className="w-full p-2 pl-10 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none" />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Valor Repassado *</label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">R$</span>
                    <input type="text" inputMode="decimal" name="valorRepassado" value={formData.valorRepassado} onChange={handleMoneyInputChange} placeholder="0,00" className="w-full p-2 pl-10 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none" />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Início da Vigência *</label>
                <input type="date" name="dataInicioVigencia" value={formData.dataInicioVigencia} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none" />
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Fim da Vigência</label>
                <input type="date" name="dataFimVigencia" value={formData.dataFimVigencia} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none" />
            </div>
            <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Arquivo {!editando ? '*' : '(opcional - deixe vazio para manter o atual)'}</label>
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
                        <h1 className="text-lg font-bold mb-4">Cadastro de Transferências Realizadas Convênios</h1>
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
                        <h1 className="text-lg font-bold mb-4">Transferências Realizadas Convênios</h1>
                        <div className="bg-gray-50 rounded p-4 mb-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Beneficiário</label>
                                    <input type="text" value={filtros.beneficiario} onChange={(e) => handleFiltroChange('beneficiario', e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none" placeholder="Filtrar por beneficiário..." />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Nº Convênio</label>
                                    <input type="text" value={filtros.numeroConvenio} onChange={(e) => handleFiltroChange('numeroConvenio', e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none" placeholder="Filtrar por número..." />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Ano</label>
                                    <input type="number" value={filtros.anoConvenio} onChange={(e) => handleFiltroChange('anoConvenio', e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none" placeholder="Ex: 2024" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Início Vigência De</label>
                                    <input type="date" value={filtros.dataInicioVigenciaInicial} onChange={(e) => handleFiltroChange('dataInicioVigenciaInicial', e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Início Vigência Até</label>
                                    <input type="date" value={filtros.dataInicioVigenciaFinal} onChange={(e) => handleFiltroChange('dataInicioVigenciaFinal', e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none" />
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
                                        <th className="py-3 px-6 text-left">Beneficiário</th>
                                        <th className="py-3 px-6 text-left">Nº/Ano</th>
                                        <th className="py-3 px-6 text-left">Objeto</th>
                                        <th className="py-3 px-6 text-left">Valor Total</th>
                                        <th className="py-3 px-6 text-left">Valor Repassado</th>
                                        <th className="py-3 px-6 text-left">Vigência</th>
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
                                                <td className="py-3 px-6 text-left">{registro.beneficiario}</td>
                                                <td className="py-3 px-6 text-left">{registro.numero_convenio}/{registro.ano_convenio}</td>
                                                <td className="py-3 px-6 text-left max-w-xs"><DescricaoTruncada texto={registro.objeto} maxLength={60} /></td>
                                                <td className="py-3 px-6 text-left">{formatarMoeda(registro.valor_total)}</td>
                                                <td className="py-3 px-6 text-left">{formatarMoeda(registro.valor_repassado)}</td>
                                                <td className="py-3 px-6 text-left">
                                                    {registro.data_inicio_vigencia ? registro.data_inicio_vigencia.split('-').reverse().join('/') : '-'}
                                                    {registro.data_fim_vigencia ? ` até ${registro.data_fim_vigencia.split('-').reverse().join('/')}` : ''}
                                                </td>
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
                <Modal isOpen={modalEdicao} onClose={() => { setModalEdicao(false); setEditando(false); resetForm(); setRegistroSelecionado(null) }} title={`Editar - Convênio ${registroSelecionado.numero_convenio}/${registroSelecionado.ano_convenio}`}>
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
