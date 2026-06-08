'use client'

import { useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import Tabela from "../components/tabela"
import FormularioFiltrosAvancado, { CampoInput, CampoSelect, CampoData } from "../components/FormularioFiltrosAvancado"
import PaginationIframeDOEM from "../components/PaginacaoDOEM"
import { FaDownload, FaEye, FaFile, FaBuilding, FaCalendarAlt, FaTag } from "react-icons/fa"
import { toast, ToastContainer } from "react-toastify"
import 'react-toastify/dist/ReactToastify.css'
import PaginacaoAvancada from "../components/PaginacaoAvancada"

const gedUrl = process.env.NEXT_PUBLIC_GED_ENDPOINT_URL
const authUrl = process.env.NEXT_PUBLIC_AUTH_ENDPOINT_URL

export default function GEDIframe() {
    const params = useSearchParams()
    const estId = params.get('id')
    const tipo = params.get('tipo')
    const tipo__nome = params.get('tipo__nome')
    const orgaoId = params.get('orgao')
    const situacao = params.get('situacao')

    const itensPorPagina = 10
    const [listaDocumentos, setListaDocumentos] = useState([])
    const [totalItems, setTotalItems] = useState(0)
    const [paginaAtual, setPaginaAtual] = useState(1)
    const [loadingDOCS, setLoadingDOCS] = useState(false)
    const [listaOrgaos, setListaOrgaos] = useState([])
    const [exportMenuOpen, setExportMenuOpen] = useState(false)
    const [listaTipos, setListaTipos] = useState([])
    const [data, setData] = useState(null)
    const acoes = [
        {
            nome: <FaDownload size={28} className="text-azul_escuro hover:text-laranja_escuro transition-colors" />,
            handler: (documento) => handleDownload(documento)
        },
        {
            nome: <FaEye size={28} className="text-azul_escuro hover:text-laranja_escuro transition-colors" />,
            handler: (documento) => handleVisualizar(documento.id)
        }
    ]

    const listaSituacoes = [
        { nome: 'Vigente', id: 1 },
        { nome: 'Revogado', id: 2 },
        { nome: 'Revogado Parcialmente', id: 3 }
    ];

    const listaColunas = [
        { nomeColuna: 'Título', coluna: 'titulo' },
        { nomeColuna: 'Descrição', coluna: 'descricao' },
        { nomeColuna: 'Tipo do Documento', coluna: 'tipo' },
        { nomeColuna: 'Data da Publicação', coluna: 'pub_date' },
        { nomeColuna: 'Situação', coluna: 'situacao' },
    ]

    const [filtros, setFiltros] = useState({
        titulo__icontains: '',
        descricao__icontains: '',
        tipo: tipo,
        tipo__nome: tipo__nome,
        situacao: situacao,
        orgao: orgaoId,
        pub_date__gte: '',
        pub_date__lte: ''
    })


    const getDocumentos = async (count, page = 1) => {
        setLoadingDOCS(true)
        try {
            if (count) {
                // Primeiro busca o total de itens
                const params = new URLSearchParams({
                    count: String(count),
                    ...(filtros.titulo__icontains && { titulo__icontains: filtros.titulo__icontains }),
                    ...(filtros.descricao__icontains && { descricao__icontains: filtros.descricao__icontains }),
                    ...(filtros.tipo && { tipo: filtros.tipo }),
                    ...(filtros.tipo__nome && { tipo__nome: filtros.tipo__nome }),
                    ...(filtros.situacao && { situacao: filtros.situacao }),
                    ...(filtros.orgao && { orgao: filtros.orgao }),
                    ...(filtros.pub_date__gte && { pub_date__gte: filtros.pub_date__gte }),
                    ...(filtros.pub_date__lte && { pub_date__lte: filtros.pub_date__lte }),
                })
                const respCount = await fetch(`${gedUrl}/docs/estabelecimento/${estId}/?${params}`)
                if (!respCount.ok) throw new Error('Erro ao buscar total de documentos')
                const totalCount = await respCount.json()
                setTotalItems(totalCount)
            }

            // Busca os documentos da página atual
            const params = new URLSearchParams({
                offset: String((page - 1) * itensPorPagina),
                ...(filtros.titulo__icontains && { titulo__icontains: filtros.titulo__icontains }),
                ...(filtros.descricao__icontains && { descricao__icontains: filtros.descricao__icontains }),
                ...(filtros.tipo && { tipo: filtros.tipo }),
                ...(filtros.tipo__nome && { tipo__nome: filtros.tipo__nome }),
                ...(filtros.situacao && { situacao: filtros.situacao }),
                ...(filtros.orgao && { orgao: filtros.orgao }),
                ...(filtros.pub_date__gte && { pub_date__gte: filtros.pub_date__gte }),
                ...(filtros.pub_date__lte && { pub_date__lte: filtros.pub_date__lte }),
            })

            const response = await fetch(`${gedUrl}/docs/estabelecimento/${estId}/?${params}`)
            if (!response.ok) throw new Error('Erro ao buscar documentos')

            const resposta = await response.json()
            const documentosData = resposta.map((documento) => ({
                titulo: documento.titulo,
                descricao: documento.descricao,
                situacao: documento.situacao,
                orgao: documento.orgao,
                id: documento.id,
                tipo: documento.tipo__nome,
                tipo_id: documento.tipo__id,
                pub_date: documento.pub_date.split('-').reverse().join('/')
            }))

            setListaDocumentos(documentosData)
            setPaginaAtual(page)
        } catch (error) {
            console.error('Erro ao obter documentos:', error)
            toast.error('Erro ao carregar documentos')
        } finally {
            setLoadingDOCS(false)
        }
    }

    const getOrgaos = async () => {
        try {
            const response = await fetch(`${authUrl}/orgao/estabelecimento/${estId}/`, {

            })
            if (!response.ok) throw new Error('Erro ao obter órgãos')
            const orgaos = await response.json()
            setListaOrgaos(orgaos)
        }
        catch (error) {
            console.error(error)
        }
    }


    const getTipos = async () => {
        try {
            const response = await fetch(`${gedUrl}/tipo/estabelecimento/${estId}/`, {
            })
            const tipos = await response.json()
            setListaTipos(tipos)
            return tipos
        } catch (error) {
            console.error('Erro ao obter tipos de documento:', error)
            return []
        }
    }

    async function handleExport(formato) {
        const params = new URLSearchParams({
            ...(filtros.titulo__icontains && { titulo__icontains: filtros.titulo__icontains }),
            ...(filtros.descricao__icontains && { descricao__icontains: filtros.descricao__icontains }),
            ...(filtros.tipo && { tipo: filtros.tipo }),
            ...(filtros.orgao && { orgao: filtros.orgao }),
            ...(filtros.tipo__nome && { tipo__nome: filtros.tipo__nome }),
            ...(filtros.situacao && { situacao: filtros.situacao }),
            ...(filtros.pub_date__gte && { pub_date__gte: filtros.pub_date__gte }),
            ...(filtros.pub_date__lte && { pub_date__lte: filtros.pub_date__lte }),
        })
        try {
            const resp = await fetch(`${gedUrl}/docs/estabelecimento/${estId}/exportar/?type=${formato}&${params}`, {
                method: 'GET',
            })
            if (!resp.ok) throw new Error('Falha ao exportar registros')
            const blob = await resp.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `registros.${formato}`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        } catch (e) {
            toast.error(e.message)
        } finally {
            setExportMenuOpen(false)
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
        getDocumentos(true, 1)
    })

    const handleDownload = async (documento) => {
        try {
            const response = await fetch(`${gedUrl}/docs/${documento.id}/content/`, {
                method: 'GET',
            })

            if (!response.ok) {
                throw new Error('Falha ao baixar documento')
            }

            const blob = await response.blob()
            const arrayBuffer = await blob.arrayBuffer()
            setData(arrayBuffer)
            const urlBlob = URL.createObjectURL(blob)
            if (!blob) {
                throw new Error('Conteúdo do documento não encontrado')
            }

            // Obter a extensão baseada no Content-Type
            const contentType = response.headers.get('Content-Type') || blob.type
            let extensao = ''
            
            // Mapear tipos MIME para extensões
            const mimeToExtension = {
                'application/pdf': '.pdf',
                'application/msword': '.doc',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
                'application/vnd.ms-excel': '.xls',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
                'application/vnd.ms-powerpoint': '.ppt',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
                'image/jpeg': '.jpg',
                'image/png': '.png',
                'image/gif': '.gif',
                'text/plain': '.txt',
                'text/csv': '.csv',
                'application/zip': '.zip',
                'application/x-rar-compressed': '.rar'
            }

            extensao = mimeToExtension[contentType] || ''

            // Se não conseguir determinar pela Content-Type, tentar pelo título
            if (!extensao && documento.titulo) {
                const tituloLower = documento.titulo.toLowerCase()
                if (tituloLower.includes('.pdf')) extensao = '.pdf'
                else if (tituloLower.includes('.doc')) extensao = documento.titulo.includes('.docx') ? '.docx' : '.doc'
                else if (tituloLower.includes('.xls')) extensao = documento.titulo.includes('.xlsx') ? '.xlsx' : '.xls'
                else if (tituloLower.includes('.ppt')) extensao = documento.titulo.includes('.pptx') ? '.pptx' : '.ppt'
                else if (tituloLower.includes('.jpg') || tituloLower.includes('.jpeg')) extensao = '.jpg'
                else if (tituloLower.includes('.png')) extensao = '.png'
                else if (tituloLower.includes('.txt')) extensao = '.txt'
                else if (tituloLower.includes('.csv')) extensao = '.csv'
                else if (tituloLower.includes('.zip')) extensao = '.zip'
                else if (tituloLower.includes('.rar')) extensao = '.rar'
            }

            // Criar nome do arquivo com extensão
            let nomeArquivo = documento.titulo
            if (extensao && !nomeArquivo.toLowerCase().endsWith(extensao.toLowerCase())) {
                nomeArquivo += extensao
            }

            const link = document.createElement('a')
            link.href = urlBlob
            link.download = nomeArquivo
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(urlBlob) // Limpar o objeto URL para liberar memória
            toast.success('Download iniciado com sucesso!')
        }
        catch (error) {
            toast.error(error.message)
        }
    }

    const handleVisualizar = (itemId) => { window.open(`/doc_view/${itemId}`) }

    const handleLimparFiltros = () => {
        setFiltros({
            titulo__icontains: '',
            descricao__icontains: '',
            tipo: tipo, // Preserva o tipo passado por query
            tipo__nome: tipo__nome, // Preserva o tipo__nome passado por query
            situacao: situacao, // Preserva a situação passada por query
            orgao: orgaoId, // Preserva o órgão passado por query
            pub_date__gte: '',
            pub_date__lte: ''
        })
        setPaginaAtual(1)
        setTimeout(() => {
            getDocumentos(true, 1)
        }, 0)
    }

    useEffect(() => {
        getOrgaos()
        getTipos()
        getDocumentos(true)
    }, [])

    useEffect(() => {
        setFiltros(prev => ({
            ...prev,
            titulo: '',
            pub_date: '',
            tipo: params.get('tipo') || '',
            tipo__nome: params.get('tipo__nome') || '',
            situacao: params.get('situacao') || '',
            orgaoId: params.get('orgao') || ''
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
            <ToastContainer></ToastContainer>
            <FormularioFiltrosAvancado
                titulo="Filtros de Documentos"
                filtros={filtros}
                onFiltroChange={handleFiltroChange}
                onLimparFiltros={handleLimparFiltros}
            >
                <CampoInput
                    label="Título do Documento"
                    nameVisible='Título'
                    name="titulo__icontains"
                    value={filtros.titulo__icontains}
                    onChange={handleFiltroChange}
                    placeholder="Ex: portaria, decreto..."
                    colSpan="md:col-span-3"
                    icone={<FaFile />}
                />

                <CampoInput
                    label="Descrição"
                    name="descricao__icontains"
                    value={filtros.descricao__icontains}
                    onChange={handleFiltroChange}
                    placeholder="Ex: regulamentação, normas..."
                    colSpan="md:col-span-3"
                    icone={<FaTag />}
                />

                <CampoSelect
                    label="Órgão Responsável"
                    name="orgao"
                    value={filtros.orgao}
                    onChange={handleFiltroChange}
                    options={listaOrgaos}
                    placeholder="Selecione um órgão"
                    colSpan="md:col-span-2"
                    icone={<FaBuilding />}
                />

                <CampoSelect
                    label="Situação"
                    name="situacao"
                    value={filtros.situacao}
                    onChange={handleFiltroChange}
                    options={listaSituacoes.map(s => ({ id: s.nome, nome: s.nome }))}
                    placeholder="Selecione uma situação"
                    colSpan="md:col-span-2"
                    icone={<FaTag />}
                />

                <CampoSelect
                    label="Tipo de Documento"
                    name="tipo"
                    value={filtros.tipo}
                    onChange={handleFiltroChange}
                    options={listaTipos}
                    placeholder="Selecione um tipo"
                    colSpan="md:col-span-2"
                    icone={<FaFile />}
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
                <button className="px-2 py-3 md:col-span-6 bg-azul_escuro text-white font-medium rounded hover:bg-laranja_escuro transition-colors"
                    onClick={handleBuscar}>
                    Pesquisar
                </button>
            </FormularioFiltrosAvancado>

            <div className="flex flex-col bg-white rounded-2xl shadow-lg p-6 gap-2 md:p-8 border border-gray-100">
                <div className="flex justify-between items-center mb-2">
                    <h1 className="text-xl font-bold">Registros</h1>
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
                    listaDados={listaDocumentos}
                    listaColunas={listaColunas}
                    acoes={acoes}
                    itensPorPagina={itensPorPagina}
                    loading={loadingDOCS}
                />

                <PaginacaoAvancada
                    totalItens={totalItems}
                    itensPorPagina={itensPorPagina}
                    paginaAtual={paginaAtual}
                    onMudarPagina={page => {
                        setPaginaAtual(page)
                        getDocumentos(false, page)
                    }}
                />
            </div>
        </section>

    )
}