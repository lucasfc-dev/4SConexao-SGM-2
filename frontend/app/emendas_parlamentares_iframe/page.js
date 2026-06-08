
'use client'

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import Tabela from "../components/tabela"
import FormularioFiltrosAvancado, { CampoInput, CampoData } from "../components/FormularioFiltrosAvancado"
import { FaDownload, FaEye, FaFileAlt, FaCalendarAlt, FaList, FaUser } from "react-icons/fa"
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

export default function EmendasParlamentaresIframe() {
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
        origem: '',
        numero: '',
        tipo: '',
        autor: '',
        beneficiario: '',
        ano_referencia: '',
        forma_repasse: '',
        data_publicacao__gte: '',
        data_publicacao__lte: '',
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
        { nomeColuna: 'Origem', coluna: 'origem' },
        { nomeColuna: 'Número', coluna: 'numero' },
        { nomeColuna: 'Data de Publicação', coluna: 'data_publicacao_formatada' },
        { nomeColuna: 'Tipo', coluna: 'tipo' },
        { nomeColuna: 'Beneficiário', coluna: 'beneficiario' },
        { nomeColuna: 'Valor Repassado', coluna: 'valor_repassado_formatado' },
    ]

    const getRegistros = async (resetCount, page = 1) => {
        setLoading(true)
        try {
            const offset = (page - 1) * itensPorPagina
            const queryParams = new URLSearchParams({
                offset: String(offset),
                limit: String(itensPorPagina),
                ...(filtros.origem && { origem: filtros.origem }),
                ...(filtros.numero && { numero: filtros.numero }),
                ...(filtros.tipo && { tipo: filtros.tipo }),
                ...(filtros.autor && { autor: filtros.autor }),
                ...(filtros.beneficiario && { beneficiario: filtros.beneficiario }),
                ...(filtros.ano_referencia && { ano_referencia: filtros.ano_referencia }),
                ...(filtros.forma_repasse && { forma_repasse: filtros.forma_repasse }),
                ...(filtros.data_publicacao__gte && { data_publicacao__gte: filtros.data_publicacao__gte }),
                ...(filtros.data_publicacao__lte && { data_publicacao__lte: filtros.data_publicacao__lte }),
            })

            const response = await fetch(`${transparenciaUrl}/emenda_parlamentar/${estId}/?${queryParams}`)
            if (!response.ok) throw new Error('Erro ao obter emendas parlamentares')

            const result = await response.json()
            const data = (result.data || []).map(item => ({
                ...item,
                data_publicacao_formatada: formatDateBR(item.data_publicacao),
                valor_repassado_formatado: formatMoeda(item.valor_repassado),
            }))

            setListaRegistros(data)
            if (resetCount) setTotalItems(result.meta?.total || 0)
            setPaginaAtual(page)
        } catch (error) {
            console.error('Erro ao obter emendas:', error)
            toast.error('Erro ao carregar emendas parlamentares')
        } finally {
            setLoading(false)
        }
    }

    const handleDownload = async (registro) => {
        try {
            const response = await fetch(`${transparenciaUrl}/emenda_parlamentar/${registro.id}/arquivo/`)
            if (!response.ok) throw new Error('Arquivo não encontrado')
            const blob = await response.blob()
            if (blob.size === 0) { toast.info('Nenhum arquivo disponível'); return }
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `emenda_${registro.numero || registro.id}`
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
            ...(filtros.origem && { origem: filtros.origem }),
            ...(filtros.numero && { numero: filtros.numero }),
            ...(filtros.tipo && { tipo: filtros.tipo }),
            ...(filtros.autor && { autor: filtros.autor }),
            ...(filtros.beneficiario && { beneficiario: filtros.beneficiario }),
            ...(filtros.ano_referencia && { ano_referencia: filtros.ano_referencia }),
            ...(filtros.forma_repasse && { forma_repasse: filtros.forma_repasse }),
            ...(filtros.data_publicacao__gte && { data_publicacao__gte: filtros.data_publicacao__gte }),
            ...(filtros.data_publicacao__lte && { data_publicacao__lte: filtros.data_publicacao__lte }),
        })
        try {
            const response = await fetch(`${transparenciaUrl}/emenda_parlamentar/${estId}/exportar/?type=${formato}&${queryParams}`)
            if (!response.ok) throw new Error('Falha ao exportar')
            const blob = await response.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `emendas_parlamentares.${formato}`
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
                titulo="Filtros de Emendas Parlamentares"
                filtros={filtros}
                onFiltroChange={handleFiltroChange}
                labelsMap={{}}
                onLimparFiltros={() => setFiltros({
                    origem: '', numero: '', tipo: '', autor: '', beneficiario: '',
                    ano_referencia: '', forma_repasse: '', data_publicacao__gte: '', data_publicacao__lte: ''
                })}
            >
                <CampoInput
                    label="Origem"
                    name="origem"
                    value={filtros.origem}
                    onChange={handleFiltroChange}
                    placeholder="Ex: Federal..."
                    colSpan="md:col-span-3"
                    icone={<FaFileAlt />}
                />

                <CampoInput
                    label="Número"
                    name="numero"
                    value={filtros.numero}
                    onChange={handleFiltroChange}
                    placeholder="Ex: 001/2024"
                    colSpan="md:col-span-3"
                    icone={<FaList />}
                />

                <CampoInput
                    label="Tipo"
                    name="tipo"
                    value={filtros.tipo}
                    onChange={handleFiltroChange}
                    placeholder="Filtrar por tipo..."
                    colSpan="md:col-span-2"
                    icone={<FaList />}
                />

                <CampoInput
                    label="Autor"
                    name="autor"
                    value={filtros.autor}
                    onChange={handleFiltroChange}
                    placeholder="Filtrar por autor..."
                    colSpan="md:col-span-2"
                    icone={<FaUser />}
                />

                <CampoInput
                    label="Beneficiário"
                    name="beneficiario"
                    value={filtros.beneficiario}
                    onChange={handleFiltroChange}
                    placeholder="Filtrar por beneficiário..."
                    colSpan="md:col-span-2"
                    icone={<FaUser />}
                />

                <CampoInput
                    label="Ano de Referência"
                    name="ano_referencia"
                    value={filtros.ano_referencia}
                    onChange={handleFiltroChange}
                    placeholder="Ex: 2024"
                    colSpan="md:col-span-3"
                    icone={<FaCalendarAlt />}
                />

                <CampoInput
                    label="Forma de Repasse"
                    name="forma_repasse"
                    value={filtros.forma_repasse}
                    onChange={handleFiltroChange}
                    placeholder="Filtrar por forma de repasse..."
                    colSpan="md:col-span-3"
                    icone={<FaList />}
                />

                <CampoData
                    label="Data de Publicação (Inicial)"
                    name="data_publicacao__gte"
                    value={filtros.data_publicacao__gte}
                    onChange={handleFiltroChange}
                    colSpan="md:col-span-3"
                    icone={<FaCalendarAlt />}
                />

                <CampoData
                    label="Data de Publicação (Final)"
                    name="data_publicacao__lte"
                    value={filtros.data_publicacao__lte}
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
                    <h1 className="text-xl font-bold">Emendas Parlamentares</h1>
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
                    title={`Detalhes da Emenda Parlamentar - ${registroSelecionado.numero || ''}`}
                >
                    <div className="p-6 overflow-y-auto">
                        <div className="flex flex-wrap gap-4 bg-white p-4 shadow-lg rounded mb-6">
                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Origem:</strong>
                                <span className="break-words">{registroSelecionado.origem || '—'}</span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Número:</strong>
                                <span className="break-words">{registroSelecionado.numero || '—'}</span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Tipo:</strong>
                                <span className="break-words">{registroSelecionado.tipo || '—'}</span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Autor:</strong>
                                <span className="break-words">{registroSelecionado.autor || '—'}</span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Data de Publicação:</strong>
                                <span className="break-words">{registroSelecionado.data_publicacao_formatada || '—'}</span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Ano de Referência:</strong>
                                <span className="break-words">{registroSelecionado.ano_referencia || '—'}</span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Forma de Repasse:</strong>
                                <span className="break-words">{registroSelecionado.forma_repasse || '—'}</span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Função de Governo:</strong>
                                <span className="break-words">{registroSelecionado.funcao_governo || '—'}</span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Valor Previsto:</strong>
                                <span className="break-words">{formatMoeda(registroSelecionado.valor_previsto)}</span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Valor Repassado:</strong>
                                <span className="break-words">{formatMoeda(registroSelecionado.valor_repassado)}</span>
                            </div>

                            <div className="flex flex-col w-full">
                                <strong>Beneficiário:</strong>
                                <span className="break-words">{registroSelecionado.beneficiario || '—'}</span>
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
