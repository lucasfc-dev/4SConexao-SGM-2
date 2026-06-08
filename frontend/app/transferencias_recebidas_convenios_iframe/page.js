
'use client'

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import Tabela from "../components/tabela"
import FormularioFiltrosAvancado, { CampoInput, CampoData } from "../components/FormularioFiltrosAvancado"
import { FaDownload, FaEye, FaBuilding, FaCalendarAlt, FaList } from "react-icons/fa"
import { toast, ToastContainer } from "react-toastify"
import 'react-toastify/dist/ReactToastify.css'
import Modal from "../components/modal"
import PaginacaoAvancada from "../components/PaginacaoAvancada"

const transparenciaUrl = process.env.NEXT_PUBLIC_TRANSPARENCIA_ENDPOINT_URL

function formatDateBR(dateStr) {
    if (!dateStr) return ''
    const [datePart] = dateStr.split('T')
    const [year, month, day] = datePart.split('-')
    if (!year || !month || !day || year.length !== 4) return ''
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`
}

function formatMoeda(value) {
    if (value == null) return '—'
    return `R$ ${parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}

export default function TransferenciasRecebidasConveniosIframe() {
    const params = useSearchParams()
    const estId = params.get('id')

    const itensPorPagina = 10
    const [listaRegistros, setListaRegistros] = useState([])
    const [totalItems, setTotalItems] = useState(0)
    const [paginaAtual, setPaginaAtual] = useState(1)
    const [loading, setLoading] = useState(false)
    const [exportMenuOpen, setExportMenuOpen] = useState(false)

    const [visualizando, setVisualizando] = useState(false)
    const [registroSelecionado, setRegistroSelecionado] = useState(null)

    const [filtros, setFiltros] = useState({
        orgao_repassador: '',
        numero_convenio: '',
        ano_convenio: '',
        data_inicio_vigencia__gte: '',
        data_inicio_vigencia__lte: '',
        data_fim_vigencia__gte: '',
        data_fim_vigencia__lte: '',
    })

    const acoes = [
        {
            nome: <FaEye size={28} className="text-azul_escuro hover:text-laranja_escuro transition-colors" />,
            handler: (registro) => { setRegistroSelecionado(registro); setVisualizando(true) }
        },
        {
            nome: <FaDownload size={28} className="text-azul_escuro hover:text-laranja_escuro transition-colors" />,
            handler: (registro) => handleDownload(registro)
        }
    ]

    const listaColunas = [
        { nomeColuna: 'Órgão Repassador', coluna: 'orgao_repassador' },
        { nomeColuna: 'Nº/Ano', coluna: 'num_ano_convenio' },
        { nomeColuna: 'Objeto', coluna: 'objeto' },
        { nomeColuna: 'Valor Total', coluna: 'valor_total_formatado' },
        { nomeColuna: 'Valor Repassado', coluna: 'valor_repassado_formatado' },
        { nomeColuna: 'Vigência', coluna: 'vigencia_formatada' },
    ]

    const getRegistros = async (resetCount, page = 1) => {
        setLoading(true)
        try {
            const offset = (page - 1) * itensPorPagina
            const queryParams = new URLSearchParams({
                offset: String(offset),
                limit: String(itensPorPagina),
                ...(filtros.orgao_repassador && { orgao_repassador: filtros.orgao_repassador }),
                ...(filtros.numero_convenio && { numero_convenio: filtros.numero_convenio }),
                ...(filtros.ano_convenio && { ano_convenio: filtros.ano_convenio }),
                ...(filtros.data_inicio_vigencia__gte && { data_inicio_vigencia__gte: filtros.data_inicio_vigencia__gte }),
                ...(filtros.data_inicio_vigencia__lte && { data_inicio_vigencia__lte: filtros.data_inicio_vigencia__lte }),
                ...(filtros.data_fim_vigencia__gte && { data_fim_vigencia__gte: filtros.data_fim_vigencia__gte }),
                ...(filtros.data_fim_vigencia__lte && { data_fim_vigencia__lte: filtros.data_fim_vigencia__lte }),
            })

            const response = await fetch(`${transparenciaUrl}/transferencia_recebida_convenio/${estId}/?${queryParams}`)
            if (!response.ok) throw new Error('Erro ao obter transferências recebidas')

            const result = await response.json()
            const data = (result.data || []).map(item => ({
                ...item,
                num_ano_convenio: `${item.numero_convenio || ''}/${item.ano_convenio || ''}`,
                valor_total_formatado: formatMoeda(item.valor_total),
                valor_repassado_formatado: formatMoeda(item.valor_repassado),
                vigencia_formatada: [
                    item.data_inicio_vigencia ? formatDateBR(item.data_inicio_vigencia) : '',
                    item.data_fim_vigencia ? `até ${formatDateBR(item.data_fim_vigencia)}` : ''
                ].filter(Boolean).join(' ') || '—',
            }))

            setListaRegistros(data)
            if (resetCount) setTotalItems(result.meta?.total || 0)
            setPaginaAtual(page)
        } catch (error) {
            console.error('Erro ao obter transferências recebidas:', error)
            toast.error('Erro ao carregar transferências recebidas')
        } finally {
            setLoading(false)
        }
    }

    const handleDownload = async (registro) => {
        try {
            const response = await fetch(`${transparenciaUrl}/transferencia_recebida_convenio/${registro.id}/arquivo/`)
            if (!response.ok) throw new Error('Arquivo não encontrado')
            const blob = await response.blob()
            if (blob.size === 0) { toast.info('Nenhum arquivo disponível'); return }
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `convenio_${registro.numero_convenio}_${registro.ano_convenio}`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
            toast.success('Download iniciado!')
        } catch (error) {
            console.error('Erro ao baixar arquivo:', error)
            toast.error('Erro ao baixar arquivo')
        }
    }

    const handleFiltroChange = (campo, valor) => setFiltros(prev => ({ ...prev, [campo]: valor }))

    const handleBuscar = (event) => {
        if (event) event.preventDefault()
        setPaginaAtual(1)
        getRegistros(true, 1)
    }

    const handleExport = async (formato) => {
        const queryParams = new URLSearchParams({
            ...(filtros.orgao_repassador && { orgao_repassador: filtros.orgao_repassador }),
            ...(filtros.numero_convenio && { numero_convenio: filtros.numero_convenio }),
            ...(filtros.ano_convenio && { ano_convenio: filtros.ano_convenio }),
            ...(filtros.data_inicio_vigencia__gte && { data_inicio_vigencia__gte: filtros.data_inicio_vigencia__gte }),
            ...(filtros.data_inicio_vigencia__lte && { data_inicio_vigencia__lte: filtros.data_inicio_vigencia__lte }),
            ...(filtros.data_fim_vigencia__gte && { data_fim_vigencia__gte: filtros.data_fim_vigencia__gte }),
            ...(filtros.data_fim_vigencia__lte && { data_fim_vigencia__lte: filtros.data_fim_vigencia__lte }),
        })
        try {
            const response = await fetch(`${transparenciaUrl}/transferencia_recebida_convenio/${estId}/exportar/?type=${formato}&${queryParams}`)
            if (!response.ok) throw new Error('Falha ao exportar')
            const blob = await response.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `transferencias_recebidas_convenios.${formato}`
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
        if (estId) getRegistros(true, 1)
    }, [estId])

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

            <FormularioFiltrosAvancado
                titulo="Filtros de Transferências Recebidas por Convênios"
                filtros={filtros}
                onFiltroChange={handleFiltroChange}
                labelsMap={{}}
                onLimparFiltros={() => setFiltros({
                    orgao_repassador: '', numero_convenio: '', ano_convenio: '',
                    data_inicio_vigencia__gte: '', data_inicio_vigencia__lte: '',
                    data_fim_vigencia__gte: '', data_fim_vigencia__lte: ''
                })}
            >
                <CampoInput
                    label="Órgão Repassador"
                    name="orgao_repassador"
                    value={filtros.orgao_repassador}
                    onChange={handleFiltroChange}
                    placeholder="Filtrar por órgão repassador..."
                    colSpan="md:col-span-3"
                    icone={<FaBuilding />}
                />

                <CampoInput
                    label="Número do Convênio"
                    name="numero_convenio"
                    value={filtros.numero_convenio}
                    onChange={handleFiltroChange}
                    placeholder="Ex: 001"
                    colSpan="md:col-span-2"
                    icone={<FaList />}
                />

                <CampoInput
                    label="Ano do Convênio"
                    name="ano_convenio"
                    value={filtros.ano_convenio}
                    onChange={handleFiltroChange}
                    placeholder="Ex: 2024"
                    colSpan="md:col-span-1"
                    icone={<FaCalendarAlt />}
                />

                <CampoData
                    label="Início de Vigência (De)"
                    name="data_inicio_vigencia__gte"
                    value={filtros.data_inicio_vigencia__gte}
                    onChange={handleFiltroChange}
                    colSpan="md:col-span-3"
                    icone={<FaCalendarAlt />}
                />

                <CampoData
                    label="Início de Vigência (Até)"
                    name="data_inicio_vigencia__lte"
                    value={filtros.data_inicio_vigencia__lte}
                    onChange={handleFiltroChange}
                    colSpan="md:col-span-3"
                    icone={<FaCalendarAlt />}
                />

                <CampoData
                    label="Fim de Vigência (De)"
                    name="data_fim_vigencia__gte"
                    value={filtros.data_fim_vigencia__gte}
                    onChange={handleFiltroChange}
                    colSpan="md:col-span-3"
                    icone={<FaCalendarAlt />}
                />

                <CampoData
                    label="Fim de Vigência (Até)"
                    name="data_fim_vigencia__lte"
                    value={filtros.data_fim_vigencia__lte}
                    onChange={handleFiltroChange}
                    colSpan="md:col-span-3"
                    icone={<FaCalendarAlt />}
                />

                <button
                    className="px-2 py-3 md:col-span-6 bg-azul_escuro text-white font-medium rounded hover:bg-laranja_escuro transition-colors"
                    onClick={handleBuscar}
                >
                    Pesquisar
                </button>
            </FormularioFiltrosAvancado>

            <div className="flex flex-col bg-white rounded-2xl shadow-lg p-6 gap-2 md:p-8 border border-gray-100">
                <div className="flex justify-between items-center mb-2">
                    <h1 className="text-xl font-bold">Transferências Recebidas por Convênios</h1>
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
                                    <button onClick={() => handleExport('pdf')} className="w-full text-left px-4 py-2 hover:bg-gray-100">PDF</button>
                                </li>
                                <li>
                                    <button onClick={() => handleExport('xml')} className="w-full text-left px-4 py-2 hover:bg-gray-100">XML</button>
                                </li>
                                <li>
                                    <button onClick={() => handleExport('csv')} className="w-full text-left px-4 py-2 hover:bg-gray-100">CSV</button>
                                </li>
                            </ul>
                        )}
                    </div>
                </div>

                <Tabela
                    listaDados={listaRegistros}
                    listaColunas={listaColunas}
                    acoes={acoes}
                    itensPorPagina={itensPorPagina}
                    loading={loading}
                />

                <PaginacaoAvancada
                    totalItens={totalItems}
                    itensPorPagina={itensPorPagina}
                    paginaAtual={paginaAtual}
                    onMudarPagina={page => {
                        setPaginaAtual(page)
                        getRegistros(false, page)
                    }}
                />
            </div>

            {visualizando && registroSelecionado && (
                <Modal
                    isOpen={visualizando}
                    onClose={() => { setVisualizando(false); setRegistroSelecionado(null) }}
                    title={`Detalhes do Convênio - ${registroSelecionado.numero_convenio || ''}/${registroSelecionado.ano_convenio || ''}`}
                >
                    <div className="p-6 overflow-y-auto">
                        <div className="flex flex-wrap gap-4 bg-white p-4 shadow-lg rounded mb-6">
                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Órgão Repassador:</strong>
                                <span className="break-words">{registroSelecionado.orgao_repassador || '—'}</span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Número do Convênio:</strong>
                                <span className="break-words">{registroSelecionado.numero_convenio || '—'}</span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Ano do Convênio:</strong>
                                <span className="break-words">{registroSelecionado.ano_convenio || '—'}</span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Valor Total:</strong>
                                <span className="break-words">{formatMoeda(registroSelecionado.valor_total)}</span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Valor Repassado:</strong>
                                <span className="break-words">{formatMoeda(registroSelecionado.valor_repassado)}</span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Início de Vigência:</strong>
                                <span className="break-words">{formatDateBR(registroSelecionado.data_inicio_vigencia) || '—'}</span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Fim de Vigência:</strong>
                                <span className="break-words">{formatDateBR(registroSelecionado.data_fim_vigencia) || '—'}</span>
                            </div>

                            <div className="flex flex-col w-full">
                                <strong>Objeto:</strong>
                                <span className="break-words whitespace-pre-wrap">{registroSelecionado.objeto || '—'}</span>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </section>
    )
}
