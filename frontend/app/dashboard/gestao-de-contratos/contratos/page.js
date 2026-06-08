'use client'
import { toast, ToastContainer } from "react-toastify"
import 'react-toastify/dist/ReactToastify.css'
import { useEffect, useRef, useState } from "react"
import { apiOrgaos } from "@/app/api/apiOrgaos"
import Cookies from "js-cookie"
import { MdDelete } from "react-icons/md"
import { FaDownload, FaEdit, FaEye, FaTrash, FaFilter, FaChevronDown, FaChevronUp, FaFileAlt, FaUndo, FaSearch } from "react-icons/fa"
import { CgClose } from "react-icons/cg"
import Modal from "@/app/components/modal"
import { FiLoader } from "react-icons/fi"
import PaginacaoAvancada from "@/app/components/PaginacaoAvancada"
import { useContratos } from "../context/ContratosContext"
import { useModalidades } from "../../gestao-de-licitacoes/context/ModalidadesContext"
import { useSecao } from "../../gestao-de-licitacoes/context/SecaoContext"
import { usePessoas } from "@/app/context/pessoasContext"
import { useFiscais } from "../context/FiscaisContext"
import { useAuth } from "@/app/context/AuthContext"

const acUrlGlobal = process.env.NEXT_PUBLIC_AC_ENDPOINT_URL

function ProcessoSelectField({ name, searchUrl, token, searchRelations = [], initialValue = '', placeholder = 'Selecione', showModalidade = false }) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [selectedId, setSelectedId] = useState(
        initialValue !== undefined && initialValue !== null ? String(initialValue) : ''
    )
    const [selectedItem, setSelectedItem] = useState(null)
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(false)
    const containerRef = useRef(null)
    const debounceRef = useRef(null)
    const relQ = useRef(searchRelations.map(r => `relations=${encodeURIComponent(r)}`).join('&')).current

    useEffect(() => {
        if (!initialValue || !searchUrl || !token) return
        fetch(`${searchUrl}${initialValue}/?${relQ}`, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : null)
            .then(item => { if (item) setSelectedItem(item) })
            .catch(() => {})
    }, [])

    const doSearch = async (q) => {
        if (!searchUrl || !token) return
        setLoading(true)
        try {
            const qParam = q ? `&num_processo__icontains=${encodeURIComponent(q)}` : ''
            const res = await fetch(`${searchUrl}?limit=20${qParam}${relQ ? `&${relQ}` : ''}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            })
            if (res.ok) {
                const data = await res.json()
                setResults(Array.isArray(data) ? data : (data.results || []))
            }
        } catch {}
        finally { setLoading(false) }
    }

    useEffect(() => {
        if (open) doSearch(search)
    }, [open])

    const handleSearchChange = (e) => {
        const q = e.target.value
        setSearch(q)
        clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => doSearch(q), 300)
    }

    useEffect(() => {
        function handleClickOutside(e) {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false)
                setSearch('')
            }
        }
        if (open) document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [open])

    const displayItems = search
        ? results
        : selectedItem
            ? [selectedItem, ...results.filter(r => String(r.id) !== String(selectedItem.id))]
            : results

    const selected = (selectedItem && String(selectedItem.id) === selectedId)
        ? selectedItem
        : results.find(item => String(item.id) === selectedId)

    return (
        <div className="relative" ref={containerRef}>
            <input type="hidden" name={name} value={selectedId} />
            <button
                type="button"
                onClick={() => setOpen(prev => !prev)}
                className="w-full text-left p-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-laranja_escuro focus:border-laranja_escuro transition-all shadow-sm flex items-center justify-between min-h-[50px]"
            >
                {selected ? (
                    <div className="flex flex-col overflow-hidden flex-1 mr-2">
                        <span className="font-semibold text-azul_escuro text-sm">
                            Nº {selected.num_processo}
                        </span>
                        <span className="text-xs text-gray-500 truncate">
                            {selected.orgao?.nome}
                            {showModalidade && selected.modalidade?.nome ? ` • ${selected.modalidade.nome}` : ''}
                        </span>
                    </div>
                ) : (
                    <span className="text-gray-400 text-sm flex-1">{placeholder}</span>
                )}
                <FaChevronDown
                    className={`flex-shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                    size={12}
                />
            </button>

            {open && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
                    <div className="p-2 border-b border-gray-100">
                        <input
                            autoFocus
                            type="text"
                            value={search}
                            onChange={handleSearchChange}
                            placeholder="Buscar por número..."
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-laranja_escuro"
                        />
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        <button
                            type="button"
                            onClick={() => { setSelectedId(''); setSelectedItem(null); setOpen(false); setSearch('') }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:bg-gray-50 transition-colors border-b border-gray-100"
                        >
                            — {placeholder}
                        </button>
                        {loading ? (
                            <div className="px-4 py-6 text-sm text-gray-400 text-center flex items-center justify-center gap-2">
                                <FiLoader className="animate-spin" size={14} />
                                Carregando...
                            </div>
                        ) : displayItems.length > 0 ? (
                            displayItems.map(item => (
                                <button
                                    type="button"
                                    key={item.id}
                                    onClick={() => { setSelectedId(String(item.id)); setSelectedItem(item); setOpen(false); setSearch('') }}
                                    className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0 flex items-start justify-between gap-3 ${String(selectedId) === String(item.id) ? 'bg-blue-50 border-l-4 border-l-laranja_escuro' : 'pl-4'}`}
                                >
                                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                        <span className="font-bold text-azul_escuro text-sm">
                                            Nº {item.num_processo}
                                        </span>
                                        <span className="text-xs text-gray-500 truncate">
                                            {item.orgao?.nome}
                                        </span>
                                    </div>
                                    {showModalidade && item.modalidade?.nome && (
                                        <span className="flex-shrink-0 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium whitespace-nowrap self-center">
                                            {item.modalidade.nome}
                                        </span>
                                    )}
                                </button>
                            ))
                        ) : (
                            <div className="px-4 py-6 text-sm text-gray-400 text-center">
                                Nenhum resultado encontrado
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default function Contratos() {
    const acUrl = acUrlGlobal
    const { listaContratos, loadingContratos, fetchContratos, totalContratos } = useContratos()
    const { listaPessoasJuridicas } = usePessoas()
    const token = Cookies.get('auth-token')
    const [documentosContrato, setDocumentosContrato] = useState([])
    const { listaModalidades } = useModalidades()
    const { listaSecoes } = useSecao()
    const { listaFiscaisContrato } = useFiscais()
    const { user } = useAuth()
    const [dadosResponsavel, setDadosResponsavel] = useState(null)
    const [editando, setEditando] = useState(false)
    const [visualizando, setVisualizando] = useState(false)
    const [contratoSelecionado, setContratoSelecionado] = useState(null)
    const [mostrarFormulario, setMostrarFormulario] = useState(true)
    const [listaOrgaos, setOrgaos] = useState([])
    const [paginaAtual, setPaginaAtual] = useState(1)
    const [itensPorPagina, setItensPorPagina] = useState(10)
    const [valorEstimado, setValorEstimado] = useState('0,00')
    const [valorEstimadoEdit, setValorEstimadoEdit] = useState('0,00')
    const [tipoPrazoEntrega, setTipoPrazoEntrega] = useState('dias')
    const [fiscalSelecionado, setFiscalSelecionado] = useState('')
    const [vigenciasFiscal, setVigenciasFiscal] = useState([])
    const [vigenciaSelecionada, setVigenciaSelecionada] = useState('')
    const [portarias, setPortarias] = useState([])
    const [portariaSelecionada, setPortariaSelecionada] = useState('')
    const [portariaContrato, setPortariaContrato] = useState(null)
    const [fiscalEditSelecionado, setFiscalEditSelecionado] = useState('')
    const [vigenciasEdit, setVigenciasEdit] = useState([])
    const [portariasEdit, setPortariasEdit] = useState([])
    const [isDesktop, setIsDesktop] = useState(false)
    const [isFiltersExpanded, setIsFiltersExpanded] = useState(false)

    const handlePrazoEntrega = (event) => {
        const novoTipo = event.target.value
        setTipoPrazoEntrega(novoTipo)
    }

    const handleGetVigencias = async (fiscalId, setter) => {
        if (!fiscalId) { setter([]); return }
        try {
            const response = await fetch(`${acUrl}/vigencia/fiscal/${fiscalId}/`, {
                headers: { 'Authorization': `Bearer ${token}` },
            })
            if (response.ok) setter(await response.json())
            else setter([])
        } catch {
            setter([])
        }
    }

    const handleFiscalChange = (event) => {
        const fiscalId = event.target.value
        setFiscalSelecionado(fiscalId)
        setVigenciaSelecionada('')
        setPortariaSelecionada('')

        if (fiscalId) {
            handleGetVigencias(fiscalId, setVigenciasFiscal)
            handleGetFiscalPortarias(fiscalId)
        } else {
            setVigenciasFiscal([])
            setPortarias([])
        }
    }

    const handleFiscalEditChange = (event) => {
        const fiscalId = event.target.value
        setFiscalEditSelecionado(fiscalId)
        handleGetVigencias(fiscalId, setVigenciasEdit)
        handleGetFiscalPortarias(fiscalId, setPortariasEdit)
    }

    const handlePortariaChange = (event) => {
        const portariaId = event.target.value
        setPortariaSelecionada(portariaId)
        if (portariaId) {
            const portariaSelecionada = portarias.find(p => p.id === portariaId)
            console.log('Dados da portaria:', portariaSelecionada)
            console.log('Título da portaria:', portariaSelecionada?.titulo)
        }
    }

    function formatarData(dataString) {
        if (!dataString) return '-'
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
    const inicializarValoresEdicao = (contrato) => {
        if (contrato?.valor_estimado) {
            const valorEstimadoFormatado = parseFloat(contrato.valor_estimado).toFixed(2).replace('.', ',')
            setValorEstimadoEdit(valorEstimadoFormatado)
        } else {
            setValorEstimadoEdit('0,00')
        }

        // Inicializa o tipo de prazo como dias (padrão no backend)
        setTipoPrazoEntrega('dias')
    }

    const [filtros, setFiltros] = useState({
        objeto: '',
        fiscalContrato: '',
        dataInicial: '',
        dataFinal: '',
        orgao: '',
        modalidade: '',
        numero: ''
    })

    const listaColunasContrato = [
        { nomeColuna: 'Número' },
        { nomeColuna: 'Órgão' },
        { nomeColuna: 'Situação' },
        { nomeColuna: 'Data de Início' },
        { nomeColuna: 'Data de Vencimento' },
        { nomeColuna: 'Objeto' }
    ]


    const getOrgaos = async () => {
        try {
            const fetchOrgaos = await apiOrgaos.getAll()
            setOrgaos(fetchOrgaos)
        } catch (error) {
            toast.error('Erro ao carregar órgãos')
        }
    }

    const getDocumentosContrato = async (contrato) => {
        try {
            const response = await fetch(`${acUrl}/contrato/${contrato.id}/docs/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })
            if (response.ok) {
                const documentos = await response.json()
                setDocumentosContrato(documentos)
            }
        }
        catch (error) {
            console.error('Erro ao obter documentos do contrato:', error)
        }
    }

    const getPortariaContrato = async (contrato) => {
        try {
            if (contrato.portaria) {
                const response = await fetch(`${acUrl}/docs/${contrato.portaria}/`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                })
                if (response.ok) {
                    const portaria = await response.json()
                    setPortariaContrato(portaria)
                } else {
                    setPortariaContrato(null)
                }
            } else {
                setPortariaContrato(null)
            }
        }
        catch (error) {
            console.error('Erro ao obter portaria do contrato:', error)
            setPortariaContrato(null)
        }
    }


    useEffect(() => {
        getOrgaos()
    }, [])

    // Hook para controlar breakpoint customizado de 1475px
    useEffect(() => {
        const handleResize = () => {
            setIsDesktop(window.innerWidth >= 1475)
        }

        // Configurar o valor inicial
        handleResize()

        // Adicionar listener
        window.addEventListener('resize', handleResize)

        // Cleanup
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // Função para detectar se há filtros ativos
    const hasActiveFilters = filtros.numero || filtros.modalidade || filtros.fiscalContrato ||
        filtros.objeto || filtros.dataInicial || filtros.dataFinal || filtros.orgao

    // Função para alternar a expansão dos filtros
    const toggleFiltersExpanded = () => {
        setIsFiltersExpanded(!isFiltersExpanded)
    }


    const handleFiltroChange = (campo, valor) => {
        setFiltros(prev => ({
            ...prev,
            [campo]: valor
        }))
    }

    const handleBuscar = () => {
        setPaginaAtual(1)
        fetchContratos({ page: 1, pageSize: itensPorPagina, filters: filtros })
    }

    const handleVisualizar = async (contrato) => {
        setContratoSelecionado(contrato)
        setVisualizando(true)
        try {
            await getDocumentosContrato(contrato)
            await getPortariaContrato(contrato)
        } catch (error) {
            console.error(error)
        }
    }

    const handleDeletar = async (contrato) => {
        try {
            const response = await fetch(`${acUrl}/contrato/${contrato.id}/`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            })
            if (response.ok) {
                toast.success('Contrato deletado com sucesso!')
                await fetchContratos()
            }
        }
        catch (error) {
            console.error('Erro ao deletar contrato:', error)
        }
    }

    const handleEditar = async (contrato) => {
        setContratoSelecionado(contrato)
        inicializarValoresEdicao(contrato)
        const fiscalId = contrato.vigencia?.fiscal?.id || ''
        setFiscalEditSelecionado(fiscalId)
        if (fiscalId) {
            handleGetVigencias(fiscalId, setVigenciasEdit)
            handleGetFiscalPortarias(fiscalId, setPortariasEdit)
        }
        setEditando(true)
    }

    const editarContrato = async (e) => {
        e.preventDefault()
        const formDataContrato = new FormData(e.target)
        const contrato = Object.fromEntries(formDataContrato.entries())
        for (const [key, value] of Object.entries(contrato)) {
            if (value === '') {
                delete contrato[key]
            }
        }

        // Converte valores formatados de volta para número
        if (contrato.valor_estimado) {
            contrato.valor_estimado = valorParaNumero(contrato.valor_estimado)
        }

        try {
            const response = await fetch(`${acUrl}/contrato/${contratoSelecionado.id}/`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(contrato),
            })
            if (response.ok) {
                await response.json()
                toast.success('Contrato editado com sucesso!')
                await fetchContratos()
                setEditando(false)
                setContratoSelecionado(null)
                setValorEstimadoEdit('0,00')
            }
        }
        catch (error) {
            toast.error('Erro ao editar contrato: ' + error.message)
        }
    }

    const handleCadastrarDocs = async (contrato, files) => {
        const fileData = new FormData()
        fileData.append('target_id', contrato.id)
        fileData.append('target_type', 'contrato')
        // Anexa o prazo de entrega original (em dias)
        fileData.append('prazo_entrega', String(contrato.prazo_entrega))
        console.log('Antes da conversão, prazo_entrega no FormData:', fileData.get('prazo_entrega'))
        // Converte para meses, se selecionado
        if (tipoPrazoEntrega === 'meses') {
            const prazoOriginal = parseInt(contrato.prazo_entrega, 10)
            fileData.set('prazo_entrega', String(prazoOriginal * 30))
            console.log('Após conversão (meses), prazo_entrega no FormData:', fileData.get('prazo_entrega'))
        }
        for (const file of files) {
            fileData.append('files', file)
        }
        try {
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
                setDocumentosContrato(prev => [...prev, novoDocumento[0]])
            }
        }
        catch (error) {
            toast.error('Erro ao cadastrar documento')
        }
    }

    const handleCadastro = async (event) => {
        event.preventDefault()
        const formData = new FormData(event.target)
        const files = event.target.files.files
        formData.delete('files')
        const formJson = Object.fromEntries(formData.entries())

        for (const [key, value] of Object.entries(formJson)) {
            if (value === '') {
                delete formJson[key]
            }
        }
        if (formJson.prazo_entrega && tipoPrazoEntrega === 'meses') {
            const prazoOrig = parseInt(formJson.prazo_entrega, 10)
            formJson.prazo_entrega = String(prazoOrig * 30)
        }
        delete formJson.prazo_entrega_tipo

        if (formJson.valor_estimado) {
            formJson.valor_estimado = valorParaNumero(formJson.valor_estimado)
        }

        try {
            const response = await fetch(`${acUrl}/contrato/`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formJson),
            })
            if (response.ok) {
                const novoContrato = await response.json()
                try {
                    await handleCadastrarDocs(novoContrato, files)
                    await fetchContratos()
                    toast.success('Contrato cadastrado com sucesso!')
                    event.target.reset()
                    setValorEstimado('0,00')
                    setTipoPrazoEntrega('dias')
                    setMostrarFormulario(false)
                }
                catch (error) {
                    throw new Error('Erro ao cadastrar contrato: ' + error.message)
                }
            }
        }
        catch (error) {
            console.error(error)
        }
    }

    const handleFecharVisualizacao = () => {
        setContratoSelecionado(null)
        setDocumentosContrato([])
        setDadosResponsavel(null)
        setVisualizando(false)
        setEditando(false)
        setValorEstimadoEdit('0,00')
        setTipoPrazoEntrega('dias')
        setPortariaContrato(null)
        setFiscalEditSelecionado('')
        setVigenciasEdit([])
        setPortariasEdit([])
    }

    const handleGerarCertificado = async (contrato) => {
        try {
            const response = await fetch(`${acUrl}/contrato/${contrato.id}/certificado/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })
            if (response.ok) {
                toast.success('Certificado gerado com sucesso!')
                await fetchContratos()
                return
            }

            const errorData = await response.json().catch(() => null)
            toast.error(errorData?.detail || 'Erro ao gerar certificado')
        }
        catch (error) {
            console.error('Erro ao gerar certificado:', error)
            toast.error('Erro ao gerar certificado')
        }
    }

    const handleDownloadCertificado = async (contratoId) => {
        try {
            const response = await fetch(`${acUrl}/contrato/${contratoId}/certificado/content/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            })
            if (response.ok) {
                const disposition = response.headers.get('content-disposition') || ''
                const match = disposition.match(/filename="([^"]+)"/)
                const filename = match ? match[1] : `Certificado de Publicação de Contrato ${contratoId}.pdf`
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

    const handleExcluirCertificado = async (contratoId) => {
        try {
            const response = await fetch(`${acUrl}/contrato/${contratoId}/certificado/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })
            if (response.ok) {
                toast.success('Certificado excluído com sucesso!')
                await fetchContratos()
                return
            }
            const errorData = await response.json().catch(() => null)
            toast.error(errorData?.detail || 'Erro ao excluir certificado')
        } catch (error) {
            console.error('Erro ao excluir certificado:', error)
            toast.error('Erro ao excluir certificado')
        }
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
                setDocumentosContrato(prev => prev.filter(d => d.id !== doc.id))
                toast.success('Documento excluído com sucesso!')
            } else {
                throw new Error('Erro ao excluir documento')
            }
        }
        catch (error) {
            console.error('Erro ao excluir documento:', error)
            toast.error('Erro ao excluir documento')
        }
    }

    const handleDownloadAllDocs = async () => {
        for (const doc of documentosContrato) {
            await handleDownloadDoc(doc)
        }
    }

    const handleGetFiscalPortarias = async (fiscalId, setter = setPortarias) => {
        if (!fiscalId) { setter([]); return }
        try {
            const response = await fetch(`${acUrl}/fiscal_contrato/${fiscalId}/docs/`, {
                headers: { 'Authorization': `Bearer ${token}` },
            })
            if (response.ok) {
                const data = await response.json()
                setter(data.portarias || [])
            } else {
                setter([])
            }
        } catch {
            setter([])
        }
    }

    const handleMudarPagina = (novaPagina) => {
        setPaginaAtual(novaPagina)
        fetchContratos({ page: novaPagina, pageSize: itensPorPagina, filters: filtros })
    }

    const handleMudarItensPorPagina = (novosItens) => {
        setItensPorPagina(novosItens)
        setPaginaAtual(1)
        fetchContratos({ page: 1, pageSize: novosItens, filters: filtros })
    }

    const acoesContrato = [
        {
            nome: <FaEdit size={28} className="text-green-800 hover:text-green-900 transition-colors" />,
            handler: handleEditar,
        },
        {
            nome: <FaEye size={28} className="text-azul_escuro hover:text-green-900 transition-colors" />,
            handler: handleVisualizar,
        },

        {
            nome: <MdDelete size={28} className="text-red-600 hover:text-red-800 transition-colors" />,
            handler: handleDeletar,
        },
    ]


    return (
        <section className="flex flex-col flex-grow text-azul_escuro overflow-auto gap-4 bg-gradient-to-br from-gray-200 to-gray-300 p-4">
            <div className="flex gap-4">
                <button
                    onClick={() => {
                        setMostrarFormulario(true)
                        setValorEstimado('0,00')
                    }}
                    className={`px-4 py-2 rounded-md ${mostrarFormulario ? 'bg-laranja_escuro text-white' : 'bg-gray-300 text-black'}`}
                >
                    Cadastro
                </button>
                <button
                    onClick={() => {
                        setMostrarFormulario(false)
                        setValorEstimado('0,00')
                    }}
                    className={`px-4 py-2 rounded-md ${!mostrarFormulario ? 'bg-laranja_escuro text-white' : 'bg-gray-300 text-black'}`}
                >
                    Registros
                </button>
            </div>
            <div className="flex flex-col w-full mx-auto bg-white shadow-lg rounded-lg p-4">
                {mostrarFormulario ? (
                    <>
                        <h1 className="font-bold text-xl mb-2">Cadastro de Contratos</h1>
                        <form onSubmit={handleCadastro} className="flex flex-col gap-4">
                            <div className=" grid grid-cols-1 md:grid-cols-2 gap-4 p-2 w-full text-azul_escuro">
                                <div>
                                    <label className="block text-sm font-medium">Número do Contrato</label>
                                    <input required name="num_contrato" type="text" className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium">Modalidade</label>
                                    <select name="modalidade" required className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all">
                                        {listaModalidades.map(modalidade => {
                                            return (
                                                <option key={modalidade.id} value={modalidade.id}>{modalidade.nome}</option>
                                            )
                                        })}
                                    </select>
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
                                    <label className="block text-sm font-medium">Finalidade</label>
                                    <input required name="finalidade" type="text" className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all" />
                                </div>


                                <div>
                                    <label className="block text-sm font-medium">Tipo</label>
                                    <select name="tipo" required className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all">
                                        <option value="contrato">Contrato</option>
                                        <option value="aditivo">Aditivo</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium">Situação</label>
                                    <select name="situacao" required className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all">
                                        <option value="vigente">Vigente</option>
                                        <option value="encerrado">Encerrado</option>
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
                                    <label className="block text-sm font-medium">Data de Início</label>
                                    <input required name="data_inicio" type="date" className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium">Data de Vencimento</label>
                                    <input required name="data_vencimento" type="date" className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium">Data de Publicação</label>
                                    <input required name="pub_date" type="date" className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Licitação</label>
                                    <ProcessoSelectField
                                        name="licitacao"
                                        searchUrl={`${acUrl}/licitacao/`}
                                        token={token}
                                        searchRelations={['orgao', 'modalidade']}
                                        placeholder="Selecione uma licitação"
                                        showModalidade={true}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Dispensa</label>
                                    <ProcessoSelectField
                                        name="dispensa"
                                        searchUrl={`${acUrl}/dispensa/`}
                                        token={token}
                                        searchRelations={['orgao']}
                                        placeholder="Selecione uma dispensa"
                                        showModalidade={false}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium">Fornecedor</label>
                                    <select name="fornecedor" required className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all">
                                        {listaPessoasJuridicas.map(pessoa => {
                                            return (
                                                <option key={pessoa.pessoa_id} value={pessoa.pessoa_id}>{pessoa.razao_social}</option>
                                            )
                                        })}
                                    </select>
                                </div>

                                <div className="md:col-span-2 rounded-xl border border-indigo-200 bg-indigo-50 p-4 flex flex-col gap-3">
                                    <h3 className="text-xs font-semibold text-indigo-700 uppercase tracking-widest">Fiscal de Contrato</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-indigo-800 mb-1">Fiscal *</label>
                                            <select
                                                required
                                                value={fiscalSelecionado}
                                                onChange={handleFiscalChange}
                                                className="w-full p-2 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                            >
                                                <option value="">Selecione um fiscal</option>
                                                {listaFiscaisContrato.map(fiscal => (
                                                    <option key={fiscal.id} value={fiscal.id}>{fiscal.pessoa.nome || fiscal.pessoa.razao_social}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {fiscalSelecionado && (<>
                                            <div>
                                                <label className="block text-sm font-medium text-indigo-800 mb-1">Vigência *</label>
                                                <select
                                                    name="vigencia"
                                                    required
                                                    value={vigenciaSelecionada}
                                                    onChange={e => setVigenciaSelecionada(e.target.value)}
                                                    className="w-full p-2 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                                >
                                                    <option value="">Selecione uma vigência</option>
                                                    {vigenciasFiscal.map(v => (
                                                        <option key={v.id} value={v.id}>
                                                            {v.data_inicio?.split('-').reverse().join('/')} — {v.data_fim ? v.data_fim.split('-').reverse().join('/') : 'Vigente'}
                                                        </option>
                                                    ))}
                                                </select>
                                                {vigenciasFiscal.length === 0 && (
                                                    <p className="text-xs text-indigo-500 mt-1">Nenhuma vigência cadastrada para este fiscal.</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-indigo-800 mb-1">Portaria (opcional)</label>
                                                <select
                                                    name="portaria"
                                                    value={portariaSelecionada}
                                                    onChange={handlePortariaChange}
                                                    className="w-full p-2 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                                >
                                                    <option value="">Selecione uma portaria</option>
                                                    {portarias.map(p => (
                                                        <option key={p.id} value={p.id}>{p.titulo}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </>)}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium">Prazo de entrega</label>
                                    <div className="flex gap-2">
                                        <input
                                            required
                                            name="prazo_entrega"
                                            type="number"
                                            min="1"
                                            placeholder="Ex: 30"
                                            className="mt-1 p-2 border border-gray-300 rounded flex-1 focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all"
                                        />
                                        <select
                                            name="prazo_entrega_tipo"
                                            value={tipoPrazoEntrega}
                                            onChange={handlePrazoEntrega}
                                            className="mt-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all min-w-[100px]"
                                        >
                                            <option value="dias">Dias</option>
                                            <option value="meses">Meses</option>
                                        </select>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {tipoPrazoEntrega === 'meses' ?
                                            'Será convertido para dias (1 mês = 30 dias)' :
                                            'Prazo em dias para entrega'
                                        }
                                    </p>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium">Observações</label>
                                    <textarea name="descricao" rows="3" className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all"></textarea>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium">Objeto</label>
                                    <textarea required name="objeto" rows="3" className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all"></textarea>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Selecione arquivos</label>
                                    <input required name="files" type="file" accept=".pdf, .doc, .docx" multiple className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all" />
                                </div>

                            </div>
                            <div className="flex w-full">
                                <button type="submit" className="w-full bg-azul_escuro text-white px-4 py-2 rounded-md hover:bg-laranja_escuro transition-colors">
                                    Cadastrar Contrato
                                </button>
                            </div>
                        </form>
                    </>

                ) : (
                    <div className="flex flex-col w-full mx-auto rounded-lg">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                            <h2 className="text-azul_escuro text-xl font-bold">Contratos Cadastrados</h2>

                        </div>

                        {/* Seção de Filtros Colapsáveis */}
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-4">
                            {/* Header dos Filtros */}
                            <div
                                className="flex items-center justify-between p-4 bg-azul_escuro text-white cursor-pointer transition-all duration-300"
                                onClick={toggleFiltersExpanded}
                            >
                                <div className="flex items-center gap-3">
                                    <FaFilter className="text-lg" />
                                    <h3 className="font-semibold text-lg">Filtros de Busca</h3>
                                    {hasActiveFilters && (
                                        <span className="bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs font-medium">
                                            Ativos
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {isFiltersExpanded ? <FaChevronUp /> : <FaChevronDown />}
                                </div>
                            </div>

                            {/* Conteúdo dos Filtros */}
                            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isFiltersExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                }`}>
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 p-6 bg-gray-50">
                                    <div className="flex flex-col">
                                        <label className="text-sm text-azul_escuro font-semibold mb-1">Número do Contrato</label>
                                        <input
                                            type="text"
                                            name="numero"
                                            value={filtros.numero}
                                            onChange={e => handleFiltroChange('numero', e.target.value)}
                                            placeholder="Ex: 12345"
                                            className="bg-white p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-laranja_escuro focus:border-laranja_escuro transition-all hover:bg-gray-50"
                                        />
                                    </div>

                                    <div className="flex flex-col">
                                        <label className="text-sm text-azul_escuro font-semibold mb-1">Modalidade</label>
                                        <select
                                            name="modalidade"
                                            value={filtros.modalidade}
                                            onChange={e => handleFiltroChange('modalidade', e.target.value)}
                                            className="bg-white p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-laranja_escuro focus:border-laranja_escuro transition-all hover:bg-gray-50"
                                        >
                                            <option value="">Todas as modalidades</option>
                                            {listaModalidades.map(modalidade => (
                                                <option key={modalidade.id} value={modalidade.id}>{modalidade.nome}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex flex-col">
                                        <label className="text-sm text-azul_escuro font-semibold mb-1">Fiscal do Contrato</label>
                                        <select
                                            name="fiscalContrato"
                                            value={filtros.fiscalContrato}
                                            onChange={e => handleFiltroChange('fiscalContrato', e.target.value)}
                                            className="bg-white p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-laranja_escuro focus:border-laranja_escuro transition-all hover:bg-gray-50"
                                        >
                                            <option value="">Todos os fiscais</option>
                                            {listaFiscaisContrato.map(fiscal => (
                                                <option key={fiscal.id} value={fiscal.id}>
                                                    {fiscal.pessoa.nome || fiscal.pessoa.nome_fantasia}
                                                </option>
                                            ))}
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
                                            name="objeto"
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
                                            name="dataInicial"
                                            value={filtros.dataInicial}
                                            onChange={e => handleFiltroChange('dataInicial', e.target.value)}
                                            className="bg-white p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-laranja_escuro focus:border-laranja_escuro transition-all hover:bg-gray-50"
                                        />
                                    </div>

                                    <div className="flex flex-col">
                                        <label className="text-sm text-azul_escuro font-semibold mb-1">Data Final</label>
                                        <input
                                            type="date"
                                            name="dataFinal"
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

                        {/* Layout Desktop - Tabela tradicional para telas >= 1475px */}
                        <div className={`overflow-x-auto bg-white shadow-md rounded-lg ${isDesktop ? 'block' : 'hidden'}`}>
                            <table className="min-w-full">
                                <thead>
                                    <tr className="bg-azul_escuro bg-opacity-90 text-branco_cinza uppercase text-sm leading-normal">
                                        <th className="py-3 px-4 text-left min-w-[120px]">Número</th>
                                        <th className="py-3 px-4 text-left min-w-[240px]">Órgão</th>
                                        <th className="py-3 px-4 text-left min-w-[100px]">Situação</th>
                                        <th className="py-3 px-4 text-left min-w-[120px]">Publicado em</th>
                                        <th className="py-3 px-4 text-left min-w-[400px]">Objeto</th>
                                        <th className="py-3 px-4 text-center min-w-[120px]">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-800 text-sm font-light">
                                    {loadingContratos ? (
                                        <tr>
                                            <td colSpan="6" className="py-12 text-center">
                                                <div className="flex justify-center items-center">
                                                    <FiLoader size={24} className="animate-spin text-azul_escuro" />
                                                </div>
                                            </td>
                                        </tr>
                                    ) : listaContratos.length > 0 ? (
                                        listaContratos.map((contrato) => (
                                            <tr key={contrato.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                                <td className="py-4 px-4 font-medium text-azul_escuro">{contrato.num_contrato}</td>
                                                <td className="py-4 px-4">
                                                    <div className="" title={contrato.secao?.orgao?.nome}>
                                                        {contrato.secao?.orgao?.nome}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${contrato.situacao?.toLowerCase() === 'vigente'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {contrato.situacao?.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4">{formatarData(contrato.pub_date)}</td>
                                                <td className="py-4 px-4">
                                                    <div className="max-w-[400px]">
                                                        <p className="truncate" title={contrato.objeto}>
                                                            {contrato.objeto}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="flex justify-center space-x-2">
                                                        {acoesContrato.map((acao, index) => (
                                                            <button
                                                                key={index}
                                                                onClick={() => acao.handler(contrato)}
                                                                className="p-1 hover:scale-110 transition-transform"
                                                                title={index === 0 ? 'Editar' : index === 1 ? 'Visualizar' : 'Excluir'}
                                                            >
                                                                {acao.nome}
                                                            </button>
                                                        ))}
                                                        {contrato.certificado_publicacao ? (
                                                            <>
                                                                <button
                                                                    onClick={() => handleDownloadCertificado(contrato.id)}
                                                                    className="p-1 hover:scale-110 transition-transform"
                                                                    title="Baixar Certificado de Publicação"
                                                                >
                                                                    <FaDownload size={28} className="text-blue-800 hover:text-blue-700 transition-colors" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleExcluirCertificado(contrato.id)}
                                                                    className="p-1 hover:scale-110 transition-transform"
                                                                    title="Remover certificado"
                                                                >
                                                                    <FaUndo size={20} className="text-orange-500 hover:text-orange-700 transition-colors" />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleGerarCertificado(contrato)}
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
                                                    <p className="text-lg font-medium mb-2">Nenhum contrato encontrado</p>
                                                    <p className="text-sm">
                                                        {!hasActiveFilters
                                                            ? 'Nenhum contrato foi cadastrado ainda.'
                                                            : 'Tente ajustar os filtros da pesquisa.'
                                                        }
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Layout Mobile/Tablet - Cards responsivos para telas < 1475px */}
                        <div className={`space-y-4 ${isDesktop ? 'hidden' : 'block'}`}>
                            {loadingContratos ? (
                                <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
                                    <FiLoader size={32} className="animate-spin text-azul_escuro mx-auto" />
                                    <p className="text-gray-500 mt-4">Carregando contratos...</p>
                                </div>
                            ) : listaContratos.map((contrato) => (
                                <div key={contrato.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-4 hover:shadow-lg transition-shadow">
                                    {/* Header do Card */}
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex flex-col">
                                            <h3 className="text-lg font-bold text-azul_escuro">
                                                Contrato Nº {contrato.num_contrato}
                                            </h3>
                                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold mt-1 w-fit ${contrato.situacao?.toLowerCase() === 'vigente'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                }`}>
                                                {contrato.situacao?.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex space-x-2">
                                            {acoesContrato.map((acao, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => acao.handler(contrato)}
                                                    className="p-2 hover:scale-110 transition-transform rounded-full hover:bg-gray-100"
                                                    title={index === 0 ? 'Editar' : index === 1 ? 'Visualizar' : 'Excluir'}
                                                >
                                                    {acao.nome}
                                                </button>
                                            ))}
                                            {contrato.certificado_publicacao ? (
                                                <>
                                                    <button
                                                        onClick={() => handleDownloadCertificado(contrato.id)}
                                                        className="p-2 hover:scale-110 transition-transform rounded-full hover:bg-gray-100"
                                                        title="Baixar Certificado de Publicação"
                                                    >
                                                        <FaDownload size={28} className="text-green-600 hover:text-green-800 transition-colors" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleExcluirCertificado(contrato.id)}
                                                        className="p-2 hover:scale-110 transition-transform rounded-full hover:bg-gray-100"
                                                        title="Remover certificado para regenerar"
                                                    >
                                                        <FaUndo size={20} className="text-orange-500 hover:text-orange-700 transition-colors" />
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => handleGerarCertificado(contrato)}
                                                    className="p-2 hover:scale-110 transition-transform rounded-full hover:bg-gray-100"
                                                    title="Gerar Certificado de Publicação"
                                                >
                                                    <FaFileAlt size={28} className="text-orange-500 hover:text-orange-700 transition-colors" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Informações principais */}
                                    <div className="space-y-2 text-sm">
                                        <div className="flex flex-col sm:flex-row sm:justify-between">
                                            <div className="mb-2 sm:mb-0">
                                                <span className="font-semibold text-gray-600">Órgão:</span>
                                                <p className="text-gray-800 mt-1">
                                                    {contrato.secao?.orgao?.nome}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            <div>
                                                <span className="font-semibold text-gray-600">Data de Início:</span>
                                                <p className="text-gray-800">{formatarData(contrato.data_inicio)}</p>
                                            </div>
                                            <div>
                                                <span className="font-semibold text-gray-600">Data de Vencimento:</span>
                                                <p className="text-gray-800">{formatarData(contrato.data_vencimento)}</p>
                                            </div>
                                        </div>

                                        {/* Objeto com expand/collapse */}
                                        <div className="mt-3">
                                            <span className="font-semibold text-gray-600">Objeto:</span>
                                            <div className="mt-1">
                                                {contrato.objeto?.length > 150 ? (
                                                    <details className="group">
                                                        <summary className="cursor-pointer text-gray-800 hover:text-azul_escuro">
                                                            <span>{contrato.objeto.substring(0, 150)}...</span>
                                                            <span className="text-azul_escuro ml-2 font-semibold group-open:hidden">Ver mais</span>
                                                            <span className="text-azul_escuro ml-2 font-semibold hidden group-open:inline">Ver menos</span>
                                                        </summary>
                                                        <p className="mt-2 text-gray-800 leading-relaxed">
                                                            {contrato.objeto}
                                                        </p>
                                                    </details>
                                                ) : (
                                                    <p className="text-gray-800">{contrato.objeto ?? '-'}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {/* Mensagem quando não há contratos */}
                            {!loadingContratos && listaContratos.length === 0 && (
                                <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
                                    <div className="flex flex-col items-center text-gray-500">
                                        <svg className="w-20 h-20 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <p className="text-xl font-medium mb-2 text-gray-700">Nenhum contrato encontrado</p>
                                        <p className="text-gray-500 max-w-md">
                                            {!hasActiveFilters
                                                ? 'Nenhum contrato foi cadastrado ainda. Use a aba "Cadastro" para criar o primeiro contrato.'
                                                : 'Não há contratos que correspondam aos filtros aplicados. Tente ajustar os critérios de pesquisa.'
                                            }
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Informações de resultado e paginação */}
                        <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">

                            <PaginacaoAvancada
                                totalItens={totalContratos}
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
            {visualizando && contratoSelecionado && !editando && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 transition-opacity duration-300">
                    <div className="bg-branco_cinza rounded-xl shadow-2xl w-full max-w-[80%] max-h-[80%] flex flex-col overflow-hidden">

                        <header className="flex items-center justify-between bg-laranja_escuro text-white px-4 py-2 rounded-t-lg">
                            <h2 className="text-lg font-semibold">Detalhes do Contrato</h2>
                            <CgClose
                                onClick={() => handleFecharVisualizacao()}
                                size={24}
                                className="cursor-pointer bg-white text-red-800 font-bold rounded-full p-1 shadow-md hover:bg-red-100 transition"
                            />
                        </header>
                        <div className="p-6 overflow-y-auto">
                            <div className="flex flex-wrap gap-4 bg-white p-4 shadow-lg rounded mb-6">
                                <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                    <strong>Órgão:</strong>
                                    <span className="break-words">{contratoSelecionado.secao?.orgao?.nome}</span>
                                </div>

                                <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                    <strong>Situação:</strong>
                                    <span className="break-words">{contratoSelecionado.situacao}</span>
                                </div>
                                <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                    <strong>Data de Publicação:</strong>
                                    <span className="break-words">
                                        {formatarData(contratoSelecionado.pub_date)}
                                    </span>
                                </div>
                                <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                    <strong>Data de Início:</strong>
                                    <span className="break-words">
                                        {formatarData(contratoSelecionado.data_inicio)}
                                    </span>
                                </div>

                                <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                    <strong>Data de Vencimento:</strong>
                                    <span className="break-words">{formatarData(contratoSelecionado.data_vencimento)}</span>
                                </div>


                                <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                    <strong>Número do Contrato:</strong>
                                    <span className="break-words">{contratoSelecionado.num_contrato}</span>
                                </div>
                                <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                    <strong>Valor estimado:</strong>
                                    <span className="break-words">R${String(contratoSelecionado.valor_estimado).replace('.', ',')}</span>
                                </div>
                                <div className="flex flex-col w-full">
                                    <strong>Objeto:</strong>
                                    <span className="break-words whitespace-pre-wrap">{contratoSelecionado.objeto}</span>
                                </div>
                            </div>
                            <h2 className="text-md font-semibold mb-2">Fiscal de contrato</h2>
                            <div className="flex w-full flex-wrap items-center gap-8 bg-white p-4 shadow-lg rounded mb-4">
                                <div className="flex gap-2">
                                    <strong>Nome:</strong>
                                    <span className="break-words">{contratoSelecionado.vigencia?.fiscal?.pessoa?.nome || contratoSelecionado.vigencia?.fiscal?.pessoa?.razao_social || '-'}</span>
                                </div>
                                <div className="flex gap-2">
                                    <strong>CPF/CNPJ:</strong>
                                    <span className="break-words">{contratoSelecionado.vigencia?.fiscal?.pessoa?.cpf || contratoSelecionado.vigencia?.fiscal?.pessoa?.cnpj || '-'}</span>
                                </div>
                                <div className="flex gap-2">
                                    <strong>Vigência:</strong>
                                    <span className="break-words">
                                        {contratoSelecionado.vigencia?.data_inicio
                                            ? `${contratoSelecionado.vigencia.data_inicio.split('-').reverse().join('/')} — ${contratoSelecionado.vigencia?.data_fim ? contratoSelecionado.vigencia.data_fim.split('-').reverse().join('/') : 'Vigente'}`
                                            : '-'}
                                    </span>
                                </div>
                                {portariaContrato && (
                                    <div className="flex gap-2">
                                        <strong>Portaria:</strong>
                                        <span className="break-words">{portariaContrato.titulo}</span>
                                    </div>
                                )}
                                {!portariaContrato && contratoSelecionado.portaria && (
                                    <div className="flex gap-2 text-gray-500">
                                        <strong>Portaria:</strong>
                                        <span className="break-words">Carregando...</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-between items-center w-full p-2">
                                <h2 className="text-md font-semibold mb-2">Documentos inclusos no contrato</h2>
                                <div className="flex gap-4 items-center">
                                    <div className="relative text-sm inline-block cursor-pointer">
                                        <label className="bg-azul_escuro text-white px-4 cursor-pointer py-2 rounded-md cursor-pointer hover:bg-laranja_escuro transition-all">
                                            Adicionar Documento
                                            <input
                                                onChange={(e) => handleCadastrarDocs(contratoSelecionado, e.target.files)}
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
                            {documentosContrato.length > 0 ? (
                                <table className="min-w-full bg-white shadow-md rounded-lg">
                                    <thead>
                                        <tr className="bg-azul_escuro bg-opacity-90 text-branco_cinza uppercase text-sm leading-normal">
                                            <th className="py-3 px-6 text-left">Título</th>
                                            <th className="py-3 px-6 text-left">Data de Inclusão</th>
                                            <th className="py-3 px-6 text-center">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-gray-800 text-sm font-light">
                                        {documentosContrato.map((doc) => (
                                            <tr key={doc.id} className="border-b border-gray-200 hover:bg-gray-100">
                                                <td className="py-3 px-6 text-left">{doc.titulo}</td>
                                                <td className="py-3 px-6 text-left">{formatarData(doc.created_at)}</td>
                                                <td className="py-3 px-6 text-center">
                                                    <button onClick={() => handleDownloadDoc(doc)} className="mr-2 text-azul_escuro hover:text-green-900 transition-colors">
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

            {editando && contratoSelecionado && (
                <Modal onClose={() => {
                    setEditando(false);
                    setTipoPrazoEntrega('dias');
                }} title={`Editar Contrato N°${contratoSelecionado.num_contrato}`} isOpen={editando}>
                    <form onSubmit={editarContrato} className="flex flex-col p-4 overflow-auto space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2 overflow-auto">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Número do Contrato
                                </label>
                                <input
                                    name="num_contrato"
                                    type="text"
                                    defaultValue={contratoSelecionado.num_contrato}
                                    className="p-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro focus:border-laranja_escuro transition-all shadow-sm bg-white"
                                    placeholder="Número do contrato"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Modalidade
                                </label>
                                <select
                                    name="modalidade"
                                    defaultValue={contratoSelecionado.modalidade?.id}
                                    className="p-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro focus:border-laranja_escuro transition-all shadow-sm bg-white"
                                >
                                    <option value="">Selecione uma modalidade</option>
                                    {listaModalidades.map((modalidade) => (
                                        <option key={modalidade.id} value={modalidade.id}>
                                            {modalidade.nome}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Seção
                                </label>
                                <select
                                    name="secao"
                                    defaultValue={contratoSelecionado.secao.id}
                                    className="p-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro focus:border-laranja_escuro transition-all shadow-sm bg-white"
                                >
                                    <option value="">Selecione uma seção</option>
                                    {listaSecoes.map((secao) => (
                                        <option key={secao.id} value={secao.id}>
                                            {secao.nome}
                                        </option>
                                    ))}
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
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tipo
                                </label>
                                <select
                                    name="tipo"
                                    defaultValue={contratoSelecionado.tipo}
                                    className="p-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro focus:border-laranja_escuro transition-all shadow-sm bg-white"
                                >
                                    <option value="">Selecione o tipo</option>
                                    <option value="contrato">Contrato</option>
                                    <option value="aditivo">Aditivo</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Situação
                                </label>
                                <select
                                    name="situacao"
                                    defaultValue={contratoSelecionado.situacao}
                                    className="p-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro focus:border-laranja_escuro transition-all shadow-sm bg-white"
                                >
                                    <option value="">Selecione a situação</option>
                                    <option value="vigente">Vigente</option>
                                    <option value="encerrado">Encerrado</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Data de Publicação
                                </label>
                                <input
                                    name="pub_date"
                                    type="date"
                                    defaultValue={contratoSelecionado.pub_date ? new Date(contratoSelecionado.pub_date).toISOString().split('T')[0] : ''}
                                    className="p-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro focus:border-laranja_escuro transition-all shadow-sm bg-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Data de Início
                                </label>
                                <input
                                    name="data_inicio"
                                    type="date"
                                    defaultValue={contratoSelecionado.data_inicio ? new Date(contratoSelecionado.data_inicio).toISOString().split('T')[0] : ''}
                                    className="p-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro focus:border-laranja_escuro transition-all shadow-sm bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Data de Vencimento
                                </label>
                                <input
                                    name="data_vencimento"
                                    type="date"
                                    defaultValue={contratoSelecionado.data_vencimento ? new Date(contratoSelecionado.data_vencimento).toISOString().split('T')[0] : ''}
                                    className="p-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro focus:border-laranja_escuro transition-all shadow-sm bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Prazo de Entrega
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        name="prazo_entrega"
                                        type="number"
                                        min="1"
                                        defaultValue={contratoSelecionado.prazo_entrega}
                                        className="p-3 border border-gray-300 rounded-lg flex-1 focus:outline-none focus:ring-2 focus:ring-laranja_escuro focus:border-laranja_escuro transition-all shadow-sm bg-white"
                                        placeholder="Ex: 30"
                                    />
                                    <select
                                        name="prazo_entrega_tipo"
                                        value={tipoPrazoEntrega}
                                        onChange={handlePrazoEntrega}
                                        className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-laranja_escuro focus:border-laranja_escuro transition-all shadow-sm bg-white min-w-[100px]"
                                    >
                                        <option value="dias">Dias</option>
                                        <option value="meses">Meses</option>
                                    </select>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    {tipoPrazoEntrega === 'meses' ?
                                        'Será convertido para dias (1 mês = 30 dias)' :
                                        'Prazo em dias para entrega'
                                    }
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Finalidade
                                </label>
                                <input
                                    name="finalidade"
                                    type="text"
                                    defaultValue={contratoSelecionado.finalidade}
                                    className="p-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro focus:border-laranja_escuro transition-all shadow-sm bg-white"
                                    placeholder="Finalidade do contrato"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Licitação
                                </label>
                                <ProcessoSelectField
                                    name="licitacao"
                                    searchUrl={`${acUrl}/licitacao/`}
                                    token={token}
                                    searchRelations={['orgao', 'modalidade']}
                                    initialValue={contratoSelecionado.licitacao?.id}
                                    placeholder="Selecione uma licitação"
                                    showModalidade={true}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Dispensa
                                </label>
                                <ProcessoSelectField
                                    name="dispensa"
                                    searchUrl={`${acUrl}/dispensa/`}
                                    token={token}
                                    searchRelations={['orgao']}
                                    initialValue={contratoSelecionado.dispensa?.id}
                                    placeholder="Selecione uma dispensa"
                                    showModalidade={false}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Fornecedor
                                </label>
                                <select
                                    name="fornecedor"
                                    defaultValue={contratoSelecionado.fornecedor}
                                    className="p-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro focus:border-laranja_escuro transition-all shadow-sm bg-white"
                                >
                                    <option value="">Selecione um fornecedor</option>
                                    {listaPessoasJuridicas.map((pessoa) => (
                                        <option key={pessoa.pessoa_id} value={pessoa.pessoa_id}>
                                            {pessoa.razao_social}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="md:col-span-2 rounded-xl border border-indigo-200 bg-indigo-50 p-4 flex flex-col gap-3">
                                <h3 className="text-xs font-semibold text-indigo-700 uppercase tracking-widest">Fiscal de Contrato</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-indigo-800 mb-1">Fiscal</label>
                                        <select
                                            value={fiscalEditSelecionado}
                                            onChange={handleFiscalEditChange}
                                            className="w-full p-3 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
                                        >
                                            <option value="">Selecione um fiscal</option>
                                            {listaFiscaisContrato.map((fiscal) => (
                                                <option key={fiscal.id} value={fiscal.id}>
                                                    {fiscal.pessoa.nome || fiscal.pessoa.razao_social}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-indigo-800 mb-1">Vigência</label>
                                        <select
                                            key={`vigencia-edit-${vigenciasEdit.length}-${fiscalEditSelecionado}`}
                                            name="vigencia"
                                            defaultValue={contratoSelecionado.vigencia?.id || ''}
                                            className="w-full p-3 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
                                        >
                                            <option value="">Selecione uma vigência</option>
                                            {vigenciasEdit.map((v) => (
                                                <option key={v.id} value={v.id}>
                                                    {v.data_inicio?.split('-').reverse().join('/')} — {v.data_fim ? v.data_fim.split('-').reverse().join('/') : 'Vigente'}
                                                </option>
                                            ))}
                                        </select>
                                        {fiscalEditSelecionado && vigenciasEdit.length === 0 && (
                                            <p className="text-xs text-indigo-500 mt-1">Nenhuma vigência para este fiscal.</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-indigo-800 mb-1">Portaria (opcional)</label>
                                        <select
                                            key={`portaria-edit-${portariasEdit.length}-${fiscalEditSelecionado}`}
                                            name="portaria"
                                            defaultValue={contratoSelecionado.portaria || ''}
                                            className="w-full p-3 border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
                                        >
                                            <option value="">Selecione uma portaria</option>
                                            {portariasEdit.map((p) => (
                                                <option key={p.id} value={p.id}>{p.titulo}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Observações
                                </label>
                                <textarea
                                    name="descricao"
                                    defaultValue={contratoSelecionado.descricao}
                                    className="p-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro focus:border-laranja_escuro transition-all shadow-sm bg-white"
                                    rows="3"
                                    placeholder="Observações do contrato"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Objeto
                                </label>
                                <textarea
                                    name="objeto"
                                    defaultValue={contratoSelecionado.objeto}
                                    className="p-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro focus:border-laranja_escuro transition-all shadow-sm bg-white"
                                    rows="4"
                                    placeholder="Objeto do contrato"
                                />
                            </div>
                        </div>



                        <div className="flex w-full mt-4">
                            <button
                                type="submit"
                                className="px-6 py-2 bg-azul_escuro w-full text-white rounded-lg hover:bg-laranja_escuro transition-all"
                            >
                                Salvar
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </section>
    )
}