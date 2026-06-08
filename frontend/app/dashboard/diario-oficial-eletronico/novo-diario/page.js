'use client'
import Cookies from 'js-cookie'
import React, { useCallback, useEffect, useState } from 'react'
import { useDocumentos } from '../context/documentosContext'
import { FiTrash2, FiCheckCircle, FiLoader } from 'react-icons/fi'
import { IoDocumentText } from "react-icons/io5"
import { FaCalendarAlt, FaList, FaCheck } from 'react-icons/fa'
import { useDiarios } from '../context/DOContext'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Search from '../components/search'
import { FaXmark } from 'react-icons/fa6'
const doemUrl = process.env.NEXT_PUBLIC_DOEM_ENDPOINT_URL


export default function NovoDiario() {
    const getToday = () => {
        const today = new Date()
        const year = today.getFullYear()
        const month = String(today.getMonth() + 1).padStart(2, '0')
        const day = String(today.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    const [documentosSelecionados, setDocumentosSelecionados] = useState([])
    const [documentosFiltrados, setDocumentosFiltrados] = useState([])
    const { listaDocumentos, loadingDOCS } = useDocumentos()
    const { listaPendentes, setListaPendentes } = useDiarios()
    const token = Cookies.get('auth-token')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [dataPublicacao, setDataPublicacao] = useState(getToday())

    const [filtros, setFiltros] = useState({
        dataInicial: getToday(),
        dataFinal: getToday(),
        titulo: '',
    })
    const handleSelectDocument = (documento) => {
        if (!documentosSelecionados.some((doc) => doc.id === documento.id)) {
            setDocumentosSelecionados([...documentosSelecionados, documento])
        }
    }

    const handleRemoveDocument = (documentoID) => {
        setDocumentosSelecionados(prevDocs => prevDocs.filter((doc) => doc.id !== documentoID))
    }

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsSubmitting(true);

        try {
            const ids = []
            documentosSelecionados.forEach(doc => ids.push(doc.id))
            const dict = {
                document_ids: ids,
                date: dataPublicacao
            }
            const conexao = await fetch(`${doemUrl}/diario/gerar_diario/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-type': 'application/json'
                },
                body: JSON.stringify(dict)
            });

            if (conexao.status === 404) {
                toast.error('Ícone ou Certificado nulos');
                throw new Error('Recurso não encontrado (404).');
            }
            if (conexao.status === 422) {
                toast.error(await conexao.json().then(data => data.detail));
                throw new Error('Falha ao processar documento.');
            }           
            if (!conexao.ok) {
                toast.error('Erro ao gerar DOEM.')
                throw new Error('Falha ao gerar o documento.');
            }

            const data = await conexao.json();
            setListaPendentes([...listaPendentes, data]);
            toast.success('Diário oficial gerado com sucesso!');
            setDocumentosSelecionados([]);
        } catch (error) {
            console.error('Erro ao gerar documento:', error);
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleFiltroChange = (campo, valor) => {
        setFiltros({
            ...filtros,
            [campo]: valor,
        })
    }

    const handleBuscar = useCallback((event) => {
        if (event) {
            event.preventDefault()
        }
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

        setDocumentosFiltrados(filtered)
    }, [filtros, listaDocumentos])

    useEffect(() => {
        handleBuscar()
    }, [handleBuscar])

    return (
        <section className="flex flex-col md:flex-row h-screen overflow-auto text-azul_escuro bg-gradient-to-br from-gray-200 to-gray-300 p-4 sm:p-4">
            <ToastContainer />

            {/* Seção de Seleção de Documentos */}
            <div className="flex flex-col gap-4 w-full md:w-1/2 mr-4 h-full overflow-auto">
                <div className="flex-shrink-0">
                    <Search filtros={filtros} onFiltroChange={handleFiltroChange} opened={false} />
                </div>

                <div className="flex flex-col flex-1 min-h-0 bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                    {/* Header estilizado para Documentos Disponíveis */}
                    <div className="flex items-center gap-3 p-4 bg-gray-50 border-b border-gray-200 flex-shrink-0">
                        <FaList className="text-azul_escuro" />
                        <h2 className="text-lg font-semibold text-gray-700">Documentos disponíveis</h2>
                        {documentosFiltrados.length > 0 && (
                            <span className="bg-azul_escuro text-white px-2 py-1 rounded-full text-xs font-medium">
                                {documentosFiltrados.length}
                            </span>
                        )}
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">{documentosFiltrados.length > 0 ? (
                        documentosFiltrados.map((doc) => {
                            const isSelected = documentosSelecionados.some(d => d.id === doc.id);
                            return (
                                <div
                                    key={doc.id}
                                    className={`flex items-center gap-4 p-4 mb-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                                        isSelected ? 'bg-azul_escuro text-white border-azul_escuro' : 'hover:bg-gray-50 border-gray-200'
                                    }`}
                                    onClick={() => handleSelectDocument(doc)}
                                >
                                    <IoDocumentText 
                                        size={32} 
                                        className={isSelected ? 'text-white' : 'text-azul_escuro'} 
                                    />
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <h3 
                                            className={`font-semibold leading-tight break-words ${
                                                isSelected ? 'text-white' : 'text-gray-900'
                                            }`}
                                            title={doc.titulo}
                                            style={{
                                                wordBreak: 'break-word',
                                                overflowWrap: 'break-word',
                                                hyphens: 'auto',
                                                fontSize: doc.titulo.length > 60 ? '0.95rem' : '1.125rem',
                                                lineHeight: doc.titulo.length > 60 ? '1.3' : '1.4'
                                            }}
                                        >
                                            {doc.titulo.length > 80 
                                                ? `${doc.titulo.substring(0, 77)}...` 
                                                : doc.titulo
                                            }
                                        </h3>
                                        <p className={`text-sm ${
                                            isSelected ? 'text-blue-200' : 'text-gray-600'
                                        }`}>
                                            {doc.tipo}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <p className={`text-sm ${
                                            isSelected ? 'text-blue-200' : 'text-gray-500'
                                        }`}>
                                            {doc.uploaded_at}
                                        </p>
                                        {isSelected && <FiCheckCircle size={20} />}
                                    </div>
                                </div>
                            );
                        })
                    ) : loadingDOCS ? (
                        <div className="flex flex-1 items-center justify-center">
                            <FiLoader className="animate-spin text-4xl text-azul_escuro" />
                        </div>
                    ) : (
                        <div className="flex flex-1 items-center justify-center">
                            <p className="text-center text-gray-500">Nenhum documento para visualizar.</p>
                        </div>
                    )}
                    </div>
                </div>
            </div>

            <div className='flex flex-col w-full md:w-1/2 h-full overflow-hidden gap-4'>
                <div className="bg-white rounded-lg shadow-md border border-gray-200 flex-shrink-0 overflow-hidden">
                    {/* Header estilizado para Data de Publicação */}
                    <div className="flex items-center gap-3 p-4 bg-gray-50 border-b border-gray-200">
                        <FaCalendarAlt className="text-azul_escuro" />
                        <h2 className="text-lg font-semibold text-gray-700">Data de Publicação</h2>
                    </div>
                    <div className="p-4">
                        <input
                            type="date"
                            value={dataPublicacao}
                            onChange={(e) => setDataPublicacao(e.target.value)}
                            className="w-full p-3 border rounded-lg shadow-sm text-gray-700 focus:ring-2 focus:ring-azul_escuro focus:border-azul_escuro"
                        />
                    </div>
                </div>
                <div className="flex flex-col flex-1 min-h-0 bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                    {/* Header estilizado para Documentos Selecionados */}
                    <div className="flex items-center gap-3 p-4 bg-gray-50 border-b border-gray-200 flex-shrink-0">
                        <FaCheck className="text-azul_escuro" />
                        <h2 className="text-lg font-semibold text-gray-700">Documentos selecionados</h2>
                        {documentosSelecionados.length > 0 && (
                            <span className="bg-azul_escuro text-white px-2 py-1 rounded-full text-xs font-medium">
                                {documentosSelecionados.length}
                            </span>
                        )}
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">{documentosSelecionados.length > 0 ? (
                        <div className="space-y-3">
                            {documentosSelecionados.map((doc) => (
                                <div key={doc.id} className="flex items-center gap-3 bg-white p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                    <IoDocumentText size={24} className="text-azul_escuro flex-shrink-0" />
                                    <div className='flex-1 min-w-0'>
                                        <h3 
                                            className="font-semibold text-gray-900 leading-tight break-words" 
                                            title={doc.titulo}
                                            style={{
                                                wordBreak: 'break-word',
                                                overflowWrap: 'break-word',
                                                hyphens: 'auto',
                                                fontSize: doc.titulo.length > 50 ? '0.95rem' : '1.125rem',
                                                lineHeight: doc.titulo.length > 50 ? '1.3' : '1.4'
                                            }}
                                        >
                                            {doc.titulo.length > 70 
                                                ? `${doc.titulo.substring(0, 67)}...` 
                                                : doc.titulo
                                            }
                                        </h3>
                                        <p className="text-sm text-gray-600">{doc.tipo}</p>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveDocument(doc.id);
                                        }}
                                        className='text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors flex-shrink-0'
                                    >
                                        <FaXmark size={20} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-1 items-center justify-center">
                            <p className="text-gray-500 text-center">Nenhum documento selecionado.</p>
                        </div>
                    )}
                    </div>
                    <div className="flex-shrink-0 p-4 border-t border-gray-200">
                        <button
                            className="w-full flex items-center justify-center px-4 py-3 bg-azul_escuro text-white font-semibold rounded-lg hover:bg-azul_medio transition disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={handleSubmit}
                            disabled={documentosSelecionados.length === 0 || isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                    </svg>
                                    Gerando...
                                </>
                            ) : (
                                <>
                                    <FiCheckCircle className="mr-2" />
                                    Gerar DOEM
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </section>

    )
}
