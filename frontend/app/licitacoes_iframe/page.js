
'use client'

import { useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import Tabela from "../components/tabela"
import FormularioFiltrosAvancado, { CampoInput, CampoSelect, CampoData } from "../components/FormularioFiltrosAvancado"
import { FaDownload, FaEye, FaFileAlt, FaBuilding, FaCalendarAlt, FaList, FaFlag, FaGavel } from "react-icons/fa"
import { toast, ToastContainer } from "react-toastify"
import 'react-toastify/dist/ReactToastify.css'
import Modal from "../components/modal"
import PaginacaoAvancada from "../components/PaginacaoAvancada"

const acUrl = process.env.NEXT_PUBLIC_AC_ENDPOINT_URL
const authUrl = process.env.NEXT_PUBLIC_AUTH_ENDPOINT_URL


export default function LicitacoesIframe() {
    const params = useSearchParams()
    const estId = params.get('id')
    const modalidade = params.get('modalidade')
    const orgaoId = params.get('orgao')
    const situacao = params.get('situacao')

    const itensPorPagina = 10
    const [listaLicitacoes, setListaLicitacoes] = useState([])
    const [licitacoesFiltradas, setLicitacoesFiltradas] = useState([])
    const [totalItems, setTotalItems] = useState(0)
    const [paginaAtual, setPaginaAtual] = useState(1)
    const [loadingLicitacoes, setLoadingLicitacoes] = useState(false)
    const [listaOrgaos, setListaOrgaos] = useState([])
    const [listaModalidades, setListaModalidades] = useState([])
    const [exportMenuOpen, setExportMenuOpen] = useState(false)

    const [visualizando, setVisualizando] = useState(false)
    const [licitacaoSelecionada, setLicitacaoSelecionada] = useState(null)
    const [documentosLicitacao, setDocumentosLicitacao] = useState([])
    const [dadosResponsavel, setDadosResponsavel] = useState(null)

    const [filtros, setFiltros] = useState({
        objeto__icontains: '',
        num_processo__icontains: '',
        modalidade: modalidade,
        situacao: situacao,
        orgao: orgaoId,
        pub_date__gte: '',
        pub_date__lte: '',
        homolog_date__gte: '',
        homolog_date__lte: '',
        julg_date__gte: '',
        julg_date__lte: '',
    })

    const acoes = [
        {
            nome: <FaEye size={28} className="text-azul_escuro hover:text-laranja_escuro transition-colors" />,
            handler: (licitacao) => handleVisualizar(licitacao)
        },
        {
            nome: <FaDownload size={28} className="text-azul_escuro hover:text-laranja_escuro transition-colors" />,
            handler: (licitacao) => handleDownloadDocs(licitacao)
        }
    ]

    const listaColunas = [
        { nomeColuna: 'Número', coluna: 'num_processo' },
        { nomeColuna: 'Órgão', coluna: 'orgao_nome' },
        { nomeColuna: 'Modalidade', coluna: 'modalidade_nome' },
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

    const getLicitacoes = async (count, page = 1, orgaos) => {
        setLoadingLicitacoes(true)
        try {
            if (count) {
                // Primeiro busca o total de itens
                const params = new URLSearchParams({
                    count: String(count),
                    ...(filtros.objeto__icontains && { objeto__icontains: filtros.objeto__icontains }),
                    ...(filtros.num_processo__icontains && { num_processo__icontains: filtros.num_processo__icontains }),
                    ...(filtros.modalidade && { modalidade: filtros.modalidade }),
                    ...(filtros.situacao && { situacao: filtros.situacao }),
                    ...(filtros.orgao && { orgao: filtros.orgao }),
                    ...(filtros.pub_date__gte && { pub_date__gte: filtros.pub_date__gte }),
                    ...(filtros.pub_date__lte && { pub_date__lte: filtros.pub_date__lte }),
                    ...(filtros.homolog_date__gte && { homolog_date__gte: filtros.homolog_date__gte }),
                    ...(filtros.homolog_date__lte && { homolog_date__lte: filtros.homolog_date__lte }),
                    ...(filtros.julg_date__gte && { julg_date__gte: filtros.julg_date__gte }),
                    ...(filtros.julg_date__lte && { julg_date__lte: filtros.julg_date__lte }),
                })
                const respCount = await fetch(`${acUrl}/licitacao/estabelecimento/${estId}/?${params}`)
                if (!respCount.ok) throw new Error('Erro ao buscar total de licitações')
                const totalCount = await respCount.json()
                setTotalItems(totalCount)
            }

            // Busca as licitações da página atual
            const params = new URLSearchParams({
                offset: String((page - 1) * itensPorPagina),
                ...(filtros.objeto__icontains && { objeto__icontains: filtros.objeto__icontains }),
                ...(filtros.num_processo__icontains && { num_processo__icontains: filtros.num_processo__icontains }),
                ...(filtros.modalidade && { modalidade: filtros.modalidade }),
                ...(filtros.situacao && { situacao: filtros.situacao }),
                ...(filtros.orgao && { orgao: filtros.orgao }),
                ...(filtros.pub_date__gte && { pub_date__gte: filtros.pub_date__gte }),
                ...(filtros.pub_date__lte && { pub_date__lte: filtros.pub_date__lte }),
                ...(filtros.homolog_date__gte && { homolog_date__gte: filtros.homolog_date__gte }),
                ...(filtros.homolog_date__lte && { homolog_date__lte: filtros.homolog_date__lte }),
                ...(filtros.julg_date__gte && { julg_date__gte: filtros.julg_date__gte }),
                ...(filtros.julg_date__lte && { julg_date__lte: filtros.julg_date__lte }),
            })

            const response = await fetch(`${acUrl}/licitacao/estabelecimento/${estId}/?${params}&relations=modalidade`)

            if (!response.ok) throw new Error('Erro ao obter licitações')

            const resposta = await response.json()

            const licitacoesData = resposta.map((licitacao) => {
                const orgaoEncontrado = orgaos.find(orgao => orgao.id === licitacao.orgao)

                return {
                    ...licitacao, // Manter todos os dados originais
                    orgao_nome: orgaoEncontrado?.nome,
                    orgao_id: licitacao.orgao?.id || licitacao.orgao,
                    situacao: licitacao.situacao.toUpperCase().replaceAll('_', ' '),
                    modalidade_nome: licitacao.modalidade.nome,
                    modalidade_id: licitacao.modalidade?.id || licitacao.modalidade,
                    pub_date: formatDateBR(licitacao.pub_date),
                    valor_estimado_formatado: `R$ ${parseFloat(licitacao.valor_estimado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                }
            })
            setListaLicitacoes(licitacoesData)
            setLicitacoesFiltradas(licitacoesData)
            setPaginaAtual(page)
        } catch (error) {
            console.error('Erro ao obter licitações:', error)
            toast.error('Erro ao carregar licitações')
        } finally {
            setLoadingLicitacoes(false)
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

    const getModalidades = async () => {
        try {
            const response = await fetch(`${acUrl}/modalidade/estabelecimento/${estId}/`, {
                method: 'GET',
            })
            if (!response.ok) throw new Error('Erro ao obter modalidades')
            const modalidades = await response.json()
            setListaModalidades(modalidades)
            return modalidades // Retorna os dados para uso imediato
        } catch (error) {
            console.error('Erro ao obter modalidades:', error)
            return []
        }
    }

    const getDadosResponsavel = async () => {
        try {
            const response = await fetch(`${acUrl}/comissao/responsavel/?estabelecimento=${estId}`, {
                method: 'GET',
            })
            if (response.ok) {
                const dados = await response.json()
                setDadosResponsavel(dados)
            }
        }
        catch (error) {
            console.error('Erro ao obter dados do responsável:', error)
        }
    }

    const getDocumentosLicitacao = async (licitacao) => {
        try {
            const response = await fetch(`${acUrl}/licitacao/${licitacao.id}/docs/`, {
                method: 'GET',
            })
            if (response.ok) {
                const documentos = await response.json()
                setDocumentosLicitacao(documentos)
            }
        }
        catch (error) {
            console.error('Erro ao obter documentos da licitação:', error)
        }
    }

    // Função para formatar CPF
    const formatarCPF = (cpf) => {
        if (!cpf) return '';
        const v = cpf.replace(/\D/g, '').slice(0, 11);
        return v
            .replace(/^(\d{3})(\d)/, '$1.$2')
            .replace(/^(\d{3}\.\d{3})(\d)/, '$1.$2')
            .replace(/^(\d{3}\.\d{3}\.\d{3})(\d)/, '$1-$2');
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
        getLicitacoes(true, 1, listaOrgaos)
    })

    const handleVisualizar = async (licitacao) => {
        setLicitacaoSelecionada(licitacao)
        setVisualizando(true)
        try {
            await getDadosResponsavel()
            await getDocumentosLicitacao(licitacao)
        } catch (error) {
            console.error(error)
        }
    }

    const handleFecharVisualizacao = () => {
        setVisualizando(false)
        setLicitacaoSelecionada(null)
        setDocumentosLicitacao([])
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
        for (const doc of documentosLicitacao) {
            await handleDownloadDoc(doc)
        }
    }

    const handleDownloadDocs = async (licitacao) => {
        try {
            const response = await fetch(`${acUrl}/licitacao/${licitacao.id}/docs/`, {
                method: 'GET',
            })

            if (!response.ok) throw new Error('Erro ao obter documentos')

            const documentos = await response.json()

            if (documentos.length === 0) {
                toast.info('Nenhum documento encontrado para esta licitação')
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
            ...(filtros.modalidade && { modalidade: filtros.modalidade }),
            ...(filtros.orgao && { orgao: filtros.orgao }),
            ...(filtros.situacao && { situacao: filtros.situacao }),
            ...(filtros.pub_date__gte && { pub_date__gte: filtros.pub_date__gte }),
            ...(filtros.pub_date__lte && { pub_date__lte: filtros.pub_date__lte }),
        })

        try {
            const response = await fetch(`${acUrl}/licitacao/estabelecimento/${estId}/exportar/?type=${formato}&${params}`, {
                method: 'GET',
            })

            if (!response.ok) throw new Error('Falha ao exportar registros')

            const blob = await response.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `licitacoes.${formato}`
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
                await getModalidades()
                await getLicitacoes(true, 1, orgaos)
            }
            loadData()
        }
    }, [estId])

    useEffect(() => {
        setFiltros(prev => ({
            ...prev,
            objeto__icontains: '',
            num_processo__icontains: '',
            pub_date__gte: '',
            pub_date__lte: '',
            modalidade: params.get('modalidade') || '',
            situacao: params.get('situacao') || '',
            orgao: params.get('orgao') || '',
            homolog_date__gte: '',
            homolog_date__lte: '',
            julg_date__gte: '',
            julg_date__lte: ''
        }))
    }, [params])

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
                titulo="Filtros de Licitações"
                filtros={filtros}
                onFiltroChange={handleFiltroChange}
                labelsMap={{ orgao: Object.fromEntries(listaOrgaos.map(o => [o.id, o.nome])) }}
                onLimparFiltros={() => setFiltros({
                    objeto__icontains: '',
                    num_processo__icontains: '',
                    modalidade: '',
                    situacao: '',
                    orgao: '',
                    pub_date__gte: '',
                    pub_date__lte: '',
                    homolog_date__gte: '',
                    homolog_date__lte: '',
                    julg_date__gte: '',
                    julg_date__lte: ''
                })}
            >
                <CampoInput
                    label="Objeto da Licitação"
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
                    label="Órgão"
                    name="orgao"
                    value={filtros.orgaoId}
                    onChange={handleFiltroChange}
                    options={listaOrgaos}
                    placeholder="Todos os órgãos"
                    colSpan="md:col-span-2"
                    icone={<FaBuilding />}
                />

                <CampoSelect
                    label="Modalidade"
                    name="modalidade"
                    value={filtros.modalidade}
                    onChange={handleFiltroChange}
                    options={listaModalidades}
                    placeholder="Todas as modalidades"
                    colSpan="md:col-span-2"
                    icone={<FaGavel />}
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
                    label="Data de Homologação (Inicial)"
                    name="homolog_date__gte"
                    value={filtros.homolog_date__gte}
                    onChange={handleFiltroChange}
                    colSpan="md:col-span-3"
                    icone={<FaCalendarAlt />}
                />

                <CampoData
                    label="Data de Homologação (Final)"
                    name="homolog_date__lte"
                    value={filtros.homolog_date__lte}
                    onChange={handleFiltroChange}
                    colSpan="md:col-span-3"
                    icone={<FaCalendarAlt />}
                />

                <CampoData
                    label="Data de Julgamento (Inicial)"
                    name="julg_date__gte"
                    value={filtros.julg_date__gte}
                    onChange={handleFiltroChange}
                    colSpan="md:col-span-3"
                    icone={<FaCalendarAlt />}
                />

                <CampoData
                    label="Data de Julgamento (Final)"
                    name="julg_date__lte"
                    value={filtros.julg_date__lte}
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
                    <h1 className="text-xl font-bold">Licitações</h1>
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
                    listaDados={licitacoesFiltradas}
                    listaColunas={listaColunas}
                    acoes={acoes}
                    itensPorPagina={itensPorPagina}
                    loading={loadingLicitacoes}
                />

                <PaginacaoAvancada
                    totalItens={totalItems}
                    itensPorPagina={itensPorPagina}
                    paginaAtual={paginaAtual}
                    onMudarPagina={page => {
                        setPaginaAtual(page)
                        getLicitacoes(false, page, listaOrgaos)
                    }}
                />
            </div>

            {visualizando && licitacaoSelecionada && (
                <Modal isOpen={visualizando} onClose={handleFecharVisualizacao} title={`Detalhes da Licitação - ${licitacaoSelecionada.num_processo}`}>
                    <div className="p-6 overflow-y-auto">
                        <div className="flex flex-wrap gap-4 bg-white p-4 shadow-lg rounded mb-6">
                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Órgão:</strong>
                                <span className="break-words">{licitacaoSelecionada.orgao?.nome || licitacaoSelecionada.orgao_nome}</span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Número do Processo:</strong>
                                <span className="break-words">{licitacaoSelecionada.num_processo}</span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Modalidade:</strong>
                                <span className="break-words">{licitacaoSelecionada.modalidade?.nome || licitacaoSelecionada.modalidade_nome}</span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Situação:</strong>
                                <span className="break-words">{licitacaoSelecionada.situacao}</span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Data de Publicação:</strong>
                                <span className="break-words">
                                    {licitacaoSelecionada.pub_date ? licitacaoSelecionada.pub_date : 'N/A'}
                                </span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Data de Homologação:</strong>
                                <span className="break-words">
                                    {licitacaoSelecionada.homolog_date ? formatDateBR(licitacaoSelecionada.homolog_date) : 'N/A'}
                                </span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Data de Julgamento:</strong>
                                <span className="break-words">
                                    {licitacaoSelecionada.julg_date ? formatDateBR(licitacaoSelecionada.julg_date) : 'Não Julgado'}
                                </span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Valor estimado:</strong>
                                <span className="break-words">R${String(licitacaoSelecionada.valor_estimado).replace('.', ',')}</span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Valor total vencedor:</strong>
                                <span className="break-words">R${String(licitacaoSelecionada.valor_vencedor).replace('.', ',')}</span>
                            </div>

                            <div className="flex flex-col w-full">
                                <strong>Objeto:</strong>
                                <span className="break-words whitespace-pre-wrap">{licitacaoSelecionada.objeto}</span>
                            </div>
                        </div>

                        <h2 className="text-md font-semibold mb-2">Responsável pela Comissão de Licitação</h2>
                        <div className="flex w-full items-center gap-8 bg-white p-4 shadow-lg rounded mb-4">
                            <div className="flex gap-2">
                                <strong>Nome:</strong>
                                <span className="break-words">{dadosResponsavel?.nome}</span>
                            </div>
                            <div className="flex gap-2">
                                <strong>CPF:</strong>
                                <span className="break-words">{formatarCPF(dadosResponsavel?.cpf)}</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-center w-full p-2">
                            <h2 className="text-md font-semibold mb-2">Documentos inclusos na licitação</h2>
                        </div>

                        {documentosLicitacao.length > 0 ? (
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
                                        {documentosLicitacao.map((doc) => (
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
