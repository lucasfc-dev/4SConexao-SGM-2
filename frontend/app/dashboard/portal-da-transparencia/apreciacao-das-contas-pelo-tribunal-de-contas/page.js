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
import { cadastrarApreciacaoContas, listarApreciacaoContas, editarApreciacaoContas, excluirApreciacaoContas } from '../api/apreciacao_contas/apreciacao_contas'
import { useAuth } from '@/app/context/AuthContext'

export default function ApreciacaoContasTribunalContas() {
    const [registros, setRegistros] = useState([])
    const [loading, setLoading] = useState(false)
    const [mostrarFormulario, setMostrarFormulario] = useState(false)
    const { user } = useAuth()
    const [editando, setEditando] = useState(false)
    const [visualizando, setVisualizando] = useState(false)
    const [modalEdicao, setModalEdicao] = useState(false)
    const [registroSelecionado, setRegistroSelecionado] = useState(null)
    const [filtros, setFiltros] = useState({
        nome: '',
        modalidade: '',
        status: '',
        dataInicial: '',
        dataFinal: ''
    })
    const [paginaAtual, setPaginaAtual] = useState(1)
    const [itensPorPagina, setItensPorPagina] = useState(10)
    const [totalRegistros, setTotalRegistros] = useState(0)
    const [metaDados, setMetaDados] = useState(null)

    // Função para recarregar os dados
    const recarregarRegistros = async (filtrosParaPesquisa = {}, pagina = 1) => {
        if (user && user.estabelecimento) {
            try {
                setLoading(true)
                
                // Preparar filtros para a API
                const filtrosAPI = {}
                if (filtrosParaPesquisa.nome) filtrosAPI.nome = filtrosParaPesquisa.nome
                if (filtrosParaPesquisa.modalidade) filtrosAPI.modalidade = filtrosParaPesquisa.modalidade
                if (filtrosParaPesquisa.status) filtrosAPI.status = filtrosParaPesquisa.status
                if (filtrosParaPesquisa.dataInicial) filtrosAPI.data_registro__gte = filtrosParaPesquisa.dataInicial
                if (filtrosParaPesquisa.dataFinal) filtrosAPI.data_registro__lte = filtrosParaPesquisa.dataFinal
                
                const registrosData = await listarApreciacaoContas(
                    user.estabelecimento.id, 
                    pagina, 
                    itensPorPagina, 
                    filtrosAPI
                )
                setRegistros(registrosData.data)
                setMetaDados(registrosData.meta)
                setTotalRegistros(registrosData.meta?.total || registrosData.meta?.count || 0)
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
        nome: '',
        modalidade: '',
        status: '',
        descricao: '',
        dataRegistro: '',
        dataResultado: '',
        arquivo: null
    })

    const resetForm = () => {
        setFormData({
            nome: '',
            modalidade: '',
            status: '',
            descricao: '',
            dataRegistro: '',
            dataResultado: '',
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
                    dataRegistro: formData.dataRegistro,
                    modalidade: formData.modalidade,
                    status: formData.status,
                    nome: formData.nome,
                    descricao: formData.descricao,
                    dataResultado: formData.dataResultado,
                    arquivo: formData.arquivo
                }

                // Fazer a chamada real para a API
                await cadastrarApreciacaoContas(dadosEnvio)
                toast.success('Registro cadastrado com sucesso!')
            } else {
                // Editar registro existente
                const dadosEnvio = {
                    dataRegistro: formData.dataRegistro,
                    modalidade: formData.modalidade,
                    status: formData.status,
                    nome: formData.nome,
                    descricao: formData.descricao,
                    dataResultado: formData.dataResultado,
                    arquivo: formData.arquivo
                }

                await editarApreciacaoContas(registroSelecionado.id, dadosEnvio)
                toast.success('Registro atualizado com sucesso!')
            }

            // Recarregar a lista de registros com os filtros atuais
            await recarregarRegistros(filtros, paginaAtual)
            resetForm()
            setMostrarFormulario(false)
            setModalEdicao(false)
            setEditando(false)
            setRegistroSelecionado(null)
        } catch (error) {
            toast.error('Erro ao salvar registro: ' + error.message)
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleEditar = (registro) => {
        setRegistroSelecionado(registro)
        setFormData({
            nome: registro.nome || '',
            modalidade: registro.modalidade || '',
            status: registro.status || '',
            descricao: registro.descricao || '',
            dataRegistro: registro.data_registro || '',
            dataResultado: registro.data_resultado || '',
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
        if (window.confirm('Tem certeza que deseja deletar este registro?')) {
            try {
                setLoading(true)
                await excluirApreciacaoContas(registro.id)
                await recarregarRegistros(filtros, paginaAtual)
                toast.success('Registro deletado com sucesso!')
            } catch (error) {
                toast.error('Erro ao deletar registro: ' + error.message)
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
        setPaginaAtual(1) // Resetar para primeira página
        await recarregarRegistros(filtros, 1)
    }

    // Função para limpar filtros
    const handleLimparFiltros = async () => {
        const filtrosLimpos = {
            nome: '',
            modalidade: '',
            status: '',
            dataInicial: '',
            dataFinal: ''
        }
        setFiltros(filtrosLimpos)
        setPaginaAtual(1)
        await recarregarRegistros(filtrosLimpos, 1)
    }

    // Função para mudança de página
    const handleMudancaPagina = async (novaPagina) => {
        setPaginaAtual(novaPagina)
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
                            Cadastro de Apreciação das Contas pelo Tribunal de Contas
                        </h1>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">
                                        Nome do Processo *
                                    </label>
                                    <input
                                        type="text"
                                        name="nome"
                                        value={formData.nome}
                                        onChange={handleInputChange}

                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Modalidade *</label>
                                    <select
                                        name="modalidade"
                                        value={formData.modalidade}
                                        onChange={handleInputChange}

                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    >
                                        <option value="">Selecione...</option>
                                        <option value="Prestacao de Contas Anual">Prestação de Contas Anual</option>
                                        <option value="Tomada de Contas Especial">Tomada de Contas Especial</option>
                                        <option value="Processo de Fiscalizacao">Processo de Fiscalização</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Status *</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleInputChange}

                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    >
                                        <option value="">Selecione...</option>
                                        <option value="Em Tramitacao">Em Tramitação</option>
                                        <option value="Julgado">Julgado</option>
                                        <option value="Aprovado">Aprovado</option>
                                        <option value="Rejeitado">Rejeitado</option>
                                        <option value="Com Ressalvas">Com Ressalvas</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Data de Registro *
                                    </label>
                                    <input
                                        type="date"
                                        name="dataRegistro"

                                        value={formData.dataRegistro}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Data do Resultado
                                    </label>
                                    <input
                                        type="date"
                                        name="dataResultado"
                                        value={formData.dataResultado}
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
                        <h1 className="text-lg font-bold mb-4">Lista de Apreciação das Contas</h1>

                        {/* Filtros */}
                        <div className="bg-gray-50 rounded p-4 mb-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Nome do Processo</label>
                                <input
                                    type="text"
                                    value={filtros.nome}
                                    onChange={(e) => handleFiltroChange('nome', e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    placeholder="Filtrar por nome..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Modalidade</label>
                                <select
                                    value={filtros.modalidade}
                                    onChange={(e) => handleFiltroChange('modalidade', e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                >
                                    <option value="">Todas</option>
                                    <option value="Prestacao de Contas Anual">Prestação de Contas Anual</option>
                                    <option value="Tomada de Contas Especial">Tomada de Contas Especial</option>
                                    <option value="Processo de Fiscalizacao">Processo de Fiscalização</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Status</label>
                                <select
                                    value={filtros.status}
                                    onChange={(e) => handleFiltroChange('status', e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                >
                                    <option value="">Todos</option>
                                    <option value="Em Tramitacao">Em Tramitação</option>
                                    <option value="Julgado">Julgado</option>
                                    <option value="Aprovado">Aprovado</option>
                                    <option value="Rejeitado">Rejeitado</option>
                                    <option value="Com Ressalvas">Com Ressalvas</option>
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
                                            Nome do Processo
                                        </th>
                                        <th className="py-3 px-6 text-left">
                                            Modalidade
                                        </th>
                                        <th className="py-3 px-6 text-left">
                                            Status
                                        </th>
                                        <th className="py-3 px-6 text-left">
                                            Descrição
                                        </th>
                                        <th className="py-3 px-6 text-left">                                            Descrição
                                        </th>
                                        <th className="py-3 px-6 text-left">                                            Data de Registro
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
                                                Nenhum registro encontrado
                                            </td>
                                        </tr>
                                    </tfoot>
                                ) : (
                                    <tbody className="text-gray-800 text-sm font-light">
                                        {registrosPaginados.map((registro) => (
                                            <tr key={registro.id} className="border-b border-gray-200 hover:bg-gray-100">
                                                <td className="py-3 px-6 text-left">
                                                    {registro.nome}
                                                </td>
                                                <td className="py-3 px-6 text-left">
                                                    {registro.modalidade}
                                                </td>
                                                <td className="py-3 px-6 text-left">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                                        registro.status === 'Aprovado' ? 'bg-green-100 text-green-800' :
                                                        registro.status === 'Rejeitado' ? 'bg-red-100 text-red-800' :
                                                        registro.status === 'Julgado' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {registro.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-6 text-left max-w-xs">
                                                    <DescricaoTruncada texto={registro.descricao} maxLength={80} />
                                                </td>
                                                <td className="py-3 px-6 text-left">
                                                    {registro.data_registro ? registro.data_registro.split('-').reverse().join('/') : '-'}
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

            {/* Modal de Visualização */}
            {visualizando && registroSelecionado && (
                <Modal
                    isOpen={visualizando}
                    onClose={() => setVisualizando(false)}
                    title={`Detalhes da Apreciação - ${registroSelecionado.nome}`}
                >
                    <div className="p-6 overflow-y-auto">
                        <div className="flex flex-wrap gap-4 bg-white p-4 shadow-lg rounded mb-6">
                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong className="text-azul_escuro">Nome do Processo:</strong>
                                <span className="break-words text-gray-700">{registroSelecionado.nome}</span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong className="text-azul_escuro">Modalidade:</strong>
                                <span className="break-words text-gray-700">{registroSelecionado.modalidade}</span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong className="text-azul_escuro">Status:</strong>
                                <span className={`px-2 py-1 text-xs rounded-full inline-block mt-1 ${
                                    registroSelecionado.status === 'Aprovado' ? 'bg-green-100 text-green-800' :
                                    registroSelecionado.status === 'Rejeitado' ? 'bg-red-100 text-red-800' :
                                    registroSelecionado.status === 'Julgado' ? 'bg-blue-100 text-blue-800' :
                                    'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {registroSelecionado.status}
                                </span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong className="text-azul_escuro">Data de Registro:</strong>
                                <span className="break-words text-gray-700">
                                    {registroSelecionado.data_registro ? 
                                        registroSelecionado.data_registro.split('-').reverse().join('/') : '-'
                                    }
                                </span>
                            </div>

                            {registroSelecionado.data_resultado && (
                                <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                    <strong className="text-azul_escuro">Data do Resultado:</strong>
                                    <span className="break-words text-gray-700">
                                        {registroSelecionado.data_resultado.split('-').reverse().join('/')}
                                    </span>
                                </div>
                            )}

                            {registroSelecionado.descricao && (
                                <div className="flex flex-col w-full">
                                    <strong className="text-azul_escuro mb-2">Descrição:</strong>
                                    <div className="bg-gray-50 p-4 rounded-lg border">
                                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{registroSelecionado.descricao}</p>
                                    </div>
                                </div>
                            )}

                            {registroSelecionado.arquivo && (
                                <div className="flex flex-col w-full">
                                    <strong className="text-azul_escuro mb-2">Arquivo:</strong>
                                    <div className="flex items-center gap-2">
                                        <a 
                                            href={`${process.env.NEXT_PUBLIC_TRANSPARENCIA_ENDPOINT_URL}/apreciacao_contas/${registroSelecionado.id}/arquivo/`}
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
                    title={`Editar Apreciação - ${registroSelecionado.nome}`}
                >
                    <div className="p-6">
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">
                                        Nome do Processo *
                                    </label>
                                    <input
                                        type="text"
                                        name="nome"
                                        value={formData.nome}
                                        onChange={handleInputChange}

                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Modalidade *</label>
                                    <select
                                        name="modalidade"
                                        value={formData.modalidade}
                                        onChange={handleInputChange}

                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    >
                                        <option value="">Selecione...</option>
                                        <option value="Prestacao de Contas Anual">Prestação de Contas Anual</option>
                                        <option value="Tomada de Contas Especial">Tomada de Contas Especial</option>
                                        <option value="Processo de Fiscalizacao">Processo de Fiscalização</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Status *</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleInputChange}

                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    >
                                        <option value="">Selecione...</option>
                                        <option value="Em Tramitacao">Em Tramitação</option>
                                        <option value="Julgado">Julgado</option>
                                        <option value="Aprovado">Aprovado</option>
                                        <option value="Rejeitado">Rejeitado</option>
                                        <option value="Com Ressalvas">Com Ressalvas</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Data de Registro *
                                    </label>
                                    <input
                                        type="date"
                                        name="dataRegistro"

                                        value={formData.dataRegistro}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Data do Resultado
                                    </label>
                                    <input
                                        type="date"
                                        name="dataResultado"
                                        value={formData.dataResultado}
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