'use client'
import { useState, useEffect } from 'react'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { FaEdit, FaPlus, FaSearch, FaDownload } from 'react-icons/fa'
import { MdDelete } from 'react-icons/md'
import { FiLoader } from 'react-icons/fi'
import Modal from '@/app/components/modal'
import PaginacaoAvancada from '@/app/components/PaginacaoAvancada'
import { cadastrarObraParalisada, editarObraParalisada, excluirObraParalisada, listarObrasParalisadas, obterObraParalisada } from '../api/obras_paralisadas/obras_paralisadas'
import { useAuth } from '@/app/context/AuthContext'

export default function ObrasParalisadas() {
    const [registros, setRegistros] = useState([])
    const [loading, setLoading] = useState(false)
    const [mostrarFormulario, setMostrarFormulario] = useState(false)
    const { user } = useAuth()
    const [editando, setEditando] = useState(false)
    const [modalEdicao, setModalEdicao] = useState(false)
    const [registroSelecionado, setRegistroSelecionado] = useState(null)
    const [filtros, setFiltros] = useState({
        titulo: '',
        responsavel: '',
        dataParalisacaoInicial: '',
        dataParalisacaoFinal: '',
        dataPrevisaoRetornoInicial: '',
        dataPrevisaoRetornoFinal: ''
    })
    const [paginaAtual, setPaginaAtual] = useState(1)
    const [itensPorPagina, setItensPorPagina] = useState(10)
    const [totalRegistros, setTotalRegistros] = useState(0)

    // Função para recarregar os dados
    const recarregarRegistros = async (filtrosParaPesquisa = {}, pagina = 1) => {
        if (user && user.estabelecimento) {
            try {
                setLoading(true)
                
                // Preparar filtros para a API
                const filtrosAPI = {}
                if (filtrosParaPesquisa.titulo) filtrosAPI.titulo = filtrosParaPesquisa.titulo
                if (filtrosParaPesquisa.responsavel) filtrosAPI.responsavel = filtrosParaPesquisa.responsavel
                if (filtrosParaPesquisa.dataParalisacaoInicial) filtrosAPI.data_paralisacao__gte = filtrosParaPesquisa.dataParalisacaoInicial
                if (filtrosParaPesquisa.dataParalisacaoFinal) filtrosAPI.data_paralisacao__lte = filtrosParaPesquisa.dataParalisacaoFinal
                if (filtrosParaPesquisa.dataPrevisaoRetornoInicial) filtrosAPI.data_previsao_retorno__gte = filtrosParaPesquisa.dataPrevisaoRetornoInicial
                if (filtrosParaPesquisa.dataPrevisaoRetornoFinal) filtrosAPI.data_previsao_retorno__lte = filtrosParaPesquisa.dataPrevisaoRetornoFinal
                
                const registrosData = await listarObrasParalisadas(
                    user.estabelecimento.id,
                    pagina, 
                    itensPorPagina, 
                    filtrosAPI
                )
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

    useEffect(() => {
        recarregarRegistros({}, 1)
    }, [user])

    // Estados do formulário
    const [formData, setFormData] = useState({
        titulo: '',
        objetoObra: '',
        dataParalisacao: '',
        dataPrevisaoRetorno: '',
        responsavel: '',
        justificativa: '',
        arquivo: null
    })

    const resetForm = () => {
        setFormData({
            titulo: '',
            objetoObra: '',
            dataParalisacao: '',
            dataPrevisaoRetorno: '',
            responsavel: '',
            justificativa: '',
            arquivo: null
        })
    }

    const handleInputChange = (e) => {
        const { name, value, type, files } = e.target
        if (type === 'file') {
            setFormData(prev => ({
                ...prev,
                [name]: files[0]
            }))
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (!editando) {
                // Preparar dados conforme o endpoint espera
                const dadosEnvio = {
                    titulo: formData.titulo,
                    objetoObra: formData.objetoObra,
                    dataParalisacao: formData.dataParalisacao,
                    dataPrevisaoRetorno: formData.dataPrevisaoRetorno || null,
                    responsavel: formData.responsavel,
                    justificativa: formData.justificativa,
                    arquivo: formData.arquivo
                }

                await cadastrarObraParalisada(dadosEnvio)
                toast.success('Obra paralisada cadastrada com sucesso!')
            } else {
                // Editar obra existente
                const dadosEnvio = {
                    titulo: formData.titulo,
                    objetoObra: formData.objetoObra,
                    dataParalisacao: formData.dataParalisacao,
                    dataPrevisaoRetorno: formData.dataPrevisaoRetorno || null,
                    responsavel: formData.responsavel,
                    justificativa: formData.justificativa,
                    arquivo: formData.arquivo
                }

                await editarObraParalisada(registroSelecionado.id, dadosEnvio)
                toast.success('Obra paralisada atualizada com sucesso!')
            }

            // Recarregar a lista de registros
            await recarregarRegistros()
            resetForm()
            setMostrarFormulario(false)
            setModalEdicao(false)
            setEditando(false)
            setRegistroSelecionado(null)
        } catch (error) {
            toast.error('Erro ao salvar obra paralisada: ' + error.message)
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleEditar = (registro) => {
        setRegistroSelecionado(registro)
        setFormData({
            titulo: registro.titulo || '',
            objetoObra: registro.objeto_obra || '',
            dataParalisacao: registro.data_paralisacao || '',
            dataPrevisaoRetorno: registro.data_previsao_retorno || '',
            responsavel: registro.responsavel || '',
            justificativa: registro.justificativa || '',
            arquivo: null
        })
        setEditando(true)
        setModalEdicao(true)
    }

    const handleDownload = async (registro) => {
        try {
            setLoading(true)
            
            // Obter o blob do arquivo via API streaming
            const blob = await obterObraParalisada(registro.id)
            
            if (blob && blob.size > 0) {
                // Criar URL temporária para o blob
                const url = URL.createObjectURL(blob)
                
                // Criar elemento de download
                const link = document.createElement('a')
                link.href = url
                link.download = `${registro.titulo}.pdf`
                link.style.display = 'none'
                
                // Adicionar ao DOM, clicar e remover
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                
                // Limpar a URL temporária
                URL.revokeObjectURL(url)
                
                toast.success('Download realizado com sucesso!')
            } else {
                toast.error('Arquivo não disponível ou vazio')
            }
        } catch (error) {
            toast.error('Erro ao fazer download do arquivo: ' + error.message)
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleDeletar = async (registro) => {
        if (window.confirm('Tem certeza que deseja deletar esta obra paralisada?')) {
            try {
                setLoading(true)
                await excluirObraParalisada(registro.id)
                await recarregarRegistros(filtros, paginaAtual)
                toast.success('Obra paralisada deletada com sucesso!')
            } catch (error) {
                toast.error('Erro ao deletar obra paralisada: ' + error.message)
                console.error(error)
            } finally {
                setLoading(false)
            }
        }
    }

    const handleFiltroChange = (campo, valor) => {
        setFiltros(prev => ({
            ...prev,
            [campo]: valor
        }))
    }

    // Função para realizar pesquisa com filtros
    const handlePesquisar = async () => {
        await recarregarRegistros(filtros, 1)
    }

    // Função para limpar filtros
    const handleLimparFiltros = async () => {
        const filtrosLimpos = {
            titulo: '',
            responsavel: '',
            dataParalisacaoInicial: '',
            dataParalisacaoFinal: '',
            dataPrevisaoRetornoInicial: '',
            dataPrevisaoRetornoFinal: ''
        }
        setFiltros(filtrosLimpos)
        await recarregarRegistros(filtrosLimpos, 1)
    }

    // Função para mudança de página
    const handleMudancaPagina = async (novaPagina) => {
        await recarregarRegistros(filtros, novaPagina)
    }

    // Os registros vêm já filtrados da API
    const registrosPaginados = registros

    const acoes = [
        {
            nome: <FaEdit size={28} className="text-green-800 hover:text-green-900 transition-colors" />,
            handler: handleEditar
        },
        {
            nome: <FaDownload size={28} className="text-azul_escuro hover:text-blue-800 transition-colors" />,
            handler: handleDownload
        },
        {
            nome: <MdDelete size={28} className="text-red-600 hover:text-red-800 transition-colors" />,
            handler: handleDeletar
        }
    ]

    return (
        <section className="flex flex-col flex-grow overflow-auto text-azul_escuro gap-4 bg-gradient-to-br from-gray-200 to-gray-300 p-4">
            <ToastContainer />

            {/* Botões de navegação */}
            <div className="flex gap-4">
                <button
                    onClick={() => {
                        setMostrarFormulario(true)
                        resetForm()
                    }}
                    className={`px-4 py-2 rounded-md flex items-center gap-2 ${
                        mostrarFormulario ? 'bg-orange-600 text-white' : 'bg-gray-300 text-black'
                    }`}
                >
                    <FaPlus size={16} />
                    Cadastro
                </button>
                <button
                    onClick={() => setMostrarFormulario(false)}
                    className={`px-4 py-2 rounded-md flex items-center gap-2 ${
                        !mostrarFormulario ? 'bg-orange-600 text-white' : 'bg-gray-300 text-black'
                    }`}
                >
                    <FaSearch size={16} />
                    Registros
                </button>
            </div>

            <div className="flex flex-col w-full mx-auto bg-white shadow-lg rounded-lg p-4">
                {mostrarFormulario ? (
                    <>
                        <h1 className="text-lg font-bold mb-4">
                            Cadastro de Obras Paralisadas
                        </h1>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">
                                        Título *
                                    </label>
                                    <input
                                        type="text"
                                        name="titulo"
                                        value={formData.titulo}
                                        onChange={handleInputChange}

                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">
                                        Objeto da Obra *
                                    </label>
                                    <textarea
                                        name="objetoObra"
                                        value={formData.objetoObra}
                                        onChange={handleInputChange}

                                        rows="3"
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Data de Paralisação *
                                    </label>
                                    <input
                                        type="date"
                                        name="dataParalisacao"

                                        value={formData.dataParalisacao}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Data Previsão de Retorno
                                    </label>
                                    <input
                                        type="date"
                                        name="dataPrevisaoRetorno"
                                        value={formData.dataPrevisaoRetorno}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Responsável *
                                    </label>
                                    <input
                                        type="text"
                                        name="responsavel"
                                        value={formData.responsavel}
                                        onChange={handleInputChange}

                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Arquivo (PDF) *
                                    </label>
                                    <input
                                        type="file"
                                        name="arquivo"
                                        onChange={handleInputChange}
                                        accept=".pdf"
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">
                                        Justificativa *
                                    </label>
                                    <textarea
                                        name="justificativa"
                                        value={formData.justificativa}
                                        onChange={handleInputChange}

                                        rows="4"
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 justify-end mt-6">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 bg-azul_escuro text-white rounded hover:bg-laranja_escuro disabled:opacity-50 flex items-center gap-2"
                                >
                                    {loading && <FiLoader className="animate-spin" />}
                                    {loading ? 'Salvando...' : (editando ? 'Atualizar' : 'Salvar')}
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <>
                        <h1 className="text-lg font-bold mb-4">Obras Paralisadas</h1>
                        
                        {/* Filtros */}
                        <div className="bg-gray-50 rounded p-4 mb-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Título</label>
                                    <input
                                        type="text"
                                        value={filtros.titulo}
                                        onChange={(e) => handleFiltroChange('titulo', e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                        placeholder="Filtrar por título..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Responsável</label>
                                    <input
                                        type="text"
                                        value={filtros.responsavel}
                                        onChange={(e) => handleFiltroChange('responsavel', e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                        placeholder="Filtrar por responsável..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Data Paralisação Inicial</label>
                                    <input
                                        type="date"
                                        value={filtros.dataParalisacaoInicial}
                                        onChange={(e) => handleFiltroChange('dataParalisacaoInicial', e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Data Paralisação Final</label>
                                    <input
                                        type="date"
                                        value={filtros.dataParalisacaoFinal}
                                        onChange={(e) => handleFiltroChange('dataParalisacaoFinal', e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Data Retorno Inicial</label>
                                    <input
                                        type="date"
                                        value={filtros.dataPrevisaoRetornoInicial}
                                        onChange={(e) => handleFiltroChange('dataPrevisaoRetornoInicial', e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Data Retorno Final</label>
                                    <input
                                        type="date"
                                        value={filtros.dataPrevisaoRetornoFinal}
                                        onChange={(e) => handleFiltroChange('dataPrevisaoRetornoFinal', e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            {/* Botões de Pesquisa */}
                            <div className="flex gap-2 justify-end mt-4">
                                <button
                                    type="button"
                                    onClick={handleLimparFiltros}
                                    disabled={loading}
                                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    Limpar
                                </button>
                                <button
                                    type="button"
                                    onClick={handlePesquisar}
                                    disabled={loading}
                                    className="px-4 py-2 bg-azul_escuro text-white rounded hover:bg-laranja_escuro transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    <FaSearch size={16} />
                                    {loading ? 'Pesquisando...' : 'Pesquisar'}
                                </button>
                            </div>
                        </div>

                        {/* Tabela */}
                        <div>
                            <table className="min-w-full bg-white mt-4 shadow-md rounded-lg">
                                <thead>
                                    <tr className="bg-azul_escuro bg-opacity-90 text-branco_cinza uppercase text-sm leading-normal">
                                        <th className="py-3 px-6 text-left">
                                            Título
                                        </th>
                                        <th className="py-3 px-6 text-left">
                                            Responsável
                                        </th>
                                        <th className="py-3 px-6 text-left">
                                            Data Paralisação
                                        </th>
                                        <th className="py-3 px-6 text-left">
                                            Previsão Retorno
                                        </th>
                                        <th className="py-3 px-6 text-center">
                                            Ações
                                        </th>
                                    </tr>
                                </thead>
                                {loading ? (
                                    <tfoot>
                                        <tr>
                                            <td colSpan="5" className="py-3 px-6 text-center">
                                                <div className="flex justify-center items-center">
                                                    <FiLoader size={24} className="animate-spin text-4xl text-azul_escuro" />
                                                </div>
                                            </td>
                                        </tr>
                                    </tfoot>
                                ) : registrosPaginados.length === 0 ? (
                                    <tfoot>
                                        <tr>
                                            <td colSpan="5" className="py-3 px-6 text-center text-gray-500">
                                                Nenhum registro encontrado
                                            </td>
                                        </tr>
                                    </tfoot>
                                ) : (
                                    <tbody className="text-gray-800 text-sm font-light">
                                        {registrosPaginados.map((registro) => (
                                            <tr key={registro.id} className="border-b border-gray-200 hover:bg-gray-100">
                                                <td className="py-3 px-6 text-left">
                                                    {registro.titulo}
                                                </td>
                                                <td className="py-3 px-6 text-left">
                                                    {registro.responsavel}
                                                </td>
                                                <td className="py-3 px-6 text-left">
                                                    {registro.data_paralisacao ? registro.data_paralisacao.split('-').reverse().join('/') : '-'}
                                                </td>
                                                <td className="py-3 px-6 text-left">
                                                    {registro.data_previsao_retorno ? registro.data_previsao_retorno.split('-').reverse().join('/') : '-'}
                                                </td>
                                                <td className="flex flex-wrap items-center justify-center py-3 px-6">
                                                    {acoes.map((acao, index) => (
                                                        <button
                                                            key={index}
                                                            onClick={() => acao.handler(registro)}
                                                            className="py-1 mx-1 disabled:opacity-50"
                                                            disabled={loading}
                                                        >
                                                            {acao.nome}
                                                        </button>
                                                    ))}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                )}
                            </table>
                        </div>

                        {/* Paginação */}
                        {totalRegistros > 0 && (
                            <PaginacaoAvancada
                                paginaAtual={paginaAtual}
                                totalItens={totalRegistros}
                                itensPorPagina={itensPorPagina}
                                onMudarPagina={handleMudancaPagina}
                                onMudarItensPorPagina={(novoLimite) => {
                                    setItensPorPagina(novoLimite)
                                    recarregarRegistros(filtros, 1)
                                }}
                            />
                        )}
                    </>
                )}
            </div>

            {/* Modal de Edição */}
            {modalEdicao && registroSelecionado && (
                <Modal
                    isOpen={modalEdicao}
                    onClose={() => {
                        setModalEdicao(false)
                        setEditando(false)
                        resetForm()
                        setRegistroSelecionado(null)
                    }}
                    title={`Editar Obra Paralisada - ${registroSelecionado.titulo}`}
                >
                    <div className="p-6 overflow-auto">
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">
                                        Título *
                                    </label>
                                    <input
                                        type="text"
                                        name="titulo"
                                        value={formData.titulo}
                                        onChange={handleInputChange}

                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">
                                        Objeto da Obra *
                                    </label>
                                    <textarea
                                        name="objetoObra"
                                        value={formData.objetoObra}
                                        onChange={handleInputChange}

                                        rows="3"
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Data de Paralisação *
                                    </label>
                                    <input
                                        type="date"
                                        name="dataParalisacao"

                                        value={formData.dataParalisacao}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Data Previsão de Retorno
                                    </label>
                                    <input
                                        type="date"
                                        name="dataPrevisaoRetorno"
                                        value={formData.dataPrevisaoRetorno}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Responsável *
                                    </label>
                                    <input
                                        type="text"
                                        name="responsavel"
                                        value={formData.responsavel}
                                        onChange={handleInputChange}

                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Arquivo (opcional - deixe vazio para manter o atual)
                                    </label>
                                    <input
                                        type="file"
                                        name="arquivo"
                                        onChange={handleInputChange}
                                        accept=".pdf"
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                    {formData.arquivo && (
                                        <p className="text-sm text-gray-600 mt-1">
                                            Arquivo selecionado: {formData.arquivo.name}
                                        </p>
                                    )}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">
                                        Justificativa *
                                    </label>
                                    <textarea
                                        name="justificativa"
                                        value={formData.justificativa}
                                        onChange={handleInputChange}

                                        rows={4}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 justify-end mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setModalEdicao(false)
                                        setEditando(false)
                                        resetForm()
                                        setRegistroSelecionado(null)
                                    }}
                                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 bg-azul_escuro text-white rounded hover:bg-laranja_escuro transition-colors disabled:opacity-50"
                                >
                                    {loading ? 'Salvando...' : 'Salvar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </Modal>
            )}

        </section>
    )
}
