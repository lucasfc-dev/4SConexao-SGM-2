'use client'
import { useState, useEffect } from 'react'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { FaEdit, FaEye, FaPlus, FaSearch, FaDownload } from 'react-icons/fa'
import { MdDelete } from 'react-icons/md'
import { FiLoader } from 'react-icons/fi'
import Modal from '@/app/components/modal'
import PaginacaoAvancada from '@/app/components/PaginacaoAvancada'
import { listarMedicamentosSUS, criarMedicamentoSUS, atualizarListaDeMedicamentosSUS, deletarMedicamentoSUS, obterArquivoMedicamentoSUS } from '../api/medicamentos_sus/medicamentos_sus'
import { useAuth } from '@/app/context/AuthContext'

export default function ListaDeMedicamentosFornecidosPeloSUS() {
    const [registros, setRegistros] = useState([])
    const [loading, setLoading] = useState(false)
    const [mostrarFormulario, setMostrarFormulario] = useState(false)
    const { user } = useAuth()
    const [editando, setEditando] = useState(false)
    const [modalEdicao, setModalEdicao] = useState(false)
    const [registroSelecionado, setRegistroSelecionado] = useState(null)
    const [filtros, setFiltros] = useState({
        nome_unidade: '',
        endereco: ''
    })
    const [paginacao, setPaginacao] = useState({
        paginaAtual: 1,
        itensPorPagina: 10,
        totalItens: 0
    })

    // Função para recarregar os dados
    const recarregarRegistros = async (filtrosParaPesquisa = {}, pagina = null) => {
        if (user && user.estabelecimento) {
            try {
                setLoading(true)
                const paginaAtual = pagina || paginacao.paginaAtual
                const offset = (paginaAtual - 1) * paginacao.itensPorPagina
                
                // Preparar filtros para a API
                const filtrosAPI = {}
                if (filtrosParaPesquisa.nome_unidade) filtrosAPI.nome_unidade = filtrosParaPesquisa.nome_unidade
                if (filtrosParaPesquisa.endereco) filtrosAPI.endereco = filtrosParaPesquisa.endereco
                
                const response = await listarMedicamentosSUS(user.estabelecimento.id, offset, paginacao.itensPorPagina, filtrosAPI)
                setRegistros(response.data || [])
                setPaginacao(prev => ({
                    ...prev,
                    paginaAtual: paginaAtual,
                    totalItens: response.meta?.total || 0
                }))
            } catch (error) {
                toast.error('Erro ao carregar medicamentos: ' + error.message)
                setRegistros([])
            } finally {
                setLoading(false)
            }
        }
    }

    useEffect(() => {
        recarregarRegistros({}, 1)
    }, [user, paginacao.itensPorPagina])

    // Estados do formulário
    const [formData, setFormData] = useState({
        nome_unidade: '',
        endereco: '',
        telefone: '',
        arquivo: null
    })

    const resetForm = () => {
        setFormData({
            nome_unidade: '',
            endereco: '',
            telefone: '',
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
                // Criar novo medicamento
                await criarMedicamentoSUS({
                    nome_unidade: formData.nome_unidade,
                    endereco: formData.endereco,
                    telefone: formData.telefone,
                    file: formData.arquivo
                })
                toast.success('Lista de Medicamentos cadastrada com sucesso!')
            } else {
                // Editar medicamento existente
                await atualizarListaDeMedicamentosSUS(registroSelecionado.id, {
                    nome_unidade: formData.nome_unidade,
                    endereco: formData.endereco,
                    telefone: formData.telefone,
                    file: formData.arquivo
                })
                toast.success('Lista de Medicamentos atualizada com sucesso!')
                setModalEdicao(false)
            }

            // Recarregar a lista de registros
            await recarregarRegistros()
            resetForm()
            setMostrarFormulario(false)
            setEditando(false)
            setRegistroSelecionado(null)
        } catch (error) {
            toast.error('Erro ao salvar medicamento: ' + error.message)
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleEditar = (registro) => {
        setRegistroSelecionado(registro)
        setFormData({
            nome_unidade: registro.nome_unidade || '',
            endereco: registro.endereco || '',
            telefone: registro.telefone || '',
            arquivo: null
        })
        setEditando(true)
        setModalEdicao(true)
    }

    const handleDownload = async (registro) => {
        try {
            setLoading(true)
            
            // Obter o blob do arquivo
            const blob = await obterArquivoMedicamentoSUS(registro.id)
            
            if (blob && blob.size > 0) {
                // Criar URL temporária para o blob
                const url = URL.createObjectURL(blob)
                
                // Criar elemento de download
                const link = document.createElement('a')
                link.href = url
                link.download = `${registro.nome_unidade || 'medicamento'}`
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
        if (window.confirm('Tem certeza que deseja deletar este medicamento?')) {
            try {
                setLoading(true)
                await deletarMedicamentoSUS(registro.id)
                await recarregarRegistros(filtros, paginacao.paginaAtualfiltros, paginacao.paginaAtual)
                toast.success('Medicamento deletado com sucesso!')
            } catch (error) {
                toast.error('Erro ao deletar medicamento: ' + error.message)
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
            nome_unidade: '',
            endereco: ''
        }
        setFiltros(filtrosLimpos)
        await recarregarRegistros(filtrosLimpos, 1)
    }

    // Usar registros diretamente da API (já filtrados)
    const registrosFiltrados = registros

    const handlePaginaChange = async (novaPagina) => {
        await recarregarRegistros(filtros, novaPagina)
    }

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
                        setEditando(false)
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
                            Cadastro de Medicamentos Fornecidos pelo SUS
                        </h1>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">
                                        Nome da Unidade *
                                    </label>
                                    <input
                                        type="text"
                                        name="nome_unidade"
                                        value={formData.nome_unidade}
                                        onChange={handleInputChange}

                                        maxLength={255}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Endereço *
                                    </label>
                                    <input
                                        type="text"
                                        name="endereco"
                                        value={formData.endereco}
                                        onChange={handleInputChange}

                                        maxLength={500}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Telefone *
                                    </label>
                                    <input
                                        type="tel"
                                        name="telefone"
                                        value={formData.telefone}
                                        onChange={handleInputChange}

                                        maxLength={30}
                                        placeholder="(11) 99999-9999"
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
                                    <small className="text-gray-500">
                                        Formatos aceitos: PDF
                                    </small>
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
                        <h1 className="text-lg font-bold mb-4">Lista de Medicamentos Fornecidos pelo SUS</h1>

                        {/* Filtros */}
                        <div className="bg-gray-50 rounded p-4 mb-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Nome da Unidade</label>
                                    <input
                                        type="text"
                                        value={filtros.nome_unidade}
                                        onChange={(e) => handleFiltroChange('nome_unidade', e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                        placeholder="Filtrar por nome da unidade..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Endereço</label>
                                    <input
                                        type="text"
                                        value={filtros.endereco}
                                        onChange={(e) => handleFiltroChange('endereco', e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                        placeholder="Filtrar por endereço..."
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
                                            Nome da Unidade
                                        </th>
                                        <th className="py-3 px-6 text-left">
                                            Endereço
                                        </th>
                                        <th className="py-3 px-6 text-left">
                                            Telefone
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
                                ) : registrosFiltrados.length === 0 ? (
                                    <tfoot>
                                        <tr>
                                            <td colSpan="4" className="py-3 px-6 text-center text-gray-500">
                                                {registros.length === 0 
                                                    ? 'Nenhuma unidade de medicamento cadastrada ainda.' 
                                                    : 'Nenhuma unidade encontrada com os filtros aplicados.'}
                                            </td>
                                        </tr>
                                    </tfoot>
                                ) : (
                                    <tbody className="text-gray-800 text-sm font-light">
                                        {registrosFiltrados.map((registro, index) => (
                                            <tr key={registro.id || index} className="border-b border-gray-200 hover:bg-gray-100">
                                                <td className="py-3 px-6 text-left">
                                                    {registro.nome_unidade || 'N/A'}
                                                </td>
                                                <td className="py-3 px-6 text-left">
                                                    {registro.endereco || 'N/A'}
                                                </td>
                                                <td className="py-3 px-6 text-left">
                                                    {registro.telefone || 'N/A'}
                                                </td>
                                                <td className="flex flex-wrap items-center justify-center py-3 px-6">
                                                    {acoes.map((acao, acoesIndex) => (
                                                        <button
                                                            key={acoesIndex}
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
                        <div className="mt-4">
                            <PaginacaoAvancada
                                paginaAtual={paginacao.paginaAtual}
                                totalItens={paginacao.totalItens}
                                itensPorPagina={paginacao.itensPorPagina}
                                onMudarPagina={handlePaginaChange}
                                onMudarItensPorPagina={(novoLimite) => {
                                    setPaginacao(prev => ({ ...prev, itensPorPagina: novoLimite, paginaAtual: 1 }))
                                    recarregarRegistros(filtros, 1)
                                }}
                            />
                        </div>
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
                    title={`Editar Unidade - ${registroSelecionado.nome_unidade}`}
                >
                    <div className="overflow-auto p-6">
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">
                                        Nome da Unidade *
                                    </label>
                                    <input
                                        type="text"
                                        name="nome_unidade"
                                        value={formData.nome_unidade}
                                        onChange={handleInputChange}

                                        maxLength={255}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Endereço *
                                    </label>
                                    <input
                                        type="text"
                                        name="endereco"
                                        value={formData.endereco}
                                        onChange={handleInputChange}

                                        maxLength={500}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Telefone *
                                    </label>
                                    <input
                                        type="tel"
                                        name="telefone"
                                        value={formData.telefone}
                                        onChange={handleInputChange}

                                        maxLength={30}
                                        placeholder="(11) 99999-9999"
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
