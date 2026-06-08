'use client'
import { useState, useEffect } from 'react'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { FaEdit, FaEye, FaPlus, FaSearch, FaDownload } from 'react-icons/fa'
import { MdDelete } from 'react-icons/md'
import { FiLoader } from 'react-icons/fi'
import Modal from '@/app/components/modal'
import PaginacaoAvancada from '@/app/components/PaginacaoAvancada'
import { criarAprovadoConcurso, atualizarListaAprovadosConcurso, deletarListaAprovadosConcurso, listarAprovadosConcursos, obterDetalhesAprovadosConcurso } from '../api/aprovados_concursos/aprovados_concursos'
import { listarConcursosPublicos } from '../api/concursos_publicos/concursos_publicos'
import { useAuth } from '@/app/context/AuthContext'

export default function ListaDeAprovadosEmConcursosEProcessosSeletivos() {
    const [registros, setRegistros] = useState([])
    const [concursos, setConcursos] = useState([])
    const [loading, setLoading] = useState(false)
    const [mostrarFormulario, setMostrarFormulario] = useState(false)
    const { user } = useAuth()
    const [editando, setEditando] = useState(false)
    const [visualizando, setVisualizando] = useState(false)
    const [modalEdicao, setModalEdicao] = useState(false)
    const [registroSelecionado, setRegistroSelecionado] = useState(null)
    const [filtros, setFiltros] = useState({
        titulo: '',
        concurso: '',
        dataInicial: '',
        dataFinal: ''
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
                if (filtrosParaPesquisa.concurso) filtrosAPI.concurso_id = filtrosParaPesquisa.concurso
                if (filtrosParaPesquisa.dataInicial) filtrosAPI.data_publicacao__gte = filtrosParaPesquisa.dataInicial
                if (filtrosParaPesquisa.dataFinal) filtrosAPI.data_publicacao__lte = filtrosParaPesquisa.dataFinal
                
                const registrosData = await listarAprovadosConcursos(
                    user.estabelecimento.id, 
                    null, 
                    pagina, 
                    itensPorPagina, 
                    filtrosAPI
                )
                setRegistros(registrosData.data)
                setTotalRegistros(registrosData.meta?.total || 0)
                setPaginaAtual(pagina)
            } catch (error) {
                toast.error('Erro ao carregar registros: ' + error.message)
            } finally {
                setLoading(false)
            }
        }
    }

    // Função para carregar concursos
    const carregarConcursos = async () => {
        if (user && user.estabelecimento) {
            try {
                const response = await listarConcursosPublicos(user.estabelecimento.id, 1, 1000) // Busca todos os concursos disponíveis
                setConcursos(response.data)
            } catch (error) {
                toast.error('Erro ao carregar concursos: ' + error.message)
            }
        }
    }

    useEffect(() => {
        recarregarRegistros({}, 1)
        carregarConcursos()
    }, [user])

    // Estados do formulário
    const [formData, setFormData] = useState({
        concursoId: '',
        dataPublicacao: '',
        titulo: '',
        descricao: '',
        file: null
    })

    const resetForm = () => {
        setFormData({
            concursoId: '',
            dataPublicacao: '',
            titulo: '',
            descricao: '',
            file: null
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
                // Criar novo registro
                await criarAprovadoConcurso(formData)
                toast.success('Lista de aprovados cadastrada com sucesso!')
            } else {
                // Editar registro existente
                await atualizarListaAprovadosConcurso(registroSelecionado.id, formData)
                toast.success('Lista de aprovados atualizada com sucesso!')
            }

            // Recarregar a lista de registros com os filtros atuais
            await recarregarRegistros(filtros, paginaAtual)
            resetForm()
            setMostrarFormulario(false)
            setModalEdicao(false)
            setEditando(false)
            setRegistroSelecionado(null)
        } catch (error) {
            toast.error('Erro ao salvar lista de aprovados: ' + error.message)
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleEditar = (registro) => {
        setRegistroSelecionado(registro)
        setFormData({
            concursoId: registro.concurso_id || '',
            dataPublicacao: registro.data_publicacao || '',
            titulo: registro.titulo || '',
            descricao: registro.descricao || '',
            file: null
        })
        setEditando(true)
        setModalEdicao(true)
    }

    const handleVisualizar = async (registro) => {
        try {
            const detalhes = await obterDetalhesAprovadosConcurso(registro.id)
            setRegistroSelecionado(detalhes)
            setVisualizando(true)
        } catch (error) {
            toast.error('Erro ao carregar detalhes: ' + error.message)
        }
    }

    const handleDeletar = async (registro) => {
        if (window.confirm('Tem certeza que deseja deletar esta lista de aprovados?')) {
            try {
                setLoading(true)
                await deletarListaAprovadosConcurso(registro.id)
                await recarregarRegistros(filtros, paginaAtual)
                toast.success('Lista de aprovados deletada com sucesso!')
            } catch (error) {
                toast.error('Erro ao deletar lista de aprovados: ' + error.message)
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
            concurso: '',
            dataInicial: '',
            dataFinal: ''
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
            nome: <FaEye size={28} className="text-azul_escuro hover:text-blue-800 transition-colors" />,
            handler: handleVisualizar
        },
        {
            nome: <MdDelete size={28} className="text-red-600 hover:text-red-800 transition-colors" />,
            handler: handleDeletar
        }
    ]

    // Função para obter o nome do concurso pelo ID
    const obterNomeConcurso = (concursoId) => {
        const concurso = concursos.find(c => c.id === concursoId)
        return concurso ? concurso.numero_edital : 'Não encontrado'
    }

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
                            Cadastro de Lista de Aprovados em Concursos e Processos Seletivos
                        </h1>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Concurso/Processo Seletivo *
                                    </label>
                                    <select
                                        name="concursoId"
                                        value={formData.concursoId}
                                        onChange={handleInputChange}

                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    >
                                        <option value="">Selecione um concurso</option>
                                        {concursos.map(concurso => (
                                            <option key={concurso.id} value={concurso.id}>
                                                {concurso.numero_edital} - {concurso.tipo_processo === 'concurso_publico' ? 'Concurso Público' : 'Seleção Pública'}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Data de Publicação *
                                    </label>
                                    <input
                                        type="date"
                                        name="dataPublicacao"

                                        value={formData.dataPublicacao}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Título *
                                    </label>
                                    <input
                                        type="text"
                                        name="titulo"
                                        value={formData.titulo}
                                        onChange={handleInputChange}

                                        placeholder="Ex: Lista dos Aprovados Processo 001/2024"
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Arquivo *
                                    </label>
                                    <input
                                        type="file"
                                        name="file"
                                        onChange={handleInputChange}
                                        accept=".pdf"
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">
                                        Descrição
                                    </label>
                                    <textarea
                                        name="descricao"
                                        value={formData.descricao}
                                        onChange={handleInputChange}
                                        rows={3}
                                        placeholder="Descrição adicional sobre a lista de aprovados..."
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none resize-vertical"
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
                        <h1 className="text-lg font-bold mb-4">Lista de Aprovados em Concursos e Processos Seletivos</h1>
                        
                        {/* Filtros */}
                        <div className="bg-gray-50 rounded p-4 mb-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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
                                    <label className="block text-sm font-medium mb-1">Concurso</label>
                                    <select
                                        value={filtros.concurso}
                                        onChange={(e) => handleFiltroChange('concurso', e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    >
                                        <option value="">Todos os concursos</option>
                                        {concursos.map(concurso => (
                                            <option key={concurso.id} value={concurso.id}>
                                                {concurso.numero_edital}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Data Inicial</label>
                                    <input
                                        type="date"
                                        value={filtros.dataInicial}
                                        onChange={(e) => handleFiltroChange('dataInicial', e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Data Final</label>
                                    <input
                                        type="date"
                                        value={filtros.dataFinal}
                                        onChange={(e) => handleFiltroChange('dataFinal', e.target.value)}
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
                                            Concurso
                                        </th>
                                        <th className="py-3 px-6 text-left">
                                            Data Publicação
                                        </th>
                                        <th className="py-3 px-6 text-center">
                                            Ações
                                        </th>
                                    </tr>
                                </thead>
                                {loading ? (
                                    <tfoot>
                                        <tr>
                                            <td colSpan="4" className="py-3 px-6 text-center">
                                                <div className="flex justify-center items-center">
                                                    <FiLoader size={24} className="animate-spin text-4xl text-azul_escuro" />
                                                </div>
                                            </td>
                                        </tr>
                                    </tfoot>
                                ) : registrosPaginados.length === 0 ? (
                                    <tfoot>
                                        <tr>
                                            <td colSpan="4" className="py-3 px-6 text-center text-gray-500">
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
                                                    {obterNomeConcurso(registro.concurso_id)}
                                                </td>
                                                <td className="py-3 px-6 text-left">
                                                    {registro.data_publicacao ? registro.data_publicacao.split('-').reverse().join('/') : '-'}
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
                    title={`Editar Lista de Aprovados - ${registroSelecionado.titulo}`}
                >
                    <div className="p-6 overflow-auto">
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Concurso/Processo Seletivo *
                                    </label>
                                    <select
                                        name="concursoId"
                                        value={formData.concursoId}
                                        onChange={handleInputChange}

                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    >
                                        <option value="">Selecione um concurso</option>
                                        {concursos.map(concurso => (
                                            <option key={concurso.id} value={concurso.id}>
                                                {concurso.numero_edital} - {concurso.tipo_processo === 'concurso_publico' ? 'Concurso Público' : 'Seleção Pública'}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Data de Publicação *
                                    </label>
                                    <input
                                        type="date"
                                        name="dataPublicacao"

                                        value={formData.dataPublicacao}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Título *
                                    </label>
                                    <input
                                        type="text"
                                        name="titulo"
                                        value={formData.titulo}
                                        onChange={handleInputChange}

                                        placeholder="Ex: Lista dos Aprovados Processo 001/2024"
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Arquivo (opcional - deixe vazio para manter o atual)
                                    </label>
                                    <input
                                        type="file"
                                        name="file"
                                        onChange={handleInputChange}
                                        accept=".pdf"
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                    {formData.file && (
                                        <p className="text-sm text-gray-600 mt-1">
                                            Arquivo selecionado: {formData.file.name}
                                        </p>
                                    )}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">
                                        Descrição
                                    </label>
                                    <textarea
                                        name="descricao"
                                        value={formData.descricao}
                                        onChange={handleInputChange}
                                        rows={3}
                                        placeholder="Descrição adicional sobre a lista de aprovados..."
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none resize-vertical"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 justify-end mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        resetForm()
                                        setMostrarFormulario(false)
                                        setEditando(false)
                                        setRegistroSelecionado(null)
                                        setModalEdicao(false)
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

            {/* Modal para Visualização */}
            {visualizando && registroSelecionado && (
                <Modal
                    isOpen={visualizando}
                    onClose={() => {
                        setVisualizando(false)
                        setRegistroSelecionado(null)
                    }}
                    title={`Detalhes da Lista de Aprovados - ${registroSelecionado.titulo}`}
                >
                    <div className="p-6 overflow-auto">
                        <div className="flex flex-wrap gap-4 bg-white p-4 shadow-lg rounded mb-6">
                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong className="text-azul_escuro">Título:</strong>
                                <span className="break-words text-gray-700">{registroSelecionado.titulo}</span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong className="text-azul_escuro">Concurso:</strong>
                                <span className="break-words text-gray-700">
                                    {obterNomeConcurso(registroSelecionado.concurso_id)}
                                </span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong className="text-azul_escuro">Data de Publicação:</strong>
                                <span className="break-words text-gray-700">
                                    {registroSelecionado.data_publicacao ? 
                                        registroSelecionado.data_publicacao.split('-').reverse().join('/') : '-'
                                    }
                                </span>
                            </div>

                            {registroSelecionado.descricao && (
                                <div className="flex flex-col w-full">
                                    <strong className="text-azul_escuro">Descrição:</strong>
                                    <span className="break-words text-gray-700 whitespace-pre-wrap">{registroSelecionado.descricao}</span>
                                </div>
                            )}

                            <div className="flex flex-col w-full">
                                <strong className="text-azul_escuro mb-2">Arquivo:</strong>
                                <div className="flex items-center gap-2">
                                    <a 
                                        href={`${process.env.NEXT_PUBLIC_TRANSPARENCIA_ENDPOINT_URL}/aprovado_concurso/${registroSelecionado.id}/arquivo/`}
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 bg-azul_escuro text-white rounded hover:bg-blue-700 transition-colors"
                                    >
                                        <FaDownload size={16} />
                                        Baixar Lista de Aprovados
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </section>
    )
}
