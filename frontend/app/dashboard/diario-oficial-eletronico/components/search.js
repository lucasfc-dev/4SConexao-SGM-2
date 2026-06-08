import { useState, useEffect } from 'react';
import { FaSearch, FaChevronDown, FaChevronUp, FaCalendarAlt, FaFilter } from 'react-icons/fa';

const Search = ({ filtros, onFiltroChange, onBuscar, opened = false }) => {
  const [isExpanded, setIsExpanded] = useState(opened);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onBuscar) {
      onBuscar(e);
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const hasActiveFilters = filtros.dataInicial || filtros.dataFinal || filtros.titulo || filtros.objeto;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header do Search */}
      <div 
        className="flex items-center justify-between p-4 bg-azul_escuro text-white cursor-pointer hover:from-blue-700 transition-all duration-300"
        onClick={toggleExpanded}
      >
        <div className="flex items-center gap-3">
          <FaFilter className="text-lg" />
          <h3 className="font-semibold text-lg">Filtros de Busca</h3>
          {hasActiveFilters && (
            <span className="bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs font-medium">
              Ativo
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
        </div>
      </div>

      {/* Conteúdo expansível */}
      <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Campos de Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <FaCalendarAlt className="text-azul_escuro" />
                Data Inicial
              </label>
              <input
                type="date"
                value={filtros.dataInicial}
                onChange={(e) => {
                  onFiltroChange('dataInicial', e.target.value);
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul_escuro focus:border-azul_escuro transition-all duration-200 bg-gray-50 hover:bg-white"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <FaCalendarAlt className="text-azul_escuro" />
                Data Final
              </label>
              <input
                type="date"
                value={filtros.dataFinal}
                onChange={(e) => {
                  onFiltroChange('dataFinal', e.target.value);
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul_escuro focus:border-azul_escuro transition-all duration-200 bg-gray-50 hover:bg-white"
              />
            </div>
          </div>

          {/* Campo de Texto com Botão */}
          <div className="space-y-2">
            {'objeto' in filtros ? (
              <>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <FaSearch className="text-azul_escuro" />
                  Objeto
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={filtros.objeto}
                    onChange={(e) => {
                      onFiltroChange('objeto', e.target.value);
                    }}
                    placeholder="Digite o objeto do documento que deseja encontrar..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul_escuro focus:border-azul_escuro transition-all duration-200 bg-gray-50 hover:bg-white placeholder-gray-400"
                  />
                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-azul_escuro hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-azul_escuro focus:ring-opacity-50"
                  >
                    <FaSearch className="text-sm" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <FaSearch className="text-azul_escuro" />
                  Título
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={filtros.titulo}
                    onChange={(e) => {
                      onFiltroChange('titulo', e.target.value);
                    }}
                    placeholder="Digite o título do documento que deseja encontrar..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul_escuro focus:border-azul_escuro transition-all duration-200 bg-gray-50 hover:bg-white placeholder-gray-400"
                  />
                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-azul_escuro hover:bg-laranja_escuro text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-azul_escuro focus:ring-opacity-50"
                  >
                    <FaSearch className="text-sm" />
                  </button>
                </div>
              </>
            )}
          </div>

        </form>
      </div>
    </div>
  );
};

export default Search;
