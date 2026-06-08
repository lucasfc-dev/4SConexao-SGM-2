
'use client'
import { useState, useEffect, use } from 'react'
import { FiLoader, FiAlertCircle, FiRefreshCw } from 'react-icons/fi'
import DiarioOficial from "./components/DiarioOficial";
import TodasEdicoesDiario from "./components/TodasEdicoesDiario";

const doemApi = process.env.NEXT_PUBLIC_DOEM_ENDPOINT_URL


export async function getDiarios({ filtros, id, page, limit }) {
  const paginaAtual = page || filtros.page || 1;
  const limitePorPagina = limit || filtros.limit || 10;

  // Detecta se é uma request do calendário (tem filtros de data específicos para um mês)
  const isCalendarRequest = filtros.data_pub__gte && filtros.data_pub__lte && 
    !page && !limit && !filtros.limit && !filtros.titulo__icontains;

  const filtrosQuery = new URLSearchParams({
    count: String(false),
    ...(paginaAtual > 1 ? { offset: String((paginaAtual - 1) * limitePorPagina) } : {}),
    // Só aplica limit se NÃO for request do calendário
    ...(!isCalendarRequest && (limit || filtros.limit) ? { limit: String(limitePorPagina) } : {}),
    ...(filtros.data_pub__gte ? { data_inicial: filtros.data_pub__gte } : {}),
    ...(filtros.data_pub__lte ? { data_final: filtros.data_pub__lte } : {}),
    ...(filtros.titulo__icontains ? { titulo: filtros.titulo__icontains } : {}),
    is_published: String(filtros.is_published),
  });
  
  const response = await fetch(`${doemApi}/diario/estabelecimento/${id}/?${filtrosQuery}`)
  
  if (!response.ok) {
    throw new Error(`Erro ao buscar diários: ${response.status}`)
  }
  
  const data = await response.json()
  
  if (!Array.isArray(data)) {
    throw new Error('Formato de dados inválido recebido')
  }
  
  for (const diario of data) {
    diario.url = `/doem_view/${diario.id}`;
  }

  return data
}

export async function getDiariosCount({ id, filtros }) {
  const filtrosQuery = new URLSearchParams({
    count: String(true),
    is_published: String(filtros.is_published),
    ...(filtros.titulo__icontains ? { titulo: filtros.titulo__icontains } : {}),
    ...(filtros.data_pub__lte ? { dataFinal: filtros.data_pub__lte } : {}),
    ...(filtros.data_pub__gte ? { dataInicial: filtros.data_pub__gte } : {}),
  })
  
  const response = await fetch(`${doemApi}/diario/estabelecimento/${id}/?${filtrosQuery}`);
  
  if (!response.ok) {
    throw new Error(`Erro ao buscar contagem de diários: ${response.status}`)
  }
  
  const data = await response.json();
  return data
}

export default function DOEMIframe({ params }) {
  const resolvedParams = use(params)
  const estId = resolvedParams?.id
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalD, setTotalD] = useState(0)
  const [diariosData, setDiariosData] = useState([])

  const loadData = async (id) => {
    if (!id) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const filtros = { is_published: true, count: false };
      const filtrosCount = { is_published: true, count: true };

      const [totalResult, diariosResult] = await Promise.all([
        getDiariosCount({ id, filtros: filtrosCount }),
        getDiarios({ id, filtros, limit: 10 }) // Força limit de 10 para loadData
      ])

      setTotalD(totalResult)
      setDiariosData(diariosResult)
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
      setError(err.message || 'Erro ao carregar dados dos diários')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (estId) {
      loadData(estId)
    }
  }, [estId])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
        <div className="text-center p-8">
          <FiLoader size={48} className="animate-spin text-azul_escuro mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Carregando Diários</h2>
          <p className="text-gray-500">Por favor, aguarde...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <FiAlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Erro ao Carregar</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => loadData(estId)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-azul_escuro text-white rounded-xl hover:bg-azul_escuro/90 transition-colors font-medium"
          >
            <FiRefreshCw className="w-4 h-4" />
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  if (!diariosData.length) {
    return (
      <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
        <div className="text-center p-8">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Nenhum Diário Encontrado</h2>
          <p className="text-gray-500">Não há diários disponíveis para este estabelecimento.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 p-2 sm:p-4 lg:p-6">
        {/* Seção principal - DiarioOficial */}
        <section className="w-full lg:w-2/3 xl:w-3/4">
          <DiarioOficial diarioAtual={diariosData[0]} todosDiarios={diariosData} />
        </section>

        {/* Sidebar - TodasEdicoesDiario */}
        <section className="w-full lg:w-1/3 xl:w-1/4 lg:max-w-sm">
          <TodasEdicoesDiario
            total={totalD}
            diarios={diariosData.slice(0, 9)}
          />
        </section>
      </div>
    </div>
  )
}