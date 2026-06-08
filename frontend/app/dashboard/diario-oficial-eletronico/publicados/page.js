'use client'

import { useCallback, useEffect, useState } from "react"
import ListaPublicados from "../components/listaPublicados"
import { useDiarios } from "../context/DOContext"
import Cookies from "js-cookie"
import Search from "../components/search"
import { toast, ToastContainer } from "react-toastify"
import 'react-toastify/dist/ReactToastify.css'
import { FaSpinner } from "react-icons/fa"
import { FiLoader } from "react-icons/fi"
import PaginacaoDOEM from "@/app/components/PaginacaoDOEM"
const doemUrl = process.env.NEXT_PUBLIC_DOEM_ENDPOINT_URL



export default function PublicadosPage() {
  const { listaPublicados, setListaPublicados, loading, fetchDiarios } = useDiarios()
  const token = Cookies.get('auth-token')
  const [diarioSelecionado, setDiarioSelecionado] = useState(null)
  const [iframeSrc, setIframeSrc] = useState('')
  const [diariosFiltrados, setDiariosFiltrados] = useState([])

  const [paginaAtual, setPaginaAtual] = useState(1)
  const itensPorPagina = 10
  const [totalItems, setTotalItems] = useState(0)
  const [filtros, setFiltros] = useState({
    dataInicial: '',
    dataFinal: '',
    titulo: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const onDeletar = async (diarioId) => {
    try {
      const conexao = await fetch(`${doemUrl}/diario/${diarioId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (conexao.ok) {
        // Remove do estado local de diários filtrados
        setDiariosFiltrados((prevFiltrados) =>
          prevFiltrados.filter((diario) => diario.id !== diarioId)
        )
        
        // Remove do estado global do contexto
        setListaPublicados((prevPublicados) =>
          prevPublicados.filter((diario) => diario.id !== diarioId)
        )
        
        // Atualiza o total de itens
        setTotalItems((prevTotal) => Math.max(0, prevTotal - 1))
        
        // Limpa a visualização se o diário deletado estava sendo visualizado
        if (diarioSelecionado && diarioSelecionado.id === diarioId) {
          setDiarioSelecionado(null)
          setIframeSrc('')
        }
        
        // Se a página atual ficou vazia, volta para a página anterior
        const itensPaginaAtual = diariosFiltrados.length
        if (itensPaginaAtual === 1 && paginaAtual > 1) {
          const novaPagina = paginaAtual - 1
          setPaginaAtual(novaPagina)

          // Converte filtros para o formato da API
          const filtrosAPI = {
            ...(filtros.titulo && { titulo: filtros.titulo }),
            ...(filtros.dataInicial && { data_pub__gte: filtros.dataInicial }),
            ...(filtros.dataFinal && { data_pub__lte: filtros.dataFinal }),
          }

          const diariosResponse = await fetchDiarios(filtrosAPI, false, novaPagina, itensPorPagina, true)
          setDiariosFiltrados(diariosResponse)
        }
        
        toast.success(`Diário oficial deletado com sucesso!`)
      } else {
        toast.error('Erro ao deletar Diário Oficial')
      }
    }
    catch (error) {
      console.error('Erro ao deletar:', error)
      toast.error('Erro ao deletar Diário Oficial')
    }
  }

  const handleFiltroChange = (campo, valor) => {
    setFiltros({
      ...filtros,
      [campo]: valor,
    });
  };

  useEffect(() => {
    const currentUrl = iframeSrc
    return () => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl)
      }
    };
  }, [iframeSrc])


  const handleDownload = async (itemId) => {
    try {
      const response = await fetch(`${doemUrl}/diario/${itemId}/content/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        throw new Error('Falha ao baixar o diário.')
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `DOEM_${itemId}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erro ao baixar o diário:', error)
    }
  }

  async function exibirDiario(itemId) {
    try {
      setIsLoading(true)
      
      // Encontra o diário selecionado na lista filtrada
      const diario = diariosFiltrados.find(d => d.id === itemId)
      if (diario) {
        setDiarioSelecionado(diario)
      }
      
      const response = await fetch(`${doemUrl}/diario/${itemId}/content/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        throw new Error('Falha ao buscar o diário.')
      }
      const blob = await response.blob()
      
      // Revoga a URL anterior se existir
      if (iframeSrc) {
        URL.revokeObjectURL(iframeSrc)
      }
      
      const url = URL.createObjectURL(blob)
      setIframeSrc(url)
      setIsLoading(false)
    } catch (error) {
      toast.error('Erro ao exibir o DO, tente novamente!')
      console.error('Erro ao exibir o diário:', error)
      setIsLoading(false)
    }
  }

  const handleBuscar = async (event) => {
    if (event) {
      event.preventDefault()
    }
    setPaginaAtual(1)

    // Converte filtros para o formato da API
    const filtrosAPI = {
      ...(filtros.titulo && { titulo: filtros.titulo }),
      ...(filtros.dataInicial && { data_pub__gte: filtros.dataInicial }),
      ...(filtros.dataFinal && { data_pub__lte: filtros.dataFinal }),
    }

    const countItems = await fetchDiarios(filtrosAPI, true, 1, itensPorPagina, true)
    setTotalItems(countItems)
    const diariosResponse = await fetchDiarios(filtrosAPI, false, 1, itensPorPagina, true)
    setDiariosFiltrados(diariosResponse)
  }

  const handleMudarPagina = async (novaPagina) => {
    setPaginaAtual(novaPagina)
    setDiarioSelecionado(null)
    setIframeSrc('')

    // Converte filtros para o formato da API
    const filtrosAPI = {
      ...(filtros.titulo && { titulo: filtros.titulo }),
      ...(filtros.dataInicial && { data_pub__gte: filtros.dataInicial }),
      ...(filtros.dataFinal && { data_pub__lte: filtros.dataFinal }),
    }

    const diariosResponse = await fetchDiarios(filtrosAPI, false, novaPagina, itensPorPagina, true)
    setDiariosFiltrados(diariosResponse)
  }


  useEffect(() => {
    handleBuscar()
  }, [])

  return (
    <section className="flex flex-col md:flex-row flex-grow text-azul_escuro overflow-auto bg-gradient-to-br from-gray-200 to-gray-300 p-4">
      <ToastContainer></ToastContainer>
      <div className="md:w-1/2 w-full flex flex-col gap-6 pr-2 bg-branco rounded-lg">
        <div className="flex flex-col gap-2">
          <Search filtros={filtros} onFiltroChange={handleFiltroChange} onBuscar={handleBuscar}/>
        </div>
        <div className="flex flex-col gap-4 h-96 sm:h-auto">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-azul_escuro">Diários Publicados</h2>
          </div>
          {diariosFiltrados.length > 0 ?
            <>
              <ListaPublicados
                lista={diariosFiltrados}
                onDeletar={onDeletar}
                onDiarioClick={(diario) => exibirDiario(diario.id)}
                onDownload={handleDownload}
                mostrarBotoes={true}
              />
              <PaginacaoDOEM
                totalItems={totalItems}
                itemsPerPage={itensPorPagina}
                currentPage={paginaAtual}
                setCurrentPage={handleMudarPagina}
              />
            </>
            : loading ?
              <div className="flex flex-grow h-16 text-center items-center justify-center">
                <FiLoader className="animate-spin text-4xl text-azul_escuro" />
              </div>
              :
              <p className="text-center">Nenhum diário para visualizar.</p>}
        </div>
      </div>
      <div className="hidden md:w-1/2 md:flex flex-col">
        <div className="flex-grow rounded-md">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-azul_escuro"></div>
            </div>
          ) : diarioSelecionado ? (
            <div className="flex-grow rounded-md h-full overflow-auto">
              <iframe src={iframeSrc} className="w-full h-full"></iframe>
            </div>
          ) : (
            <p className="text-center text-gray-500">Selecione um documento para visualizar.</p>
          )}
        </div>
      </div>

    </section>
  )
}
