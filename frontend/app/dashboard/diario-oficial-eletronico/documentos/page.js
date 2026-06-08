'use client'
import { apiOrgaos } from '@/app/api/apiOrgaos'
import { useAuth } from '@/app/context/AuthContext'
import { useDocumentos } from '../context/documentosContext'
import Cookies from 'js-cookie'
import React, { useEffect, useState, useCallback } from 'react'
import Search from '../components/search'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import TableDocs from '@/app/components/tableDocs'
import FormDocsDOEM from '../components/formDocsDOEM'

const doemUrl = process.env.NEXT_PUBLIC_DOEM_ENDPOINT_URL


export default function Documentos() {
  const { user } = useAuth()
  const { listaDocumentos, setListaDocumentos, loadingDOCS } = useDocumentos()
  const [orgaos, setOrgaos] = useState([])
  const [documentosFiltrados, setDocumentosFiltrados] = useState([])
  const [filtros, setFiltros] = useState({
    titulo: '',
    dataInicial: '',
    dataFinal: ''
  })
  const token = Cookies.get('auth-token')

  const getOrgaos = async () => {
    try {
      const fetchOrgaos = await apiOrgaos.getAll()
      setOrgaos(fetchOrgaos)
    } catch (error) {
      toast.error('Erro ao carregar órgãos')
    }
  }

  async function handleEnviar(e) {
    const formulario = new FormData(e.target)
    try {
      const response = await fetch(`${doemUrl}/docs/uploadfile/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formulario,
      })

      if (!response.ok) {
        throw new Error('Falha ao enviar documento')
      }
      const novoDocumento = await response.json()
      const documentoData = {
        titulo: novoDocumento.titulo,
        id: novoDocumento.id,
        tipo: novoDocumento.tipo,
        uploaded_at: new Date(novoDocumento.uploaded_at).toLocaleDateString('pt-br'),
      }
      setListaDocumentos(docs => [...docs, documentoData])
      setDocumentosFiltrados(docs => [...docs, documentoData])
      e.target.reset()
      toast.success('Documento enviado com sucesso!')
    } catch (error) {
      toast.error(error.message)
    }
  }

  async function handleDeletar(documento) {
    if (!window.confirm('Tem certeza que deseja excluir este documento?')) {
      return
    }
    try {
      const response = await fetch(`${doemUrl}/docs/${documento.id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Falha ao deletar documento')
      }

      const filteredDocs = listaDocumentos.filter(doc => doc.id !== documento.id)
      setListaDocumentos(filteredDocs)
      setDocumentosFiltrados(filteredDocs)
      toast.success('Documento deletado com sucesso!')
    } catch (error) {
      toast.error(error.message)
    }
  }

  async function handleDownload(documento) {
    try {
      const response = await fetch(`${doemUrl}/docs/download/${documento.id}/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Falha ao baixar documento');
      }

      const contentType = response.headers.get('Content-Type');
      const blob = await response.blob();

      let extension = '';
      if (contentType === 'application/pdf') {
        extension = '.pdf';
      } else if (contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        extension = '.docx';
      } else {
        throw new Error('Tipo de conteúdo desconhecido');
      }

      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = documento.titulo + extension;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      toast.success('Download iniciado com sucesso!');
    } catch (error) {
      toast.error(error.message);
    }
  }


  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }))
  }

  const handleBuscar = useCallback((event) => {
    if (event) {
      event.preventDefault()
    }

    const filtered = listaDocumentos.filter((documento) => {
      const tituloMatch = !filtros.titulo ||
        documento.titulo?.toLowerCase().includes(filtros.titulo.toLowerCase())

      const dataDocumento = new Date(documento.uploaded_at.split('/').reverse().join('-'))
      const dataInicial = filtros.dataInicial ? new Date(filtros.dataInicial) : null
      const dataFinal = filtros.dataFinal ? new Date(filtros.dataFinal) : null

      const dataMatch =
        (!dataInicial || dataDocumento >= dataInicial) &&
        (!dataFinal || dataDocumento <= dataFinal)

      return tituloMatch && dataMatch
    })

    setDocumentosFiltrados(filtered.reverse())
  }, [filtros, listaDocumentos])


  useEffect(() => {
    if (user) {
      getOrgaos()
    }
  }, [])

  useEffect(() => {
    handleBuscar()
  }, [handleBuscar])

  return (
    <section className="flex-grow overflow-auto text-azul_escuro bg-gradient-to-br from-gray-200 to-gray-300 bg-gray-100 p-4 md:p-8">
      <ToastContainer />
      <div className="mx-auto">
        <FormDocsDOEM listaOrgaos={orgaos} onSubmit={handleEnviar} />
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className='mb-2'>
            <Search
              filtros={filtros}
              onFiltroChange={handleFiltroChange}
              opened={true}
            />
          </div>
          <TableDocs
            listaDocs={documentosFiltrados}
            loading={loadingDOCS}
            onDeletar={handleDeletar}
            onDownload={handleDownload}
            listaColunas={[
              { nomeColuna: 'Título', coluna: 'titulo' },
              { nomeColuna: 'Tipo', coluna: 'tipo' },
              { nomeColuna: 'Enviado em', coluna: 'uploaded_at' }
            ]}>
          </TableDocs>
        </div>
      </div>
    </section>
  )
}
