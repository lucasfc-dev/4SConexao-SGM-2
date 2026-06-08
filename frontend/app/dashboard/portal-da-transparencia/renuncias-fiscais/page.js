'use client'
import { useState, useEffect } from 'react'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { FaEdit, FaEye, FaPlus, FaSearch, FaDownload } from 'react-icons/fa'
import { MdDelete } from 'react-icons/md'
import { FiLoader } from 'react-icons/fi'
import Modal from '@/app/components/modal'
import PaginacaoAvancada from '@/app/components/PaginacaoAvancada'
import { listarRenunciasFiscais, criarRenunciaFiscal, atualizarRenunciaFiscal, deletarRenunciaFiscal, getArquivoRenunciaFiscal } from '../api/renuncias_fiscais/renuncias_fiscais'
import { useAuth } from '@/app/context/AuthContext'

export default function RenunciasFiscais() {
    const [registros, setRegistros] = useState([])
    const [loading, setLoading] = useState(false)
    const [mostrarFormulario, setMostrarFormulario] = useState(false)
    const { user } = useAuth()
    const [editando, setEditando] = useState(false)
    const [modalEdicao, setModalEdicao] = useState(false)
    const [registroSelecionado, setRegistroSelecionado] = useState(null)
    const [filtros, setFiltros] = useState({
        tipoReceita: '',
        tipoRenuncia: '',
        dataInicial: '',
        dataFinal: ''
    })
    const [paginaAtual, setPaginaAtual] = useState(1)
    const [itensPorPagina, setItensPorPagina] = useState(10)
    const [totalItens, setTotalItens] = useState(0)


    // Função para recarregar os dados
    const recarregarRegistros = async (filtrosParaPesquisa = {}, pagina = 1) => {
        if (user && user.estabelecimento) {
            try {
                setLoading(true)
                
                // Preparar filtros para a API
                const filtrosAPI = {}
                if (filtrosParaPesquisa.tipoReceita) filtrosAPI.tipo_receita = filtrosParaPesquisa.tipoReceita
                if (filtrosParaPesquisa.tipoRenuncia) filtrosAPI.tipo_renuncia = filtrosParaPesquisa.tipoRenuncia
                if (filtrosParaPesquisa.dataInicial) filtrosAPI.data_publicacao__gte = filtrosParaPesquisa.dataInicial
                if (filtrosParaPesquisa.dataFinal) filtrosAPI.data_publicacao__lte = filtrosParaPesquisa.dataFinal
                
                const response = await listarRenunciasFiscais(
                    user.estabelecimento.id, 
                    pagina, 
                    itensPorPagina, 
                    filtrosAPI
                )
                setRegistros(response.data)
                setTotalItens(response.meta?.total || response.total || 0)
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
        dataPublicacao: '',
        tipoReceita: '',
        tipoRenuncia: '',
        file: null
    })

    const resetForm = () => {
        setFormData({
            dataPublicacao: '',
            tipoReceita: '',
            tipoRenuncia: '',
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
                await criarRenunciaFiscal(formData)
                toast.success('Renúncia fiscal cadastrada com sucesso!')
            } else {
                // Editar registro existente
                await atualizarRenunciaFiscal(registroSelecionado.id, formData)
                toast.success('Renúncia fiscal atualizada com sucesso!')
            }

            // Recarregar a lista de registros
            await recarregarRegistros()
            resetForm()
            setMostrarFormulario(false)
            setModalEdicao(false)
            setEditando(false)
            setRegistroSelecionado(null)
        } catch (error) {
            toast.error('Erro ao salvar renúncia fiscal: ' + error.message)
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleEditar = (registro) => {
        setRegistroSelecionado(registro)
        setFormData({
            dataPublicacao: registro.data_publicacao || '',
            tipoReceita: registro.tipo_receita || '',
            tipoRenuncia: registro.tipo_renuncia || '',
            file: null
        })
        setEditando(true)
        setModalEdicao(true)
    }

    const handleDownload = async (registro) => {
        try {
            setLoading(true)
            
            // Obter o blob do arquivo via API streaming
            const blob = await getArquivoRenunciaFiscal(registro.id)
            
            if (blob && blob.size > 0) {
                // Criar URL temporária para o blob
                const url = URL.createObjectURL(blob)
                
                // Criar elemento de download
                const link = document.createElement('a')
                link.href = url
                link.download = `${registro.tipo_receita}_${registro.ano}`
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
        if (window.confirm('Tem certeza que deseja deletar esta renúncia fiscal?')) {
            try {
                setLoading(true)
                await deletarRenunciaFiscal(registro.id)
                await recarregarRegistros(filtros, paginaAtual)
                toast.success('Renúncia fiscal deletada com sucesso!')
            } catch (error) {
                toast.error('Erro ao deletar renúncia fiscal: ' + error.message)
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
            tipoReceita: '',
            tipoRenuncia: '',
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

    const handleMudarItensPorPagina = (novosItens) => {
        setItensPorPagina(novosItens)
        recarregarRegistros(filtros, 1)
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
                            Cadastro de Renúncias Fiscais
                        </h1>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                        Tipo de Receita *
                                    </label>
                                    <input
                                        name="tipoReceita"
                                        value={formData.tipoReceita}
                                        onChange={handleInputChange}

                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    >
                                    </input>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Tipo de Renúncia *
                                    </label>
                                    <input
                                        name="tipoRenuncia"
                                        value={formData.tipoRenuncia}
                                        onChange={handleInputChange}

                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    >

                                    </input>
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
                                    {formData.file && (
                                        <p className="text-sm text-gray-600 mt-1">
                                            Arquivo selecionado: {formData.file.name}
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
                        <h1 className="text-lg font-bold mb-4">Renúncias Fiscais</h1>
                        
                        {/* Filtros */}
                        <div className="bg-gray-50 rounded p-4 mb-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Tipo de Receita</label>
                                    <input
                                        type="text"
                                        value={filtros.tipoReceita}
                                        onChange={(e) => handleFiltroChange('tipoReceita', e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                        placeholder="Filtrar por tipo de receita..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Tipo de Renúncia</label>
                                    <input
                                        type="text"
                                        value={filtros.tipoRenuncia}
                                        onChange={(e) => handleFiltroChange('tipoRenuncia', e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                        placeholder="Filtrar por tipo de renúncia..."
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
                                            Tipo de Receita
                                        </th>
                                        <th className="py-3 px-6 text-left">
                                            Tipo de Renúncia
                                        </th>
                                        <th className="py-3 px-6 text-left">
                                            Data Publicação
                                        </th>
                                        <th className="py-3 px-6 text-left">
                                            Ano
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
                                                    {registro.tipo_receita}
                                                </td>
                                                <td className="py-3 px-6 text-left">
                                                    {registro.tipo_renuncia}
                                                </td>
                                                <td className="py-3 px-6 text-left">
                                                    {registro.data_publicacao ? registro.data_publicacao.split('-').reverse().join('/') : '-'}
                                                </td>
                                                <td className="py-3 px-6 text-left">
                                                    {registro.ano}
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
                        {totalItens > 0 && (
                            <PaginacaoAvancada
                                paginaAtual={paginaAtual}
                                totalItens={totalItens}
                                itensPorPagina={itensPorPagina}
                                onMudarPagina={handleMudancaPagina}
                                onMudarItensPorPagina={handleMudarItensPorPagina}
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
                    title={`Editar Renúncia Fiscal - ${registroSelecionado.tipo_receita}`}
                >
                    <div className="p-6 overflow-auto">
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                        Tipo de Receita *
                                    </label>
                                    <select
                                        name="tipoReceita"
                                        value={formData.tipoReceita}
                                        onChange={handleInputChange}

                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    >
                                        <option value="">Selecione o tipo de receita</option>
                                        <option value="IPTU">IPTU</option>
                                        <option value="ISS">ISS</option>
                                        <option value="ITBI">ITBI</option>
                                        <option value="Taxas">Taxas</option>
                                        <option value="Contribuições">Contribuições</option>
                                        <option value="Multas">Multas</option>
                                        <option value="Outros">Outros</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Tipo de Renúncia *
                                    </label>
                                    <select
                                        name="tipoRenuncia" 
                                        value={formData.tipoRenuncia}
                                        onChange={handleInputChange}

                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    >
                                        <option value="">Selecione o tipo de renúncia</option>
                                        <option value="Isenção">Isenção</option>
                                        <option value="Anistia">Anistia</option>
                                        <option value="Remissão">Remissão</option>
                                        <option value="Subsídio">Subsídio</option>
                                        <option value="Crédito Presumido">Crédito Presumido</option>
                                        <option value="Redução de Base de Cálculo">Redução de Base de Cálculo</option>
                                        <option value="Redução de Alíquota">Redução de Alíquota</option>
                                        <option value="Outros">Outros</option>
                                    </select>
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

        </section>
    )
}