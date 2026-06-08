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
import { criarEmendaParlamentar, listarEmendasParlamentares, editarEmendaParlamentar, deletarEmendaParlamentar, obterArquivoEmendaParlamentar } from '../api/emendas_parlamentares/emendas_parlamentares'
import { useAuth } from '@/app/context/AuthContext'
import { formatarMoeda, formatarMoedaInput, desformatarMoeda, numeroParaInput } from '@/app/utils/formatarMoeda'

export default function EmendasParlamentares() {
    const [registros, setRegistros] = useState([])
    const [loading, setLoading] = useState(false)
    const [mostrarFormulario, setMostrarFormulario] = useState(false)
    const { user } = useAuth()
    const [editando, setEditando] = useState(false)
    const [modalEdicao, setModalEdicao] = useState(false)
    const [modalVisualizacao, setModalVisualizacao] = useState(false)
    const [registroSelecionado, setRegistroSelecionado] = useState(null)
    const [filtros, setFiltros] = useState({
        origem: '',
        anoReferencia: '',
        beneficiario: '',
        formaRepasse: '',
        tipo: '',
        numero: '',
        autor: '',
        objeto: '',
        dataInicial: '',
        dataFinal: ''
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
                if (filtrosParaPesquisa.origem) filtrosAPI.origem = filtrosParaPesquisa.origem
                if (filtrosParaPesquisa.anoReferencia) filtrosAPI.ano_referencia = filtrosParaPesquisa.anoReferencia
                if (filtrosParaPesquisa.beneficiario) filtrosAPI.beneficiario = filtrosParaPesquisa.beneficiario
                if (filtrosParaPesquisa.formaRepasse) filtrosAPI.forma_repasse = filtrosParaPesquisa.formaRepasse
                if (filtrosParaPesquisa.tipo) filtrosAPI.tipo = filtrosParaPesquisa.tipo
                if (filtrosParaPesquisa.numero) filtrosAPI.numero = filtrosParaPesquisa.numero
                if (filtrosParaPesquisa.autor) filtrosAPI.autor = filtrosParaPesquisa.autor
                if (filtrosParaPesquisa.objeto) filtrosAPI.objeto = filtrosParaPesquisa.objeto
                if (filtrosParaPesquisa.dataInicial) filtrosAPI.data_publicacao__gte = filtrosParaPesquisa.dataInicial
                if (filtrosParaPesquisa.dataFinal) filtrosAPI.data_publicacao__lte = filtrosParaPesquisa.dataFinal
                
                const response = await listarEmendasParlamentares(
                    user.estabelecimento.id, 
                    offset, 
                    paginacao.itensPorPagina, 
                    filtrosAPI
                )
                setRegistros(response.data || [])
                setPaginacao(prev => ({
                    ...prev,
                    paginaAtual: paginaAtual,
                    totalItens: response.meta?.total || 0
                }))
            } catch (error) {
                toast.error('Erro ao carregar emendas parlamentares: ' + error.message)
                setRegistros([])
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
        origem: '',
        anoReferencia: '',
        beneficiario: '',
        formaRepasse: '',
        tipo: '',
        numero: '',
        autor: '',
        valorPrevisto: '',
        valorRepassado: '',
        funcaoGoverno: '',
        objeto: '',
        dataPublicacao: '',
        arquivo: null
    })

    const resetForm = () => {
        setFormData({
            origem: '',
            anoReferencia: '',
            beneficiario: '',
            formaRepasse: '',
            tipo: '',
            numero: '',
            autor: '',
            valorPrevisto: '',
            valorRepassado: '',
            funcaoGoverno: '',
            objeto: '',
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

    const handleMoneyInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: formatarMoedaInput(value)
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (!editando) {
                // Criar nova emenda parlamentar
                await criarEmendaParlamentar({
                    origem: formData.origem,
                    ano_referencia: formData.anoReferencia,
                    beneficiario: formData.beneficiario,
                    forma_repasse: formData.formaRepasse,
                    tipo: formData.tipo,
                    numero: formData.numero,
                    autor: formData.autor,
                    valor_previsto: desformatarMoeda(formData.valorPrevisto),
                    valor_repassado: desformatarMoeda(formData.valorRepassado),
                    funcao_governo: formData.funcaoGoverno,
                    objeto: formData.objeto,
                    data_publicacao: formData.dataPublicacao,
                    file: formData.arquivo
                })
                toast.success('Emenda parlamentar cadastrada com sucesso!')
            } else {
                // Editar emenda parlamentar existente
                await editarEmendaParlamentar(registroSelecionado.id, {
                    origem: formData.origem,
                    ano_referencia: formData.anoReferencia,
                    beneficiario: formData.beneficiario,
                    forma_repasse: formData.formaRepasse,
                    tipo: formData.tipo,
                    numero: formData.numero,
                    autor: formData.autor,
                    valor_previsto: desformatarMoeda(formData.valorPrevisto),
                    valor_repassado: desformatarMoeda(formData.valorRepassado),
                    funcao_governo: formData.funcaoGoverno,
                    objeto: formData.objeto,
                    data_publicacao: formData.dataPublicacao,
                    file: formData.arquivo
                })
                toast.success('Emenda parlamentar atualizada com sucesso!')
            }

            // Recarregar a lista de registros com os filtros atuais
            await recarregarRegistros(filtros, paginacao.paginaAtual)
            resetForm()
            setMostrarFormulario(false)
            setModalEdicao(false)
            setEditando(false)
            setRegistroSelecionado(null)
        } catch (error) {
            toast.error('Erro ao salvar emenda parlamentar: ' + error.message)
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleEditar = (registro) => {
        setRegistroSelecionado(registro)
        setFormData({
            origem: registro.origem || '',
            anoReferencia: registro.ano_referencia || '',
            beneficiario: registro.beneficiario || '',
            formaRepasse: registro.forma_repasse || '',
            tipo: registro.tipo || '',
            numero: registro.numero || '',
            autor: registro.autor || '',
            valorPrevisto: numeroParaInput(registro.valor_previsto),
            valorRepassado: numeroParaInput(registro.valor_repassado),
            funcaoGoverno: registro.funcao_governo || '',
            objeto: registro.objeto || '',
            dataPublicacao: registro.data_publicacao || '',
            arquivo: null
        })
        setEditando(true)
        setModalEdicao(true)
    }

    const handleVisualizar = (registro) => {
        setRegistroSelecionado(registro)
        setModalVisualizacao(true)
    }

    const handleDownload = async (registro) => {
        try {
            setLoading(true)
            
            // Obter o blob do arquivo
            const blob = await obterArquivoEmendaParlamentar(registro.id)
            
            if (blob && blob.size > 0) {
                // Criar URL temporária para o blob
                const url = URL.createObjectURL(blob)
                
                // Criar elemento de download
                const link = document.createElement('a')
                link.href = url
                link.download = `${registro.origem || 'emenda'}`
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
        if (window.confirm('Tem certeza que deseja deletar esta emenda parlamentar?')) {
            try {
                setLoading(true)
                await deletarEmendaParlamentar(registro.id)
                await recarregarRegistros(filtros, paginacao.paginaAtual)
                toast.success('Emenda parlamentar deletada com sucesso!')
            } catch (error) {
                toast.error('Erro ao deletar emenda parlamentar: ' + error.message)
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
        setPaginacao(prev => ({ ...prev, paginaAtual: 1 }))
        await recarregarRegistros(filtros, 1)
    }

    // Função para limpar filtros
    const handleLimparFiltros = async () => {
        const filtrosLimpos = {
            origem: '',
            anoReferencia: '',
            beneficiario: '',
            formaRepasse: '',
            tipo: '',
            numero: '',
            autor: '',
            objeto: '',
            dataInicial: '',
            dataFinal: ''
        }
        setFiltros(filtrosLimpos)
        setPaginacao(prev => ({ ...prev, paginaAtual: 1 }))
        await recarregarRegistros(filtrosLimpos, 1)
    }

    // Função para mudança de página
    const handlePaginaChange = async (novaPagina) => {
        await recarregarRegistros(filtros, novaPagina)
    }

    // Os registros vêm já filtrados da API
    const registrosPaginados = registros

    const acoes = [
        {
            nome: <FaEye size={28} className="text-blue-600 hover:text-blue-800 transition-colors" />,
            handler: handleVisualizar
        },
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
                            Cadastro de Emendas Parlamentares
                        </h1>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">
                                        Origem *
                                    </label>
                                    <input
                                        type="text"
                                        name="origem"
                                        value={formData.origem}
                                        onChange={handleInputChange}

                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Forma de Repasse *
                                    </label>
                                    <input
                                        type="text"
                                        name="formaRepasse"
                                        value={formData.formaRepasse}
                                        onChange={handleInputChange}

                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Tipo *
                                    </label>
                                    <input
                                        type="text"
                                        name="tipo"
                                        value={formData.tipo}
                                        onChange={handleInputChange}

                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Nº *
                                    </label>
                                    <input
                                        type="text"
                                        name="numero"
                                        value={formData.numero}
                                        onChange={handleInputChange}

                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Autor *
                                    </label>
                                    <input
                                        type="text"
                                        name="autor"
                                        value={formData.autor}
                                        onChange={handleInputChange}

                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Ano de Referência *
                                    </label>
                                    <input
                                        type="number"
                                        name="anoReferencia"
                                        value={formData.anoReferencia}
                                        onChange={handleInputChange}

                                        min="2000"
                                        max="2030"
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
                                        Valor Previsto *
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">R$</span>
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            name="valorPrevisto"
                                            value={formData.valorPrevisto}
                                            onChange={handleMoneyInputChange}
                                            placeholder="0,00"
                                            className="w-full p-2 pl-10 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Valor Repassado *
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">R$</span>
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            name="valorRepassado"
                                            value={formData.valorRepassado}
                                            onChange={handleMoneyInputChange}
                                            placeholder="0,00"
                                            className="w-full p-2 pl-10 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">
                                        Beneficiário *
                                    </label>
                                    <input
                                        type="text"
                                        name="beneficiario"
                                        value={formData.beneficiario}
                                        onChange={handleInputChange}

                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>

                            

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">
                                        Função de Governo *
                                    </label>
                                    <input
                                        type="text"
                                        name="funcaoGoverno"
                                        value={formData.funcaoGoverno}
                                        onChange={handleInputChange}

                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">
                                        Objeto *
                                    </label>
                                    <textarea
                                        name="objeto"
                                        value={formData.objeto}
                                        onChange={handleInputChange}

                                        rows="3"
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                        placeholder="Descreva o objeto da emenda parlamentar..."
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
                        <h1 className="text-lg font-bold mb-4">Lista de Emendas Parlamentares</h1>

                        {/* Filtros */}
                        <div className="bg-gray-50 rounded p-4 mb-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Origem</label>
                                    <input
                                        type="text"
                                        value={filtros.origem}
                                        onChange={(e) => handleFiltroChange('origem', e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                        placeholder="Filtrar por origem..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Forma de Repasse</label>
                                    <input
                                        type="text"
                                        value={filtros.formaRepasse}
                                        onChange={(e) => handleFiltroChange('formaRepasse', e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                        placeholder="Filtrar por forma de repasse..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Tipo</label>
                                    <input
                                        type="text"
                                        value={filtros.tipo}
                                        onChange={(e) => handleFiltroChange('tipo', e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                        placeholder="Filtrar por tipo..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Nº</label>
                                    <input
                                        type="text"
                                        value={filtros.numero}
                                        onChange={(e) => handleFiltroChange('numero', e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                        placeholder="Filtrar por número..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Autor</label>
                                    <input
                                        type="text"
                                        value={filtros.autor}
                                        onChange={(e) => handleFiltroChange('autor', e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                        placeholder="Filtrar por autor..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Objeto</label>
                                    <input
                                        type="text"
                                        value={filtros.objeto}
                                        onChange={(e) => handleFiltroChange('objeto', e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                        placeholder="Filtrar por objeto..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Ano de Referência</label>
                                    <input
                                        type="text"
                                        value={filtros.anoReferencia}
                                        onChange={(e) => handleFiltroChange('anoReferencia', e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                        placeholder="Filtrar por ano..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Beneficiário</label>
                                    <input
                                        type="text"
                                        value={filtros.beneficiario}
                                        onChange={(e) => handleFiltroChange('beneficiario', e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                        placeholder="Filtrar por beneficiário..."
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
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white mt-4 shadow-md rounded-lg">
                                <thead>
                                    <tr className="bg-azul_escuro bg-opacity-90 text-branco_cinza uppercase text-sm leading-normal">
                                        <th className="py-3 px-6 text-left">
                                            Origem
                                        </th>
                                        <th className="py-3 px-6 text-left">
                                            Nº
                                        </th>
                                        <th className="py-3 px-6 text-left">
                                            Data de Publicação
                                        </th>
                                        <th className="py-3 px-6 text-left">
                                            Tipo
                                        </th>
                                        <th className="py-3 px-6 text-left">
                                            Beneficiário
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
                                                {registros.length === 0 
                                                    ? 'Nenhuma emenda parlamentar cadastrada ainda.' 
                                                    : 'Nenhuma emenda encontrada com os filtros aplicados.'}
                                            </td>
                                        </tr>
                                    </tfoot>
                                ) : (
                                    <tbody className="text-gray-800 text-sm font-light">
                                        {registrosPaginados.map((registro, index) => (
                                            <tr key={registro.id || index} className="border-b border-gray-200 hover:bg-gray-100">
                                                <td className="py-3 px-6 text-left">
                                                    <DescricaoTruncada texto={registro.origem || 'N/A'} limite={40} />
                                                </td>
                                                <td className="py-3 px-6 text-left">
                                                    {registro.numero || 'N/A'}
                                                </td>
                                                <td className="py-3 px-6 text-left">
                                                    {registro.data_publicacao ? registro.data_publicacao.split('-').reverse().join('/') : '-'}
                                                </td>
                                                <td className="py-3 px-6 text-left">
                                                    {registro.tipo || 'N/A'}
                                                </td>
                                                <td className="py-3 px-6 text-left">
                                                    <DescricaoTruncada texto={registro.beneficiario || 'N/A'} limite={40} />
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
                                    setPaginacao(prev => ({
                                        ...prev,
                                        itensPorPagina: novoLimite,
                                        paginaAtual: 1
                                    }))
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
                    title={`Editar Emenda - ${registroSelecionado.origem || registroSelecionado.titulo}`}
                >
                    <div className="p-6 overflow-y-auto">
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">
                                        Origem *
                                    </label>
                                    <input
                                        type="text"
                                        name="origem"
                                        value={formData.origem}
                                        onChange={handleInputChange}

                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Forma de Repasse *
                                    </label>
                                    <input
                                        type="text"
                                        name="formaRepasse"
                                        value={formData.formaRepasse}
                                        onChange={handleInputChange}

                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Tipo *
                                    </label>
                                    <input
                                        type="text"
                                        name="tipo"
                                        value={formData.tipo}
                                        onChange={handleInputChange}

                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Nº *
                                    </label>
                                    <input
                                        type="text"
                                        name="numero"
                                        value={formData.numero}
                                        onChange={handleInputChange}

                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Autor *
                                    </label>
                                    <input
                                        type="text"
                                        name="autor"
                                        value={formData.autor}
                                        onChange={handleInputChange}

                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Ano de Referência *
                                    </label>
                                    <input
                                        type="number"
                                        name="anoReferencia"
                                        value={formData.anoReferencia}
                                        onChange={handleInputChange}

                                        min="2000"
                                        max="2030"
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
                                        Valor Previsto *
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">R$</span>
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            name="valorPrevisto"
                                            value={formData.valorPrevisto}
                                            onChange={handleMoneyInputChange}
                                            placeholder="0,00"
                                            className="w-full p-2 pl-10 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Valor Repassado *
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">R$</span>
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            name="valorRepassado"
                                            value={formData.valorRepassado}
                                            onChange={handleMoneyInputChange}
                                            placeholder="0,00"
                                            className="w-full p-2 pl-10 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">
                                        Beneficiário *
                                    </label>
                                    <input
                                        type="text"
                                        name="beneficiario"
                                        value={formData.beneficiario}
                                        onChange={handleInputChange}

                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    />
                                </div>


                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">
                                        Função de Governo *
                                    </label>
                                    <input
                                        type="text"
                                        name="funcaoGoverno"
                                        value={formData.funcaoGoverno}
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
                                            Novo arquivo selecionado: {formData.arquivo.name}
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
                                    {loading ? 'Salvando...' : 'Atualizar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </Modal>
            )}
            
            {/* Modal de Visualização */}
            {modalVisualizacao && registroSelecionado && (
                <Modal
                    isOpen={modalVisualizacao}
                    onClose={() => {
                        setModalVisualizacao(false)
                        setRegistroSelecionado(null)
                    }}
                    title="Detalhes da Emenda Parlamentar"
                >
                    <div className="p-6 overflow-y-auto">
                        <div className="flex flex-wrap gap-4 bg-white p-4 shadow-lg rounded mb-6">

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong className="text-azul_escuro">Origem:</strong>
                                <span className="break-words text-gray-700">{registroSelecionado.origem || 'Não informado'}</span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong className="text-azul_escuro">Número:</strong>
                                <span className="break-words text-gray-700">{registroSelecionado.numero || 'Não informado'}</span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong className="text-azul_escuro">Tipo:</strong>
                                <span className="break-words text-gray-700">{registroSelecionado.tipo || 'Não informado'}</span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong className="text-azul_escuro">Autor:</strong>
                                <span className="break-words text-gray-700">{registroSelecionado.autor || 'Não informado'}</span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong className="text-azul_escuro">Data de Publicação:</strong>
                                <span className="break-words text-gray-700">
                                    {registroSelecionado.data_publicacao ? registroSelecionado.data_publicacao.split('-').reverse().join('/') : 'Não informado'}
                                </span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong className="text-azul_escuro">Ano de Referência:</strong>
                                <span className="break-words text-gray-700">{registroSelecionado.ano_referencia || 'Não informado'}</span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong className="text-azul_escuro">Forma de Repasse:</strong>
                                <span className="break-words text-gray-700">{registroSelecionado.forma_repasse || 'Não informado'}</span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong className="text-azul_escuro">Função de Governo:</strong>
                                <span className="break-words text-gray-700">{registroSelecionado.funcao_governo || 'Não informado'}</span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong className="text-azul_escuro">Valor Previsto:</strong>
                                <span className="break-words text-gray-700 font-semibold">{formatarMoeda(registroSelecionado.valor_previsto)}</span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong className="text-azul_escuro">Valor Repassado:</strong>
                                <span className="break-words text-gray-700 font-semibold">{formatarMoeda(registroSelecionado.valor_repassado)}</span>
                            </div>

                            <div className="flex flex-col w-full">
                                <strong className="text-azul_escuro">Beneficiário:</strong>
                                <span className="break-words text-gray-700">{registroSelecionado.beneficiario || 'Não informado'}</span>
                            </div>

                            <div className="flex flex-col w-full">
                                <strong className="text-azul_escuro mb-2">Objeto:</strong>
                                <div className="bg-gray-50 p-4 rounded-lg border">
                                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{registroSelecionado.objeto || 'Não informado'}</p>
                                </div>
                            </div>

                        </div>
                    </div>
                </Modal>
            )}
        </section>
    )
}

