'use client'

import { useState, useEffect, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { FiLoader, FiZoomIn, FiZoomOut, FiMaximize, FiMinimize } from 'react-icons/fi'
import { FaChevronUp, FaChevronDown } from 'react-icons/fa'

// Polyfill for Promise.withResolvers for Safari compatibility
if (typeof window !== 'undefined' && !Promise.withResolvers) {
    Promise.withResolvers = function() {
        let resolve, reject;
        const promise = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
        });
        return { promise, resolve, reject };
    };
}

// Set up PDF.js worker
if (typeof window !== 'undefined') {
    pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.js`
}

export default function PDFViewer({ pdfBlob }) {
    const [numPages, setNumPages] = useState(null)
    const [isClient, setIsClient] = useState(false)
    const [scale, setScale] = useState(1.0)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [showAllPages, setShowAllPages] = useState(true)
    const [containerWidth, setContainerWidth] = useState(0)
    const [pdfError, setPdfError] = useState(null)
    const [isLoadingPdf, setIsLoadingPdf] = useState(true)

    useEffect(() => {
        setIsClient(true)
        
        // Set initial scale based on screen size
        const updateScale = () => {
            const isMobile = window.innerWidth < 768
            const isTablet = window.innerWidth < 1024
            
            if (isMobile) {
                setScale(0.7)
            } else if (isTablet) {
                setScale(0.85)
            } else {
                setScale(1.0)
            }
            
            setContainerWidth(window.innerWidth)
        }
        
        updateScale()
        window.addEventListener('resize', updateScale)
        
        // Prevent default zoom behavior on mobile
        const preventZoom = (e) => {
            if (e.touches.length > 1) {
                e.preventDefault()
            }
        }
        
        document.addEventListener('touchstart', preventZoom, { passive: false })
        
        return () => {
            window.removeEventListener('resize', updateScale)
            document.removeEventListener('touchstart', preventZoom)
        }
    }, [])

    const onLoadSuccess = ({ numPages }) => {
        setNumPages(numPages)
        setIsLoadingPdf(false)
        setPdfError(null)
    }

    const onLoadError = (error) => {
        console.error('Erro ao carregar PDF:', error)
        setIsLoadingPdf(false)
        setPdfError('Erro ao carregar o documento PDF')
    }

    // Reset states when pdfBlob changes
    useEffect(() => {
        if (pdfBlob) {
            setIsLoadingPdf(true)
            setPdfError(null)
            setNumPages(null)
        }
    }, [pdfBlob])

    const handleZoomIn = () => {
        setScale(prev => Math.min(prev + 0.2, 3.0))
    }

    const handleZoomOut = () => {
        setScale(prev => Math.max(prev - 0.2, 0.3))
    }

    const handleFitToWidth = () => {
        const isMobile = window.innerWidth < 768
        const isTablet = window.innerWidth < 1024
        
        if (isMobile) {
            setScale(0.6)
        } else if (isTablet) {
            setScale(0.8)
        } else {
            setScale(1.0)
        }
    }

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen)
    }

    const getResponsiveScale = useCallback(() => {
        if (containerWidth < 640) {
            return scale * 0.8 // Smaller on mobile
        } else if (containerWidth < 1024) {
            return scale * 0.9 // Medium on tablet
        }
        return scale
    }, [scale, containerWidth])

    if (!isClient) {
        return (
            <div className="flex items-center justify-center h-96 bg-gray-50">
                <FiLoader size={50} className="animate-spin text-4xl text-primaria" />
            </div>
        )
    }

    if (!pdfBlob || !(pdfBlob instanceof Blob)) {
        return (
            <div className="flex items-center justify-center h-96 bg-gray-50">
                <div className="text-center">
                    <FiLoader size={50} className="animate-spin text-4xl text-primaria mb-4" />
                    <p className="text-gray-600 text-sm">Aguardando documento...</p>
                </div>
            </div>
        )
    }

    if (pdfError) {
        return (
            <div className="flex items-center justify-center h-96 bg-gray-50">
                <div className="text-center">
                    <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <p className="text-red-600 text-sm mb-2">{pdfError}</p>
                    <button 
                        onClick={() => {
                            setPdfError(null);
                            setIsLoadingPdf(true);
                        }}
                        className="text-azul_escuro hover:text-azul_escuro/80 text-sm underline"
                    >
                        Tentar novamente
                    </button>
                </div>
            </div>
        )
    }


    return (
        <div className={`bg-gray-50 pdf-container ${isFullscreen ? 'fixed inset-0 z-50 overflow-auto' : 'h-[500px] overflow-auto'}`}>
            {/* Controls Bar */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-2 sm:p-3 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                        <span className="font-medium">
                            {numPages ? `${numPages} página${numPages > 1 ? 's' : ''}` : 'Carregando...'}
                        </span>
                        <span className="hidden sm:inline text-gray-400">•</span>
                        <span className="hidden sm:inline">{Math.round(getResponsiveScale() * 100)}%</span>
                        {/* Mobile zoom indicator */}
                        <span className="sm:hidden bg-gray-100 px-2 py-1 rounded text-xs font-medium">
                            {Math.round(getResponsiveScale() * 100)}%
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                        {/* Zoom Controls */}
                        <button
                            onClick={handleZoomOut}
                            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Diminuir zoom"
                        >
                            <FiZoomOut className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                        
                        <button
                            onClick={handleFitToWidth}
                            className="px-2 py-1.5 sm:px-3 sm:py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                            title="Ajustar à largura"
                        >
                            <span className="hidden sm:inline">Ajustar</span>
                            <span className="sm:hidden">Fit</span>
                        </button>
                        
                        <button
                            onClick={handleZoomIn}
                            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Aumentar zoom"
                        >
                            <FiZoomIn className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                        
                        <div className="w-px h-4 sm:h-6 bg-gray-300 mx-1"></div>
                        
                        {/* View Toggle */}
                        <button
                            onClick={() => setShowAllPages(!showAllPages)}
                            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title={showAllPages ? "Mostrar apenas primeira página" : "Mostrar todas as páginas"}
                        >
                            {showAllPages ? <FaChevronUp className="w-3 h-3 sm:w-4 sm:h-4" /> : <FaChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />}
                        </button>
                        
                        {/* Fullscreen Toggle */}
                        <button
                            onClick={toggleFullscreen}
                            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
                        >
                            {isFullscreen ? <FiMinimize className="w-3 h-3 sm:w-4 sm:h-4" /> : <FiMaximize className="w-3 h-3 sm:w-4 sm:h-4" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* PDF Document */}
            <div className="p-2 sm:p-4">
                <Document
                    file={pdfBlob}
                    onLoadSuccess={onLoadSuccess}
                    onLoadError={onLoadError}
                    loading={
                        <div className="flex justify-center py-8">
                            <div className="text-center">
                                <FiLoader size={32} className="animate-spin text-primaria mx-auto mb-2" />
                                <p className="text-gray-600 text-sm">Carregando documento...</p>
                            </div>
                        </div>
                    }
                    error={
                        <div className="text-center py-8">
                            <p className="text-red-600 text-sm">Erro ao carregar o PDF</p>
                            <button 
                                onClick={() => {
                                    setPdfError(null);
                                    setIsLoadingPdf(true);
                                }}
                                className="mt-2 text-azul_escuro hover:text-azul_escuro/80 text-sm underline"
                            >
                                Tentar novamente
                            </button>
                        </div>
                    }
                >
                    <div className="space-y-4">
                        {numPages && showAllPages ? (
                            // Show all pages
                            Array.from(new Array(numPages), (el, index) => (
                                <div key={`page_${index + 1}`} className="flex justify-center">
                                    <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200 max-w-full">
                                        <div className="bg-gray-100 px-3 py-2 text-xs text-gray-600 font-medium">
                                            Página {index + 1} de {numPages}
                                        </div>
                                        <div className="overflow-auto">
                                            <Page
                                                pageNumber={index + 1}
                                                scale={getResponsiveScale()}
                                                renderTextLayer={true}
                                                renderAnnotationLayer={true}
                                                className="block mx-auto"
                                                loading={
                                                    <div className="flex justify-center py-4">
                                                        <FiLoader className="animate-spin text-primaria" />
                                                    </div>
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : numPages ? (
                            // Show only first page
                            <div className="flex justify-center">
                                <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200 max-w-full">
                                    <div className="bg-gray-100 px-3 py-2 text-xs text-gray-600 font-medium">
                                        Página 1 de {numPages}
                                        {numPages > 1 && (
                                            <span className="ml-2 text-blue-600">
                                                (Clique em ↓ para ver todas)
                                            </span>
                                        )}
                                    </div>
                                    <div className="overflow-auto">
                                        <Page
                                            pageNumber={1}
                                            scale={getResponsiveScale()}
                                            renderTextLayer={true}
                                            renderAnnotationLayer={true}
                                            className="block mx-auto"
                                            loading={
                                                <div className="flex justify-center py-4">
                                                    <FiLoader className="animate-spin text-primaria" />
                                                </div>
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </Document>
            </div>
        </div>
    )
}