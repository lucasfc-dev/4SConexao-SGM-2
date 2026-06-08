'use client'
import { useState, useEffect } from 'react'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { FaEdit, FaEye, FaPlus, FaSearch, FaDownload } from 'react-icons/fa'
import { MdDelete } from 'react-icons/md'
import { FiLoader } from 'react-icons/fi'
import Modal from '@/app/components/modal'
import PaginacaoAvancada from '@/app/components/PaginacaoAvancada'
import { cadastrarConcursoPublico, editarConcursoPublico, excluirConcursoPublico, listarConcursosPublicos } from '../api/concursos_publicos/concursos_publicos'
import { useAuth } from '@/app/context/AuthContext'

export default function ConcursosPublicos() {
    const [registros, setRegistros] = useState([])
    const [loading, setLoading] = useState(false)
    const [mostrarFormulario, setMostrarFormulario] = useState(false)
    const { user } = useAuth()
    const [editando, setEditando] = useState(false)
    const [visualizando, setVisualizando] = useState(false)
    const [modalEdicao, setModalEdicao] = useState(false)
    const [registroSelecionado, setRegistroSelecionado] = useState(null)
    const [filtros, setFiltros] = useState({
        numeroEdital: '',
        dataInicial: '',
        dataFinal: ''
    })
    const [paginaAtual, setPaginaAtual] = useState(1)
    const [itensPorPagina, setItensPorPagina] = useState(10)

    // Função para recarregar os dados
    const recarregarRegistros = async () => {
        if (user && user.estabelecimento) {
            try {
                setLoading(true)
                const registrosData = await listarConcursosPublicos(user.estabelecimento.id)
                setRegistros(registrosData.data)
            } catch (error) {
                toast.error('Erro ao carregar registros: ' + error.message)
            } finally {
                setLoading(false)
            }
        }
    }

    useEffect(() => {
        recarregarRegistros()
    }, [user])

    // Estados do formulário
    const [formData, setFormData] = useState({
        tipoProcesso: 'concurso_publico',
        numeroEdital: '',
        dataPublicacao: '',
        situacao: 'previsto',
        dataInicioInscricoes: '',
        dataHomologacao: '',
        dataValidade: '',
        veiculoPublicacao: '',
        arquivo: null
    })

    const resetForm = () => {
        setFormData({
            tipoProcesso: 'concurso_publico',
            numeroEdital: '',
            dataPublicacao: '',
            situacao: 'previsto',
            dataInicioInscricoes: '',
            dataHomologacao: '',
            dataValidade: '',
            veiculoPublicacao: '',
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
                // Fazer a chamada real para a API
                await cadastrarConcursoPublico(formData)
                toast.success('Concurso público cadastrado com sucesso!')
            } else {
                // Editar documento existente
                await editarConcursoPublico(registroSelecionado.id, formData)
                toast.success('Concurso público atualizado com sucesso!')
            }

            // Recarregar a lista de registros
            await recarregarRegistros()
            resetForm()
            setMostrarFormulario(false)
            setModalEdicao(false)
            setEditando(false)
            setRegistroSelecionado(null)
        } catch (error) {
            toast.error('Erro ao salvar concurso público: ' + error.message)
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleEditar = (registro) => {
        setRegistroSelecionado(registro)
        setFormData({
            tipoProcesso: registro.tipo_processo || 'concurso_publico',
            numeroEdital: registro.numero_edital || '',
            dataPublicacao: registro.data_publicacao || '',
            situacao: registro.situacao || 'previsto',
            dataInicioInscricoes: registro.data_inicio_inscricoes || '',
            dataHomologacao: registro.data_homologacao || '',
            dataValidade: registro.data_validade || '',
            veiculoPublicacao: registro.veiculo_publicacao || '',
            arquivo: null
        })
        setEditando(true)
        setModalEdicao(true)
    }

    const handleVisualizar = (registro) => {
        setRegistroSelecionado(registro)
        setVisualizando(true)
    }

    const handleDeletar = async (registro) => {
        if (window.confirm('Tem certeza que deseja deletar este concurso?')) {
            try {
                setLoading(true)
                await excluirConcursoPublico(registro.id)
                await recarregarRegistros()
                toast.success('Concurso deletado com sucesso!')
            } catch (error) {
                toast.error('Erro ao deletar concurso: ' + error.message)
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

    // Aplicar filtros
    const registrosFiltrados = registros.filter(registro => {
        const numeroEditalMatch = !filtros.numeroEdital || (registro.numero_edital && registro.numero_edital.toLowerCase().includes(filtros.numeroEdital.toLowerCase()))
        const dataInicialMatch = !filtros.dataInicial || new Date(registro.data_publicacao) >= new Date(filtros.dataInicial)
        const dataFinalMatch = !filtros.dataFinal || new Date(registro.data_publicacao) <= new Date(filtros.dataFinal)
        return numeroEditalMatch && dataInicialMatch && dataFinalMatch
    })

    // Paginação
    const indiceInicial = (paginaAtual - 1) * itensPorPagina
    const indiceFinal = indiceInicial + itensPorPagina
    const registrosPaginados = registrosFiltrados.slice(indiceInicial, indiceFinal)

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
                            Cadastro de Concurso Público
                        </h1>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Tipo de Processo *
                                    </label>
                                    <select
                                        name="tipoProcesso"
                                        value={formData.tipoProcesso}
                                        onChange={handleInputChange}

                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    >
                                        <option value="concurso_publico">Concurso Público</option>
                                        <option value="selecao_publica">Seleção Pública</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Número do Edital *
                                    </label>
                                    <input
                                        type="text"
                                        name="numeroEdital"
                                        value={formData.numeroEdital}
                                        onChange={handleInputChange}

                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
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
                                        Situação *
                                    </label>
                                    <select
                                        name="situacao"
                                        value={formData.situacao}
                                        onChange={handleInputChange}

                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    >
                                        <option value="previsto">Previsto</option>
                                        <option value="aberto">Aberto</option>
                                        <option value="em_andamento">Em Andamento</option>
                                        <option value="homologado">Homologado</option>
                                        <option value="encerrado">Encerrado</option>
                                        <option value="cancelado">Cancelado</option>
                                        <option value="suspenso">Suspenso</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Data Início das Inscrições
                                    </label>
                                    <input
                                        type="date"
                                        name="dataInicioInscricoes"
                                        value={formData.dataInicioInscricoes}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Data de Homologação
                                    </label>
                                    <input
                                        type="date"
                                        name="dataHomologacao"
                                        value={formData.dataHomologacao}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Data de Validade
                                    </label>
                                    <input
                                        type="date"
                                        name="dataValidade"
                                        value={formData.dataValidade}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Veículo de Publicação
                                    </label>
                                    <input
                                        type="text"
                                        name="veiculoPublicacao"
                                        value={formData.veiculoPublicacao}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">
                                        Arquivo *
                                    </label>
                                    <input
                                        type="file"
                                        name="arquivo"
                                        onChange={handleInputChange}
                                        accept=".pdf"
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 justify-end mt-6">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 bg-azul_escuro text-white rounded hover:laranja_escuros disabled:opacity-50 flex items-center gap-2"
                                >
                                    {loading && <FiLoader className="animate-spin" />}
                                    {loading ? 'Salvando...' : (editando ? 'Atualizar' : 'Salvar')}
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <>
                        <h1 className="text-lg font-bold mb-4">Concursos Públicos</h1>
                        
                        {/* Filtros */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded">
                            <div>
                                <label className="block text-sm font-medium mb-1">Número do Edital</label>
                                <input
                                    type="text"
                                    value={filtros.numeroEdital}
                                    onChange={(e) => handleFiltroChange('numeroEdital', e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    placeholder="Filtrar por número do edital..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Data de Publicação Inicial</label>
                                <input
                                    type="date"
                                    value={filtros.dataInicial}
                                    onChange={(e) => handleFiltroChange('dataInicial', e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Data de Publicação Final</label>
                                <input
                                    type="date"
                                    value={filtros.dataFinal}
                                    onChange={(e) => handleFiltroChange('dataFinal', e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Tabela */}
                        <div>
                            <table className="min-w-full bg-white mt-4 shadow-md rounded-lg">
                                <thead>
                                    <tr className="bg-azul_escuro bg-opacity-90 text-branco_cinza uppercase text-sm leading-normal">
                                        <th className="py-3 px-6 text-left">
                                            Número Edital
                                        </th>
                                        <th className="py-3 px-6 text-left">
                                            Tipo
                                        </th>
                                        <th className="py-3 px-6 text-left">
                                            Data Publicação
                                        </th>
                                        <th className="py-3 px-6 text-left">
                                            Situação
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
                                                    {registro.numero_edital}
                                                </td>
                                                <td className="py-3 px-6 text-left">
                                                    {registro.tipo_processo === 'concurso_publico' ? 'Concurso Público' : 'Seleção Pública'}
                                                </td>
                                                <td className="py-3 px-6 text-left">
                                                    {registro.data_publicacao ? registro.data_publicacao.split('-').reverse().join('/') : '-'}
                                                </td>
                                                <td className="py-3 px-6 text-left">
                                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                                        registro.situacao === 'aberto' ? 'bg-green-100 text-green-800' :
                                                        registro.situacao === 'em_andamento' ? 'bg-blue-100 text-blue-800' :
                                                        registro.situacao === 'homologado' ? 'bg-purple-100 text-purple-800' :
                                                        registro.situacao === 'encerrado' ? 'bg-gray-100 text-gray-800' :
                                                        registro.situacao === 'cancelado' ? 'bg-red-100 text-red-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {registro.situacao === 'previsto' ? 'Previsto' :
                                                         registro.situacao === 'aberto' ? 'Aberto' :
                                                         registro.situacao === 'em_andamento' ? 'Em Andamento' :
                                                         registro.situacao === 'homologado' ? 'Homologado' :
                                                         registro.situacao === 'encerrado' ? 'Encerrado' :
                                                         registro.situacao === 'cancelado' ? 'Cancelado' :
                                                         registro.situacao === 'suspenso' ? 'Suspenso' : registro.situacao}
                                                    </span>
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
                        {registrosFiltrados.length > 0 && (
                            <PaginacaoAvancada
                                paginaAtual={paginaAtual}
                                totalItens={registrosFiltrados.length}
                                itensPorPagina={itensPorPagina}
                                onMudarPagina={setPaginaAtual}
                                onMudarItensPorPagina={setItensPorPagina}
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
                    title={`Editar Concurso Público - ${registroSelecionado.numero_edital}`}
                >
                    <div className="p-6 overflow-auto">
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Tipo de Processo *
                                    </label>
                                    <select
                                        name="tipoProcesso"
                                        value={formData.tipoProcesso}
                                        onChange={handleInputChange}

                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    >
                                        <option value="concurso_publico">Concurso Público</option>
                                        <option value="selecao_publica">Seleção Pública</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Número do Edital *
                                    </label>
                                    <input
                                        type="text"
                                        name="numeroEdital"
                                        value={formData.numeroEdital}
                                        onChange={handleInputChange}

                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
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
                                        Situação *
                                    </label>
                                    <select
                                        name="situacao"
                                        value={formData.situacao}
                                        onChange={handleInputChange}

                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    >
                                        <option value="previsto">Previsto</option>
                                        <option value="aberto">Aberto</option>
                                        <option value="em_andamento">Em Andamento</option>
                                        <option value="homologado">Homologado</option>
                                        <option value="encerrado">Encerrado</option>
                                        <option value="cancelado">Cancelado</option>
                                        <option value="suspenso">Suspenso</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Data Início das Inscrições
                                    </label>
                                    <input
                                        type="date"
                                        name="dataInicioInscricoes"
                                        value={formData.dataInicioInscricoes}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Data de Homologação
                                    </label>
                                    <input
                                        type="date"
                                        name="dataHomologacao"
                                        value={formData.dataHomologacao}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Data de Validade
                                    </label>
                                    <input
                                        type="date"
                                        name="dataValidade"
                                        value={formData.dataValidade}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Veículo de Publicação
                                    </label>
                                    <input
                                        type="text"
                                        name="veiculoPublicacao"
                                        value={formData.veiculoPublicacao}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>

                                <div className="md:col-span-2">
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
                            </div>

                            <div className="flex gap-4 justify-end mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        resetForm()
                                        setMostrarFormulario(false)
                                        setEditando(false)
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

            {/* Modal para Visualização */}
            {visualizando && registroSelecionado && (
                <Modal
                    isOpen={visualizando}
                    onClose={() => {
                        setVisualizando(false)
                        setRegistroSelecionado(null)
                    }}
                    title={`Detalhes do Concurso - ${registroSelecionado.numero_edital}`}
                >
                    <div className="p-6 overflow-auto">
                        <div className="flex flex-wrap gap-4 bg-white p-4 shadow-lg rounded mb-6">
                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong className="text-azul_escuro">Número Edital:</strong>
                                <span className="break-words text-gray-700">{registroSelecionado.numero_edital}</span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong className="text-azul_escuro">Tipo de Processo:</strong>
                                <span className="break-words text-gray-700">
                                    {registroSelecionado.tipo_processo === 'concurso_publico' ? 'Concurso Público' : 'Seleção Pública'}
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

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong className="text-azul_escuro">Situação:</strong>
                                <span className="break-words text-gray-700">
                                    {registroSelecionado.situacao === 'previsto' ? 'Previsto' :
                                     registroSelecionado.situacao === 'aberto' ? 'Aberto' :
                                     registroSelecionado.situacao === 'em_andamento' ? 'Em Andamento' :
                                     registroSelecionado.situacao === 'homologado' ? 'Homologado' :
                                     registroSelecionado.situacao === 'encerrado' ? 'Encerrado' :
                                     registroSelecionado.situacao === 'cancelado' ? 'Cancelado' :
                                     registroSelecionado.situacao === 'suspenso' ? 'Suspenso' : registroSelecionado.situacao}
                                </span>
                            </div>

                            {registroSelecionado.data_inicio_inscricoes && (
                                <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                    <strong className="text-azul_escuro">Início Inscrições:</strong>
                                    <span className="break-words text-gray-700">
                                        {registroSelecionado.data_inicio_inscricoes.split('-').reverse().join('/')}
                                    </span>
                                </div>
                            )}

                            {registroSelecionado.data_homologacao && (
                                <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                    <strong className="text-azul_escuro">Data Homologação:</strong>
                                    <span className="break-words text-gray-700">
                                        {registroSelecionado.data_homologacao.split('-').reverse().join('/')}
                                    </span>
                                </div>
                            )}

                            {registroSelecionado.data_validade && (
                                <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                    <strong className="text-azul_escuro">Data Validade:</strong>
                                    <span className="break-words text-gray-700">
                                        {registroSelecionado.data_validade.split('-').reverse().join('/')}
                                    </span>
                                </div>
                            )}

                            {registroSelecionado.veiculo_publicacao && (
                                <div className="flex flex-col w-full">
                                    <strong className="text-azul_escuro">Veículo de Publicação:</strong>
                                    <span className="break-words text-gray-700">{registroSelecionado.veiculo_publicacao}</span>
                                </div>
                            )}

                            {registroSelecionado.numero_edital && (
                                <div className="flex flex-col w-full">
                                    <strong className="text-azul_escuro mb-2">Arquivo:</strong>
                                    <div className="flex items-center gap-2">
                                        <a 
                                            href={`${process.env.NEXT_PUBLIC_TRANSPARENCIA_ENDPOINT_URL}/concurso_publico/${registroSelecionado.id}/arquivo/`}
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-4 py-2 bg-azul_escuro text-white rounded hover:bg-blue-700 transition-colors"
                                        >
                                            <FaDownload size={16} />
                                            Baixar Documento
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </Modal>
            )}
        </section>
    )
}