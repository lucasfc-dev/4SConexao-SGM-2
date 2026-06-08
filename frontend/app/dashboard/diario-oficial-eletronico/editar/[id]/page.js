'use client'
import Cookies from 'js-cookie'
import React, { useCallback, useEffect, useState } from 'react'
import { FiCheckCircle, FiLoader, FiList } from 'react-icons/fi'
import { IoDocumentText } from 'react-icons/io5'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useDocumentos } from '../../context/documentosContext'
import Search from '../../components/search'
import { useParams } from 'next/navigation'
import { FaCheck, FaEye, FaFilePdf } from 'react-icons/fa'
import { FaXmark } from 'react-icons/fa6'
import Modal from '@/app/components/modal'
import { motion, AnimatePresence } from 'framer-motion'

const doemUrl = process.env.NEXT_PUBLIC_DOEM_ENDPOINT_URL

export default function EditarDiario() {
    const id = useParams()
    const [documentosSelecionados, setDocumentosSelecionados] = useState([])
    const [documentosFiltrados, setDocumentosFiltrados] = useState([])
    const [diario, setDiario] = useState(null)
    const [loadingDiario, setLoadingDiario] = useState(true)
    const [modalAberta, setModalAberta] = useState(false)
    const { listaDocumentos, loadingDOCS } = useDocumentos()
    const [iframeSrc, setIframeSrc] = useState()
    const token = Cookies.get('auth-token')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const getToday = () => {
        const today = new Date()
        const year = today.getFullYear()
        const month = String(today.getMonth() + 1).padStart(2, '0')
        const day = String(today.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    const [filtros, setFiltros] = useState({
        dataInicial: getToday(),
        dataFinal: getToday(),
        titulo: '',
    })

    useEffect(() => {
        async function buscarSelecionados() {
            try {
                const response = await fetch(`${doemUrl}/diario/${id.id}/documentos/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                if (response.ok) {
                    const data = await response.json()
                    setDocumentosSelecionados(data)
                }
            } catch (error) {
                console.error(error)
            }
        }
        async function getDiario() {
            setLoadingDiario(true)
            try {
                const response = await fetch(`${doemUrl}/diario/${id.id}/`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                const diarioResponse = await response.json()
                setDiario(diarioResponse)
            } catch (error) {
                console.error(error)
            } finally {
                setLoadingDiario(false)
            }
        }
        getDiario()
        buscarSelecionados()
    }, [id, token])

    const exibirDiario = async () => {
        setModalAberta(true)
        try {
            const response = await fetch(`${doemUrl}/diario/${id.id}/content/`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
            })
            if (!response.ok) throw new Error('Falha ao buscar o diário.')
            const blob = await response.blob()
            const url = URL.createObjectURL(blob)
            setIframeSrc(url)
        } catch (error) {
            toast.error('Erro ao exibir o DO, tente novamente!')
            console.error('Erro ao exibir o diário:', error)
        }
    }

    const handleSelectDocument = (documento) => {
        setDocumentosSelecionados((prevSelecionados) => {
            const jaSelecionado = prevSelecionados.some((doc) => doc.id === documento.id)
            if (jaSelecionado) {
                return prevSelecionados.filter((doc) => doc.id !== documento.id)
            } else {
                return [...prevSelecionados, documento]
            }
        })
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        setIsSubmitting(true)
        try {
            const listaIDS = documentosSelecionados.map(doc => doc.id)
            const conexao = await fetch(`${doemUrl}/diario/${id.id}/`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 'document_ids': listaIDS })
            })
            if (conexao.status === 404) {
                toast.error('Ícone ou Certificado nulos')
                throw new Error('Recurso não encontrado (404).')
            } else if (!conexao.ok) {
                toast.error('Erro ao gerar DOEM.')
                throw new Error('Falha ao gerar o documento.')
            } else {
                toast.success('Diário oficial editado com sucesso!')
                await exibirDiario()
            }
        } catch (error) {
            console.error('Erro ao editar documento:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleFiltroChange = (campo, valor) => {
        setFiltros(prev => ({ ...prev, [campo]: valor }))
    }

    const handleBuscar = useCallback((event) => {
        if (event) event.preventDefault()
        const filtered = listaDocumentos.filter((documento) => {
            const tituloMatch = !filtros.titulo ||
                documento.titulo?.toLowerCase().includes(filtros.titulo.toLowerCase())
            const [dia, mes, ano] = documento.uploaded_at.split('/')
            const dataDocumento = new Date(`${ano}-${mes}-${dia}`)
            const dataInicial = filtros.dataInicial ? new Date(filtros.dataInicial) : null
            const dataFinal = filtros.dataFinal ? new Date(filtros.dataFinal) : null
            const dataMatch =
                (!dataInicial || dataDocumento >= dataInicial) &&
                (!dataFinal || dataDocumento <= dataFinal)
            return tituloMatch && dataMatch
        })
        const parseDate = (str) => {
            const [dia, mes, ano] = str.split('/')
            return new Date(`${ano}-${mes}-${dia}`)
        }
        const sortDesc = (a, b) => parseDate(b.uploaded_at) - parseDate(a.uploaded_at)
        const selecionadosIds = documentosSelecionados.map((doc) => doc.id)
        const documentosOrdenados = [
            ...filtered.filter((doc) => selecionadosIds.includes(doc.id)).sort(sortDesc),
            ...filtered.filter((doc) => !selecionadosIds.includes(doc.id)).sort(sortDesc),
        ]
        setDocumentosFiltrados(documentosOrdenados)
    }, [filtros, listaDocumentos, documentosSelecionados])

    const handleDeletar = (docId) => {
        setDocumentosSelecionados(prevDocs => prevDocs.filter(doc => doc.id !== docId))
    }

    useEffect(() => {
        handleBuscar()
    }, [handleBuscar])

    return (
        <section className="flex flex-col flex-grow bg-branco_cinza overflow-auto text-azul_escuro p-4 md:p-8">
            <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />

            {/* Header */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="bg-laranja_escuro rounded-lg p-2.5 shrink-0">
                        <FaFilePdf className="text-white text-xl" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-2xl md:text-3xl font-extrabold text-azul_escuro leading-tight">
                            Editar Diário Oficial
                        </h1>
                        <p className="text-sm text-gray-500 mt-0.5 truncate">
                            {loadingDiario ? 'Carregando...' : diario?.titulo ?? ''}
                        </p>
                    </div>
                </div>
                <button
                    onClick={exibirDiario}
                    className="flex items-center gap-2 px-4 py-2.5 bg-azul_escuro text-white text-sm rounded-lg shadow hover:bg-azul_claro transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-azul_escuro focus:ring-opacity-50 shrink-0"
                >
                    <FaEye />
                    Visualizar Diário
                </button>
            </div>

            {/* Content: two columns */}
            <div className="flex flex-col lg:flex-row gap-6">

                {/* Left: Available documents */}
                <div className="flex flex-col gap-4 w-full lg:w-1/2">
                    <div className="shrink-0">
                        <Search filtros={filtros} onFiltroChange={handleFiltroChange} opened={false} />
                    </div>

                    <div className="flex flex-col bg-white rounded-xl shadow-md overflow-hidden">
                        <div className="flex items-center gap-3 p-4 bg-gray-50 border-b border-gray-100">
                            <FiList className="text-azul_escuro" />
                            <h2 className="text-base font-semibold text-azul_escuro">Documentos disponíveis</h2>
                            {documentosFiltrados.length > 0 && (
                                <span className="bg-azul_escuro text-white px-2 py-0.5 rounded-full text-xs font-medium">
                                    {documentosFiltrados.length}
                                </span>
                            )}
                        </div>
                        <div className="p-4">
                            {loadingDOCS ? (
                                <div className="flex items-center justify-center h-32">
                                    <FiLoader className="animate-spin text-3xl text-azul_escuro" />
                                </div>
                            ) : documentosFiltrados.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                                    <IoDocumentText className="text-4xl mb-2 opacity-40" />
                                    <p className="text-sm">Nenhum documento encontrado.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <AnimatePresence>
                                        {documentosFiltrados.map((doc, i) => {
                                            const isSelecionado = documentosSelecionados.some(d => d.id === doc.id)
                                            return (
                                                <motion.div
                                                    key={doc.id}
                                                    initial={{ opacity: 0, y: 6 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.02, duration: 0.2 }}
                                                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                                                        isSelecionado
                                                            ? 'bg-azul_escuro text-white border-azul_escuro'
                                                            : 'border-gray-200 hover:bg-gray-50 hover:shadow-sm'
                                                    }`}
                                                    onClick={() => handleSelectDocument(doc)}
                                                >
                                                    <IoDocumentText
                                                        size={28}
                                                        className={`shrink-0 ${isSelecionado ? 'text-white' : 'text-azul_escuro'}`}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <h3
                                                            className={`text-sm font-semibold leading-snug break-words ${isSelecionado ? 'text-white' : 'text-azul_escuro'}`}
                                                            style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                                                        >
                                                            {doc.titulo}
                                                        </h3>
                                                        <p className={`text-xs mt-0.5 ${isSelecionado ? 'text-blue-200' : 'text-gray-500'}`}>
                                                            {doc.tipo} · {doc.uploaded_at}
                                                        </p>
                                                    </div>
                                                    {isSelecionado && <FiCheckCircle size={18} className="shrink-0" />}
                                                </motion.div>
                                            )
                                        })}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Selected documents + submit */}
                <div className="flex flex-col gap-4 w-full lg:w-1/2">
                    <div className="flex flex-col bg-white rounded-xl shadow-md overflow-hidden">
                        <div className="flex items-center gap-3 p-4 bg-gray-50 border-b border-gray-100">
                            <FaCheck className="text-azul_escuro" />
                            <h2 className="text-base font-semibold text-azul_escuro">Documentos no diário</h2>
                            {documentosSelecionados.length > 0 && (
                                <span className="bg-laranja_escuro text-white px-2 py-0.5 rounded-full text-xs font-medium">
                                    {documentosSelecionados.length}
                                </span>
                            )}
                        </div>
                        <div className="p-4">
                            {documentosSelecionados.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                                    <IoDocumentText className="text-4xl mb-2 opacity-40" />
                                    <p className="text-sm">Nenhum documento selecionado.</p>
                                    <p className="text-xs mt-1">Clique nos documentos à esquerda para adicioná-los.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <AnimatePresence>
                                        {documentosSelecionados.map((doc, i) => (
                                            <motion.div
                                                key={doc.id}
                                                initial={{ opacity: 0, x: 10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -10 }}
                                                transition={{ delay: i * 0.02, duration: 0.2 }}
                                                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
                                            >
                                                <IoDocumentText size={24} className="text-azul_escuro shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <h3
                                                        className="text-sm font-semibold text-azul_escuro leading-snug break-words"
                                                        style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                                                    >
                                                        {doc.titulo}
                                                    </h3>
                                                    <p className="text-xs text-gray-500 mt-0.5">{doc.tipo}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleDeletar(doc.id)}
                                                    className="shrink-0 p-1 rounded-full hover:bg-red-50 transition-colors"
                                                    title="Remover documento"
                                                >
                                                    <FaXmark size={16} className="text-red-500" />
                                                </button>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-laranja_escuro text-white font-semibold rounded-lg shadow hover:bg-orange-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-laranja_escuro focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                        onClick={handleSubmit}
                        disabled={documentosSelecionados.length === 0 || isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <FiLoader className="animate-spin h-5 w-5" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <FiCheckCircle className="h-5 w-5" />
                                Finalizar Edição
                            </>
                        )}
                    </button>
                </div>
            </div>

            <Modal isOpen={modalAberta} onClose={() => setModalAberta(false)} title="Visualizando Diário Oficial">
                <div className="flex flex-col items-end h-[90vh] p-4">
                    <iframe src={iframeSrc} className="w-full h-full" />
                </div>
            </Modal>
        </section>
    )
}
