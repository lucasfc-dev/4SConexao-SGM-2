'use client';

import { useEffect, useState } from "react"
import { useDiarios } from "../context/DOContext"
import Search from "../components/search"
import { FaPlus } from "react-icons/fa"
import { toast, ToastContainer } from "react-toastify"
import Cookies from "js-cookie"
import ListaPendentes from "../components/listaPendentes"
import 'react-toastify/dist/ReactToastify.css'
import { FiLoader } from "react-icons/fi";
import PaginacaoDOEM from "@/app/components/PaginacaoDOEM"
const doemUrl = process.env.NEXT_PUBLIC_DOEM_ENDPOINT_URL


export default function Pendentes() {
  const [diarioSelecionado, setDiarioSelecionado] = useState(null)
  const [diariosFiltrados, setDiariosFiltrados] = useState([])
  const token = Cookies.get('auth-token')
  const [isPublicando, setIsPublicando] = useState(false)
  const { listaPendentes, setListaPendentes, setListaPublicados, loading, fetchDiarios } = useDiarios()
  const [iframeSrc, setIframeSrc] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const [paginaAtual, setPaginaAtual] = useState(1)
  const itensPorPagina = 10
  const [totalItems, setTotalItems] = useState(0)
  const [filtros, setFiltros] = useState({
    dataInicial: '',
    dataFinal: '',
    titulo: '',
  })


  const handleFiltroChange = (campo, valor) => {
    setFiltros({
      ...filtros,
      [campo]: valor,
    })
  }

  useEffect(() => {
    const currentUrl = iframeSrc
    return () => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl)
      }
    };
  }, [iframeSrc])

  async function exibirDiario(itemId) {
    try {
      setIsLoading(true)

      // Encontra o diário selecionado na lista filtrada
      const diario = diariosFiltrados.find(d => d.id === itemId)
      if (diario) {
        setDiarioSelecionado(itemId)
      }

      const response = await fetch(`${doemUrl}/diario/${itemId}/content/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
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
      console.error('Erro ao exibir o diário:', error)
      toast.error('Erro ao abrir o DO, tente novamente!')
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

    const countItems = await fetchDiarios(filtrosAPI, true, 1, itensPorPagina, false)
    setTotalItems(countItems)
    const diariosResponse = await fetchDiarios(filtrosAPI, false, 1, itensPorPagina, false)
    setDiariosFiltrados(diariosResponse)
  }

  const handleDeletar = async (diarioId) => {
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
        setListaPendentes((prevPendentes) =>
          prevPendentes.filter((diario) => diario.id !== diarioId)
        )

        // Atualiza o total de itens
        setTotalItems((prevTotal) => Math.max(0, prevTotal - 1))

        // Limpa a visualização se o diário deletado estava sendo visualizado
        if (diarioSelecionado && diarioSelecionado === diarioId) {
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

          const diariosResponse = await fetchDiarios(filtrosAPI, false, novaPagina, itensPorPagina, false)
          setDiariosFiltrados(diariosResponse)
        }

        toast.success(`Diário oficial de id ${diarioId} deletado com sucesso!`)
      }
    }
    catch (error) {
      console.error(error.detail)
      toast.error('Erro ao deletar Diário Oficial')
    }
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

    const diariosResponse = await fetchDiarios(filtrosAPI, false, novaPagina, itensPorPagina, false)
    setDiariosFiltrados(diariosResponse)
  }

  useEffect(() => {
    handleBuscar()
  }, [])

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

  const handlePublicar = async (diarioId) => {
    try {
      setIsPublicando(true)
      const conexao = await fetch(`${doemUrl}/diario/sign/${diarioId}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (conexao.ok) {
        const diarioPublicado = await conexao.json();
        toast.success('Diário assinado e publicado com sucesso!');

        // Remove do estado local de diários filtrados
        setDiariosFiltrados((prevFiltrados) =>
          prevFiltrados.filter((diario) => diario.id !== diarioId)
        )

        // Remove do estado global do contexto
        setListaPendentes((prevPendentes) =>
          prevPendentes.filter((diario) => diario.id !== diarioId)
        );

        setListaPublicados((prevPublicados) => [
          ...prevPublicados,
          diarioPublicado,
        ]);

        // Atualiza o total de itens
        setTotalItems((prevTotal) => Math.max(0, prevTotal - 1))

        // Limpa a visualização
        setDiarioSelecionado(null);
        setIframeSrc('');

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

          const diariosResponse = await fetchDiarios(filtrosAPI, false, novaPagina, itensPorPagina, false)
          setDiariosFiltrados(diariosResponse)
        }
      } else if (conexao.status === 400) {
        const response = await conexao.json()
        toast.error(`Erro: ${response.detail}`);
        throw new Error(`Status: ${conexao.status}, Mensagem: ${response.detail}`);
      } else {
        toast.error(`Erro: ${conexao.statusText}`);
        throw new Error(`Status: ${conexao.status}, Mensagem: ${conexao.statusText}`);
      }
    } catch (error) {
      console.error('Erro ao publicar diário:', error);
      toast.error('Ocorreu um erro ao publicar o diário.');
    }
    finally {
      setIsPublicando(false)
    }
  };


  return (
    <section className="flex flex-col flex-grow md:flex-row overflow-auto text-azul_escuro p-2 sm:p-4 bg-gradient-to-br from-gray-200 to-gray-300">
      <ToastContainer></ToastContainer>
      <div className="md:w-1/2 h-auto w-full flex flex-col pr-2 gap-6 rounded-lg">
        <div className="flex flex-col gap-2">
          <Search filtros={filtros} onFiltroChange={handleFiltroChange} onBuscar={handleBuscar} opened={false} />
        </div>
        <div className="flex flex-col mb-2 h-96 sm:h-auto">
          <div className="flex justify-between mb-4">
            <div className="flex items-center">
              <h2 className="text-xl font-semibold text-azul_escuro">Diários Pendentes</h2>
            </div>
            {diarioSelecionado ?
              <button
                onClick={() => handlePublicar(diarioSelecionado)}
                className={`flex items-center px-4 w-56 justify-center py-2 bg-green-700 hover:bg-green-900 text-branco_cinza hover:text-branco_cinza rounded-lg transition duration-300`}
              >
                <FaPlus className="mr-2" /> Assinar e Publicar
              </button> : isPublicando ?
                <button
                  disabled
                  onClick={() => handlePublicar(diarioSelecionado)}
                  className={`flex items-center px-4 w-56 justify-center py-2 bg-green-700 hover:bg-green-900 text-branco_cinza hover:text-branco_cinza rounded-lg transition duration-300`}
                >
                  <FiLoader className="mr-2 animate-spin" /> Publicando
                </button> :
                <button
                  className={`${!diarioSelecionado
                    && 'bg-azul_escuro bg-opacity-50 cursor-not-allowed'} flex items-center px-4 py-2 w-56 justify-center bg-azul_escuro text-branco_cinza hover:text-branco_cinza rounded-lg transition duration-300`}
                >
                  <FaPlus className="mr-2" /> Selecione um diário
                </button>
            }
          </div>
          <div className="overflow-auto">
            {diariosFiltrados.length > 0 ?
              <>
                <ListaPendentes
                  lista={diariosFiltrados}
                  onDiarioClick={(diario) => exibirDiario(diario.id)}
                  onDeletar={handleDeletar}
                  onDownload={handleDownload}
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
      </div>
      <div className="hidden md:w-1/2 md:flex flex-col">
        <div className="flex-grow rounded-md">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-azul_escuro"></div>
            </div>
          ) : diarioSelecionado && iframeSrc ? (
            <iframe src={iframeSrc} width="100%" height="100%" className="rounded-md shadow-md"></iframe>
          ) : (
            <p className="text-center text-gray-500">Selecione um diário oficial para visualizar.</p>
          )}
        </div>
      </div>
    </section>
  )
}
