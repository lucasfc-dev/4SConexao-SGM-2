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
import { criarDocumentoNumerado, listarDocumentosNumerados, editarDocumentoNumerado, excluirDocumentoNumerado, obterDocumentoNumerado } from '../api/doc_numerado/doc_numerado'
import { useAuth } from '@/app/context/AuthContext'

export default function CotasParlamentares() {
    const [registros, setRegistros] = useState([])
    const [loading, setLoading] = useState(false)
    const [mostrarFormulario, setMostrarFormulario] = useState(false)
    const { user } = useAuth()
    const [editando, setEditando] = useState(false)
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
    const [totalRegistros, setTotalRegistros] = useState(0)

    const recarregarRegistros = async (filtrosParaPesquisa = {}, pagina = 1) => {
        if (user && user.estabelecimento) {
            try {
                setLoading(true)

                const filtrosAPI = {}
                if (filtrosParaPesquisa.numeroDocumento) filtrosAPI.numero = filtrosParaPesquisa.numeroDocumento
                if (filtrosParaPesquisa.titulo) filtrosAPI.titulo = filtrosParaPesquisa.titulo
                if (filtrosParaPesquisa.dataInicial) filtrosAPI.data_publicacao__gte = filtrosParaPesquisa.dataInicial
                if (filtrosParaPesquisa.dataFinal) filtrosAPI.data_publicacao__lte = filtrosParaPesquisa.dataFinal

                const offset = (pagina - 1) * itensPorPagina
                const registrosData = await listarDocumentosNumerados(
                    'cota_parlamentar',
                    user.estabelecimento.id,
                    {
                        offset,
                        limit: itensPorPagina,
                        filters: filtrosAPI
                    }
                )
                setRegistros(registrosData.data)
                setTotalRegistros(registrosData.total || 0)
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
                const dadosEnvio = {
                    dataPublicacao: formData.dataPublicacao,
                    titulo: formData.titulo,
                    descricao: formData.descricao,
                    numDoc: formData.numeroDocumento,
                    arquivo: formData.arquivo
                }

                await criarDocumentoNumerado('cota_parlamentar', dadosEnvio)
                toast.success('Cota parlamentar cadastrada com sucesso!')
            } else {
                const dadosEnvio = {
                    dataPublicacao: formData.dataPublicacao,
                    titulo: formData.titulo,
                    descricao: formData.descricao,
                    numDoc: formData.numeroDocumento,
                    arquivo: formData.arquivo
                }

                await editarDocumentoNumerado(registroSelecionado.id, dadosEnvio)
                toast.success('Cota parlamentar atualizada com sucesso!')
            }

            await recarregarRegistros(filtros, paginaAtual)
            resetForm()
            setMostrarFormulario(false)
            setModalEdicao(false)
            setEditando(false)
            setRegistroSelecionado(null)
        } catch (error) {
            toast.error('Erro ao salvar cota parlamentar: ' + error.message)
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

    const handleDownload = async (registro) => {
        try {
            setLoading(true)

            const blob = await obterDocumentoNumerado(registro.id)

            if (blob && blob.size > 0) {
                const url = URL.createObjectURL(blob)

                const link = document.createElement('a')
                link.href = url
                link.download = `${registro.num_doc}_${registro.titulo}`
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
            toast.error('Erro ao fazer download do arquivo: ' + error.message)
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleDeletar = async (registro) => {
        if (window.confirm('Tem certeza que deseja deletar esta cota parlamentar?')) {
            try {
                setLoading(true)
                await excluirDocumentoNumerado(registro.id)
                await recarregarRegistros(filtros, paginaAtual)
                toast.success('Cota parlamentar deletada com sucesso!')
            } catch (error) {
                toast.error('Erro ao deletar cota parlamentar: ' + error.message)
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

    const handlePesquisar = async () => {
        setPaginaAtual(1)
        await recarregarRegistros(filtros, 1)
    }

    const handleLimparFiltros = async () => {
        const filtrosLimpos = {
            numeroDocumento: '',
            ano: '',
            titulo: '',
            dataInicial: '',
            dataFinal: ''
        }
        setFiltros(filtrosLimpos)
        setPaginaAtual(1)
        await recarregarRegistros(filtrosLimpos, 1)
    }

    const handleMudancaPagina = async (novaPagina) => {
        setPaginaAtual(novaPagina)
        await recarregarRegistros(filtros, novaPagina)
    }

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
                            Cadastro de Cotas Parlamentares
                        </h1>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Nº do Documento
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
                                        Data de Publicação
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
                                        Título do Documento
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
                                        Descrição
                                    </label>
                                    <textarea
                                        name="descricao"
                                        value={formData.descricao}
                                        onChange={handleInputChange}
                                        rows={4}
                                        placeholder="Descreva a cota parlamentar..."
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">
                                        Anexar Arquivo
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
                        <h1 className="text-lg font-bold mb-4">Lista de Cotas Parlamentares</h1>

                        {/* Filtros */}
                        <div className="bg-gray-50 rounded p-4 mb-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Nº do Documento</label>
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
                                    <label className="block text-sm font-medium mb-1">Título do Documento</label>
                                    <input
                                        type="text"
                                        value={filtros.titulo}
                                        onChange={(e) => handleFiltroChange('titulo', e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                        placeholder="Filtrar por título..."
                                    />
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
                                            Nº Documento
                                        </th>
                                        <th className="py-3 px-6 text-left">
                                            Ano
                                        </th>
                                        <th className="py-3 px-6 text-left">
                                            Título do Documento
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
                                                Nenhuma cota parlamentar encontrada
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
                        {totalRegistros > 0 && (
                            <PaginacaoAvancada
                                paginaAtual={paginaAtual}
                                totalItens={totalRegistros}
                                itensPorPagina={itensPorPagina}
                                onMudarPagina={handleMudancaPagina}
                                onMudarItensPorPagina={(novoLimite) => {
                                    setItensPorPagina(novoLimite)
                                    setPaginaAtual(1)
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
                    title={`Editar Cota Parlamentar - ${registroSelecionado.num_doc}`}
                >
                    <div className="overflow-auto p-6">
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Nº do Documento
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
                                        Data de Publicação
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
                                        Título do Documento
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
                                        Descrição
                                    </label>
                                    <textarea
                                        name="descricao"
                                        value={formData.descricao}
                                        onChange={handleInputChange}
                                        rows={4}
                                        placeholder="Descreva a cota parlamentar..."
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">
                                        Anexar Arquivo (opcional - deixe vazio para manter o atual)
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
