
'use client'

import { useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import Tabela from "../components/tabela"
import FormularioFiltrosAvancado, { CampoInput, CampoSelect, CampoData } from "../components/FormularioFiltrosAvancado"
import { FaDownload, FaEye, FaFileContract, FaBuilding, FaCalendarAlt, FaList, FaFlag } from "react-icons/fa"
import { toast, ToastContainer } from "react-toastify"
import 'react-toastify/dist/ReactToastify.css'
import Modal from "../components/modal"
import PaginacaoAvancada from "../components/PaginacaoAvancada"
const contratacaoUrl = process.env.NEXT_PUBLIC_AC_ENDPOINT_URL
const authUrl = process.env.NEXT_PUBLIC_AUTH_ENDPOINT_URL



export default function ContratosIframe() {
    const params = useSearchParams()
    const estId = params.get('id')
    const modalidade = params.get('modalidade')
    const orgaoId = params.get('orgao')
    const situacao = params.get('situacao')
    const tipo = params.get('tipo')

    const itensPorPagina = 10
    const [listaContratos, setListaContratos] = useState([])
    const [listaFiscais, setListaFiscais] = useState([])
    const [contratosFiltrados, setContratosFiltrados] = useState([])
    const [totalItems, setTotalItems] = useState(0)
    const [paginaAtual, setPaginaAtual] = useState(1)
    const [loadingContratos, setLoadingContratos] = useState(false)
    const [listaOrgaos, setListaOrgaos] = useState([])
    const [exportMenuOpen, setExportMenuOpen] = useState(false)

    const [visualizando, setVisualizando] = useState(false)
    const [contratoSelecionado, setContratoSelecionado] = useState(null)
    const [documentosContrato, setDocumentosContrato] = useState([])

    const [filtros, setFiltros] = useState({
        objeto__icontains: '',
        fiscal_contrato: '',
        pub_date__gte: '',
        pub_date__lte: '',
        data_inicio__gte: '',
        data_fim__lte: '',
        data_vencimento__gte: '',
        data_vencimento__lte: '',
        orgao: orgaoId,
        tipo: tipo,
        situacao: situacao,
        modalidade: modalidade,
        num_contrato__icontains: ''
    })

    const acoes = [
        {
            nome: <FaEye size={28} className="text-azul_escuro hover:text-laranja_escuro transition-colors" />,
            handler: (contrato) => handleVisualizar(contrato)
        },
        {
            nome: <FaDownload size={28} className="text-azul_escuro hover:text-laranja_escuro transition-colors" />,
            handler: (contrato) => handleDownloadDocs(contrato)
        }
    ]

    const listaColunas = [
        { nomeColuna: 'Número', coluna: 'num_contrato' },
        { nomeColuna: 'Órgão', coluna: 'orgao_nome' },
        { nomeColuna: 'Situação', coluna: 'situacao' },
        { nomeColuna: 'Objeto', coluna: 'objeto' },
        { nomeColuna: 'Publicado em', coluna: 'pub_date' },
        { nomeColuna: 'Valor', coluna: 'valor_formatado' }
    ]

    const listaSituacoes = [
        { nome: 'Vigente', id: 'vigente' },
        { nome: 'Encerrado', id: 'encerrado' }
    ]

    const listaTipos = [
        { nome: 'Contrato', id: 'contrato' },
        { nome: 'Aditivo', id: 'aditivo' }
    ]

    // Função para formatar data yyyy-mm-dd ou ISO para dd/mm/yyyy
    function formatDateBR(dateStr) {
        if (!dateStr) return '';
        
        // Remove parte de tempo se existir (formato ISO)
        const [datePart] = dateStr.split('T');
        const [year, month, day] = datePart.split('-');
        
        // Validação básica
        if (!year || !month || !day || year.length !== 4) return '';
        
        return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }

    const getContratos = async (count, page = 1, orgaos) => {
        setLoadingContratos(true)
        try {
            if (count) {
                // Primeiro busca o total de itens
                const params = new URLSearchParams({
                    count: String(count),
                    ...(filtros.objeto__icontains && { objeto__icontains: filtros.objeto__icontains }),
                    ...(filtros.num_contrato__icontains && { num_contrato__icontains: filtros.num_contrato__icontains }),
                    ...(filtros.tipo && { tipo: filtros.tipo }),
                    ...(filtros.situacao && { situacao: filtros.situacao }),
                    ...(filtros.orgao && { secao__orgao: filtros.orgao }),
                    ...(filtros.pub_date__gte && { pub_date__gte: filtros.pub_date__gte }),
                    ...(filtros.pub_date__lte && { pub_date__lte: filtros.pub_date__lte }),
                    ...(filtros.data_inicio__gte && { data_inicio__gte: filtros.data_inicio__gte }),
                    ...(filtros.data_fim__lte && { data_fim__lte: filtros.data_fim__lte }),
                    ...(filtros.data_vencimento__gte && { data_vencimento__gte: filtros.data_vencimento__gte }),
                    ...(filtros.data_vencimento__lte && { data_vencimento__lte: filtros.data_vencimento__lte }),
                    ...(filtros.fiscal_contrato && { vigencia__fiscal__pessoa: filtros.fiscal_contrato }),
                })
                const respCount = await fetch(`${contratacaoUrl}/contrato/estabelecimento/${estId}/?${params}&relations=secao&relations=vigencia__fiscal__pessoa`)
                if (!respCount.ok) throw new Error('Erro ao buscar total de contratos')
                const totalCount = await respCount.json()
                setTotalItems(totalCount)
            }

            // Busca os contratos da página atual
            const params = new URLSearchParams({
                offset: String((page - 1) * itensPorPagina),
                ...(filtros.objeto__icontains && { objeto__icontains: filtros.objeto__icontains }),
                ...(filtros.num_contrato__icontains && { num_contrato__icontains: filtros.num_contrato__icontains }),
                ...(filtros.tipo && { tipo: filtros.tipo }),
                ...(filtros.situacao && { situacao: filtros.situacao }),
                ...(filtros.orgao && { secao__orgao: filtros.orgao }),
                ...(filtros.pub_date__gte && { pub_date__gte: filtros.pub_date__gte }),
                ...(filtros.pub_date__lte && { pub_date__lte: filtros.pub_date__lte }),
                ...(filtros.data_inicio__gte && { data_inicio__gte: filtros.data_inicio__gte }),
                ...(filtros.data_fim__lte && { data_fim__lte: filtros.data_fim__lte }),
                ...(filtros.data_vencimento__gte && { data_vencimento__gte: filtros.data_vencimento__gte }),
                ...(filtros.data_vencimento__lte && { data_vencimento__lte: filtros.data_vencimento__lte }),
                ...(filtros.fiscal_contrato && { vigencia__fiscal__pessoa: filtros.fiscal_contrato }),
            })

            const response = await fetch(`${contratacaoUrl}/contrato/estabelecimento/${estId}/?${params}&relations=secao&relations=vigencia__fiscal__pessoa`)

            if (!response.ok) throw new Error('Erro ao obter contratos')

            const resposta = await response.json()

            const contratosData = resposta.map((contrato) => {
                const orgaoId = contrato.secao?.orgao
                const orgaoEncontrado = orgaos.find(orgao => orgao.id === orgaoId)
                return {
                    ...contrato, // Manter todos os dados originais
                    orgao_nome: orgaoEncontrado?.nome,
                    orgao_id: orgaoEncontrado?.id,
                    pub_date: formatDateBR(contrato.pub_date),
                    situacao: contrato.situacao?.toUpperCase().replaceAll('_', '') ?? '',
                    valor_formatado: `R$ ${parseFloat(contrato.valor_estimado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                }
            })
            setListaContratos(contratosData)
            setContratosFiltrados(contratosData)
            setPaginaAtual(page)
        } catch (error) {
            console.error('Erro ao obter contratos:', error)
            toast.error('Erro ao carregar contratos')
        } finally {
            setLoadingContratos(false)
        }
    }

    const getFiscaisContrato = async () => {
        try {
            const response = await fetch(`${contratacaoUrl}/fiscal_contrato/estabelecimento/${estId}/?relations=pessoa`, {
                method: 'GET',
            })
            if (response.ok) {
                const fiscais = await response.json()
                setListaFiscais(
                    fiscais
                        .filter(f => f.pessoa)
                        .map(f => ({ id: f.pessoa.id, nome: f.pessoa.nome || f.pessoa.razao_social }))
                )
            }
        } catch (error) {
            console.error('Erro ao obter fiscais do contrato:', error)
        }
    }

    const getOrgaos = async () => {
        try {
            const response = await fetch(`${authUrl}/orgao/estabelecimento/${estId}/`, {
                method: 'GET',
            })
            if (!response.ok) throw new Error('Erro ao obter órgãos')
            const orgaos = await response.json()
            setListaOrgaos(orgaos)
            return orgaos // Retorna os dados para uso imediato
        } catch (error) {
            console.error('Erro ao obter órgãos:', error)
            return []
        }
    }

    const getDocumentosContrato = async (contrato) => {
        try {
            const response = await fetch(`${contratacaoUrl}/contrato/${contrato.id}/docs/`, {
                method: 'GET',
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

    const handleFiltroChange = (campo, valor) => {
        setFiltros(prev => ({
            ...prev,
            [campo]: valor
        }))
    }

    const handleBuscar = ((event) => {
        if (event) {
            event.preventDefault()
        }

        setPaginaAtual(1)
        getContratos(true, 1, listaOrgaos)
    })

    const handleVisualizar = async (contrato) => {
        setContratoSelecionado(contrato)
        setVisualizando(true)
    }

    const handleFecharVisualizacao = () => {
        setVisualizando(false)
        setContratoSelecionado(null)
        setDocumentosContrato([])
    }

    const handleDownloadDoc = async (doc) => {
        try {
            const response = await fetch(`${contratacaoUrl}/docs/${doc.id}/content/`, {
                method: 'GET',
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

    const handleDownloadAllDocs = async () => {
        for (const doc of documentosContrato) {
            await handleDownloadDoc(doc)
        }
    }

    const handleDownloadDocs = async (contrato) => {
        try {
            const response = await fetch(`${contratacaoUrl}/contrato/${contrato.id}/docs/`, {
                method: 'GET',
            })

            if (!response.ok) throw new Error('Erro ao obter documentos')

            const documentos = await response.json()

            if (documentos.length === 0) {
                toast.info('Nenhum documento encontrado para este contrato')
                return
            }

            // Download de todos os documentos
            for (const doc of documentos) {
                const docResponse = await fetch(`${contratacaoUrl}/docs/${doc.id}/content/`, {
                    method: 'GET',
                })

                if (docResponse.ok) {
                    const blob = await docResponse.blob()
                    const url = URL.createObjectURL(blob)
                    const link = document.createElement('a')
                    link.href = url
                    link.download = doc.titulo
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                    URL.revokeObjectURL(url)
                }
            }

            toast.success('Download dos documentos iniciado!')
        } catch (error) {
            console.error('Erro ao baixar documentos:', error)
            toast.error('Erro ao baixar documentos')
        }
    }

    const handleExport = async (formato) => {
        const params = new URLSearchParams({
            ...(filtros.objeto__icontains && { objeto__icontains: filtros.objeto__icontains }),
            ...(filtros.num_contrato__icontains && { num_contrato__icontains: filtros.num_contrato__icontains }),
            ...(filtros.tipo && { tipo: filtros.tipo }),
            ...(filtros.orgao && { secao__orgao: filtros.orgao }),
            ...(filtros.situacao && { situacao: filtros.situacao }),
            ...(filtros.pub_date__gte && { pub_date__gte: filtros.pub_date__gte }),
            ...(filtros.pub_date__lte && { pub_date__lte: filtros.pub_date__lte }),
            ...(filtros.data_inicio__gte && { data_inicio__gte: filtros.data_inicio__gte }),
            ...(filtros.data_fim__lte && { data_fim__lte: filtros.data_fim__lte }),
            ...(filtros.data_vencimento__gte && { data_vencimento__gte: filtros.data_vencimento__gte }),
            ...(filtros.data_vencimento__lte && { data_vencimento__lte: filtros.data_vencimento__lte }),
            ...(filtros.fiscal_contrato && { vigencia__fiscal__pessoa: filtros.fiscal_contrato }),
        })

        try {
            const response = await fetch(`${contratacaoUrl}/contrato/estabelecimento/${estId}/exportar/?type=${formato}&${params}`, {
                method: 'GET',
            })

            if (!response.ok) throw new Error('Falha ao exportar registros')

            const blob = await response.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `contratos.${formato}`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)

            toast.success('Exportação realizada com sucesso!')
        } catch (error) {
            console.error('Erro ao exportar:', error)
            toast.error('Erro ao exportar registros')
        } finally {
            setExportMenuOpen(false)
        }
    }

    useEffect(() => {
        if (estId) {
            const loadData = async () => {
                const orgaos = await getOrgaos()
                await getFiscaisContrato(estId)
                await getContratos(true, 1, orgaos)
            }
            loadData()
        }
    }, [estId])

    useEffect(() => {
        setFiltros(prev => ({
            ...prev,
            objeto__icontains: '',
            num_contrato__icontains: '',
            pub_date__gte: '',
            pub_date__lte: '',
            tipo: params.get('tipo') || '',
            situacao: params.get('situacao') || '',
            data_inicio__gte: params.get('data_inicio_vigencia') || '',
            data_fim__lte: params.get('data_fim_vigencia') || '',
            data_vencimento__gte: params.get('data_inicio_vencimento') || '',
            data_vencimento__lte: params.get('data_fim_vencimento') || '',
            orgao: params.get('orgao') || ''
        }))
    }, [params])

    useEffect(() => {
        if (contratoSelecionado) {
            getDocumentosContrato(contratoSelecionado)
        }
    }, [contratoSelecionado])

    useEffect(() => {
        const sendHeight = () => {
            const h = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)
            window.parent.postMessage({ height: h }, "*")
        }

        sendHeight()
        window.addEventListener("resize", sendHeight)

        const observer = new MutationObserver(sendHeight)
        observer.observe(document.body, { childList: true, subtree: true, attributes: true })

        return () => {
            window.removeEventListener("resize", sendHeight)
            observer.disconnect()
        }
    }, [])

    return (
        <section className="flex flex-col text-azul_escuro flex-grow overflow-hidden bg-branco_cinza px-4 py-6 md:px-6 md:py-8 gap-6">
            <ToastContainer />

            {/* Filtros */}
            <FormularioFiltrosAvancado
                titulo="Filtros de Contratos"
                filtros={filtros}
                onFiltroChange={handleFiltroChange}
                labelsMap={{ orgao: Object.fromEntries(listaOrgaos.map(o => [o.id, o.nome])) }}
                onLimparFiltros={() => setFiltros({
                    objeto__icontains: '',
                    num_contrato__icontains: '',
                    tipo: '',
                    situacao: '',
                    orgao: '',
                    pub_date__gte: '',
                    pub_date__lte: '',
                    data_inicio__gte: '',
                    data_fim__lte: '',
                    data_vencimento__gte: '',
                    data_vencimento__lte: ''
                })}
            >
                <CampoInput
                    label="Objeto do Contrato"
                    name="objeto__icontains"
                    value={filtros.objeto__icontains}
                    onChange={handleFiltroChange}
                    placeholder="Ex: prestação de serviços..."
                    colSpan="md:col-span-3"
                    icone={<FaFileContract />}
                />

                <CampoInput
                    label="Número do Contrato"
                    name="num_contrato__icontains"
                    value={filtros.num_contrato__icontains}
                    onChange={handleFiltroChange}
                    placeholder="Ex: 001/2024"
                    colSpan="md:col-span-3"
                    icone={<FaList />}
                />

                <CampoSelect
                    label="Órgão"
                    name="orgao"
                    value={filtros.orgao}
                    onChange={handleFiltroChange}
                    options={listaOrgaos}
                    placeholder="Todos os órgãos"
                    colSpan="md:col-span-2"
                    icone={<FaBuilding />}
                />

                <CampoSelect
                    label="Tipo"
                    name="tipo"
                    value={filtros.tipo}
                    onChange={handleFiltroChange}
                    options={listaTipos}
                    placeholder="Todos os tipos"
                    colSpan="md:col-span-2"
                    icone={<FaList />}
                />

                <CampoSelect
                    label="Fiscal de contrato"
                    name="fiscal_contrato"
                    value={filtros.fiscal_contrato}
                    onChange={handleFiltroChange}
                    options={listaFiscais}
                    placeholder="Todos os fiscais de contrato"
                    colSpan="md:col-span-2"
                    icone={<FaList />}
                />

                <CampoSelect
                    label="Situação"
                    name="situacao"
                    value={filtros.situacao}
                    onChange={handleFiltroChange}
                    options={listaSituacoes}
                    placeholder="Todas as situações"
                    colSpan="md:col-span-6"
                    icone={<FaFlag />}
                />

                <CampoData
                    label="Data de Publicação (Inicial)"
                    name="pub_date__gte"
                    value={filtros.pub_date__gte}
                    onChange={handleFiltroChange}
                    colSpan="md:col-span-3"
                    icone={<FaCalendarAlt />}
                />

                <CampoData
                    label="Data de Publicação (Final)"
                    name="pub_date__lte"
                    value={filtros.pub_date__lte}
                    onChange={handleFiltroChange}
                    colSpan="md:col-span-3"
                    icone={<FaCalendarAlt />}
                />

                <CampoData
                    label="Vigência (Inicial)"
                    name="data_inicio__gte"
                    value={filtros.data_inicio__gte}
                    onChange={handleFiltroChange}
                    colSpan="md:col-span-3"
                    icone={<FaCalendarAlt />}
                />

                <CampoData
                    label="Vigência (Final)"
                    name="data_fim__lte"
                    value={filtros.data_fim__lte}
                    onChange={handleFiltroChange}
                    colSpan="md:col-span-3"
                    icone={<FaCalendarAlt />}
                />

                <CampoData
                    label="Data de Vencimento (Inicial)"
                    name="data_vencimento__gte"
                    value={filtros.data_vencimento__gte}
                    onChange={handleFiltroChange}
                    colSpan="md:col-span-3"
                    icone={<FaCalendarAlt />}
                />

                <CampoData
                    label="Data de Vencimento (Final)"
                    name="data_vencimento__lte"
                    value={filtros.data_vencimento__lte}
                    onChange={handleFiltroChange}
                    colSpan="md:col-span-3"
                    icone={<FaCalendarAlt />}
                />

                <button className="px-2 py-3 md:col-span-6 bg-azul_escuro text-white font-medium rounded hover:bg-laranja_escuro transition-colors"
                    onClick={handleBuscar}>
                    Pesquisar
                </button>
            </FormularioFiltrosAvancado>

            {/* Registros */}
            <div className="flex flex-col bg-white rounded-2xl shadow-lg p-6 gap-2 md:p-8 border border-gray-100">
                <div className="flex justify-between items-center mb-2">
                    <h1 className="text-xl font-bold">Contratos</h1>
                    <div className="relative">
                        <button
                            onClick={() => setExportMenuOpen(prev => !prev)}
                            className="bg-azul_escuro text-white px-4 py-2 rounded-lg hover:bg-laranja_escuro transition"
                        >
                            Exportar registros
                        </button>
                        {exportMenuOpen && (
                            <ul className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded shadow-lg z-10">
                                <li>
                                    <button
                                        onClick={() => handleExport('pdf')}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-100"
                                    >
                                        PDF
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => handleExport('xml')}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-100"
                                    >
                                        XML
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => handleExport('csv')}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-100"
                                    >
                                        CSV
                                    </button>
                                </li>
                            </ul>
                        )}
                    </div>
                </div>

                <Tabela
                    listaDados={contratosFiltrados}
                    listaColunas={listaColunas}
                    acoes={acoes}
                    itensPorPagina={itensPorPagina}
                    loading={loadingContratos}
                />

                <PaginacaoAvancada
                    totalItens={totalItems}
                    itensPorPagina={itensPorPagina}
                    paginaAtual={paginaAtual}
                    onMudarPagina={page => {
                        setPaginaAtual(page)
                        getContratos(false, page, listaOrgaos)
                    }}
                />
            </div>

            {/* Modal de Visualização */}
            {visualizando && contratoSelecionado && (
                <Modal isOpen={visualizando} onClose={handleFecharVisualizacao} title={`Detalhes do Contrato - ${contratoSelecionado.num_contrato}`}>
                    <div className="p-6 overflow-y-auto">
                        <div className="flex flex-wrap gap-4 bg-white p-4 shadow-lg rounded mb-6">
                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Órgão:</strong>
                                <span className="break-words">{contratoSelecionado.orgao_nome}</span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Número do Contrato:</strong>
                                <span className="break-words">{contratoSelecionado.num_contrato}</span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Tipo:</strong>
                                <span className="break-words">{contratoSelecionado.tipo?.toUpperCase() ?? '—'}</span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Situação:</strong>
                                <span className="break-words">{contratoSelecionado.situacao}</span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Data de Publicação:</strong>
                                <span className="break-words">
                                    {contratoSelecionado.pub_date}
                                </span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Data de Vigência:</strong>
                                <span className="break-words">
                                    {formatDateBR(contratoSelecionado.data_inicio)}
                                </span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Data de Vencimento:</strong>
                                <span className="break-words">
                                    {formatDateBR(contratoSelecionado.data_vencimento)}
                                </span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Valor estimado:</strong>
                                <span className="break-words">{contratoSelecionado.valor_estimado != null ? `R$ ${String(contratoSelecionado.valor_estimado).replace('.', ',')}` : '—'}</span>
                            </div>

                            <div className="flex flex-col w-full">
                                <strong>Objeto:</strong>
                                <span className="break-words whitespace-pre-wrap">{contratoSelecionado.objeto}</span>
                            </div>
                        </div>

                        {contratoSelecionado.vigencia?.pessoa ? (
                            <>
                                <h2 className="text-md font-semibold mb-2">Dados do Fiscal de Contrato</h2>
                                <div className="flex w-full flex-col md:flex-row items-start gap-8 bg-white p-4 shadow-lg rounded mb-4">
                                    <div className="flex gap-2">
                                        <strong>Nome/Razão Social:</strong>
                                        <span className="break-words">{contratoSelecionado.vigencia.pessoa.nome || contratoSelecionado.vigencia.pessoa.razao_social || '—'}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <strong>CPF/CNPJ:</strong>
                                        <span className="break-words">{contratoSelecionado.vigencia.pessoa.cpf || contratoSelecionado.vigencia.pessoa.cnpj || '—'}</span>
                                    </div>
                                </div>
                            </>
                        ) : null}

                        <div className="flex justify-between items-center w-full p-2">
                            <h2 className="text-md font-semibold mb-2">Documentos inclusos no contrato</h2>
                            <div className="flex gap-4 items-center">
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
                                            <td className="py-3 px-6 text-left">{formatDateBR(doc.created_at)}</td>
                                            <td className="py-3 px-6 text-center">
                                                <button onClick={() => handleDownloadDoc(doc)} className="mr-2 text-azul_escuro hover:text-green-900 transition-colors">
                                                    <FaDownload size={18} className="text-azul_escuro" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : <></>}
                    </div>
                </Modal>
            )}
        </section>
    )
}
