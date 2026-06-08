'use client'
import { useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import Cookies from "js-cookie"
import { FaDownload, FaEye, FaTrash, FaUser, FaBuilding, FaCalendarAlt, FaFlag } from "react-icons/fa"
import { toast, ToastContainer } from "react-toastify"
import 'react-toastify/dist/ReactToastify.css'
import Modal from "@/app/components/modal"
import Tabela from "@/app/components/tabela"
import FormularioFiltrosAvancado, { CampoInput, CampoSelect, CampoData } from "@/app/components/FormularioFiltrosAvancado"

const acUrl = process.env.NEXT_PUBLIC_AC_ENDPOINT_URL

export default function FiscalContratoIframe() {
    const params = useSearchParams()
    const estId = params.get('id')

    const [listaFiscaisContrato, setListaFiscaisContrato] = useState([])
    const [fiscaisFiltrados, setFiscaisFiltrados] = useState([])
    const [loadingFiscais, setLoadingFiscais] = useState(false)
    const [documentosFiscal, setDocumentosFiscal] = useState([])
    const token = Cookies.get('auth-token')
    const [visualizando, setVisualizando] = useState(false)
    const [orgaos, setOrgaos] = useState([])
    const [fiscalSelecionado, setFiscalSelecionado] = useState(null)
    const [exportMenuOpen, setExportMenuOpen] = useState(false)

    // Estado dos filtros
    const [filtros, setFiltros] = useState({
        nome: '',
        orgaoId: '',
        dataInicial: '',
        dataFinal: ''
    })

    const acoesFiscal = [
        {
            nome: <FaEye size={20} className="text-azul_escuro transition-colors" />,
            handler: handleVisualizar,
        },
    ]

    const listaColunas = [
        { nomeColuna: 'Nome', coluna: 'pessoa_nome' },
        { nomeColuna: 'Órgão', coluna: 'orgao_nome' },
        { nomeColuna: 'Data de Início', coluna: 'data_inicio_formatada' },
        { nomeColuna: 'Data de Fim', coluna: 'data_fim_formatada' },
    ]

    // Fetch de órgãos
    const fetchOrgaos = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH_ENDPOINT_URL}/orgao/estabelecimento/${estId}/`, {
                method: 'GET',
            })
            if (!response.ok) throw new Error('Erro ao obter órgãos')
            const listaOrgaos = await response.json()
            setOrgaos(listaOrgaos)
            return listaOrgaos
        } catch (err) {
            toast.error('Erro ao obter órgãos')
            return []
        }
    }

    const fetchFiscaisContrato = async (orgaosData = orgaos) => {
        try {
            setLoadingFiscais(true)
            const response = await fetch(`${acUrl}/fiscal_contrato/estabelecimento/${estId}/?relations=pessoa&relations=vigencias`, {
                method: 'GET',
            })

            if (!response.ok) throw new Error('Erro ao obter fiscais')

            const fiscais = await response.json()

            // Expande: uma linha por (fiscal, vigência)
            const rows = []
            fiscais.forEach(fiscal => {
                const orgaoEncontrado = orgaosData.find(orgao =>
                    orgao.id === (fiscal.orgao?.id || fiscal.orgao)
                )
                const baseData = {
                    ...fiscal,
                    fiscal_id: fiscal.id,
                    pessoa_nome: fiscal.pessoa?.nome || fiscal.pessoa?.nome_fantasia,
                    orgao_nome: orgaoEncontrado?.nome || 'Órgão não encontrado',
                    orgao_id: fiscal.orgao?.id || fiscal.orgao,
                }

                const vigencias = fiscal.vigencias || []
                if (vigencias.length === 0) {
                    rows.push({
                        ...baseData,
                        vigencia_id: null,
                        data_inicio: null,
                        data_fim: null,
                        data_inicio_formatada: 'N/A',
                        data_fim_formatada: 'N/A',
                    })
                } else {
                    vigencias.forEach(vigencia => {
                        rows.push({
                            ...baseData,
                            id: `${fiscal.id}_${vigencia.id}`,
                            vigencia_id: vigencia.id,
                            data_inicio: vigencia.data_inicio,
                            data_fim: vigencia.data_fim,
                            data_inicio_formatada: vigencia.data_inicio ? vigencia.data_inicio.split('-').reverse().join('/') : 'N/A',
                            data_fim_formatada: vigencia.data_fim ? vigencia.data_fim.split('-').reverse().join('/') : 'Vigente',
                        })
                    })
                }
            })

            setListaFiscaisContrato(rows)
            setFiscaisFiltrados(rows)
            return rows
        } catch (error) {
            console.error('Erro ao obter fiscais:', error)
            toast.error('Erro ao carregar fiscais')
            return []
        } finally {
            setLoadingFiscais(false)
        }
    }

    const handleFiltroChange = (campo, valor) => {
        setFiltros(prev => ({
            ...prev,
            [campo]: valor
        }))
    }

    const handleBuscar = useCallback((event) => {
        if (event) {
            event.preventDefault()
        }

        const filtered = listaFiscaisContrato.filter((fiscal) => {
            const nomeMatch = !filtros.nome ||
                fiscal.pessoa_nome?.toLowerCase().includes(filtros.nome.toLowerCase())

            const orgaoMatch = !filtros.orgaoId ||
                String(fiscal.orgao_id) === String(filtros.orgaoId)

            let dataMatch = true
            if (filtros.dataInicial || filtros.dataFinal) {
                const dataFiscal = fiscal.data_inicio
                const dataInicial = filtros.dataInicial || null
                const dataFinal = filtros.dataFinal || null

                dataMatch = (!dataInicial || dataFiscal >= dataInicial) &&
                    (!dataFinal || dataFiscal <= dataFinal)
            }

            return nomeMatch && orgaoMatch && dataMatch
        })

        setFiscaisFiltrados(filtered)
    }, [filtros, listaFiscaisContrato])

    const handleExport = async (formato) => {
        const params = new URLSearchParams({
            ...(filtros.nome && { nome: filtros.nome }),
        })
        try {
            const response = await fetch(`${acUrl}/fiscal_contrato/estabelecimento/${estId}/exportar/?type=${formato}&${params}`, {
                method: 'GET',
            })
            if (!response.ok) throw new Error('Falha ao exportar registros')
            const blob = await response.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `fiscais_contrato.${formato}`
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

    async function handleVisualizar(fiscal) {
        setFiscalSelecionado(fiscal)
        setVisualizando(true)
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

    const handleGetDocumentos = useCallback(async (fiscal) => {
        try {
            const response = await fetch(`${acUrl}/fiscal_contrato/${fiscal.fiscal_id || fiscal.id}/docs/`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            if (response.ok) {
                const documentos = await response.json()
                setDocumentosFiscal(documentos)
            } else {
                throw new Error('Erro ao obter documentos do fiscal')
            }
        } catch (err) {
            toast.error(err.message || err)
        }
    }, [token])

    useEffect(() => {
        if (fiscalSelecionado) {
            handleGetDocumentos(fiscalSelecionado)
        }
    }, [handleGetDocumentos, fiscalSelecionado])

    // Inicialização
    useEffect(() => {
        if (estId) {
            const loadData = async () => {
                const orgaosData = await fetchOrgaos()
                await fetchFiscaisContrato(orgaosData)
            }
            loadData()
        }
    }, [estId])

    // Aplicar filtros quando mudarem
    useEffect(() => {
        if (listaFiscaisContrato.length > 0) {
            handleBuscar()
        }
    }, [filtros, listaFiscaisContrato, handleBuscar])

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
            <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />

            {/* Filtros */}
            <FormularioFiltrosAvancado
                titulo="Filtros de Fiscais de Contrato"
                filtros={filtros}
                onFiltroChange={handleFiltroChange}
                labelsMap={{ orgaoId: Object.fromEntries(orgaos.map(o => [o.id, o.nome])) }}
                onLimparFiltros={() => setFiltros({
                    nome: '',
                    orgaoId: '',
                    dataInicial: '',
                    dataFinal: ''
                })}
            >
                <CampoInput
                    label="Nome do Fiscal"
                    name="nome"
                    value={filtros.nome}
                    onChange={handleFiltroChange}
                    placeholder="Ex: João Silva, Maria Santos..."
                    colSpan="md:col-span-3"
                    icone={<FaUser />}
                />

                <CampoSelect
                    label="Órgão"
                    name="orgaoId"
                    value={filtros.orgaoId}
                    onChange={handleFiltroChange}
                    options={orgaos}
                    placeholder="Todos os órgãos"
                    colSpan="md:col-span-3"
                    icone={<FaBuilding />}
                />

                <CampoData
                    label="Data Inicial"
                    name="dataInicial"
                    value={filtros.dataInicial}
                    onChange={handleFiltroChange}
                    colSpan="md:col-span-2"
                    icone={<FaCalendarAlt />}
                />

                <CampoData
                    label="Data Final"
                    name="dataFinal"
                    value={filtros.dataFinal}
                    onChange={handleFiltroChange}
                    colSpan="md:col-span-2"
                    icone={<FaCalendarAlt />}
                />
            </FormularioFiltrosAvancado>

            {/* Tabela de Fiscais */}
            <div className="flex flex-col bg-white rounded-2xl shadow-lg p-6 gap-2 md:p-8 border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-xl font-bold text-azul_escuro">Fiscais de Contrato</h1>
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

                {/* Tabela */}
                <Tabela
                    listaDados={fiscaisFiltrados}
                    listaColunas={listaColunas}
                    acoes={acoesFiscal}
                    itensPorPagina={15}
                    loading={loadingFiscais}
                />
            </div>


            {/* Modal de Visualização */}
            {fiscalSelecionado && visualizando && (
                <Modal isOpen={visualizando} onClose={() => setVisualizando(false)} title="Detalhes do Fiscal">
                    <div className="p-6 overflow-y-auto">
                        <div className="flex flex-wrap gap-4 bg-white p-4 shadow-lg rounded mb-6">
                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Nome:</strong>
                                <span className="break-words">{fiscalSelecionado.pessoa_nome}</span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Órgão:</strong>
                                <span className="break-words">{fiscalSelecionado.orgao_nome}</span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Data de Início:</strong>
                                <span className="break-words">{fiscalSelecionado.data_inicio_formatada}</span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Data de Fim:</strong>
                                <span className="break-words">{fiscalSelecionado.data_fim_formatada}</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-center w-full p-2">
                            <h2 className="text-md font-semibold mb-2">Documento de nomeação do fiscal</h2>
                        </div>

                        {documentosFiscal.length > 0 ? (
                            <table className="min-w-full bg-white shadow-md rounded-lg">
                                <thead>
                                    <tr className="bg-azul_escuro bg-opacity-90 text-branco_cinza uppercase text-sm leading-normal">
                                        <th className="py-3 px-6 text-left">Título</th>
                                        <th className="py-3 px-6 text-left">Data de Inclusão</th>
                                        <th className="py-3 px-6 text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-800 text-sm font-light">
                                    {documentosFiscal.map((doc) => (
                                        <tr key={doc.id} className="border-b border-gray-200 hover:bg-gray-100">
                                            <td className="py-3 px-6 text-left">{doc.titulo}</td>
                                            <td className="py-3 px-6 text-left">{doc.created_at.split('T')[0].split('-').reverse().join('/')}</td>
                                            <td className="py-3 px-6 text-center">
                                                <button onClick={() => handleDownloadDoc(doc)} className="mr-2 text-azul_escuro hover:text-green-900 transition-colors">
                                                    <FaDownload size={18} className="text-azul_escuro" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="text-center py-4 text-gray-500">
                                Nenhum documento encontrado
                            </div>
                        )}
                    </div>
                </Modal>
            )}
        </section>
    )
}