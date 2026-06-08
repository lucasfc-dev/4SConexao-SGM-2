'use client'
import { FaDownload, FaEye, FaFilePdf, FaSearch } from 'react-icons/fa';
import Calendar from './Calendar';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const PDFViewer = dynamic(() => import('../components/pdfIframeViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" role="status">
        <span className="sr-only">Carregando...</span>
      </div>
    </div>
  )
});
const doemApi = process.env.NEXT_PUBLIC_DOEM_ENDPOINT_URL

export async function getDiarioContent(id){
    const response = await fetch(`${doemApi}/diario/${id}/content/`);
    if (!response.ok) {
        throw new Error('Failed to fetch diario content');
    }
    return response.blob();
}


export default function DiarioOficial({ diarioAtual, todosDiarios = [] }) {

    const router = useRouter()
    const [codigoBusca, setCodigoBusca] = useState('')
    const [diarioAtualState, setDiarioAtualState] = useState(diarioAtual)
    const [isChanging, setIsChanging] = useState(false)
    const [isLoadingContent, setIsLoadingContent] = useState(false)
    const [isDownloading, setIsDownloading] = useState(false)
    const [contentError, setContentError] = useState(null)
    const [downloadError, setDownloadError] = useState(null)

    const handleDiarioSelect = async (diario) => {
        setIsChanging(true)
        setContentError(null)
        try {
            const blob = await getDiarioContent(diario.id)
            setDiarioAtualState({ ...diario, blob: blob })
        } catch (error) {
            console.error('Erro ao carregar conteúdo do diário:', error)
            setContentError('Erro ao carregar conteúdo do diário')
            setDiarioAtualState(diario) // Define sem o blob em caso de erro
        } finally {
            setIsChanging(false)
        }
    }

    const fetchDoemContent = async () => {
        if (!diarioAtualState?.id) return;
        
        setIsLoadingContent(true)
        setContentError(null)
        
        try {
            const blob = await getDiarioContent(diarioAtualState.id);
            if (blob && blob instanceof Blob && blob.size > 0) {
                setDiarioAtualState(prev => ({ ...prev, blob: blob }));
            } else {
                console.warn('Blob inválido recebido');
                setContentError('Conteúdo do diário não encontrado');
            }
        } catch (error) {
            console.error('Erro ao carregar conteúdo do diário:', error);
            setContentError('Erro ao carregar conteúdo do diário');
        } finally {
            setIsLoadingContent(false)
        }
    }

    useEffect(() => {
        if (diarioAtualState?.id) {
            fetchDoemContent()
        }
    }, [diarioAtualState?.id])

    // Limpa erros quando o componente é desmontado ou diário muda
    useEffect(() => {
        setDownloadError(null)
    }, [diarioAtualState?.id])

    const handleDownloadDoem = async () => {
        if (isDownloading) return; // Previne múltiplos downloads simultâneos
        
        setIsDownloading(true)
        setDownloadError(null)
        
        try {
            const conteudo = await getDiarioContent(diarioAtualState.id)
            const url = window.URL.createObjectURL(new Blob([conteudo]))
            const link = document.createElement('a')
            link.href = url
            link.download = `${diarioAtualState.titulo}.pdf`;
            link.click()
            setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        } catch (error) {
            console.error('Erro ao baixar o diário:', error);
            setDownloadError('Erro ao baixar o arquivo PDF');
        } finally {
            setIsDownloading(false)
        }
    }

    return (
        <div className="w-full space-y-3 sm:space-y-4 lg:space-y-6">
            {/* Header do diário atual */}

            <div className={`bg-gradient-to-r p-4 sm:p-6 text-white from-azul_escuro to-azul_escuro/90 rounded-xl shadow-lg overflow-hidden transition-all duration-300 ${isChanging ? 'scale-95 opacity-80' : 'scale-100 opacity-100'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1">
                        <div className="bg-white/20 p-2 sm:p-3 rounded-lg backdrop-blur-sm flex-shrink-0">
                            <FaFilePdf className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-white text-base sm:text-lg font-bold leading-tight line-clamp-2 sm:line-clamp-1">
                                {diarioAtualState.titulo}
                            </p>
                            <p className="text-white/80 text-xs sm:text-sm mt-1">
                                {new Date(diarioAtualState.published_at).toLocaleDateString('pt-BR')}
                            </p>
                        </div>
                    </div>
                    {isChanging && (
                        <div className="text-white/80 text-xs sm:text-sm animate-pulse flex-shrink-0">
                            Atualizando...
                        </div>
                    )}
                </div>
            </div>

            {/* Layout adaptativo */}
            <div className="flex flex-col lg:grid lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-4">
                {/* Calendário - em mobile fica na parte superior */}
                <div className="order-1 lg:order-none">
                    <Calendar 
                        diarios={todosDiarios} 
                        onDiarioSelect={handleDiarioSelect} 
                        selectedDiario={diarioAtualState}
                    />
                </div>

                {/* Conteúdo principal */}
                <div className="order-2 lg:order-none lg:col-span-2 xl:col-span-3 space-y-4 sm:space-y-6">
                    {/* Mensagens de erro */}
                    {(contentError || downloadError) && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                            <div className="flex items-center gap-2 text-red-700">
                                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm font-medium">
                                    {contentError || downloadError}
                                </span>
                                {contentError && (
                                    <button 
                                        onClick={() => {
                                            setContentError(null);
                                            fetchDoemContent();
                                        }}
                                        className="ml-auto text-red-600 hover:text-red-800 text-sm underline"
                                    >
                                        Tentar novamente
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Busca por código */}
                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                            <input
                                type="text"
                                value={codigoBusca}
                                onChange={(e) => setCodigoBusca(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && codigoBusca.trim()) {
                                        router.push(`/validar_diario/${codigoBusca.trim()}`)
                                    }
                                }}
                                placeholder="Buscar diário por código..."
                                className="w-full pl-9 pr-4 py-3 sm:py-4 rounded-xl border-2 border-gray-200 focus:border-azul_escuro focus:outline-none text-sm sm:text-base text-gray-700 placeholder-gray-400 transition-colors"
                            />
                        </div>
                        <button
                            onClick={() => { if (codigoBusca.trim()) router.push(`/validar_diario/${codigoBusca.trim()}`) }}
                            disabled={!codigoBusca.trim()}
                            className={`px-5 py-3 sm:py-4 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm sm:text-base transition-all duration-200 ${
                                codigoBusca.trim()
                                    ? 'bg-azul_escuro text-white hover:bg-azul_escuro/90 transform hover:scale-[1.02]'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            <FaSearch className="w-4 h-4 flex-shrink-0" />
                            <span>Validar</span>
                        </button>
                    </div>

                    {/* Botões de ação */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <a 
                            href={diarioAtualState.url} 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 bg-gradient-to-r from-laranja_escuro to-laranja_escuro/90 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl hover:shadow-lg transition-all duration-200 font-semibold flex items-center justify-center gap-2 sm:gap-3 transform hover:scale-[1.02] text-sm sm:text-base"
                        >
                            <FaEye className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                            <span>Ler Online</span>
                        </a>

                        <button 
                            onClick={handleDownloadDoem} 
                            disabled={isDownloading || !diarioAtualState?.id}
                            className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 rounded-xl transition-all duration-200 font-semibold flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base ${
                                isDownloading || !diarioAtualState?.id
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-white text-azul_escuro border-2 border-azul_escuro hover:bg-azul_escuro hover:text-white transform hover:scale-[1.02]'
                            }`}
                        >
                            {isDownloading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                                    <span>Baixando...</span>
                                </>
                            ) : (
                                <>
                                    <FaDownload className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                                    <span>Download PDF</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Visualizador de PDF */}
                    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="bg-gray-50 p-3 sm:p-4 border-b border-gray-100">
                            <h4 className="font-bold text-gray-800 flex items-center gap-2 text-sm sm:text-base">
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-laranja_escuro flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                                </svg>
                                <span className="truncate">Visualizando {diarioAtualState.titulo}</span>
                            </h4>
                        </div>
                        <div className="w-full">
                            {isLoadingContent ? (
                                <div className="h-[400px] sm:h-[500px] lg:h-[600px] flex items-center justify-center bg-gray-50">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-azul_escuro mx-auto mb-4" />
                                        <p className="text-gray-600 text-sm">Carregando conteúdo do diário...</p>
                                    </div>
                                </div>
                            ) : contentError ? (
                                <div className="h-[400px] sm:h-[500px] lg:h-[600px] flex items-center justify-center bg-gray-50">
                                    <div className="text-center">
                                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                        </svg>
                                        <p className="text-gray-600 text-sm mb-2">Não foi possível carregar o PDF</p>
                                        <button 
                                            onClick={fetchDoemContent}
                                            className="text-azul_escuro hover:text-azul_escuro/80 text-sm underline"
                                        >
                                            Tentar novamente
                                        </button>
                                    </div>
                                </div>
                            ) : diarioAtualState.blob ? (
                                <div className="h-[400px] sm:h-[500px] lg:h-[600px] overflow-hidden">
                                    <PDFViewer pdfBlob={diarioAtualState.blob} />
                                </div>
                            ) : (
                                <div className="h-[400px] sm:h-[500px] lg:h-[600px] flex items-center justify-center bg-gray-50">
                                    <div className="text-center">
                                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                        </svg>
                                        <p className="text-gray-600 text-sm">Selecione um diário para visualizar</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}