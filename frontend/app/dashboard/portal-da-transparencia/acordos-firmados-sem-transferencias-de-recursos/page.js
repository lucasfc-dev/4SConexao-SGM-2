'use client'
import { useState, useEffect } from 'react'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { FaEdit, FaEye, FaPlus, FaSearch, FaDownload } from 'react-icons/fa'
import { MdDelete } from 'react-icons/md'
import { FiLoader } from 'react-icons/fi'
import Modal from '@/app/components/modal'
import PaginacaoAvancada from '@/app/components/PaginacaoAvancada'
import DescricaoTruncada from '@/app/components/DescricaoTruncada'
import { criarDocumentoNumerado, listarDocumentosNumerados, editarDocumentoNumerado, excluirDocumentoNumerado } from '../api/doc_numerado/doc_numerado'
import { useAuth } from '@/app/context/AuthContext'

export default function AcordosFirmadosSemTransferenciasRecursos() {
    const [registros, setRegistros] = useState([])
    const [loading, setLoading] = useState(false)
    const [mostrarFormulario, setMostrarFormulario] = useState(false)
    const { user } = useAuth()
    const [editando, setEditando] = useState(false)
    const [visualizando, setVisualizando] = useState(false)
    const [modalEdicao, setModalEdicao] = useState(false)
    const [registroSelecionado, setRegistroSelecionado] = useState(null)
    const [filtros, setFiltros] = useState({
        numeroDocumento: '',
        ano: '',
        titulo: '',
        dataInicial: '',
        dataFinal: ''
    })
    const [paginaAtual, setPaginaAtual] = useState(1)
    const [itensPorPagina, setItensPorPagina] = useState(10)
    const [totalItens, setTotalItens] = useState(0)

    // Função para recarregar os dados
    const recarregarRegistros = async (pagina = paginaAtual, itensPerPage = itensPorPagina) => {
        if (user && user.estabelecimento) {
            try {
                setLoading(true)
                const offset = (pagina - 1) * itensPerPage
                const resultado = await listarDocumentosNumerados('acordos_firmados', user.estabelecimento.id, {
                    offset,
                    limit: itensPerPage
                })
                setRegistros(resultado.data)
                setTotalItens(resultado.total)
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

    // Função para mudar página
    const handleMudarPagina = (novaPagina) => {
        setPaginaAtual(novaPagina)
        recarregarRegistros(novaPagina, itensPorPagina)
    }

    // Estados do formulário
    const [formData, setFormData] = useState({
        numeroDocumento: '',
        ano: '',
        titulo: '',
        descricao: '',
        dataPublicacao: '',
        arquivo: null
    })

    const resetForm = () => {
        setFormData({
            numeroDocumento: '',
            ano: '',
            titulo: '',
            descricao: '',
            dataPublicacao: '',
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
                    dataPublicacao: formData.dataPublicacao,
                    titulo: formData.titulo,
                    descricao: formData.descricao,
                    numDoc: formData.numeroDocumento,
                    arquivo: formData.arquivo
                }

                // Fazer a chamada real para a API
                await criarDocumentoNumerado('acordos_firmados', dadosEnvio)
                toast.success('Acordo cadastrado com sucesso!')
            } else {
                // Editar acordo existente
                const dadosEnvio = {
                    dataPublicacao: formData.dataPublicacao,
                    titulo: formData.titulo,
                    descricao: formData.descricao,
                    numDoc: formData.numeroDocumento,
                    arquivo: formData.arquivo
                }

                await editarDocumentoNumerado(registroSelecionado.id, dadosEnvio)
                toast.success('Acordo atualizado com sucesso!')
            }

            // Recarregar a lista de registros
            await recarregarRegistros()
            resetForm()
            setMostrarFormulario(false)
            setModalEdicao(false)
            setEditando(false)
            setRegistroSelecionado(null)
        } catch (error) {
            toast.error('Erro ao salvar acordo: ' + error.message)
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleEditar = (registro) => {
        setRegistroSelecionado(registro)
        setFormData({
            numeroDocumento: registro.num_doc || '',
            ano: registro.ano || '',
            titulo: registro.titulo || '',
            descricao: registro.descricao || '',
            dataPublicacao: registro.data_publicacao || '',
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
        if (window.confirm('Tem certeza que deseja deletar este acordo?')) {
            try {
                setLoading(true)
                await excluirDocumentoNumerado(registro.id)
                await recarregarRegistros()
                toast.success('Acordo deletado com sucesso!')
            } catch (error) {
                toast.error('Erro ao deletar acordo: ' + error.message)
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

    // Aplicar filtros aos dados paginados do backend
    const registrosFiltrados = registros.filter(registro => {
        const numeroMatch = !filtros.numeroDocumento || (registro.num_doc && registro.num_doc.toString().includes(filtros.numeroDocumento))
        const anoMatch = !filtros.ano || (registro.ano && registro.ano.toString().includes(filtros.ano))
        const tituloMatch = !filtros.titulo || (registro.titulo && registro.titulo.toLowerCase().includes(filtros.titulo.toLowerCase()))
        return numeroMatch && anoMatch && tituloMatch
    })

    const registrosPaginados = registrosFiltrados

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
                    className={`px-4 py-2 rounded-md flex items-center gap-2 ${mostrarFormulario ? 'bg-orange-600 text-white' : 'bg-gray-300 text-black'
                        }`}
                >
                    <FaPlus size={16} />
                    Cadastro
                </button>
                <button
                    onClick={() => setMostrarFormulario(false)}
                    className={`px-4 py-2 rounded-md flex items-center gap-2 ${!mostrarFormulario ? 'bg-orange-600 text-white' : 'bg-gray-300 text-black'
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
                            Cadastro de Acordos Firmados
                        </h1>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Número do Documento *
                                    </label>
                                    <input
                                        type="text"
                                        name="numeroDocumento"
                                        value={formData.numeroDocumento}
                                        onChange={handleInputChange}

                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Ano *
                                    </label>
                                    <input
                                        type="number"
                                        name="ano"
                                        value={formData.ano}
                                        onChange={handleInputChange}

                                        min="2000"
                                        max="2030"
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">
                                        Título do Acordo *
                                    </label>
                                    <input
                                        type="text"
                                        name="titulo"
                                        value={formData.titulo}
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

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">
                                        Descrição
                                    </label>
                                    <textarea
                                        name="descricao"
                                        value={formData.descricao}
                                        onChange={handleInputChange}
                                        rows={4}
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
                    </>
                ) : (
                    <>
                        <h1 className="text-lg font-bold mb-4">Lista de Acordos Firmados</h1>

                        {/* Filtros */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded">
                            <div>
                                <label className="block text-sm font-medium mb-1">Número do Documento</label>
                                <input
                                    type="text"
                                    value={filtros.numeroDocumento}
                                    onChange={(e) => handleFiltroChange('numeroDocumento', e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    placeholder="Filtrar por número..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Ano</label>
                                <input
                                    type="text"
                                    value={filtros.ano}
                                    onChange={(e) => handleFiltroChange('ano', e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    placeholder="Filtrar por ano..."
                                />
                            </div>
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
                        </div>

                        {/* Tabela */}
                        <div>
                            <table className="min-w-full bg-white mt-4 shadow-md rounded-lg">
                                <thead>
                                    <tr className="bg-azul_escuro bg-opacity-90 text-branco_cinza uppercase text-sm leading-normal">
                                        <th className="py-3 px-6 text-left">
                                            Número
                                        </th>
                                        <th className="py-3 px-6 text-left">
                                            Ano
                                        </th>
                                        <th className="py-3 px-6 text-left">
                                            Título
                                        </th>
                                        <th className="py-3 px-6 text-left">
                                            Descrição
                                        </th>
                                        <th className="py-3 px-6 text-left">
                                            Data de Publicação
                                        </th>
                                        <th className="py-3 px-6 text-center">
                                            Ações
                                        </th>
                                    </tr>
                                </thead>
                                {loading ? (
                                    <tfoot>
                                        <tr>
                                            <td colSpan="6" className="py-3 px-6 text-center">
                                                <div className="flex justify-center items-center">
                                                    <FiLoader size={24} className="animate-spin text-4xl text-azul_escuro" />
                                                </div>
                                            </td>
                                        </tr>
                                    </tfoot>
                                ) : registrosPaginados.length === 0 ? (
                                    <tfoot>
                                        <tr>
                                            <td colSpan="6" className="py-3 px-6 text-center text-gray-500">
                                                Nenhum acordo encontrado
                                            </td>
                                        </tr>
                                    </tfoot>
                                ) : (
                                    <tbody className="text-gray-800 text-sm font-light">
                                        {registrosPaginados.map((registro) => (
                                            <tr key={registro.id} className="border-b border-gray-200 hover:bg-gray-100">
                                                <td className="py-3 px-6 text-left">
                                                    {registro.num_doc}
                                                </td>
                                                <td className="py-3 px-6 text-left">
                                                    {registro.ano}
                                                </td>
                                                <td className="py-3 px-6 text-left">
                                                    {registro.titulo}
                                                </td>
                                                <td className="py-3 px-6 text-left max-w-xs">
                                                    <DescricaoTruncada texto={registro.descricao} maxLength={80} />
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
                        <PaginacaoAvancada
                            paginaAtual={paginaAtual}
                            totalItens={totalItens}
                            itensPorPagina={itensPorPagina}
                            onMudarPagina={handleMudarPagina}
                        />
                    </>
                )}
            </div>

            {/* Modal de Visualização */}
            {visualizando && registroSelecionado && (
                <Modal
                    isOpen={visualizando}
                    onClose={() => setVisualizando(false)}
                    title={`Detalhes do Acordo - ${registroSelecionado.num_doc || registroSelecionado.numeroDocumento}`}
                >
                    <div className="p-6 overflow-y-auto">
                        <div className="flex flex-wrap gap-4 bg-white p-4 shadow-lg rounded mb-6">
                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong className="text-azul_escuro">Número do Documento:</strong>
                                <span className="break-words text-gray-700">{registroSelecionado.num_doc || registroSelecionado.numeroDocumento}</span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong className="text-azul_escuro">Ano:</strong>
                                <span className="break-words text-gray-700">{registroSelecionado.ano}</span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong className="text-azul_escuro">Título:</strong>
                                <span className="break-words text-gray-700">{registroSelecionado.titulo}</span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong className="text-azul_escuro">Data de Publicação:</strong>
                                <span className="break-words text-gray-700">
                                    {registroSelecionado.data_publicacao ? 
                                        registroSelecionado.data_publicacao.split('-').reverse().join('/') : 
                                        (registroSelecionado.dataPublicacao ? registroSelecionado.dataPublicacao.split('-').reverse().join('/') : '-')
                                    }
                                </span>
                            </div>

                            {registroSelecionado.descricao && (
                                <div className="flex flex-col w-full">
                                    <strong className="text-azul_escuro mb-2">Descrição:</strong>
                                    <div className="bg-gray-50 p-4 rounded-lg border">
                                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{registroSelecionado.descricao}</p>
                                    </div>
                                </div>
                            )}

                            {registroSelecionado.url_arquivo && (
                                <div className="flex flex-col w-full">
                                    <strong className="text-azul_escuro mb-2">Arquivo:</strong>
                                    <div className="flex items-center gap-2">
                                        <a 
                                            href={registroSelecionado.url_arquivo} 
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
                    title={`Editar Acordo - ${registroSelecionado.num_doc}`}
                >
                    <div className="overflow-auto p-6">
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Número do Documento *
                                    </label>
                                    <input
                                        type="text"
                                        name="numeroDocumento"
                                        value={formData.numeroDocumento}
                                        onChange={handleInputChange}

                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Ano *
                                    </label>
                                    <input
                                        type="number"
                                        name="ano"
                                        value={formData.ano}
                                        onChange={handleInputChange}

                                        min="2000"
                                        max="2030"
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">
                                        Título do Acordo *
                                    </label>
                                    <input
                                        type="text"
                                        name="titulo"
                                        value={formData.titulo}
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

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">
                                        Descrição
                                    </label>
                                    <textarea
                                        name="descricao"
                                        value={formData.descricao}
                                        onChange={handleInputChange}
                                        rows={4}
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
                                    {loading ? 'Atualizando...' : 'Atualizar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </Modal>
            )}
        </section>
    )
}