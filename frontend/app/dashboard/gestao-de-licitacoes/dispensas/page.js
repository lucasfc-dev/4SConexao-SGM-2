'use client'
import { toast, ToastContainer } from "react-toastify"
import 'react-toastify/dist/ReactToastify.css'
import { useCallback, useEffect, useState } from "react"
import { useAuth } from "@/app/context/AuthContext"
import Cookies from "js-cookie"
import { useSecao } from "../context/SecaoContext"
import { MdDelete } from "react-icons/md"
import { FaDownload, FaEye, FaTrash, FaEdit, FaFilter, FaChevronDown, FaChevronUp, FaFileAlt, FaUndo, FaSearch } from "react-icons/fa"
import { CgClose } from "react-icons/cg"
import { useDispensas } from "../context/DispensasContext"
import { FiLoader } from "react-icons/fi"
import PaginacaoAvancada from "@/app/components/PaginacaoAvancada"


export default function Dispensas() {
    const acUrl = process.env.NEXT_PUBLIC_AC_ENDPOINT_URL
    const { listaDispensas, totalDispensas, loadingDispensas, fetchDispensas } = useDispensas()
    const { user } = useAuth()
    const token = Cookies.get('auth-token')
    const [documentosDispensa, setDocumentosDispensa] = useState([])
    const { listaSecoes } = useSecao()  
    const [dispensaSelecionada, setDispensaSelecionada] = useState(null)
    const [mostrarFormulario, setMostrarFormulario] = useState(true)
    const [editando, setEditando] = useState(false)
    const [visualizando, setVisualizando] = useState(false)
    const [filtros, setFiltros] = useState({
        objeto: '',
        dataInicial: '',
        tipo: '',
        dataFinal: '',
        orgao: '',
        numero: ''
    })
    const [paginaAtual, setPaginaAtual] = useState(1)
    const [itensPorPagina, setItensPorPagina] = useState(10)
    const [valorEstimado, setValorEstimado] = useState('0,00')
    const [valorVencedor, setValorVencedor] = useState('0,00')
    const [valorEstimadoEdit, setValorEstimadoEdit] = useState('0,00')
    const [valorVencedorEdit, setValorVencedorEdit] = useState('0,00')
    const [isDesktop, setIsDesktop] = useState(false)
    const [isFiltersExpanded, setIsFiltersExpanded] = useState(false)

    function formatarData(dataString){
        if (!dataString) return ''
        return dataString.split('-').reverse().join('/')
    }
    // Função para formatar valor monetário com dígitos empurrados da direita para esquerda
    const formatarValorMonetario = (valor) => {
        // Remove tudo que não é dígito
        const digits = valor.replace(/\D/g, '')
        
        if (digits.length === 0) return '0,00'
        
        // Converte para número e formata com 2 casas decimais
        const number = parseInt(digits) / 100
        return number.toFixed(2).replace('.', ',')
    }

    // Função para converter valor formatado para número
    const valorParaNumero = (valorFormatado) => {
        return parseFloat(valorFormatado.replace(',', '.'))
    }

    // Handler para campos de valor monetário
    const handleValorChange = (event, setter) => {
        const inputValue = event.target.value
        const valorFormatado = formatarValorMonetario(inputValue)
        setter(valorFormatado)
        event.target.value = valorFormatado
    }

    // Função para inicializar valores de edição
    const inicializarValoresEdicao = (dispensa) => {
        if (dispensa?.valor_estimado) {
            const valorEstimadoFormatado = parseFloat(dispensa.valor_estimado).toFixed(2).replace('.', ',')
            setValorEstimadoEdit(valorEstimadoFormatado)
        } else {
            setValorEstimadoEdit('0,00')
        }
        
        if (dispensa?.valor_vencedor) {
            const valorVencedorFormatado = parseFloat(dispensa.valor_vencedor).toFixed(2).replace('.', ',')
            setValorVencedorEdit(valorVencedorFormatado)
        } else {
            setValorVencedorEdit('0,00')
        }
    }

    const listaColunasDispensa = [
        { nomeColuna: 'Número do processo' },
        { nomeColuna: 'Órgão' },
        { nomeColuna: 'Tipo' },
        { nomeColuna: 'Situação' },
        { nomeColuna: 'Data de publicação' },
        { nomeColuna: 'Objeto' }
    ]


    const getDocumentosDispensa = async (dispensa) => {
        try {
            const response = await fetch(`${acUrl}/dispensa/${dispensa.id}/docs/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })
            if (response.ok) {
                const documentos = await response.json()
                setDocumentosDispensa(documentos)
            }
        }
        catch (error) {
            console.error('Erro ao obter documentos da dispensa:', error)
        }
    }


    useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 1475)
        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const hasActiveFilters = filtros.numero || filtros.tipo || filtros.objeto ||
        filtros.dataInicial || filtros.dataFinal || filtros.orgao

    const toggleFiltersExpanded = () => setIsFiltersExpanded(prev => !prev)

    const handleFiltroChange = (campo, valor) => {
        setFiltros(prev => ({
            ...prev,
            [campo]: valor
        }))
    }

    const handleVisualizar = async (dispensa) => {
        setDispensaSelecionada(dispensa)
        setVisualizando(true)
        try {
            await getDocumentosDispensa(dispensa)
        } catch (error) {
            console.error(error)
        }
    }

    const handleDeletar = async (dispensa) => {
        try {
            const response = await fetch(`${acUrl}/dispensa/${dispensa.id}/`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            })
            if (response.ok) {
                await response.json()
                toast.success('Dispensa deletada com sucesso!')
                await refreshDispensas()
            }
            else{
                const jsonError = await response.json()
                toast.error(jsonError.error || jsonError.detail || 'Erro ao deletar dispensa')
                throw new Error('Erro ao deletar dispensa')
            }
        }
        catch (error) {
            console.error('Erro ao deletar dispensa:', error)
        }
    }

    const handleCadastro = async (event) => {
        event.preventDefault()
        const formData = new FormData(event.target)
        const files = event.target.files.files
        formData.delete('files')
        const formJson = Object.fromEntries(formData.entries())
        
        // Função para remover campos vazios
        const removerCamposVazios = (dados) => {
            const dadosFiltrados = {}
            for (const [key, value] of Object.entries(dados)) {
                if (value !== "" && value !== null && value !== undefined) {
                    dadosFiltrados[key] = value
                }
            }
            return dadosFiltrados
        }
        
        const formJsonSemVazios = removerCamposVazios(formJson)
        
        // Converte valores formatados de volta para número
        if (formJsonSemVazios.valor_estimado) {
            formJsonSemVazios.valor_estimado = valorParaNumero(formJsonSemVazios.valor_estimado)
        }
        if (formJsonSemVazios.valor_vencedor) {
            formJsonSemVazios.valor_vencedor = valorParaNumero(formJsonSemVazios.valor_vencedor)
        }
        
        try {
            const response = await fetch(`${acUrl}/dispensa/`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formJsonSemVazios),
            })
            if (response.ok) {
                const novaDispensa = await response.json()
                try {
                    const responseDocs = await handleCadastrarDocs(novaDispensa, files)
                    if (responseDocs.ok) {
                        await refreshDispensas()
                        toast.success('Dispensa cadastrada com sucesso!')
                        event.target.reset()
                        setValorEstimado('0,00')
                        setValorVencedor('0,00')
                        setMostrarFormulario(false)
                    }
                    else{
                        const jsonError = await responseDocs.json()
                        toast.error(jsonError.error || jsonError.detail || 'Erro ao cadastrar documentos da dispensa.')
                        throw new Error('Erro ao cadastrar documentos da dispensa.')
                    }
                }
                catch (error) {
                    throw new Error('Erro ao enviar arquivos da dispensa: ' + error.message)
                }
            }
        }
        catch (error) {
            console.error(error)
        }
    }

    const handleCadastrarDocs = async (dispensa, files) => {
        const fileData = new FormData()
        fileData.append('target_id', dispensa.id)
        fileData.append('target_type', 'dispensa')
        for (const file of files) {
            fileData.append('files', file)
        }
        const responseDocs = await fetch(`${acUrl}/docs/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: fileData,
        })
        if (responseDocs.ok) {
            const novoDocumento = await responseDocs.json()
            toast.success('Documento cadastrado com sucesso!')
            setDocumentosDispensa(prev => [...prev, novoDocumento[0]])
        }
        else{
            const jsonError = await responseDocs.json()
            toast.error(jsonError.error || jsonError.detail || 'Erro ao cadastrar documentos da dispensa.')
            throw new Error('Erro ao cadastrar documentos da dispensa.')
        }
        return responseDocs
    }

    const handleDownloadDoc = async (doc) => {
        try {
            const response = await fetch(`${acUrl}/docs/${doc.id}/content/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            })
            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = doc.titulo
                a.click()
                window.URL.revokeObjectURL(url)
            }
        }
        catch (error) {
            console.error('Erro ao baixar documento:', error)
        }
    }

    const handleExcluirDoc = async (doc) => {
        try {
            const response = await fetch(`${acUrl}/docs/${doc.id}/`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            })
            if (response.ok) {
                setDocumentosDispensa(prev => prev.filter(d => d.id !== doc.id))
                toast.success('Documento excluído com sucesso!')
            } else {
                const jsonError = await response.json()
                toast.error(jsonError.error || jsonError.detail || 'Erro ao excluir documento')
                throw new Error('Erro ao excluir documento')
            }
        }
        catch (error) {
            console.error('Erro ao excluir documento:', error)
            toast.error('Erro ao excluir documento')
        }
    }

    const handleDownloadAllDocs = async () => {
        for (const doc of documentosDispensa) {
            await handleDownloadDoc(doc)
        }
    }

    const handleGerarCertificado = async (dispensa) => {
        try {
            const response = await fetch(`${acUrl}/dispensa/${dispensa.id}/certificado/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })
            if (response.ok) {
                toast.success('Certificado gerado com sucesso!')
                await refreshDispensas()
                return
            }
            const errorData = await response.json().catch(() => null)
            toast.error(errorData?.detail || 'Erro ao gerar certificado')
        } catch (error) {
            console.error('Erro ao gerar certificado:', error)
            toast.error('Erro ao gerar certificado')
        }
    }

    const handleDownloadCertificado = async (dispensaId) => {
        try {
            const response = await fetch(`${acUrl}/dispensa/${dispensaId}/certificado/content/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            })
            if (response.ok) {
                const disposition = response.headers.get('content-disposition') || ''
                const match = disposition.match(/filename="([^"]+)"/)
                const filename = match ? match[1] : `Certificado de Publicação de Dispensa ${dispensaId}.pdf`
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = filename
                a.click()
                window.URL.revokeObjectURL(url)
            }
        } catch (error) {
            console.error('Erro ao baixar certificado:', error)
            toast.error('Erro ao baixar certificado de publicação')
        }
    }

    const handleExcluirCertificado = async (dispensaId) => {
        try {
            const response = await fetch(`${acUrl}/dispensa/${dispensaId}/certificado/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })
            if (response.ok) {
                toast.success('Certificado excluído com sucesso!')
                await refreshDispensas()
                return
            }
            const errorData = await response.json().catch(() => null)
            toast.error(errorData?.detail || 'Erro ao excluir certificado')
        } catch (error) {
            console.error('Erro ao excluir certificado:', error)
            toast.error('Erro ao excluir certificado')
        }
    }

    const handleFecharVisualizacao = () => {
        setDispensaSelecionada(null)
        setDocumentosDispensa([])
        setVisualizando(false)
        setEditando(false)
        setValorEstimadoEdit('0,00')
        setValorVencedorEdit('0,00')
    }

    const handleEditar = async (dispensa) => {
        setDispensaSelecionada(dispensa)
        inicializarValoresEdicao(dispensa)
        setEditando(true)
    }

    const editarDispensa = async (e) => {
        e.preventDefault()
        const formDataDispensa = new FormData(e.target)
        const dispensa = Object.fromEntries(formDataDispensa.entries())
        
        // Função para remover campos vazios
        const removerCamposVazios = (dados) => {
            const dadosFiltrados = {}
            for (const [key, value] of Object.entries(dados)) {
                if (value !== "" && value !== null && value !== undefined) {
                    dadosFiltrados[key] = value
                }
            }
            return dadosFiltrados
        }
        
        const dispensaSemVazios = removerCamposVazios(dispensa)
        
        // Converte valores formatados de volta para número
        if (dispensaSemVazios.valor_estimado) {
            dispensaSemVazios.valor_estimado = valorParaNumero(dispensaSemVazios.valor_estimado)
        }
        if (dispensaSemVazios.valor_vencedor) {
            dispensaSemVazios.valor_vencedor = valorParaNumero(dispensaSemVazios.valor_vencedor)
        }
        
        try {
            const response = await fetch(`${acUrl}/dispensa/${dispensaSelecionada.id}/`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dispensaSemVazios),
            })
            if (response.ok) {
                await response.json()
                toast.success('Dispensa editada com sucesso!')
                await refreshDispensas()
                setEditando(false)
                setDispensaSelecionada(null)
                setValorEstimadoEdit('0,00')
                setValorVencedorEdit('0,00')
            }
            else{
                const jsonError = await response.json()
                toast.error(jsonError.error || jsonError.detail || 'Erro ao editar dispensa')
                throw new Error('Erro ao editar dispensa')
            }
        }
        catch (error) {
            toast.error('Erro ao editar dispensa: ' + error.message)
        }
    }

    const buildApiFilters = useCallback(() => {
        const f = {}
        if (filtros.objeto) f['objeto__icontains'] = filtros.objeto
        if (filtros.numero) f['num_processo__icontains'] = filtros.numero
        if (filtros.tipo) f['tipo_dispensa'] = filtros.tipo
        if (filtros.orgao) f['orgao'] = filtros.orgao
        if (filtros.dataInicial) f['pub_date__gte'] = filtros.dataInicial
        if (filtros.dataFinal) f['pub_date__lte'] = filtros.dataFinal
        return f
    }, [filtros])

    const refreshDispensas = useCallback(() => {
        const offset = (paginaAtual - 1) * itensPorPagina
        return fetchDispensas({ limit: itensPorPagina, offset, filters: buildApiFilters() })
    }, [paginaAtual, itensPorPagina, fetchDispensas, buildApiFilters])

    useEffect(() => {
        refreshDispensas()
    }, [paginaAtual, itensPorPagina])

    const handleBuscar = useCallback((event) => {
        if (event) event.preventDefault()
        if (paginaAtual === 1) {
            refreshDispensas()
        } else {
            setPaginaAtual(1)
        }
    }, [paginaAtual, refreshDispensas])

    const handleMudarPagina = (novaPagina) => {
        setPaginaAtual(novaPagina)
    }

    const handleMudarItensPorPagina = (novosItens) => {
        setItensPorPagina(novosItens)
        setPaginaAtual(1)
    }

    const acoesDispensa = [
        {
            nome: <FaEdit size={28} className="text-green-800 hover:text-green-900 transition-colors" />,
            handler: handleEditar,
        },
        {
            nome: <FaEye size={28} className="text-azul_escuro transition-colors" />,
            handler: handleVisualizar,
        },

        {
            nome: <MdDelete size={28} className="text-red-600 hover:text-red-800 transition-colors" />,
            handler: handleDeletar,
        },
    ]


    return (
        <section className="flex flex-col flex-grow overflow-auto text-azul_escuro gap-4 bg-gradient-to-br from-gray-200 to-gray-300 p-4">
            <div className="flex gap-4">
                <button
                    onClick={() => {
                        setMostrarFormulario(true)
                        setValorEstimado('0,00')
                        setValorVencedor('0,00')
                    }}
                    className={`px-4 py-2 rounded-md ${mostrarFormulario ? 'bg-laranja_escuro text-white' : 'bg-gray-300 text-black'}`}
                >
                    Cadastro
                </button>
                <button
                    onClick={() => {
                        setMostrarFormulario(false)
                        setValorEstimado('0,00')
                        setValorVencedor('0,00')
                    }}
                    className={`px-4 py-2 rounded-md ${!mostrarFormulario ? 'bg-laranja_escuro text-white' : 'bg-gray-300 text-black'}`}
                >
                    Registros
                </button>
            </div>
            <div className="flex flex-col w-full mx-auto bg-white overflow-auto shadow-lg rounded-lg p-4">
                {mostrarFormulario ? (
                    <>
                        <h1 className="text-lg font-bold mb-2">Cadastro de Dispensas e Inexigibilidades</h1>
                        <form onSubmit={handleCadastro} className="flex flex-col gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2 w-full mx-auto text-azul_escuro">
                                <div>
                                    <label className="block text-sm font-medium ">Órgão</label>
                                    <select
                                        required
                                        name="orgao"
                                        className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all"
                                    >
                                        <option value="">Selecione um órgão</option>
                                        {(user?.orgaos ?? []).map(orgao => (
                                            <option key={orgao.id} value={orgao.id}>{orgao.nome}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium">Número do Processo</label>
                                    <input required name="num_processo" type="text" className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium">Seção</label>
                                    <select name="secao" required className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all">
                                        {listaSecoes.map(secao => {
                                            return (
                                                <option key={secao.id} value={secao.id}>{secao.nome}</option>
                                            )
                                        })}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium">Tipo</label>
                                    <select name="tipo_dispensa" required className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all">
                                        <option value="dispensa">Dispensa</option>
                                        <option value="inexigibilidade">Inexigibilidade</option>
                                        <option value="inexigibilidade_credenciamento_chamada_publica">Inexigibilidade por credenciamento de chamada pública</option>
                                        <option value="dispensa_chamada_publica">Dispensa por chamada pública</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium">Regime de Execução</label>
                                    <select name="regime_execucao" required className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all">
                                        <option value="NA">Não se Aplica</option>
                                        <option value="global">Empreitada por preço global</option>
                                        <option value="unitario">Empreitada por preço unitário</option>
                                        <option value="integral">Empreitada integral</option>
                                        <option value="tarefas">Tarefa</option>
                                        <option value="execucao_direta">Execução direta</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium">Natureza do Objeto</label>
                                    <select name="natureza_objeto" required className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all">
                                        <option value="normal">Normal</option>
                                        <option value="registro_precos">Registro de Preços</option>
                                        <option value="credenciamento_chamamento">Credenciamento/Chamamento</option>
                                        <option value="adesao_registro_precos">Adesão de Registro de Preços</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Situação</label>
                                    <select name="situacao" required className="p-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro focus:border-laranja_escuro transition-all shadow-sm bg-white">
                                        <option value="">Selecione a situação</option>
                                        <option value="em_andamento">Em Andamento</option>
                                        <option value="aberta">Aberta</option>
                                        <option value="julgada">Julgada</option>
                                        <option value="adjudicada">Adjudicada</option>
                                        <option value="homologada">Homologada</option>
                                        <option value="deserta">Deserta</option>
                                        <option value="fracassada">Fracassada</option>
                                        <option value="postergada">Postergada</option>
                                        <option value="revogada">Revogada</option>
                                        <option value="cancelada">Cancelada</option>
                                        <option value="anulada">Anulada</option>
                                        <option value="suspensa">Suspensa</option>
                                        <option value="aguardando_fase_recursal">Aguardando Fase Recursal</option>
                                        <option value="sessao_iniciada">Sessão Iniciada</option>
                                        <option value="sessao_encerrada">Sessão Encerrada</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium">Valor Estimado</label>
                                    <input 
                                        required 
                                        name="valor_estimado" 
                                        type="text" 
                                        value={valorEstimado}
                                        onChange={(e) => handleValorChange(e, setValorEstimado)}
                                        className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all" 
                                        placeholder="0,00"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium">Data de Publicação</label>
                                    <input required name="pub_date" type="date" className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium">Data de Homologação (Opcional)</label>
                                    <input name="homolog_date" type="date" className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium">Data de Julgamento (Opcional)</label>
                                    <input name="julg_date" type="date" className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium">Valor vencedor</label>
                                    <input 
                                        required 
                                        name="valor_vencedor" 
                                        type="text" 
                                        value={valorVencedor}
                                        onChange={(e) => handleValorChange(e, setValorVencedor)}
                                        className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all" 
                                        placeholder="0,00"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium">Objeto</label>
                                    <textarea required name="objeto" rows="3" className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all"></textarea>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium">Fundamento Legal (Opcional)</label>
                                    <textarea name="fundamento_legal" rows="2" className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all"></textarea>
                                </div>

                                <div className="md:col-span-2 gap-2 flex flex-col">
                                    <label className="block text-sm font-medium">Documentos</label>
                                    <div className="relative">
                                        <input
                                            required
                                            name="files"
                                            type="file"
                                            accept=".pdf,.doc,.docx"
                                            multiple
                                            className="p-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro focus:border-laranja_escuro transition-all shadow-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-laranja_escuro file:text-white hover:file:bg-laranja_claro file:cursor-pointer"
                                        />
                                        <small className="text-gray-500 mt-1 block">Formatos aceitos: PDF, DOC, DOCX</small>
                                    </div>
                                </div>

                            </div>
                            <div className="md:col-span-2 flex justify-end">
                                <button type="submit" className="w-full bg-azul_escuro text-white px-4 py-2 rounded-md hover:bg-laranja_escuro transition-colors">
                                    Cadastrar
                                </button>
                            </div>
                        </form>

                    </>) : (
                    <div className="flex flex-col w-full mx-auto rounded-lg">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                            <h2 className="text-azul_escuro text-xl font-bold">Dispensas e Inexigibilidades Cadastradas</h2>
                        </div>

                        {/* Filtros Colapsáveis */}
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-4">
                            <div
                                className="flex items-center justify-between p-4 bg-azul_escuro text-white cursor-pointer transition-all duration-300"
                                onClick={toggleFiltersExpanded}
                            >
                                <div className="flex items-center gap-3">
                                    <FaFilter className="text-lg" />
                                    <h3 className="font-semibold text-lg">Filtros de Busca</h3>
                                    {hasActiveFilters && (
                                        <span className="bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs font-medium">Ativos</span>
                                    )}
                                </div>
                                {isFiltersExpanded ? <FaChevronUp /> : <FaChevronDown />}
                            </div>
                            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isFiltersExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 p-6 bg-gray-50">
                                    <div className="flex flex-col">
                                        <label className="text-sm text-azul_escuro font-semibold mb-1">Número do Processo</label>
                                        <input
                                            type="text"
                                            value={filtros.numero}
                                            onChange={e => handleFiltroChange('numero', e.target.value)}
                                            placeholder="Ex: 12345"
                                            className="bg-white p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-laranja_escuro focus:border-laranja_escuro transition-all hover:bg-gray-50"
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="text-sm text-azul_escuro font-semibold mb-1">Tipo</label>
                                        <select
                                            value={filtros.tipo}
                                            onChange={e => handleFiltroChange('tipo', e.target.value)}
                                            className="bg-white p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-laranja_escuro focus:border-laranja_escuro transition-all hover:bg-gray-50"
                                        >
                                            <option value="">Todos os tipos</option>
                                            <option value="dispensa">Dispensa</option>
                                            <option value="inexigibilidade">Inexigibilidade</option>
                                            <option value="inexigibilidade_credenciamento_chamada_publica">Inexigibilidade por credenciamento</option>
                                            <option value="dispensa_chamada_publica">Dispensa por chamada pública</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="text-sm text-azul_escuro font-semibold mb-1">Órgão</label>
                                        <select
                                            value={filtros.orgao}
                                            onChange={e => handleFiltroChange('orgao', e.target.value)}
                                            className="bg-white p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-laranja_escuro focus:border-laranja_escuro transition-all hover:bg-gray-50"
                                        >
                                            <option value="">Todos os órgãos</option>
                                            {(user?.orgaos ?? []).map(orgao => (
                                                <option key={orgao.id} value={orgao.id}>{orgao.nome}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex flex-col sm:col-span-2 lg:col-span-1">
                                        <label className="text-sm text-azul_escuro font-semibold mb-1">Objeto</label>
                                        <input
                                            type="text"
                                            value={filtros.objeto}
                                            onChange={e => handleFiltroChange('objeto', e.target.value)}
                                            placeholder="Buscar por palavras no objeto..."
                                            className="bg-white p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-laranja_escuro focus:border-laranja_escuro transition-all hover:bg-gray-50"
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="text-sm text-azul_escuro font-semibold mb-1">Data Inicial</label>
                                        <input
                                            type="date"
                                            value={filtros.dataInicial}
                                            onChange={e => handleFiltroChange('dataInicial', e.target.value)}
                                            className="bg-white p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-laranja_escuro focus:border-laranja_escuro transition-all hover:bg-gray-50"
                                        />
                                    </div>
                                    <div className="flex flex-col">
                                        <label className="text-sm text-azul_escuro font-semibold mb-1">Data Final</label>
                                        <input
                                            type="date"
                                            value={filtros.dataFinal}
                                            onChange={e => handleFiltroChange('dataFinal', e.target.value)}
                                            className="bg-white p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-laranja_escuro focus:border-laranja_escuro transition-all hover:bg-gray-50"
                                        />
                                    </div>
                                    <div className="sm:col-span-2 xl:col-span-3 flex justify-end pt-2 border-t border-gray-200">
                                        <button
                                            type="button"
                                            onClick={handleBuscar}
                                            className="flex items-center gap-2 px-6 py-3 bg-laranja_escuro text-white rounded-lg font-semibold shadow-md hover:bg-orange-700 active:scale-95 transition-all duration-150"
                                        >
                                            <FaSearch size={14} />
                                            Pesquisar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tabela Desktop >= 1475px */}
                        <div className={`bg-white shadow-md rounded-lg ${isDesktop ? 'block' : 'hidden'}`}>
                            <table className="min-w-full">
                                <thead>
                                    <tr className="bg-azul_escuro bg-opacity-90 text-branco_cinza uppercase text-sm leading-normal">
                                        <th className="py-3 px-4 text-left min-w-[140px]">Número</th>
                                        <th className="py-3 px-4 text-left min-w-[200px]">Órgão</th>
                                        <th className="py-3 px-4 text-left min-w-[160px]">Tipo</th>
                                        <th className="py-3 px-4 text-left min-w-[100px]">Situação</th>
                                        <th className="py-3 px-4 text-left min-w-[120px]">Publicado em</th>
                                        <th className="py-3 px-4 text-left min-w-[360px]">Objeto</th>
                                        <th className="py-3 px-4 text-center min-w-[120px]">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-800 text-sm font-light">
                                    {loadingDispensas ? (
                                        <tr>
                                            <td colSpan="7" className="py-12 text-center">
                                                <div className="flex justify-center items-center">
                                                    <FiLoader size={24} className="animate-spin text-azul_escuro" />
                                                </div>
                                            </td>
                                        </tr>
                                    ) : listaDispensas.length > 0 ? (
                                        listaDispensas.map((dispensa) => (
                                            <tr key={dispensa.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                                <td className="py-4 px-4 font-medium text-azul_escuro">{dispensa.num_processo}</td>
                                                <td className="py-4 px-4">{dispensa.orgao.nome}</td>
                                                <td className="py-4 px-4">{dispensa.tipo_dispensa.toUpperCase().replaceAll('_', ' ')}</td>
                                                <td className="py-4 px-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                        ['homologad', 'aberta', 'em_andamento'].some(s => dispensa.situacao?.toLowerCase().includes(s))
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {dispensa.situacao?.toUpperCase().replaceAll('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4">{formatarData(dispensa.pub_date)}</td>
                                                <td className="py-4 px-4">
                                                    <p className="truncate max-w-[360px]" title={dispensa.objeto}>{dispensa.objeto}</p>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="flex justify-center space-x-2">
                                                        {acoesDispensa.map((acao, index) => (
                                                            <button
                                                                key={index}
                                                                onClick={() => acao.handler(dispensa)}
                                                                className="p-1 hover:scale-110 transition-transform"
                                                                title={index === 0 ? 'Editar' : index === 1 ? 'Visualizar' : 'Excluir'}
                                                            >
                                                                {acao.nome}
                                                            </button>
                                                        ))}
                                                        {dispensa.certificado_publicacao ? (
                                                            <>
                                                                <button
                                                                    onClick={() => handleDownloadCertificado(dispensa.id)}
                                                                    className="p-1 hover:scale-110 transition-transform"
                                                                    title="Baixar Certificado de Publicação"
                                                                >
                                                                    <FaDownload size={28} className="text-blue-800 hover:text-blue-700 transition-colors" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleExcluirCertificado(dispensa.id)}
                                                                    className="p-1 hover:scale-110 transition-transform"
                                                                    title="Remover certificado"
                                                                >
                                                                    <FaUndo size={20} className="text-orange-500 hover:text-orange-700 transition-colors" />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleGerarCertificado(dispensa)}
                                                                className="p-1 hover:scale-110 transition-transform"
                                                                title="Gerar Certificado de Publicação"
                                                            >
                                                                <FaFileAlt size={28} className="text-orange-500 hover:text-orange-700 transition-colors" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="py-12 text-center">
                                                <div className="flex flex-col items-center text-gray-500">
                                                    <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    <p className="text-lg font-medium mb-2">Nenhuma dispensa encontrada</p>
                                                    <p className="text-sm">
                                                        {listaDispensas.length === 0 ? 'Nenhuma dispensa foi cadastrada ainda.' : 'Tente ajustar os filtros da pesquisa.'}
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Cards Mobile < 1475px */}
                        <div className={`space-y-4 ${isDesktop ? 'hidden' : 'block'}`}>
                            {loadingDispensas ? (
                                <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
                                    <FiLoader size={32} className="animate-spin text-azul_escuro mx-auto" />
                                    <p className="text-gray-500 mt-4">Carregando dispensas...</p>
                                </div>
                            ) : listaDispensas.length > 0 ? (
                                listaDispensas.map((dispensa) => (
                                    <div key={dispensa.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-4 hover:shadow-lg transition-shadow">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex flex-col">
                                                <h3 className="text-lg font-bold text-azul_escuro">Processo Nº {dispensa.num_processo}</h3>
                                                <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold mt-1 w-fit ${
                                                    ['homologad', 'aberta', 'em_andamento'].some(s => dispensa.situacao?.toLowerCase().includes(s))
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {dispensa.situacao?.toUpperCase().replaceAll('_', ' ')}
                                                </span>
                                            </div>
                                            <div className="flex space-x-1">
                                                {acoesDispensa.map((acao, index) => (
                                                    <button
                                                        key={index}
                                                        onClick={() => acao.handler(dispensa)}
                                                        className="p-2 hover:scale-110 transition-transform rounded-full hover:bg-gray-100"
                                                        title={index === 0 ? 'Editar' : index === 1 ? 'Visualizar' : 'Excluir'}
                                                    >
                                                        {acao.nome}
                                                    </button>
                                                ))}
                                                {dispensa.certificado_publicacao ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleDownloadCertificado(dispensa.id)}
                                                            className="p-2 hover:scale-110 transition-transform rounded-full hover:bg-gray-100"
                                                            title="Baixar Certificado de Publicação"
                                                        >
                                                            <FaDownload size={28} className="text-green-600 hover:text-green-800 transition-colors" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleExcluirCertificado(dispensa.id)}
                                                            className="p-2 hover:scale-110 transition-transform rounded-full hover:bg-gray-100"
                                                            title="Remover certificado para regenerar"
                                                        >
                                                            <FaUndo size={20} className="text-orange-500 hover:text-orange-700 transition-colors" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() => handleGerarCertificado(dispensa)}
                                                        className="p-2 hover:scale-110 transition-transform rounded-full hover:bg-gray-100"
                                                        title="Gerar Certificado de Publicação"
                                                    >
                                                        <FaFileAlt size={28} className="text-orange-500 hover:text-orange-700 transition-colors" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <div>
                                                <span className="font-semibold text-gray-600">Órgão:</span>
                                                <p className="text-gray-800 mt-1">{dispensa.orgao.nome}</p>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                <div>
                                                    <span className="font-semibold text-gray-600">Tipo:</span>
                                                    <p className="text-gray-800">{dispensa.tipo_dispensa.toUpperCase().replaceAll('_', ' ')}</p>
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-gray-600">Data de Publicação:</span>
                                                    <p className="text-gray-800">{formatarData(dispensa.pub_date)}</p>
                                                </div>
                                            </div>
                                            <div className="mt-3">
                                                <span className="font-semibold text-gray-600">Objeto:</span>
                                                <div className="mt-1">
                                                    {dispensa.objeto.length > 150 ? (
                                                        <details className="group">
                                                            <summary className="cursor-pointer text-gray-800 hover:text-azul_escuro list-none">
                                                                <span>{dispensa.objeto.substring(0, 150)}...</span>
                                                                <span className="text-azul_escuro ml-2 font-semibold group-open:hidden">Ver mais</span>
                                                                <span className="text-azul_escuro ml-2 font-semibold hidden group-open:inline">Ver menos</span>
                                                            </summary>
                                                            <p className="mt-2 text-gray-800 leading-relaxed">{dispensa.objeto}</p>
                                                        </details>
                                                    ) : (
                                                        <p className="text-gray-800">{dispensa.objeto}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
                                    <div className="flex flex-col items-center text-gray-500">
                                        <svg className="w-20 h-20 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <p className="text-xl font-medium mb-2 text-gray-700">Nenhuma dispensa encontrada</p>
                                        <p className="text-gray-500 max-w-md">
                                            {listaDispensas.length === 0
                                                ? 'Nenhuma dispensa foi cadastrada ainda. Use a aba "Cadastro" para criar a primeira dispensa.'
                                                : 'Não há dispensas que correspondam aos filtros aplicados. Tente ajustar os critérios de pesquisa.'}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
                            <PaginacaoAvancada
                                totalItens={totalDispensas}
                                itensPorPagina={itensPorPagina}
                                paginaAtual={paginaAtual}
                                onMudarPagina={handleMudarPagina}
                                onMudarItensPorPagina={handleMudarItensPorPagina}
                            />
                        </div>
                    </div>
                )
                }
            </div>
            <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
            {dispensaSelecionada && visualizando && !editando && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-branco_cinza rounded-xl shadow-2xl w-full max-w-[80%] max-h-[80%] flex flex-col overflow-hidden">
                        <header className="flex items-center justify-between bg-laranja_escuro text-white px-4 py-2 rounded-t-lg shrink-0">
                            <h2 className="text-lg font-semibold">Detalhes da Dispensa - {dispensaSelecionada.num_processo}</h2>
                            <CgClose
                                onClick={handleFecharVisualizacao}
                                size={24}
                                className="cursor-pointer bg-white text-red-800 font-bold rounded-full p-1 shadow-md hover:bg-red-100 transition"
                            />
                        </header>
                        <div className="p-6 overflow-y-auto">
                        <div className="flex flex-wrap gap-4 bg-white p-4 shadow-lg rounded mb-6">
                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Órgão:</strong>
                                <span className="break-words">{dispensaSelecionada.orgao.nome}</span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Tipo:</strong>
                                <span className="break-words">{dispensaSelecionada.tipo_dispensa.toUpperCase()}</span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Situação:</strong>
                                <span className="break-words">{dispensaSelecionada.situacao.toUpperCase().replaceAll('_', ' ')}</span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Valor estimado:</strong>
                                <span className="break-words">R${String(dispensaSelecionada.valor_estimado).replace('.',',')}</span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Valor total vencedor:</strong>
                                <span className="break-words">R${String(dispensaSelecionada.valor_vencedor).replace('.',',')}</span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Data de Homologação:</strong>
                                <span className="break-words">
                                    {formatarData(dispensaSelecionada.homolog_date)}
                                </span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Data de Julgamento:</strong>
                                <span className="break-words">
                                    {dispensaSelecionada.julg_date ? formatarData(dispensaSelecionada.julg_date) : 'Não Julgado'}
                                </span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Número do Processo:</strong>
                                <span className="break-words">{dispensaSelecionada.num_processo}</span>
                            </div>

                            <div className="flex flex-col w-full">
                                <strong>Objeto:</strong>
                                <span className="break-words whitespace-pre-wrap">{dispensaSelecionada.objeto}</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center w-full p-2">
                            <h2 className="text-md font-semibold mb-2">Documentos inclusos na dispensa</h2>
                            <div className="flex gap-4 items-center">
                                <div className="relative text-sm inline-block cursor-pointer">
                                    <label className="bg-azul_escuro text-white px-4 cursor-pointer py-2 rounded-md cursor-pointer hover:bg-laranja_escuro transition-all">
                                        Adicionar Documento
                                        <input
                                            onChange={(e) => handleCadastrarDocs(dispensaSelecionada, e.target.files)}
                                            type="file"
                                            name="files"
                                            accept=".docx, .pdf"
                                            className="absolute left-0 top-0 w-full h-full opacity-0 cursor-pointer file:cursor-pointer"
                                        />
                                    </label>
                                </div>
                                <div>
                                    <button onClick={() => handleDownloadAllDocs()} className=" text-sm bg-azul_escuro text-white px-4 cursor-pointer py-2 rounded-md cursor-pointer hover:bg-laranja_escuro transition-all">Baixar todos</button>
                                </div>
                            </div>


                        </div>
                        {documentosDispensa.length > 0 ? (
                            <table className="min-w-full bg-white shadow-md rounded-lg">
                                <thead>
                                    <tr className="bg-azul_escuro bg-opacity-90 text-branco_cinza uppercase text-sm leading-normal">
                                        <th className="py-3 px-6 text-left">Título</th>
                                        <th className="py-3 px-6 text-left">Data de Inclusão</th>
                                        <th className="py-3 px-6 text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-800 text-sm font-light">
                                    {documentosDispensa.map((doc) => (
                                        <tr key={doc.id} className="border-b border-gray-200 hover:bg-gray-100">
                                            <td className="py-3 px-6 text-left">{doc.titulo}</td>
                                            <td className="py-3 px-6 text-left">{formatarData(doc.created_at)}</td>
                                            <td className="py-3 px-6 text-center">
                                                <button className='mr-2' onClick={() => handleDownloadDoc(doc)} >
                                                    <FaDownload size={18} className="text-azul_escuro" />
                                                </button>
                                                <button onClick={() => handleExcluirDoc(doc)} >
                                                    <FaTrash size={18} className="text-azul_escuro" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : <></>}
                    </div>
                    </div>
                </div>
            )}

            {editando && dispensaSelecionada && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-branco_cinza rounded-xl shadow-2xl w-full max-w-[80%] max-h-[80%] flex flex-col overflow-hidden">
                        <header className="flex items-center justify-between bg-laranja_escuro text-white px-4 py-2 rounded-t-lg shrink-0">
                            <h2 className="text-lg font-semibold">Editar Dispensa - {dispensaSelecionada.num_processo}</h2>
                            <CgClose
                                onClick={() => setEditando(false)}
                                size={24}
                                className="cursor-pointer bg-white text-red-800 font-bold rounded-full p-1 shadow-md hover:bg-red-100 transition"
                            />
                        </header>
                    <form onSubmit={editarDispensa} className="p-6 overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Órgão
                                </label>
                                <select
                                    name="orgao"
                                    defaultValue={dispensaSelecionada.orgao.id}
                                    className="p-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro focus:border-laranja_escuro transition-all shadow-sm bg-white"
                                    required
                                >
                                    <option value="">Selecione um órgão</option>
                                    {(user?.orgaos ?? []).map((orgao) => (
                                        <option key={orgao.id} value={orgao.id}>
                                            {orgao.nome}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tipo de Dispensa
                                </label>
                                <select
                                    name="tipo_dispensa"
                                    defaultValue={dispensaSelecionada.tipo_dispensa}
                                    className="p-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro focus:border-laranja_escuro transition-all shadow-sm bg-white"
                                    required
                                >
                                    <option value="">Selecione o tipo</option>
                                    <option value="dispensa">Dispensa</option>
                                    <option value="inexigibilidade">Inexigibilidade</option>
                                    <option value="inexigibilidade_credenciamento_chamada_publica">Inexigibilidade por credenciamento de chamada pública</option>
                                    <option value="dispensa_chamada_publica">Dispensa por chamada pública</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Situação
                                </label>
                                <select
                                    name="situacao"
                                    defaultValue={dispensaSelecionada.situacao}
                                    className="p-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro focus:border-laranja_escuro transition-all shadow-sm bg-white"
                                    required
                                >
                                    <option value="">Selecione a situação</option>
                                    <option value="em_andamento">Em Andamento</option>
                                    <option value="aberta">Aberta</option>
                                    <option value="julgada">Julgada</option>
                                    <option value="adjudicada">Adjudicada</option>
                                    <option value="homologada">Homologada</option>
                                    <option value="deserta">Deserta</option>
                                    <option value="fracassada">Fracassada</option>
                                    <option value="postergada">Postergada</option>
                                    <option value="revogada">Revogada</option>
                                    <option value="cancelada">Cancelada</option>
                                    <option value="anulada">Anulada</option>
                                    <option value="suspensa">Suspensa</option>
                                    <option value="aguardando_fase_recursal">Aguardando Fase Recursal</option>
                                    <option value="sessao_iniciada">Sessão Iniciada</option>
                                    <option value="sessao_encerrada">Sessão Encerrada</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Valor Estimado
                                </label>
                                <input
                                    name="valor_estimado"
                                    type="text"
                                    value={valorEstimadoEdit}
                                    onChange={(e) => handleValorChange(e, setValorEstimadoEdit)}
                                    className="p-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro focus:border-laranja_escuro transition-all shadow-sm bg-white"
                                    placeholder="0,00"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Valor Vencedor
                                </label>
                                <input
                                    name="valor_vencedor"
                                    type="text"
                                    value={valorVencedorEdit}
                                    onChange={(e) => handleValorChange(e, setValorVencedorEdit)}
                                    className="p-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro focus:border-laranja_escuro transition-all shadow-sm bg-white"
                                    placeholder="0,00"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Data de Publicação
                                </label>
                                <input
                                    name="pub_date"
                                    type="date"
                                    defaultValue={dispensaSelecionada.pub_date ? new Date(dispensaSelecionada.pub_date).toISOString().split('T')[0] : ''}
                                    className="p-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro focus:border-laranja_escuro transition-all shadow-sm bg-white"
                                    required
                                />
                            </div>                          

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Data de Homologação (Opcional)
                                </label>
                                <input
                                    name="homolog_date"
                                    type="date"
                                    defaultValue={dispensaSelecionada.homolog_date ? new Date(dispensaSelecionada.homolog_date).toISOString().split('T')[0] : ''}
                                    className="p-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro focus:border-laranja_escuro transition-all shadow-sm bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Data de Julgamento (Opcional)
                                </label>
                                <input
                                    name="julg_date"
                                    type="date"
                                    defaultValue={dispensaSelecionada.julg_date ? new Date(dispensaSelecionada.julg_date).toISOString().split('T')[0] : ''}
                                    className="p-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro focus:border-laranja_escuro transition-all shadow-sm bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Número do Processo
                                </label>
                                <input
                                    name="num_processo"
                                    type="text"
                                    defaultValue={dispensaSelecionada.num_processo}
                                    className="p-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro focus:border-laranja_escuro transition-all shadow-sm bg-white"
                                    placeholder="Número do processo"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Seção</label>
                                <select name="secao" defaultValue={dispensaSelecionada.secao?.id || ''} required className="p-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro focus:border-laranja_escuro transition-all shadow-sm bg-white">
                                    <option value="">Selecione uma seção</option>
                                    {listaSecoes.map(secao => {
                                        return (
                                            <option key={secao.id} value={secao.id}>{secao.nome}</option>
                                        )
                                    })}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Regime de Execução</label>
                                <select name="regime_execucao" defaultValue={dispensaSelecionada.regime_execucao || ''} required className="p-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro focus:border-laranja_escuro transition-all shadow-sm bg-white">
                                    <option value="">Selecione o regime</option>
                                    <option value="NA">Não se Aplica</option>
                                    <option value="global">Empreitada por preço global</option>
                                    <option value="unitario">Empreitada por preço unitário</option>
                                    <option value="integral">Empreitada integral</option>
                                    <option value="tarefas">Tarefa</option>
                                    <option value="execucao_direta">Execução direta</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Natureza do Objeto</label>
                                <select name="natureza_objeto" defaultValue={dispensaSelecionada.natureza_objeto || ''} required className="p-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro focus:border-laranja_escuro transition-all shadow-sm bg-white">
                                    <option value="">Selecione a natureza</option>
                                    <option value="normal">Normal</option>
                                    <option value="registro_precos">Registro de Preços</option>
                                    <option value="credenciamento_chamamento">Credenciamento/Chamamento</option>
                                    <option value="adesao_registro_precos">Adesão de Registro de Preços</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Objeto
                            </label>
                            <textarea
                                name="objeto"
                                defaultValue={dispensaSelecionada.objeto}
                                className="p-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro focus:border-laranja_escuro transition-all shadow-sm bg-white"
                                rows="4"
                                placeholder="Descrição do objeto"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fundamento Legal (Opcional)</label>
                            <textarea name="fundamento_legal" defaultValue={dispensaSelecionada.fundamento_legal || ''} rows="2" className="p-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro focus:border-laranja_escuro transition-all shadow-sm bg-white" />
                        </div>

                        <div className="flex w-full">
                            <button
                                type="submit"
                                className="px-6 py-2 w-full bg-azul_escuro text-white rounded-lg hover:bg-orange-600 transition-all"
                            >
                                Salvar
                            </button>
                        </div>
                    </form>
                    </div>
                </div>
            )}
        </section >
    )
}