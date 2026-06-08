'use client'
import { useState, useEffect } from 'react';
import { FaFilePdf, FaChevronLeft, FaChevronRight, FaEye, FaDownload, FaSearch, FaTimes } from 'react-icons/fa';
import { getDiarios, getDiariosCount } from '../page';
import { useParams } from 'next/navigation';

const doemApi = process.env.NEXT_PUBLIC_DOEM_ENDPOINT_URL

export async function getDiarioContent(id) {
    const response = await fetch(`${doemApi}/diario/${id}/content/`);
    if (!response.ok) {
        throw new Error('Failed to fetch diario content');
    }
    return response.blob();
}

export default function TodasEdicoesDiario({ diarios: diariosIniciais, total: totalInicial }) {
    const id = useParams().id;
    const [paginaAtual, setPaginaAtual] = useState(1)
    const [downloadingId, setDownloadingId] = useState(null)
    const [diarios, setDiarios] = useState(diariosIniciais || [])
    const [total, setTotal] = useState(totalInicial || 0)
    const [loading, setLoading] = useState(false)
    const [termoPesquisa, setTermoPesquisa] = useState('')
    const [pesquisaAtiva, setPesquisaAtiva] = useState(false)

    const itensPorPagina = 10
    const totalPaginas = Math.ceil(total / itensPorPagina)
    
    const carregarPagina = async (pagina, termo = termoPesquisa) => {
        setLoading(true)
        try {
            const filtros = { 
                is_published: true,
                ...(termo ? { titulo__icontains: termo } : {})
            }
            
            const novosDiarios = await getDiarios({ 
                id: id,
                filtros, 
                page: pagina, 
                limit: itensPorPagina 
            })
            
            const novoTotal = await getDiariosCount({ id, filtros })
            
            setDiarios(novosDiarios)
            setTotal(novoTotal)
            setPaginaAtual(pagina)
        } catch (error) {
            console.error('Erro ao carregar página:', error)
        } finally {
            setLoading(false)
        }
    }

    const executarPesquisa = async (termo) => {
        setTermoPesquisa(termo)
        setPesquisaAtiva(!!termo)
        setPaginaAtual(1) 
        await carregarPagina(1, termo)
    }

    const limparPesquisa = () => {
        setTermoPesquisa('')
        setPesquisaAtiva(false)
        setPaginaAtual(1)
        setDiarios(diariosIniciais || [])
        setTotal(totalInicial || 0)
    }

    useEffect(() => {
        const carregarTotal = async () => {
            try {
                const filtros = { is_published: true }
                const novoTotal = await getDiariosCount({ id, filtros })
                setTotal(novoTotal)
            } catch (error) {
                console.error('Erro ao carregar total:', error)
            }
        }

        if (!totalInicial) {
            carregarTotal()
        }
    }, [])

    const handleProximaPagina = () => {
        if (paginaAtual < totalPaginas && !loading) {
            carregarPagina(paginaAtual + 1, termoPesquisa)
        }
    };

    const handlePaginaAnterior = () => {
        if (paginaAtual > 1 && !loading) {
            carregarPagina(paginaAtual - 1, termoPesquisa)
        }
    };

    const irParaPagina = (pagina) => {
        if (pagina !== paginaAtual && !loading) {
            carregarPagina(pagina, termoPesquisa)
        }
    };

    const handleDownload = async (diario) => {
        setDownloadingId(diario.id)
        try {
            const conteudo = await getDiarioContent(diario.id)
            const url = window.URL.createObjectURL(new Blob([conteudo]))
            const link = document.createElement('a')
            link.href = url
            link.download = `${diario.titulo}.pdf`
            link.click()
            setTimeout(() => window.URL.revokeObjectURL(url), 1000)
        } catch (error) {
            console.error('Erro ao baixar o diário:', error)
        } finally {
            setDownloadingId(null)
        }
    };

    return (
        <div className="bg-gradient-to-br from-white via-gray-50/30 to-white rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">

            <div className="bg-gradient-to-r from-azul_escuro via-azul_escuro/95 to-laranja_escuro/20 p-4 sm:p-6 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-azul_escuro/90"></div>
                <div className="relative z-10 space-y-4">
                    {/* Header com título e contador */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg sm:text-xl font-bold text-white">
                                {pesquisaAtiva ? 'Resultados' : 'Todas as edições'}
                            </h3>
                        </div>
                        <div className="bg-white/15 backdrop-blur-sm border border-white/20 px-3 py-2 sm:px-4 rounded-full self-start sm:self-auto">
                            <span className="text-white font-semibold text-sm">
                                {total} {total === 1 ? 'edição' : 'edições'}
                            </span>
                        </div>
                    </div>

                    {/* Barra de pesquisa */}
                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaSearch className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Pesquisar por título..."
                                value={termoPesquisa}
                                onChange={(e) => setTermoPesquisa(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        executarPesquisa(termoPesquisa)
                                    }
                                }}
                                className="w-full pl-5 pr-5 py-2.5 sm:py-3 bg-white/90 backdrop-blur-sm border border-white/30 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200 text-sm font-medium"
                            />
                            {termoPesquisa && (
                                <button
                                    onClick={() => {
                                        setTermoPesquisa('')
                                        if (pesquisaAtiva) limparPesquisa()
                                    }}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <FaTimes className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        
                        <button
                            onClick={() => executarPesquisa(termoPesquisa)}
                            disabled={!termoPesquisa.trim() || loading}
                            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-laranja_escuro hover:bg-laranja_escuro/90 disabled:bg-white/20 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 text-sm min-w-fit"
                        >
                            <FaSearch className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                        
                    </div>
                </div>
            </div>

            <div className="p-4 sm:p-4 max-h-[600px] overflow-y-auto space-y-4 relative">
                {loading && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-3 border-azul_escuro border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm text-gray-600 font-medium">Carregando diários...</span>
                        </div>
                    </div>
                )}
                {diarios.length === 0 && !loading ? (
                    <div className="text-center py-12">
                        <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                            {pesquisaAtiva ? (
                                <FaSearch className="w-8 h-8 text-gray-400" />
                            ) : (
                                <FaFilePdf className="w-8 h-8 text-gray-400" />
                            )}
                        </div>
                        <h4 className="text-lg font-semibold text-gray-600 mb-2">
                            {pesquisaAtiva ? 'Nenhum resultado encontrado' : 'Nenhuma edição encontrada'}
                        </h4>
                        <p className="text-gray-500 text-sm">
                            {pesquisaAtiva 
                                ? `Não foram encontrados diários com o termo "${termoPesquisa}". Tente usar outras palavras-chave.`
                                : 'Não há diários oficiais publicados no momento.'
                            }
                        </p>
                        {pesquisaAtiva && (
                            <button
                                onClick={limparPesquisa}
                                className="mt-4 px-4 py-2 bg-azul_escuro text-white rounded-lg hover:bg-azul_escuro/90 transition-colors text-sm font-medium"
                            >
                                Ver todas as edições
                            </button>
                        )}
                    </div>
                ) : (
                    diarios.map((diario, index) => (
                    <div
                        key={diario.id}
                        className="group bg-white cursor-pointer hover:bg-gray-50/50 border border-gray-200/60 hover:border-azul_escuro/20 rounded-xl p-5 transition-all duration-300 hover:shadow-lg hover:shadow-azul_escuro/5 transform hover:-translate-y-0.5 animate-fadeIn"
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        <div className="flex items-start gap-3">
                            <div className="p-2.5 bg-red-50 group-hover:bg-red-100 rounded-lg transition-colors duration-200 flex-shrink-0">
                                <FaFilePdf className="w-5 h-5 text-red-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-800 group-hover:text-azul_escuro text-base sm:text-md leading-relaxed break-words transition-colors duration-200">
                                    {diario.titulo}
                                </h4>
                            </div>
                        </div>
                        {/* Botões abaixo do título, aparecem no hover em md+ e sempre visíveis em mobile */}
                        <div className="flex gap-2 w-full transition-all duration-300 md:max-h-0 md:opacity-0 md:overflow-hidden md:mt-0 md:group-hover:max-h-20 md:group-hover:opacity-100 md:group-hover:mt-4 mt-4 opacity-100 max-h-20">
                            <a
                                href={diario.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="group/btn flex-1 md:flex-none flex items-center justify-center gap-2 p-3 text-laranja_escuro bg-laranja_escuro/5 hover:bg-laranja_escuro hover:text-white rounded-xl border border-laranja_escuro/20 hover:border-laranja_escuro transition-all duration-200 shadow-sm hover:shadow-md text-sm font-medium"
                                title="Visualizar online"
                            >
                                <FaEye className="w-4 h-4" />
                                <span className="md:hidden">Visualizar</span>
                            </a>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownload(diario);
                                }}
                                disabled={downloadingId === diario.id}
                                className="group/btn flex-1 md:flex-none flex items-center justify-center gap-2 p-3 text-azul_escuro bg-azul_escuro/5 hover:bg-azul_escuro hover:text-white rounded-xl border border-azul_escuro/20 hover:border-azul_escuro transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                title="Baixar PDF"
                            >
                                {downloadingId === diario.id ? (
                                    <div className="w-4 h-4 border-2 border-azul_escuro border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <FaDownload className="w-4 h-4" />
                                )}
                                <span className="md:hidden">
                                    {downloadingId === diario.id ? 'Baixando...' : 'Download'}
                                </span>
                            </button>
                        </div>
                    </div>
                    ))
                )}
            </div>

            {totalPaginas > 1 && (
                <div className="bg-gray-50/50 border-t border-gray-200/60 p-4 sm:p-6 mt-0">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handlePaginaAnterior}
                                disabled={paginaAtual === 1 || loading}
                                className="p-2 rounded-xl bg-white text-gray-700 border border-gray-300 hover:bg-azul_escuro/10 hover:border-azul_escuro/30 hover:text-azul_escuro disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                title="Página anterior"
                            >
                                <FaChevronLeft className="w-4 h-4" />
                            </button>
                            
                            <div className="flex items-center gap-2">
                                {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                                    .filter(pagina => {
                                        return pagina === 1 || 
                                               pagina === totalPaginas || 
                                               (pagina >= paginaAtual - 1 && pagina <= paginaAtual + 1);
                                    })
                                    .map((pagina, index, array) => (
                                        <div key={pagina} className="flex items-center">
                                            {index > 0 && array[index - 1] !== pagina - 1 && (
                                                <span className="px-2 text-gray-400 text-sm">•••</span>
                                            )}
                                            <button
                                                onClick={() => irParaPagina(pagina)}
                                                disabled={loading}
                                                className={`min-w-[40px] h-10 px-3 rounded-xl text-sm font-medium transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                                                    paginaAtual === pagina
                                                        ? 'bg-gradient-to-r from-azul_escuro to-azul_escuro/90 text-white border border-azul_escuro shadow-md transform scale-105'
                                                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-azul_escuro/10 hover:border-azul_escuro/30 hover:text-azul_escuro'
                                                }`}
                                            >
                                                {pagina}
                                            </button>
                                        </div>
                                    ))
                                }
                            </div>
                            
                            <button
                                onClick={handleProximaPagina}
                                disabled={paginaAtual === totalPaginas || loading}
                                className="p-2 rounded-xl bg-white text-gray-700 border border-gray-300 hover:bg-azul_escuro/10 hover:border-azul_escuro/30 hover:text-azul_escuro disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                title="Próxima página"
                            >
                                <FaChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}