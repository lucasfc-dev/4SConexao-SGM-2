import { FaChevronLeft, FaChevronRight, FaAngleDoubleLeft, FaAngleDoubleRight } from 'react-icons/fa'

export default function PaginacaoAvancada({ 
    totalItens, 
    itensPorPagina, 
    paginaAtual, 
    onMudarPagina
}) {
    const totalPaginas = Math.ceil(totalItens / itensPorPagina)
    
    if (totalItens === 0) return null

    const paginasVisiveis = []
    const maxPaginasVisiveis = 7
    
    let inicioIntervalo = Math.max(1, paginaAtual - Math.floor(maxPaginasVisiveis / 2))
    let fimIntervalo = Math.min(totalPaginas, inicioIntervalo + maxPaginasVisiveis - 1)
    
    if (fimIntervalo - inicioIntervalo + 1 < maxPaginasVisiveis) {
        inicioIntervalo = Math.max(1, fimIntervalo - maxPaginasVisiveis + 1)
    }
    
    for (let i = inicioIntervalo; i <= fimIntervalo; i++) {
        paginasVisiveis.push(i)
    }

    const irParaPrimeira = () => onMudarPagina(1)
    const irParaUltima = () => onMudarPagina(totalPaginas)
    const irParaAnterior = () => paginaAtual > 1 && onMudarPagina(paginaAtual - 1)
    const irParaProxima = () => paginaAtual < totalPaginas && onMudarPagina(paginaAtual + 1)
    const irParaPagina = (pagina) => onMudarPagina(pagina)

    const indiceInicial = totalItens === 0 ? 0 : (paginaAtual - 1) * itensPorPagina + 1
    const indiceFinal = Math.min(paginaAtual * itensPorPagina, totalItens)

    return (
        <div className="bg-gradient-to-r from-gray-50 to-white border-t border-gray-200 px-6 py-8 sm:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex-1 flex justify-between sm:hidden">
                    <button
                        onClick={irParaAnterior}
                        disabled={paginaAtual === 1}
                        className="relative inline-flex items-center px-5 py-2.5 text-sm font-semibold rounded-lg text-gray-700 bg-white border border-gray-300 shadow-sm hover:bg-gray-50 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:shadow-sm transition-all duration-200"
                    >
                        Anterior
                    </button>
                    <button
                        onClick={irParaProxima}
                        disabled={paginaAtual === totalPaginas}
                        className="ml-3 relative inline-flex items-center px-5 py-2.5 text-sm font-semibold rounded-lg text-gray-700 bg-white border border-gray-300 shadow-sm hover:bg-gray-50 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:shadow-sm transition-all duration-200"
                    >
                        Próximo
                    </button>
                </div>

                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div className="flex items-center gap-6">
                        <div className="bg-white rounded-lg px-4 py-2 shadow-sm border border-gray-200">
                            <p className="text-sm text-gray-600">
                                Mostrando <span className="font-bold text-laranja_escuro">{indiceInicial}</span> até{' '}
                                <span className="font-bold text-laranja_escuro">{indiceFinal}</span> de{' '}
                                <span className="font-bold text-laranja_escuro">{totalItens}</span> resultados
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center">
                        <nav className="relative z-0 inline-flex rounded-xl shadow-lg border border-gray-200 bg-white -space-x-px" aria-label="Paginação">
                            <button
                                onClick={irParaPrimeira}
                                disabled={paginaAtual === 1}
                                className="relative inline-flex items-center px-3 py-2.5 rounded-l-xl border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-all duration-200"
                                title="Primeira página"
                            >
                                <FaAngleDoubleLeft className="h-4 w-4" />
                            </button>

                            <button
                                onClick={irParaAnterior}
                                disabled={paginaAtual === 1}
                                className="relative inline-flex items-center px-3 py-2.5 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-all duration-200"
                                title="Página anterior"
                            >
                                <FaChevronLeft className="h-4 w-4" />
                            </button>

                            {inicioIntervalo > 1 && (
                                <>
                                    <button
                                        onClick={() => irParaPagina(1)}
                                        className="relative inline-flex items-center px-4 py-2.5 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
                                    >
                                        1
                                    </button>
                                    {inicioIntervalo > 2 && (
                                        <span className="relative inline-flex items-center px-4 py-2.5 border border-gray-300 bg-gray-50 text-sm font-medium text-gray-500">
                                            ...
                                        </span>
                                    )}
                                </>
                            )}

                            {paginasVisiveis.map((pagina) => (
                                <button
                                    key={pagina}
                                    onClick={() => irParaPagina(pagina)}
                                    className={`relative inline-flex items-center px-4 py-2.5 border text-sm font-semibold transition-all duration-200 ${
                                        pagina === paginaAtual
                                            ? 'z-10 bg-gradient-to-r from-laranja_escuro to-laranja_claro border-laranja_escuro text-white shadow-md hover:shadow-lg transform hover:scale-105'
                                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400'
                                    }`}
                                >
                                    {pagina}
                                </button>
                            ))}

                            {fimIntervalo < totalPaginas && (
                                <>
                                    {fimIntervalo < totalPaginas - 1 && (
                                        <span className="relative inline-flex items-center px-4 py-2.5 border border-gray-300 bg-gray-50 text-sm font-medium text-gray-500">
                                            ...
                                        </span>
                                    )}
                                    <button
                                        onClick={() => irParaPagina(totalPaginas)}
                                        className="relative inline-flex items-center px-4 py-2.5 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
                                    >
                                        {totalPaginas}
                                    </button>
                                </>
                            )}

                            <button
                                onClick={irParaProxima}
                                disabled={paginaAtual === totalPaginas}
                                className="relative inline-flex items-center px-3 py-2.5 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-all duration-200"
                                title="Próxima página"
                            >
                                <FaChevronRight className="h-4 w-4" />
                            </button>

                            <button
                                onClick={irParaUltima}
                                disabled={paginaAtual === totalPaginas}
                                className="relative inline-flex items-center px-3 py-2.5 rounded-r-xl border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-all duration-200"
                                title="Última página"
                            >
                                <FaAngleDoubleRight className="h-4 w-4" />
                            </button>
                        </nav>
                    </div>
                </div>

                <div className="sm:hidden bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-200">
                    <p className="text-sm text-gray-600 text-center">
                        Página <span className="font-bold text-laranja_escuro">{paginaAtual}</span> de{' '}
                        <span className="font-bold text-laranja_escuro">{totalPaginas}</span>
                    </p>
                </div>
            </div>

            {totalPaginas > 10 && (
                <div className="hidden sm:flex items-center justify-center mt-6 gap-4">
                    <div className="flex items-center gap-4 bg-white rounded-lg px-6 py-3 shadow-sm border border-gray-200">
                        <span className="text-sm text-gray-600 font-medium">Ir para página:</span>
                        <input
                            type="number"
                            min="1"
                            max={totalPaginas}
                            value={paginaAtual}
                            onChange={(e) => {
                                const pagina = parseInt(e.target.value)
                                if (pagina >= 1 && pagina <= totalPaginas) {
                                    irParaPagina(pagina)
                                }
                            }}
                            className="w-20 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-laranja_escuro focus:border-laranja_escuro text-center shadow-sm hover:shadow-md transition-all duration-200"
                        />
                        <span className="text-sm text-gray-600">de <span className="font-semibold text-laranja_escuro">{totalPaginas}</span></span>
                    </div>
                </div>
            )}
        </div>
    )
}
