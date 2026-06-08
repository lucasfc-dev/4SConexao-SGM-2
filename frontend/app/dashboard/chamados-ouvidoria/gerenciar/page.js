'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/context/AuthContext'
import Cookies from 'js-cookie'
import { MdSearch, MdFilterList, MdVisibility, MdEdit, MdAssignmentInd, MdMessage, MdClose, MdDownload, MdCheckCircle, MdCancel, MdGavel } from 'react-icons/md'
import { FiLoader } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'

const ouvidoriaUrl = process.env.NEXT_PUBLIC_OUVIDORIA_ENDPOINT_URL

export default function GerenciarChamados() {
    const { user } = useAuth()
    const token = Cookies.get('auth-token')
    const [loading, setLoading] = useState(true)
    const [chamados, setChamados] = useState([])
    const [filtros, setFiltros] = useState({
        busca: '',
        status: '',
        tipo: '',
        tipoResposta: '',
        dataInicio: '',
        dataFim: ''
    })
    const [showFiltros, setShowFiltros] = useState(false)
    const [paginaAtual, setPaginaAtual] = useState(1)
    const [selectedChamados, setSelectedChamados] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [chamadoSelecionado, setChamadoSelecionado] = useState(null)
    const [loadingAnexos, setLoadingAnexos] = useState(false)
    const [showRespostaModal, setShowRespostaModal] = useState(false)
    const [chamadoParaResposta, setChamadoParaResposta] = useState(null)
    const [respostaData, setRespostaData] = useState({
        resposta: '',
        tipoResposta: '', // 'deferido', 'indeferido'
        statusClassificacao: '', // 'nao_classificado', 'classificado', 'desclassificado'
        tipoClassificacao: '' // 'ultra_secreto', 'secreto', 'reservado', 'sem_classificacao'
    })
    const [anexosResposta, setAnexosResposta] = useState([])
    const [loadingResposta, setLoadingResposta] = useState(false)
    const [showClassificarModal, setShowClassificarModal] = useState(false)
    const [chamadoParaClassificar, setChamadoParaClassificar] = useState(null)
    const [tipoClassificacao, setTipoClassificacao] = useState('') // 'deferido' ou 'indeferido'
    const [respostaClassificacao, setRespostaClassificacao] = useState('')
    const [loadingClassificacao, setLoadingClassificacao] = useState(false)
    const [justificativaIndeferimento, setJustificativaIndeferimento] = useState('')
    const itensPorPagina = 10

    useEffect(() => {
        const fetchChamados = async () => {
            setLoading(true)
            try {
                const response = await fetch(`${ouvidoriaUrl}/chamado/estabelecimento/`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                })

                if (!response.ok) {
                    throw new Error('Erro ao buscar chamados')
                }

                const data = await response.json()
                console.log('Dados recebidos do backend:', data[0]) // Log para debug
                setChamados(data)
            } catch (error) {
                console.error('Erro ao buscar chamados:', error)
                // Fallback para dados simulados em caso de erro
                setChamados([])
            } finally {
                setLoading(false)
            }
        }

        if (token) {
            fetchChamados()
        }
    }, [token])

    const fetchChamadoDetalhes = async (chamadoId) => {
        try {
            setLoadingAnexos(true)
            const response = await fetch(`${ouvidoriaUrl}/chamado/${chamadoId}/`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                throw new Error('Erro ao buscar detalhes do chamado')
            }

            const data = await response.json()
            setChamadoSelecionado(data)
            setShowModal(true)
        } catch (error) {
            console.error('Erro ao buscar detalhes do chamado:', error)
        } finally {
            setLoadingAnexos(false)
        }
    }

    const downloadAnexo = async (anexoId, filename) => {
        try {
            const response = await fetch(`${ouvidoriaUrl}/docs/${anexoId}/content/`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (!response.ok) {
                throw new Error('Erro ao baixar anexo')
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = filename || 'anexo'
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Erro ao baixar anexo:', error)
        }
    }

    const abrirModalResposta = (chamado) => {
        setChamadoParaResposta(chamado)
        setRespostaData({
            resposta: '',
            tipoResposta: '',
            statusClassificacao: '',
            tipoClassificacao: ''
        })
        setAnexosResposta([])
        setShowModal(false) // Fecha o modal de detalhes se estiver aberto
        setShowRespostaModal(true)
    }

    const fecharModalResposta = () => {
        setShowRespostaModal(false)
        setChamadoParaResposta(null)
        setRespostaData({
            resposta: '',
            tipoResposta: '',
            statusClassificacao: '',
            tipoClassificacao: ''
        })
        setAnexosResposta([])
    }

    const handleRespostaChange = (e) => {
        setRespostaData(prev => ({
            ...prev,
            resposta: e.target.value
        }))
    }

    const handleTipoRespostaChange = (e) => {
        setRespostaData(prev => ({
            ...prev,
            tipoResposta: e.target.value
        }))
    }

    const handleClassificacaoChange = (e) => {
        setRespostaData(prev => ({
            ...prev,
            tipoClassificacao: e.target.value
        }))
    }

    const handleStatusClassificacaoChange = (e) => {
        setRespostaData(prev => ({
            ...prev,
            statusClassificacao: e.target.value,
            tipoClassificacao: '' // Reset tipo when changing status
        }))
    }

    const handleAnexosChange = (e) => {
        const files = Array.from(e.target.files)
        setAnexosResposta(files)
    }

    const removeAnexo = (index) => {
        setAnexosResposta(prev => prev.filter((_, i) => i !== index))
    }

    const enviarResposta = async () => {
        if (!respostaData.resposta.trim()) {
            alert('Por favor, digite uma resposta.')
            return
        }

        const isInformacao = chamadoParaResposta.tipo_abertura === 'informacao'
        
        // tipoResposta (Deferir/Indeferir) é sempre obrigatório
        if (!respostaData.tipoResposta) {
            alert('Por favor, selecione se deseja deferir ou indeferir o chamado.')
            return
        }

        // Validação específica para classificação
        if (respostaData.statusClassificacao === 'classificado' && !respostaData.tipoClassificacao) {
            alert('Por favor, selecione o tipo de classificação.')
            return
        }

        setLoadingResposta(true)
        try {
            const formData = new FormData()
            formData.append('resposta', respostaData.resposta)
            formData.append('tipo_resposta', respostaData.tipoResposta)
            
            // Para chamados do tipo informação, pode adicionar status_classificacao
            if (isInformacao && respostaData.statusClassificacao) {
                formData.append('status_classificacao', respostaData.statusClassificacao)
                // Se for classificado, adiciona o tipo de classificação
                if (respostaData.statusClassificacao === 'classificado' && respostaData.tipoClassificacao) {
                    formData.append('tipo_classificacao', respostaData.tipoClassificacao)
                }
            } else {
                // Define status_classificacao como nao_classificado se não especificado
                formData.append('status_classificacao', 'nao_classificado')
            }

            // Adiciona anexos se existirem
            anexosResposta.forEach((anexo, index) => {
                formData.append('anexos', anexo)
            })

            const response = await fetch(`${ouvidoriaUrl}/retorno_chamado/${chamadoParaResposta.id}/encerrar/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // Não incluir Content-Type para que o browser defina automaticamente com boundary
                },
                body: formData
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.detail || 'Erro ao processar resposta')
            }

            const result = await response.json()
            let actionText = 'Chamado processado'
            
            // Determina a mensagem baseada na ação tomada
            if (respostaData.tipoResposta) {
                const actionTexts = {
                    'deferido': 'Chamado deferido',
                    'indeferido': 'Chamado indeferido'
                }
                actionText = actionTexts[respostaData.tipoResposta] || 'Chamado processado'
            } else if (respostaData.statusClassificacao) {
                const actionTexts = {
                    'classificado': 'Chamado classificado',
                    'desclassificado': 'Chamado desclassificado'
                }
                actionText = actionTexts[respostaData.statusClassificacao] || 'Chamado processado'
            }
            
            alert(`${actionText} com sucesso!`)
            
            // Atualiza a lista de chamados
            const updatedChamados = chamados.map(chamado => 
                chamado.id === chamadoParaResposta.id 
                    ? { 
                        ...chamado, 
                        status: 'encerrado', 
                        tipo_resposta: respostaData.tipoResposta || null,
                        status_classificacao: respostaData.statusClassificacao || 'nao_classificado',
                        tipo_classificacao: respostaData.tipoClassificacao || null
                    }
                    : chamado
            )
            setChamados(updatedChamados)
            
            fecharModalResposta()
        } catch (error) {
            console.error('Erro ao processar resposta:', error)
            alert(error.message || 'Erro ao processar resposta. Tente novamente.')
        } finally {
            setLoadingResposta(false)
        }
    }

    const abrirModalClassificar = (chamado, tipo) => {
        setChamadoParaClassificar(chamado)
        setTipoClassificacao(tipo)
        setRespostaClassificacao('')
        setShowModal(false) // Fecha o modal de detalhes se estiver aberto
        setShowClassificarModal(true)
    }

    const fecharModalClassificar = () => {
        setShowClassificarModal(false)
        setChamadoParaClassificar(null)
        setTipoClassificacao('')
        setRespostaClassificacao('')
        setJustificativaIndeferimento('')
    }

    const deferir = async () => {
        if (!respostaClassificacao.trim()) {
            alert('Por favor, digite a resposta para o deferimento.')
            return
        }

        setLoadingClassificacao(true)
        try {
            const response = await fetch(`${ouvidoriaUrl}/retorno_chamado/${chamadoParaClassificar.id}/encerrar/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    resposta: respostaClassificacao,
                    tipo_resposta: 'deferido'
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.detail || 'Erro ao deferir chamado')
            }

            const result = await response.json()
            alert('Chamado deferido com sucesso!')
            
            // Atualiza a lista de chamados
            const updatedChamados = chamados.map(chamado => 
                chamado.id === chamadoParaClassificar.id 
                    ? { ...chamado, status: 'encerrado', tipo_resposta: 'deferido' }
                    : chamado
            )
            setChamados(updatedChamados)
            
            fecharModalClassificar()
        } catch (error) {
            console.error('Erro ao deferir chamado:', error)
            alert(error.message || 'Erro ao deferir chamado. Tente novamente.')
        } finally {
            setLoadingClassificacao(false)
        }
    }

    const indeferir = async () => {
        if (!respostaClassificacao.trim()) {
            alert('Por favor, digite a justificativa para o indeferimento.')
            return
        }

        setLoadingClassificacao(true)
        try {
            const response = await fetch(`${ouvidoriaUrl}/retorno_chamado/${chamadoParaClassificar.id}/encerrar/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    resposta: respostaClassificacao,
                    tipo_resposta: 'indeferido'
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.detail || 'Erro ao indeferir chamado')
            }

            const result = await response.json()
            alert('Chamado indeferido com sucesso!')
            
            // Atualiza a lista de chamados
            const updatedChamados = chamados.map(chamado => 
                chamado.id === chamadoParaClassificar.id 
                    ? { ...chamado, status: 'encerrado', tipo_resposta: 'indeferido' }
                    : chamado
            )
            setChamados(updatedChamados)
            
            fecharModalClassificar()
        } catch (error) {
            console.error('Erro ao indeferir chamado:', error)
            alert(error.message || 'Erro ao indeferir chamado. Tente novamente.')
        } finally {
            setLoadingClassificacao(false)
        }
    }

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'pendente': return 'text-yellow-800 bg-yellow-100 border-yellow-200'
            case 'encerrado': return 'text-gray-800 bg-gray-100 border-gray-200'
            default: return 'text-gray-800 bg-gray-100 border-gray-200'
        }
    }

    const getStatusText = (status) => {
        switch (status?.toLowerCase()) {
            case 'pendente': return 'Pendente'
            case 'encerrado': return 'Encerrado'
            default: return status?.charAt(0)?.toUpperCase() + status?.slice(1) || 'Status não definido'
        }
    }

    const getTipoAberturaText = (tipo) => {
        switch (tipo?.toLowerCase()) {
            case 'informacao': return 'Informação'
            case 'elogio': return 'Elogio'
            case 'sugestao': return 'Sugestão'
            case 'reclamacao': return 'Reclamação'
            case 'comunicacao': return 'Comunicação'
            case 'irregularidade': return 'Irregularidade'
            case 'denuncia': return 'Denúncia'
            case 'representacao': return 'Representação'
            case 'demanda': return 'Demanda'
            case 'critica': return 'Crítica'
            default: return tipo?.charAt(0)?.toUpperCase() + tipo?.slice(1) || '-'
        }
    }

    const getTipoAberturaColor = (tipo) => {
        switch (tipo?.toLowerCase()) {
            case 'informacao': return 'text-blue-800 bg-blue-100 border-blue-200'
            case 'elogio': return 'text-green-800 bg-green-100 border-green-200'
            case 'sugestao': return 'text-purple-800 bg-purple-100 border-purple-200'
            case 'reclamacao': return 'text-red-800 bg-red-100 border-red-200'
            case 'comunicacao': return 'text-indigo-800 bg-indigo-100 border-indigo-200'
            case 'irregularidade': return 'text-orange-800 bg-orange-100 border-orange-200'
            case 'denuncia': return 'text-red-900 bg-red-200 border-red-300'
            case 'representacao': return 'text-teal-800 bg-teal-100 border-teal-200'
            case 'demanda': return 'text-cyan-800 bg-cyan-100 border-cyan-200'
            case 'critica': return 'text-pink-800 bg-pink-100 border-pink-200'
            default: return 'text-gray-800 bg-gray-100 border-gray-200'
        }
    }

    const handleFiltroChange = (e) => {
        const { name, value } = e.target
        setFiltros(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSelectChamado = (id) => {
        setSelectedChamados(prev => 
            prev.includes(id) 
                ? prev.filter(chamadoId => chamadoId !== id)
                : [...prev, id]
        )
    }

    const handleSelectAll = () => {
        if (selectedChamados.length === chamadosPaginados.length) {
            setSelectedChamados([])
        } else {
            setSelectedChamados(chamadosPaginados.map(chamado => chamado.id))
        }
    }

    const formatarData = (dataString) => {
        if (!dataString) return ''
        return String(dataString).split('-').reverse().join('/')
    }

    function capitalizeString(string){
        const capitalizedString = string.charAt(0).toUpperCase() + string.slice(1)
        return capitalizedString
    }

    const chamadosFiltrados = chamados.filter(chamado => {
        const solicitante = chamado.identificacao?.nome || 'Anônimo'
        return (
            (!filtros.busca || 
             chamado.num_protocolo?.toLowerCase().includes(filtros.busca.toLowerCase()) ||
             chamado.assunto?.toLowerCase().includes(filtros.busca.toLowerCase()) ||
             chamado.tipo_abertura?.toLowerCase().includes(filtros.busca.toLowerCase()) ||
             solicitante.toLowerCase().includes(filtros.busca.toLowerCase())) &&
            (!filtros.status || chamado.status?.toLowerCase() === filtros.status.toLowerCase()) &&
            (!filtros.tipo || chamado.tipo_abertura?.toLowerCase() === filtros.tipo.toLowerCase()) &&
            (!filtros.tipoResposta || chamado.tipo_resposta?.toLowerCase() === filtros.tipoResposta.toLowerCase()) &&
            (!filtros.dataInicio || chamado.data_envio >= filtros.dataInicio) &&
            (!filtros.dataFim || chamado.data_envio <= filtros.dataFim)
        )
    })

    const totalPaginas = Math.ceil(chamadosFiltrados.length / itensPorPagina)
    const indiceInicial = (paginaAtual - 1) * itensPorPagina
    const indiceFinal = indiceInicial + itensPorPagina
    const chamadosPaginados = chamadosFiltrados.slice(indiceInicial, indiceFinal)

    const limparFiltros = () => {
        setFiltros({
            busca: '',
            status: '',
            tipo: '',
            tipoResposta: '',
            dataInicio: '',
            dataFim: ''
        })
        setPaginaAtual(1)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center flex-grow bg-branco_cinza">
                <FiLoader className="animate-spin text-4xl text-azul_escuro" />
            </div>
        )
    }

    return (
        <section className="flex flex-col flex-grow bg-branco_cinza overflow-auto text-azul_escuro p-4 md:p-8">
            {/* Header */}
            <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-azul_escuro">Gerenciar Chamados</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {chamados.length}{' '}{chamados.length === 1 ? 'chamado cadastrado' : 'chamados cadastrados'}
                    </p>
                </div>
                <button
                    onClick={() => setShowFiltros(!showFiltros)}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm rounded-lg shadow transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
                        showFiltros
                            ? 'bg-azul_escuro text-white focus:ring-azul_escuro'
                            : 'bg-white border border-gray-200 text-azul_escuro hover:bg-gray-50 focus:ring-azul_escuro'
                    }`}
                >
                    <MdFilterList />
                    {showFiltros ? 'Ocultar Filtros' : 'Filtros'}
                </button>
            </div>

            {/* Search */}
            <div className="relative mb-4">
                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    name="busca"
                    value={filtros.busca}
                    onChange={handleFiltroChange}
                    placeholder="Buscar por protocolo, assunto ou solicitante..."
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-azul_escuro placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-azul_escuro focus:ring-opacity-30"
                />
            </div>

            {/* Filtros Avançados */}
            <AnimatePresence>
            {showFiltros && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="mb-4 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
                >
                    {/* Header do painel de filtros */}
                    <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                        <div className="flex items-center gap-2 text-azul_escuro">
                            <MdFilterList size={18} />
                            <span className="text-sm font-semibold">Filtros avançados</span>
                            {(filtros.status || filtros.tipo || filtros.tipoResposta || filtros.dataInicio || filtros.dataFim) && (
                                <span className="bg-laranja_escuro text-white text-xs px-2 py-0.5 rounded-full font-medium">
                                    ativos
                                </span>
                            )}
                        </div>
                        <button
                            onClick={limparFiltros}
                            className="text-xs text-gray-400 hover:text-azul_escuro transition-colors"
                        >
                            Limpar tudo
                        </button>
                    </div>

                    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {/* Status */}
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</label>
                            <select
                                name="status"
                                value={filtros.status}
                                onChange={handleFiltroChange}
                                className={`w-full px-3 py-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-azul_escuro focus:ring-opacity-30 transition-colors ${
                                    filtros.status ? 'border-azul_escuro text-azul_escuro font-medium' : 'border-gray-200 text-gray-600'
                                }`}
                            >
                                <option value="">Todos</option>
                                <option value="pendente">Pendente</option>
                                <option value="encerrado">Encerrado</option>
                            </select>
                        </div>

                        {/* Tipo Resposta */}
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Resposta</label>
                            <select
                                name="tipoResposta"
                                value={filtros.tipoResposta}
                                onChange={handleFiltroChange}
                                className={`w-full px-3 py-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-azul_escuro focus:ring-opacity-30 transition-colors ${
                                    filtros.tipoResposta ? 'border-azul_escuro text-azul_escuro font-medium' : 'border-gray-200 text-gray-600'
                                }`}
                            >
                                <option value="">Todos</option>
                                <option value="deferido">Deferido</option>
                                <option value="indeferido">Indeferido</option>
                            </select>
                        </div>

                        {/* Tipo Abertura */}
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo</label>
                            <select
                                name="tipo"
                                value={filtros.tipo}
                                onChange={handleFiltroChange}
                                className={`w-full px-3 py-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-azul_escuro focus:ring-opacity-30 transition-colors ${
                                    filtros.tipo ? 'border-azul_escuro text-azul_escuro font-medium' : 'border-gray-200 text-gray-600'
                                }`}
                            >
                                <option value="">Todos</option>
                                <option value="informacao">Informação</option>
                                <option value="elogio">Elogio</option>
                                <option value="sugestao">Sugestão</option>
                                <option value="reclamacao">Reclamação</option>
                                <option value="comunicacao">Comunicação</option>
                                <option value="irregularidade">Irregularidade</option>
                                <option value="denuncia">Denúncia</option>
                                <option value="representacao">Representação</option>
                                <option value="demanda">Demanda</option>
                                <option value="critica">Crítica</option>
                            </select>
                        </div>

                        {/* Data Início */}
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">De</label>
                            <input
                                type="date"
                                name="dataInicio"
                                value={filtros.dataInicio}
                                onChange={handleFiltroChange}
                                className={`w-full px-3 py-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-azul_escuro focus:ring-opacity-30 transition-colors ${
                                    filtros.dataInicio ? 'border-azul_escuro text-azul_escuro font-medium' : 'border-gray-200 text-gray-600'
                                }`}
                            />
                        </div>

                        {/* Data Fim */}
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Até</label>
                            <input
                                type="date"
                                name="dataFim"
                                value={filtros.dataFim}
                                onChange={handleFiltroChange}
                                className={`w-full px-3 py-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-azul_escuro focus:ring-opacity-30 transition-colors ${
                                    filtros.dataFim ? 'border-azul_escuro text-azul_escuro font-medium' : 'border-gray-200 text-gray-600'
                                }`}
                            />
                        </div>
                    </div>
                </motion.div>
            )}
            </AnimatePresence>

            {/* Tabela */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="bg-azul_escuro bg-opacity-90 text-branco_cinza uppercase text-xs">
                                <th className="py-3 px-4 text-left font-medium w-10">
                                    <input
                                        type="checkbox"
                                        checked={selectedChamados.length === chamadosPaginados.length && chamadosPaginados.length > 0}
                                        onChange={handleSelectAll}
                                        className="h-4 w-4 rounded border-gray-300"
                                    />
                                </th>
                                <th className="py-3 px-4 text-left font-medium">Protocolo</th>
                                <th className="py-3 px-4 text-left font-medium">Solicitante / Assunto</th>
                                <th className="py-3 px-4 text-left font-medium">Tipo</th>
                                <th className="py-3 px-4 text-left font-medium">Status</th>
                                <th className="py-3 px-4 text-left font-medium">Resposta</th>
                                <th className="py-3 px-4 text-left font-medium">Data</th>
                                <th className="py-3 px-4 text-center font-medium">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            <AnimatePresence>
                            {chamadosPaginados.map((chamado, i) => (
                                <motion.tr
                                    key={chamado.id}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.03, duration: 0.2 }}
                                    className="hover:bg-gray-50 transition-colors"
                                >
                                    <td className="py-3 px-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedChamados.includes(chamado.id)}
                                            onChange={() => handleSelectChamado(chamado.id)}
                                            className="h-4 w-4 rounded border-gray-300"
                                        />
                                    </td>
                                    <td className="py-3 px-4 font-medium text-azul_escuro whitespace-nowrap">
                                        {chamado.num_protocolo}
                                    </td>
                                    <td className="py-3 px-4">
                                        <p className="font-medium text-azul_escuro">{chamado.identificacao?.nome || 'Anônimo'}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{chamado.assunto}</p>
                                    </td>
                                    <td className="py-3 px-4 whitespace-nowrap">
                                        <span className={`text-xs px-2 py-1 rounded-full border ${getTipoAberturaColor(chamado.tipo_abertura)}`}>
                                            {getTipoAberturaText(chamado.tipo_abertura)}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 whitespace-nowrap">
                                        <span className={`text-xs px-2 py-1 rounded-full border ${
                                            chamado.status?.toLowerCase() === 'encerrado'
                                                ? 'text-gray-600 bg-gray-100 border-gray-200'
                                                : 'text-yellow-800 bg-yellow-100 border-yellow-200'
                                        }`}>
                                            {chamado.status?.charAt(0)?.toUpperCase() + chamado.status?.slice(1) || '—'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 whitespace-nowrap">
                                        {chamado.status?.toLowerCase() === 'encerrado' && chamado.tipo_resposta ? (
                                            <span className={`text-xs px-2 py-1 rounded-full border ${
                                                chamado.tipo_resposta?.toLowerCase() === 'deferido'
                                                    ? 'text-emerald-800 bg-emerald-100 border-emerald-200'
                                                    : 'text-red-800 bg-red-100 border-red-200'
                                            }`}>
                                                {chamado.tipo_resposta?.charAt(0)?.toUpperCase() + chamado.tipo_resposta?.slice(1)}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-gray-400">—</span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                                        {formatarData(chamado.data_envio)}
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center justify-center gap-3">
                                            <button
                                                onClick={() => fetchChamadoDetalhes(chamado.id)}
                                                className="text-azul_escuro hover:text-azul_claro transition-colors"
                                                title="Visualizar"
                                            >
                                                <MdVisibility size={20} />
                                            </button>
                                            <button
                                                onClick={() => abrirModalResposta(chamado)}
                                                className={`transition-colors ${
                                                    chamado.status?.toLowerCase() === 'encerrado'
                                                        ? 'text-gray-300 cursor-not-allowed'
                                                        : 'text-emerald-600 hover:text-emerald-800'
                                                }`}
                                                title={
                                                    chamado.status?.toLowerCase() === 'encerrado'
                                                        ? `Já encerrado (${chamado.tipo_resposta || 'finalizado'})`
                                                        : 'Encerrar chamado'
                                                }
                                                disabled={chamado.status?.toLowerCase() === 'encerrado'}
                                            >
                                                <MdMessage size={20} />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {/* Paginação */}
                {totalPaginas > 1 && (
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                            Mostrando {indiceInicial + 1}–{Math.min(indiceFinal, chamadosFiltrados.length)} de {chamadosFiltrados.length}
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPaginaAtual(Math.max(1, paginaAtual - 1))}
                                disabled={paginaAtual === 1}
                                className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                Anterior
                            </button>
                            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(pagina => (
                                <button
                                    key={pagina}
                                    onClick={() => setPaginaAtual(pagina)}
                                    className={`px-3 py-1 rounded-lg transition-colors ${
                                        pagina === paginaAtual
                                            ? 'bg-azul_escuro text-white'
                                            : 'border border-gray-200 hover:bg-gray-100'
                                    }`}
                                >
                                    {pagina}
                                </button>
                            ))}
                            <button
                                onClick={() => setPaginaAtual(Math.min(totalPaginas, paginaAtual + 1))}
                                disabled={paginaAtual === totalPaginas}
                                className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                Próxima
                            </button>
                        </div>
                    </div>
                )}

                {/* Vazio */}
                {chamadosFiltrados.length === 0 && (
                    <div className="py-16 text-center text-gray-400">
                        <MdAssignmentInd className="mx-auto text-4xl mb-2 opacity-40" />
                        <p className="text-sm">
                            {filtros.busca || filtros.status || filtros.tipo
                                ? 'Nenhum chamado encontrado com esses filtros.'
                                : 'Não há chamados para gerenciar no momento.'
                            }
                        </p>
                    </div>
                )}
            </div>

            {/* Modal de Visualização de Chamado */}
            {showModal && chamadoSelecionado && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Header da Modal */}
                        <div className="flex justify-between items-center bg-azul_escuro text-white px-5 py-3 rounded-t-xl">
                            <div>
                                <h2 className="text-lg font-bold">{chamadoSelecionado.num_protocolo}</h2>
                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-0.5 ${getStatusColor(chamadoSelecionado.status)}`}>
                                    {getStatusText(chamadoSelecionado.status)}
                                </span>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-white hover:text-gray-200 transition-colors"
                            >
                                <MdClose size={22} />
                            </button>
                        </div>

                        {/* Conteúdo da Modal */}
                        <div className="p-6 space-y-6">
                            {/* Informações Básicas */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações do Chamado</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <span className="text-sm font-medium text-gray-500">Tipo:</span>
                                            <p className="text-gray-900">{capitalizeString(chamadoSelecionado.tipo_abertura)}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-gray-500">Assunto:</span>
                                            <p className="text-gray-900">{chamadoSelecionado.assunto}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-gray-500">Data de Envio:</span>
                                            <p className="text-gray-900">{formatarData(chamadoSelecionado.data_envio)}</p>
                                        </div>
                                        {chamadoSelecionado.tipo_resposta && (
                                            <div>
                                                <span className="text-sm font-medium text-gray-500">Tipo de Resposta:</span>
                                                <p className={`inline-block ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                                                    chamadoSelecionado.tipo_resposta === 'deferido' 
                                                        ? 'bg-emerald-100 text-emerald-800' 
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {chamadoSelecionado.tipo_resposta === 'deferido' ? 'Deferido' : 'Indeferido'}
                                                </p>
                                            </div>
                                        )}
                                        {chamadoSelecionado.status_classificacao && chamadoSelecionado.status_classificacao !== 'nao_classificado' && (
                                            <div>
                                                <span className="text-sm font-medium text-gray-500">Status de Classificação:</span>
                                                <p className={`inline-block ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                                                    chamadoSelecionado.status_classificacao === 'classificado' 
                                                        ? 'bg-blue-100 text-blue-800' 
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {chamadoSelecionado.status_classificacao === 'classificado' ? 'Classificado' : 'Desclassificado'}
                                                </p>
                                            </div>
                                        )}
                                        {chamadoSelecionado.tipo_classificacao && (
                                            <div>
                                                <span className="text-sm font-medium text-gray-500">Tipo de Classificação:</span>
                                                <p className="text-gray-900">
                                                    {chamadoSelecionado.tipo_classificacao === 'ultra_secreto' ? 'Ultra Secreto' :
                                                     chamadoSelecionado.tipo_classificacao === 'secreto' ? 'Secreto' :
                                                     chamadoSelecionado.tipo_classificacao === 'reservado' ? 'Reservado' :
                                                     chamadoSelecionado.tipo_classificacao}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {chamadoSelecionado.identificacao && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados do Solicitante</h3>
                                        <div className="space-y-3">
                                            <div>
                                                <span className="text-sm font-medium text-gray-500">Nome:</span>
                                                <p className="text-gray-900">{chamadoSelecionado.identificacao.nome}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm font-medium text-gray-500">E-mail:</span>
                                                <p className="text-gray-900">{chamadoSelecionado.identificacao.email}</p>
                                            </div>
                                            {chamadoSelecionado.identificacao.telefone && (
                                                <div>
                                                    <span className="text-sm font-medium text-gray-500">Telefone:</span>
                                                    <p className="text-gray-900">{chamadoSelecionado.identificacao.telefone}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Descrição */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Descrição</h3>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-gray-900 whitespace-pre-wrap">{chamadoSelecionado.descricao}</p>
                                </div>
                            </div>

                            {/* Anexos */}
                            {chamadoSelecionado.anexos && chamadoSelecionado.anexos.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Anexos</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {chamadoSelecionado.anexos.map((anexo) => (
                                            <div
                                                key={anexo.id}
                                                className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {anexo.filename || 'Arquivo sem nome'}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {anexo.tipo}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => downloadAnexo(anexo.id, anexo.filename)}
                                                        className="ml-2 text-azul_escuro hover:text-azul_claro"
                                                        title="Baixar arquivo"
                                                    >
                                                        <MdDownload />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Respostas */}
                            {chamadoSelecionado.retornos && chamadoSelecionado.retornos.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Respostas</h3>
                                    <div className="space-y-4">
                                        {chamadoSelecionado.retornos.map((retorno, index) => (
                                            <div
                                                key={retorno.id}
                                                className="bg-green-50 border border-green-200 rounded-lg p-4"
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <h4 className="text-md font-semibold text-green-800">
                                                        Resposta #{index + 1}
                                                    </h4>
                                                    <span className="text-sm text-green-600">
                                                        {new Date(retorno.created_at).toLocaleDateString('pt-BR', {
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                                
                                                <div className="mb-3">
                                                    <p className="text-gray-900 whitespace-pre-wrap">
                                                        {retorno.mensagem}
                                                    </p>
                                                </div>

                                                {/* Anexos da resposta */}
                                                {retorno.anexos && retorno.anexos.length > 0 && (
                                                    <div>
                                                        <h5 className="text-sm font-medium text-green-700 mb-2">
                                                            Anexos da Resposta:
                                                        </h5>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                            {retorno.anexos.map((anexo) => (
                                                                <div
                                                                    key={anexo.id}
                                                                    className="bg-white border border-green-200 rounded p-2 hover:bg-green-25 transition-colors"
                                                                >
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-xs font-medium text-gray-900 truncate">
                                                                                {anexo.filename || 'Arquivo sem nome'}
                                                                            </p>
                                                                            <p className="text-xs text-gray-500">
                                                                                {anexo.tipo}
                                                                            </p>
                                                                        </div>
                                                                        <button
                                                                            onClick={() => downloadAnexo(anexo.id, anexo.filename)}
                                                                            className="ml-2 text-green-600 hover:text-green-800"
                                                                            title="Baixar arquivo"
                                                                        >
                                                                            <MdDownload className="text-sm" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {loadingAnexos && (
                                <div className="flex items-center justify-center py-4">
                                    <FiLoader className="animate-spin text-2xl text-azul_escuro" />
                                    <span className="ml-2 text-gray-600">Carregando anexos...</span>
                                </div>
                            )}
                        </div>

                        {/* Footer da Modal */}
                        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                Fechar
                            </button>
                            
                            {/* Botão Encerrar - apenas se ainda não foi encerrado */}
                            {chamadoSelecionado.status?.toLowerCase() === 'pendente' && (
                                <button
                                    onClick={() => abrirModalResposta(chamadoSelecionado)}
                                    className="px-4 py-2 bg-azul_escuro text-white rounded-lg hover:bg-blue-800 transition-colors"
                                >
                                    Encerrar Chamado
                                </button>
                            )}



                            {/* Indicador de status final */}
                            {chamadoSelecionado.status?.toLowerCase() === 'encerrado' && chamadoSelecionado.tipo_resposta && (
                                <div className="flex items-center gap-2 px-4 py-2">
                                    <MdGavel className="text-gray-500" />
                                    <span className="text-gray-600">
                                        Chamado {chamadoSelecionado.tipo_resposta}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Resposta ao Chamado */}
            {showRespostaModal && chamadoParaResposta && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Header da Modal */}
                        <div className="flex justify-between items-center bg-azul_escuro text-white px-5 py-3 rounded-t-xl">
                            <div>
                                <h2 className="text-lg font-bold">Encerrar Chamado</h2>
                                <p className="text-xs text-blue-200 mt-0.5">Protocolo: {chamadoParaResposta.num_protocolo}</p>
                            </div>
                            <button
                                onClick={fecharModalResposta}
                                className="text-white hover:text-gray-200 transition-colors"
                            >
                                <MdClose />
                            </button>
                        </div>

                        {/* Conteúdo da Modal */}
                        <div className="p-6 space-y-6">
                            {/* Informações do Chamado */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-gray-900 mb-2">Informações do Chamado</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="font-medium text-gray-600">Tipo:</span>
                                        <p className="text-gray-900">{capitalizeString(chamadoParaResposta.tipo_abertura)}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-600">Assunto:</span>
                                        <p className="text-gray-900">{chamadoParaResposta.assunto}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-600">Solicitante:</span>
                                        <p className="text-gray-900">{chamadoParaResposta.identificacao?.nome || 'Anônimo'}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-600">Status:</span>
                                        <span className={`inline-block px-2 py-1 rounded-full text-xs ${getStatusColor(chamadoParaResposta.status)}`}>
                                            {getStatusText(chamadoParaResposta.status)}
                                        </span>
                                    </div>
                                </div>
                            </div>

            {/* Tipo de Decisão */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Decisão do Chamado <span className="text-red-500">*</span>
                </label>
                
                {/* Para informação: deferir/indeferir obrigatório + pode adicionar classificação */}
                {chamadoParaResposta.tipo_abertura === 'informacao' ? (
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Deferir/Indeferir <span className="text-red-500">*</span></label>
                            <select
                                value={respostaData.tipoResposta}
                                onChange={handleTipoRespostaChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-azul_escuro focus:border-azul_escuro"
                                required
                            >
                                <option value="">Selecione a decisão</option>
                                <option value="deferido">Deferir</option>
                                <option value="indeferido">Indeferir</option>
                            </select>
                        </div>
                        
                        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                            <label className="block text-xs font-medium text-blue-900 mb-2">
                                Classificação Adicional (Opcional)
                            </label>
                            <p className="text-xs text-blue-700 mb-2">
                                Você pode adicionar uma classificação de sigilo ao chamado:
                            </p>
                            <select
                                value={respostaData.statusClassificacao}
                                onChange={handleStatusClassificacaoChange}
                                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-azul_escuro focus:border-azul_escuro bg-white"
                            >
                                <option value="">Sem classificação</option>
                                <option value="classificado">Classificar</option>
                                <option value="desclassificado">Desclassificar</option>
                            </select>
                        </div>
                    </div>
                ) : (
                    <select
                        value={respostaData.tipoResposta}
                        onChange={handleTipoRespostaChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-azul_escuro focus:border-azul_escuro"
                        required
                    >
                        <option value="">Selecione a decisão</option>
                        <option value="deferido">Deferir</option>
                        <option value="indeferido">Indeferir</option>
                    </select>
                )}

                {/* Campo de Classificação - apenas para chamados do tipo informação classificados */}
                {respostaData.statusClassificacao === 'classificado' && (
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tipo de Classificação <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={respostaData.tipoClassificacao}
                            onChange={handleClassificacaoChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-azul_escuro focus:border-azul_escuro"
                            required
                        >
                            <option value="">Selecione a classificação</option>
                            <option value="ultra_secreto">Ultra Secreto</option>
                            <option value="secreto">Secreto</option>
                            <option value="reservado">Reservado</option>
                        </select>
                    </div>
                )}

                {/* Informação sobre a decisão selecionada */}
                {(respostaData.tipoResposta || respostaData.statusClassificacao) && (
                    <div className={`mt-2 p-3 rounded-lg text-sm ${
                        ['deferido', 'classificado'].includes(respostaData.tipoResposta || respostaData.statusClassificacao)
                            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                            : 'bg-red-50 border border-red-200 text-red-800'
                    }`}>
                        {(respostaData.tipoResposta === 'deferido') ? (
                            <div className="flex items-start gap-2">
                                <MdCheckCircle className="mt-0.5 text-emerald-600" />
                                <div>
                                    <p className="font-medium">Deferimento</p>
                                    <p>O chamado será encerrado como deferido.</p>
                                </div>
                            </div>
                        ) : respostaData.tipoResposta === 'indeferido' ? (
                            <div className="flex items-start gap-2">
                                <MdCancel className="mt-0.5 text-red-600" />
                                <div>
                                    <p className="font-medium">Indeferimento</p>
                                    <p>O chamado será encerrado como indeferido.</p>
                                </div>
                            </div>
                        ) : respostaData.statusClassificacao === 'classificado' ? (
                            <div className="flex items-start gap-2">
                                <MdCheckCircle className="mt-0.5 text-emerald-600" />
                                <div>
                                    <p className="font-medium">Classificação</p>
                                    <p>O chamado será encerrado como classificado.</p>
                                </div>
                            </div>
                        ) : respostaData.statusClassificacao === 'desclassificado' ? (
                            <div className="flex items-start gap-2">
                                <MdCancel className="mt-0.5 text-red-600" />
                                <div>
                                    <p className="font-medium">Desclassificação</p>
                                    <p>O chamado será encerrado como desclassificado.</p>
                                </div>
                            </div>
                        ) : null}
                    </div>
                )}
                            </div>

                            {/* Campo de Resposta */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {respostaData.tipoResposta === 'deferido' ? 'Resposta do Deferimento' :
                                     respostaData.tipoResposta === 'indeferido' ? 'Justificativa do Indeferimento' :
                                     respostaData.statusClassificacao === 'classificado' ? 'Resposta da Classificação' :
                                     respostaData.statusClassificacao === 'desclassificado' ? 'Justificativa da Desclassificação' :
                                     'Resposta'} <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={respostaData.resposta}
                                    onChange={handleRespostaChange}
                                    rows={6}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-azul_escuro focus:border-azul_escuro resize-none"
                                    placeholder={
                                        respostaData.tipoResposta === 'deferido' ? 'Digite a resposta para o deferimento...' :
                                        respostaData.tipoResposta === 'indeferido' ? 'Digite a justificativa para o indeferimento...' :
                                        respostaData.statusClassificacao === 'classificado' ? 'Digite a resposta para a classificação...' :
                                        respostaData.statusClassificacao === 'desclassificado' ? 'Digite a justificativa para a desclassificação...' :
                                        'Digite sua resposta ao chamado...'
                                    }
                                    required
                                />
                            </div>

                            {/* Anexos da Resposta */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Anexos da Resposta (Opcional)
                                </label>
                                <input
                                    type="file"
                                    multiple
                                    onChange={handleAnexosChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-azul_escuro focus:border-azul_escuro"
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Formatos aceitos: PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, PNG, TXT (máx. 10MB cada)
                                </p>

                                {/* Lista de Anexos Selecionados */}
                                {anexosResposta.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                        <p className="text-sm font-medium text-gray-700">Anexos Selecionados:</p>
                                        {anexosResposta.map((anexo, index) => (
                                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <div className="text-blue-600">
                                                        📎
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{anexo.name}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {(anexo.size / (1024 * 1024)).toFixed(2)} MB
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => removeAnexo(index)}
                                                    className="text-red-500 hover:text-red-700 p-1"
                                                    title="Remover anexo"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>


                        </div>

                        {/* Footer da Modal */}
                        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                            <button
                                onClick={fecharModalResposta}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                                disabled={loadingResposta}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={enviarResposta}
                                disabled={
                                    loadingResposta || 
                                    !respostaData.resposta.trim() || 
                                    !respostaData.tipoResposta ||
                                    // Se tiver statusClassificacao = classificado, precisa de tipoClassificacao
                                    (respostaData.statusClassificacao === 'classificado' && !respostaData.tipoClassificacao)
                                }
                                className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                                    ['deferido', 'classificado'].includes(respostaData.tipoResposta || respostaData.statusClassificacao) ? 'bg-emerald-600 hover:bg-emerald-700' :
                                    ['indeferido', 'desclassificado'].includes(respostaData.tipoResposta || respostaData.statusClassificacao) ? 'bg-red-600 hover:bg-red-700' :
                                    'bg-azul_escuro hover:bg-blue-800'
                                }`}
                            >
                                {loadingResposta && <FiLoader className="animate-spin" />}
                                {['deferido', 'classificado'].includes(respostaData.tipoResposta || respostaData.statusClassificacao) && <MdCheckCircle />}
                                {['indeferido', 'desclassificado'].includes(respostaData.tipoResposta || respostaData.statusClassificacao) && <MdCancel />}
                                {loadingResposta ? 'Processando...' : 
                                 respostaData.tipoResposta === 'deferido' ? 'Deferir Chamado' :
                                 respostaData.tipoResposta === 'indeferido' ? 'Indeferir Chamado' :
                                 respostaData.statusClassificacao === 'classificado' ? 'Classificar Chamado' :
                                 respostaData.statusClassificacao === 'desclassificado' ? 'Desclassificar Chamado' :
                                 'Selecione uma Decisão'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Classificação (Deferir/Indeferir) */}
            {showClassificarModal && chamadoParaClassificar && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Header da Modal */}
                        <div className={`flex justify-between items-center px-5 py-3 rounded-t-xl text-white ${
                            tipoClassificacao === 'deferido' ? 'bg-emerald-600' : 'bg-red-600'
                        }`}>
                            <div>
                                <h2 className="text-lg font-bold flex items-center gap-2">
                                    {tipoClassificacao === 'deferido' ? (
                                        <><MdCheckCircle /> Deferir Chamado</>
                                    ) : (
                                        <><MdCancel /> Indeferir Chamado</>
                                    )}
                                </h2>
                                <p className="text-xs opacity-80 mt-0.5">Protocolo: {chamadoParaClassificar.num_protocolo}</p>
                            </div>
                            <button
                                onClick={fecharModalClassificar}
                                className="text-white hover:opacity-70 transition-opacity"
                            >
                                <MdClose size={22} />
                            </button>
                        </div>

                        {/* Conteúdo da Modal */}
                        <div className="p-6 space-y-6">
                            {/* Informações do Chamado */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-gray-900 mb-2">Informações do Chamado</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="font-medium text-gray-600">Tipo:</span>
                                        <p className="text-gray-900">{capitalizeString(chamadoParaClassificar.tipo_abertura)}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-600">Assunto:</span>
                                        <p className="text-gray-900">{chamadoParaClassificar.assunto}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-600">Solicitante:</span>
                                        <p className="text-gray-900">{chamadoParaClassificar.identificacao?.nome || 'Anônimo'}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-600">Status Atual:</span>
                                        <span className={`inline-block px-2 py-1 rounded-full text-xs ${getStatusColor(chamadoParaClassificar.status)}`}>
                                            {getStatusText(chamadoParaClassificar.status)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Informações sobre a classificação */}
                            {tipoClassificacao === 'deferido' ? (
                                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg">
                                    <h3 className="font-semibold text-emerald-800 mb-2 flex items-center gap-2">
                                        <MdCheckCircle />
                                        Deferimento do Chamado
                                    </h3>
                                    <p className="text-emerald-700 text-sm">
                                        Ao deferir este chamado, você está confirmando que a solicitação foi atendida de forma satisfatória 
                                        e que o caso pode ser considerado resolvido.
                                    </p>
                                </div>
                            ) : (
                                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                                    <h3 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                                        <MdCancel />
                                        Indeferimento do Chamado
                                    </h3>
                                    <p className="text-red-700 text-sm mb-4">
                                        Ao indeferir este chamado, você deve fornecer uma justificativa clara do motivo 
                                        pelo qual a solicitação não pode ser atendida.
                                    </p>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-red-700 mb-2">
                                            Justificativa do Indeferimento <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            value={justificativaIndeferimento}
                                            onChange={(e) => setJustificativaIndeferimento(e.target.value)}
                                            rows={4}
                                            className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                                            placeholder="Digite a justificativa para o indeferimento do chamado..."
                                            required
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer da Modal */}
                        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                            <button
                                onClick={fecharModalClassificar}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                                disabled={loadingClassificacao}
                            >
                                Cancelar
                            </button>
                            
                            {tipoClassificacao === 'deferido' ? (
                                <button
                                    onClick={deferir}
                                    disabled={loadingClassificacao}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {loadingClassificacao && <FiLoader className="animate-spin" />}
                                    <MdCheckCircle />
                                    {loadingClassificacao ? 'Deferindo...' : 'Confirmar Deferimento'}
                                </button>
                            ) : (
                                <button
                                    onClick={indeferir}
                                    disabled={loadingClassificacao || !justificativaIndeferimento.trim()}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {loadingClassificacao && <FiLoader className="animate-spin" />}
                                    <MdCancel />
                                    {loadingClassificacao ? 'Indeferindo...' : 'Confirmar Indeferimento'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}