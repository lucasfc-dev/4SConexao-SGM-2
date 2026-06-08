'use client'

import { useSearchParams } from "next/navigation"

import { useCallback, useEffect, useState } from "react"
import Tabela from "../components/tabela"
import FormularioFiltrosAvancado, { CampoInput, CampoSelect, CampoData } from "../components/FormularioFiltrosAvancado"
import { FaDownload, FaEye, FaFileAlt, FaBuilding, FaCalendarAlt, FaList, FaFlag } from "react-icons/fa"
import { toast, ToastContainer } from "react-toastify"
import 'react-toastify/dist/ReactToastify.css'
import Modal from "../components/modal"
import PaginacaoAvancada from "../components/PaginacaoAvancada"

const acUrl = process.env.NEXT_PUBLIC_AC_ENDPOINT_URL
const authUrl = process.env.NEXT_PUBLIC_AUTH_ENDPOINT_URL

export default function DispensasIframe() {
    const params = useSearchParams()
    const estId = params.get('id')
    const orgaoId = params.get('orgao')
    const tipo = params.get('tipo')
    const situacao = params.get('situacao')

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
    const itensPorPagina = 10
    const [listaDispensas, setListaDispensas] = useState([])
    const [dispensasFiltradas, setDispensasFiltradas] = useState([])
    const [totalItems, setTotalItems] = useState(0)
    const [paginaAtual, setPaginaAtual] = useState(1)
    const [loadingDispensas, setLoadingDispensas] = useState(false)
    const [listaOrgaos, setListaOrgaos] = useState([])
    const [exportMenuOpen, setExportMenuOpen] = useState(false)

    const [visualizando, setVisualizando] = useState(false)
    const [dispensaSelecionada, setDispensaSelecionada] = useState(null)
    const [documentosDispensa, setDocumentosDispensa] = useState([])
    const [dadosResponsavel, setDadosResponsavel] = useState(null)

    const [filtros, setFiltros] = useState({
        objeto__icontains: '',
        num_processo__icontains: '',
        tipo: tipo,
        situacao: situacao,
        orgao: orgaoId,
        pub_date__gte: '',
        pub_date__lte: '',
        julg_date__gte: '',
        julg_date__lte: '',
        homolog_date__gte: '',
        homolog_date__lte: ''
    })

    const acoes = [
        {
            nome: <FaEye size={28} className="text-azul_escuro hover:text-laranja_escuro transition-colors" />,
            handler: (dispensa) => handleVisualizar(dispensa)
        },
        {
            nome: <FaDownload size={28} className="text-azul_escuro hover:text-laranja_escuro transition-colors" />,
            handler: (dispensa) => handleDownloadDocs(dispensa)
        }
    ]

    const listaColunas = [
        { nomeColuna: 'Número', coluna: 'num_processo' },
        { nomeColuna: 'Órgão', coluna: 'orgao_nome' },
        { nomeColuna: 'Situação', coluna: 'situacao' },
        { nomeColuna: 'Publicado em', coluna: 'pub_date' },
        { nomeColuna: 'Objeto', coluna: 'objeto' },
        { nomeColuna: 'Valor Estimado', coluna: 'valor_estimado_formatado' }
    ]
    const listaSituacoes = [
        { "id": "aberta", "nome": "Aberta" },
        { "id": "julgada", "nome": "Julgada" },
        { "id": "adjudicada", "nome": "Adjudicada" },
        { "id": "homologada", "nome": "Homologada" },
        { "id": "deserta", "nome": "Deserta" },
        { "id": "fracassada", "nome": "Fracassada" },
        { "id": "postergada", "nome": "Postergada" },
        { "id": "revogada", "nome": "Revogada" },
        { "id": "cancelada", "nome": "Cancelada" },
        { "id": "anulada", "nome": "Anulada" },
        { "id": "suspensa", "nome": "Suspensa" },
        { "id": "aguardando_fase_recursal", "nome": "Aguardando Fase Recursal" },
        { "id": "sessao_iniciada", "nome": "Sessão Iniciada" },
        { "id": "sessao_encerrada", "nome": "Sessão Encerrada" }
    ]
    const getDispensas = async (count, page = 1, orgaos) => {
        setLoadingDispensas(true)
        try {
            if (count) {
                // Primeiro busca o total de itens
                const params = new URLSearchParams({
                    count: String(count),
                    ...(filtros.objeto__icontains && { objeto__icontains: filtros.objeto__icontains }),
                    ...(filtros.num_processo__icontains && { num_processo__icontains: filtros.num_processo__icontains }),
                    ...(filtros.tipo && { tipo_dispensa: filtros.tipo }),
                    ...(filtros.situacao && { situacao: filtros.situacao }),
                    ...(filtros.orgao && { orgao: filtros.orgao }),
                    ...(filtros.pub_date__gte && { pub_date__gte: filtros.pub_date__gte }),
                    ...(filtros.pub_date__lte && { pub_date__lte: filtros.pub_date__lte }),
                    ...(filtros.julg_date__gte && { julg_date__gte: filtros.julg_date__gte }),
                    ...(filtros.julg_date__lte && { julg_date__lte: filtros.julg_date__lte }),
                    ...(filtros.homolog_date__gte && { homolog_date__gte: filtros.homolog_date__gte }),
                    ...(filtros.homolog_date__lte && { homolog_date__lte: filtros.homolog_date__lte }),
                })
                const respCount = await fetch(`${acUrl}/dispensa/estabelecimento/${estId}/?${params}`)
                if (!respCount.ok) throw new Error('Erro ao buscar total de dispensas')
                const totalCount = await respCount.json()
                setTotalItems(totalCount)
            }

            // Busca as dispensas da página atual
            const params = new URLSearchParams({
                offset: String((page - 1) * itensPorPagina),
                ...(filtros.objeto__icontains && { objeto__icontains: filtros.objeto__icontains }),
                ...(filtros.num_processo__icontains && { num_processo__icontains: filtros.num_processo__icontains }),
                ...(filtros.tipo && { tipo_dispensa: filtros.tipo }),
                ...(filtros.situacao && { situacao: filtros.situacao }),
                ...(filtros.orgao && { orgao: filtros.orgao }),
                ...(filtros.pub_date__gte && { pub_date__gte: filtros.pub_date__gte }),
                ...(filtros.pub_date__lte && { pub_date__lte: filtros.pub_date__lte }),
                ...(filtros.julg_date__gte && { julg_date__gte: filtros.julg_date__gte }),
                ...(filtros.julg_date__lte && { julg_date__lte: filtros.julg_date__lte }),
                ...(filtros.homolog_date__gte && { homolog_date__gte: filtros.homolog_date__gte }),
                ...(filtros.homolog_date__lte && { homolog_date__lte: filtros.homolog_date__lte }),
            })

            const response = await fetch(`${acUrl}/dispensa/estabelecimento/${estId}/?${params}`)

            if (!response.ok) throw new Error('Erro ao obter dispensas')

            const resposta = await response.json()
            const dispensasData = resposta.map((dispensa) => {
                const orgaoEncontrado = orgaos.find(orgao => orgao.id === dispensa.orgao)

                return {
                    ...dispensa, // Manter todos os dados originais
                    orgao_nome: orgaoEncontrado?.nome,
                    orgao_id: orgaoEncontrado?.id,
                    pub_date: formatDateBR(dispensa.pub_date),
                    homolog_date: formatDateBR(dispensa.homolog_date),
                    situacao: dispensa.situacao.toUpperCase().replaceAll('_', ' '),
                    valor_estimado_formatado: `R$ ${parseFloat(dispensa.valor_estimado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                }
            })
            setListaDispensas(dispensasData)
            setDispensasFiltradas(dispensasData)
            setPaginaAtual(page)
        } catch (error) {
            console.error('Erro ao obter dispensas:', error)
            toast.error('Erro ao carregar dispensas')
        } finally {
            setLoadingDispensas(false)
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
            return orgaos
        } catch (error) {
            console.error('Erro ao obter órgãos:', error)
            return []
        }
    }

    const getDocumentosDispensa = async (dispensa) => {
        try {
            const response = await fetch(`${acUrl}/dispensa/${dispensa.id}/docs/`, {
                method: 'GET',
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

    const handleFiltroChange = (campo, valor) => {
        setFiltros(prev => ({
            ...prev,
            [campo]: valor
        }))
    }

    const handleBuscar = async (event, orgaos = listaOrgaos) => {
        if (event) {
            event.preventDefault()
        }
        setPaginaAtual(1)
        await getDispensas(true, 1, orgaos)
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

    const handleFecharVisualizacao = () => {
        setVisualizando(false)
        setDispensaSelecionada(null)
        setDocumentosDispensa([])
        setDadosResponsavel(null)
    }

    const handleDownloadDoc = async (doc) => {
        try {
            const response = await fetch(`${acUrl}/docs/${doc.id}/content/`, {
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
        for (const doc of documentosDispensa) {
            await handleDownloadDoc(doc)
        }
    }

    const handleDownloadDocs = async (dispensa) => {
        try {
            const response = await fetch(`${acUrl}/dispensa/${dispensa.id}/docs/`, {
                method: 'GET',
            })

            if (!response.ok) throw new Error('Erro ao obter documentos')

            const documentos = await response.json()

            if (documentos.length === 0) {
                toast.info('Nenhum documento encontrado para esta dispensa')
                return
            }

            // Download de todos os documentos
            for (const doc of documentos) {
                const docResponse = await fetch(`${acUrl}/docs/${doc.id}/content/`, {
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
            ...(filtros.num_processo__icontains && { num_processo__icontains: filtros.num_processo__icontains }),
            ...(filtros.tipo && { tipo_dispensa: filtros.tipo }),
            ...(filtros.orgao && { orgao: filtros.orgao }),
            ...(filtros.situacao && { situacao: filtros.situacao }),
            ...(filtros.pub_date__gte && { pub_date__gte: filtros.pub_date__gte }),
            ...(filtros.pub_date__lte && { pub_date__lte: filtros.pub_date__lte }),
            ...(filtros.julg_date__gte && { julg_date__gte: filtros.julg_date__gte }),
            ...(filtros.julg_date__lte && { julg_date__lte: filtros.julg_date__lte }),
            ...(filtros.homolog_date__gte && { homolog_date__gte: filtros.homolog_date__gte }),
            ...(filtros.homolog_date__lte && { homolog_date__lte: filtros.homolog_date__lte }),
        })

        try {
            const response = await fetch(`${acUrl}/dispensa/estabelecimento/${estId}/exportar/?type=${formato}&${params}`, {
                method: 'GET',
            })

            if (!response.ok) throw new Error('Falha ao exportar registros')

            const blob = await response.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `dispensas.${formato}`
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
        setFiltros(prev => ({
            ...prev,
            objeto__icontains: '',
            num_processo__icontains: '',
            dataInicial: '',
            dataFinal: '',
            tipo: params.get('tipo') || '',
            situacao: params.get('situacao') || '',
            orgaoId: params.get('orgao') || ''
        }))
    }, [params])

    useEffect(() => {
        async function fetchData() {
            const orgaos = await getOrgaos()
            setListaOrgaos(orgaos)
            await handleBuscar(null, orgaos)
        }
        fetchData()
    }, [])

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
                titulo="Filtros de Dispensas"
                filtros={filtros}
                onFiltroChange={handleFiltroChange}
                labelsMap={{ orgao: Object.fromEntries(listaOrgaos.map(o => [o.id, o.nome])) }}
                onLimparFiltros={() => setFiltros({
                    objeto__icontains: '',
                    num_processo__icontains: '',
                    tipo: '',
                    situacao: '',
                    orgao: '',
                    pub_date__gte: '',
                    pub_date__lte: '',
                    julg_date__gte: '',
                    julg_date__lte: '',
                    homolog_date__gte: '',
                    homolog_date__lte: ''
                })}
            >
                <CampoInput
                    label="Objeto da Dispensa"
                    name="objeto__icontains"
                    value={filtros.objeto__icontains}
                    onChange={handleFiltroChange}
                    placeholder="Ex: pavimentação, contrato..."
                    colSpan="md:col-span-3"
                    icone={<FaFileAlt />}
                />

                <CampoInput
                    label="Número do Processo"
                    name="num_processo__icontains"
                    value={filtros.num_processo__icontains}
                    onChange={handleFiltroChange}
                    placeholder="Ex: 12345/2024"
                    colSpan="md:col-span-3"
                    icone={<FaList />}
                />

                <CampoSelect
                    label="Tipo"
                    name="tipo"
                    value={filtros.tipo}
                    onChange={handleFiltroChange}
                    options={[
                        { id: "dispensa", nome: "Dispensa" },
                        { id: "inexigibilidade", nome: "Inexigibilidade" },
                        { id: "inexigibilidade_credenciamento_chamada_publica", nome: "Inexigibilidade por credenciamento de chamada pública" },
                        { id: "dispensa_chamada_publica", nome: "Dispensa por chamada pública" }
                    ]}
                    placeholder="Todos os tipos"
                    colSpan="md:col-span-2"
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
                    label="Situação"
                    name="situacao"
                    value={filtros.situacao}
                    onChange={handleFiltroChange}
                    options={listaSituacoes}
                    placeholder="Todas as situações"
                    colSpan="md:col-span-2"
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
                    label="Data Julgamento (Inicial)"
                    name="julg_date__gte"
                    value={filtros.julg_date__gte}
                    onChange={handleFiltroChange}
                    colSpan="md:col-span-3"
                    icone={<FaCalendarAlt />}
                />

                <CampoData
                    label="Data Julgamento (Final)"
                    name="julg_date__lte"
                    value={filtros.julg_date__lte}
                    onChange={handleFiltroChange}
                    colSpan="md:col-span-3"
                    icone={<FaCalendarAlt />}
                />

                <CampoData
                    label="Data Homologação (Inicial)"
                    name="homolog_date__gte"
                    value={filtros.homolog_date__gte}
                    onChange={handleFiltroChange}
                    colSpan="md:col-span-3"
                    icone={<FaCalendarAlt />}
                />

                <CampoData
                    label="Data Homologação (Final)"
                    name="homolog_date__lte"
                    value={filtros.homolog_date__lte}
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
                    <h1 className="text-xl font-bold">Dispensas</h1>
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
                    listaDados={dispensasFiltradas}
                    listaColunas={listaColunas}
                    acoes={acoes}
                    itensPorPagina={itensPorPagina}
                    loading={loadingDispensas}
                />

                <PaginacaoAvancada
                    totalItens={totalItems}
                    itensPorPagina={itensPorPagina}
                    paginaAtual={paginaAtual}
                    onMudarPagina={page => {
                        setPaginaAtual(page)
                        getDispensas(false, page, listaOrgaos)
                    }}
                />
            </div>

            {/* Modal de Visualização */}
            {visualizando && dispensaSelecionada && (
                <Modal isOpen={visualizando} onClose={handleFecharVisualizacao} title={`Detalhes da Dispensa - ${dispensaSelecionada.num_processo}`}>
                    <div className="p-6 overflow-y-auto">
                        <div className="flex flex-wrap gap-4 bg-white p-4 shadow-lg rounded mb-6">
                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Órgão:</strong>
                                <span className="break-words">{dispensaSelecionada.orgao?.nome || dispensaSelecionada.orgao_nome}</span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Número do Processo:</strong>
                                <span className="break-words">{dispensaSelecionada.num_processo}</span>
                            </div>


                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Situação:</strong>
                                <span className="break-words">{dispensaSelecionada.situacao}</span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Tipo:</strong>
                                <span className="break-words">{dispensaSelecionada.tipo_dispensa.toUpperCase().replaceAll('_', ' ')}</span>
                            </div>


                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Data de Publicação:</strong>
                                <span className="break-words">
                                    {dispensaSelecionada.pub_date ? dispensaSelecionada.pub_date : 'N/A'}
                                </span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Data de Homologação:</strong>
                                <span className="break-words">
                                    {dispensaSelecionada.homolog_date ? dispensaSelecionada.homolog_date : 'N/A'}
                                </span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Data de Julgamento:</strong>
                                <span className="break-words">
                                    {dispensaSelecionada.julg_date ? formatDateBR(dispensaSelecionada.julg_date) : 'Não Julgado'}
                                </span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Valor estimado:</strong>
                                <span className="break-words">R${String(dispensaSelecionada.valor_estimado).replace('.', ',')}</span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Valor total vencedor:</strong>
                                <span className="break-words">R${String(dispensaSelecionada.valor_vencedor).replace('.', ',')}</span>
                            </div>

                            <div className="flex flex-col w-full">
                                <strong>Objeto:</strong>
                                <span className="break-words whitespace-pre-wrap">{dispensaSelecionada.objeto}</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-center w-full py-2 px-0">
                            <h2 className="text-md font-semibold ">Documentos inclusos na dispensa</h2>
                        </div>

                        {documentosDispensa.length > 0 ? (
                            <div className="flex overflow-auto">
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
                            </div>
                        ) : <></>}
                    </div>
                </Modal>
            )}
        </section>
    )
}
