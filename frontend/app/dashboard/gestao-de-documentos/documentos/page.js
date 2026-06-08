'use client'
import { useAuth } from '@/app/context/AuthContext'
import Cookies from 'js-cookie'
import React, { useEffect, useState, useCallback } from 'react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useGED } from '../context/docsGEDContext'
import Search from '../../diario-oficial-eletronico/components/search'
import TableDocs from '@/app/components/tableDocs'
import { useVereadores } from '../context/vereadoresContext'
import { useTipos } from '../context/tiposContext'
import FormDocsGED from '../components/formDocsGED'
import Modal from '@/app/components/modal'
import FormEditarGED from '../components/formEditar'

const gedUrl = process.env.NEXT_PUBLIC_GED_ENDPOINT_URL


export default function GEDDocumentos() {
  const { user } = useAuth()
  const { listaVereadores } = useVereadores()
  const { listaDocumentos, setListaDocumentos, loadingDOCS, fetchDocumentos } = useGED()
  const { listaTipos } = useTipos()
  const [modalAberta, setModalAberta] = useState(false)
  const [documentoSelecionado, setDocumentoSelecionado] = useState(null)
  const [documentosFiltrados, setDocumentosFiltrados] = useState([])
  const [filtros, setFiltros] = useState({
    titulo: '',
    dataInicial: '',
    dataFinal: ''
  })

  const isCamaraMunicipal = user?.estabelecimento?.config?.tipo === 'DA CÂMARA MUNICIPAL';

  const listaSituacoes = [
    { nome: 'Vigente', id: 1 },
    { nome: 'Revogado', id: 2 },
    { nome: 'Revogado Parcialmente', id: 3 }
  ];

  const token = Cookies.get('auth-token')

  async function handleEnviar(e, requerAssinatura, requerCompartilhamento) {
    const formulario = new FormData(e.target)
    if (!formulario.get('vereador_id')) {
      formulario.delete('vereador_id')
    }

    try {
      const response = await fetch(`${gedUrl}/docs/?${requerCompartilhamento ? 'compartilhar=true' : 'compartilhar=false'}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formulario,
      })

      if (response.status === 400) {
        const errorData = await response.json()
        toast.error(`Erro: ${errorData.detail || 'Dados inválidos'}`, { autoClose: 15000 })
        throw new Error('Dados inválidos')
      }
      else if (requerAssinatura) {
        try {
          const conteudo = await response.json()
          const responseAssinatura = await fetch(`${gedUrl}/docs/sign/${conteudo.id}/`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          if (!responseAssinatura.ok) {
            const errorData = await responseAssinatura.json()
            toast.error(errorData.detail || errorData.message)
            throw new Error('Falha ao assinar documento')
          }
          toast.success('Documento assinado com sucesso!')
        }
        catch (error) {
          toast.error(error.message)
        }
      }
      if (!response.ok) {
        throw new Error('Falha ao enviar documento')
      }
      const novaLista = await fetchDocumentos()
      setListaDocumentos(novaLista)
      setDocumentosFiltrados(novaLista)
      e.target.reset()
      if (requerCompartilhamento) {
        toast.success('Documento adicionado ao módulo DOEM!')
      }
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
      const response = await fetch(`${gedUrl}/docs/${documento.id}/`, {
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
      const response = await fetch(`${gedUrl}/docs/${documento.id}/content/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Falha ao baixar documento')
      }

      const data = await response.blob()
      const urlBlob = URL.createObjectURL(data)
      if (!data) {
        throw new Error('Conteúdo do documento não encontrado')
      }

      const link = document.createElement('a')
      link.href = urlBlob
      link.download = documento.titulo
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Download iniciado com sucesso!')
    }
    catch (error) {
      toast.error(error.message)
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
      const dataDocumento = new Date(documento.pub_date.split('/').reverse().join('-'))
      const dataInicial = filtros.dataInicial ? new Date(filtros.dataInicial) : null
      const dataFinal = filtros.dataFinal ? new Date(filtros.dataFinal) : null

      const dataMatch =
        (!dataInicial || dataDocumento >= dataInicial) &&
        (!dataFinal || dataDocumento <= dataFinal)

      return tituloMatch && dataMatch
    })

    setDocumentosFiltrados(filtered.reverse())
  }, [filtros, listaDocumentos])

  const handleEditar = async (documento) => {
    setDocumentoSelecionado(documento)
    setModalAberta(true)
  }

  const handleFinalizarEdicao = async (e, requerAssinatura) => {
    const formulario = new FormData(e.target)
    const file = formulario.get('file')
    if (file.size === 0) {
      formulario.delete('file')
    }
    formulario.forEach((campo, chave) => {
      if (campo === '') {
        formulario.delete(chave)
      }
    })
    try {
      const response = await fetch(`${gedUrl}/docs/${documentoSelecionado.id}/`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formulario,
      })
      if (!response.ok) {
        throw new Error('Falha ao editar documento')
      }
      else if (requerAssinatura) {
        try {
          const conteudo = await response.json()
          const responseAssinatura = await fetch(`${gedUrl}/docs/sign/${conteudo.id}/`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          if (!responseAssinatura.ok) {
            const errorData = await responseAssinatura.json()
            toast.error(errorData.detail || errorData.message)
            throw new Error('Falha ao assinar documento')
          }
          toast.success('Documento assinado com sucesso!')
        }
        catch (error) {
          toast.error(error.message)
        }
      }
      fetchDocumentos()
      toast.success('Documento salvo com sucesso!')
      setModalAberta(false)
    }
    catch (error) {
      toast.error(error.message)
    }
  }

  function isCamara(listaVereadores) {
    const tipo = user?.estabelecimento?.config?.tipo
    if (tipo === "DA CÂMARA MUNICIPAL") {
      return listaVereadores
    }
    return false
  }

  useEffect(() => {
    handleBuscar()
  }, [handleBuscar])

  return (
    <section className="flex flex-col flex-grow overflow-auto text-azul_escuro bg-gradient-to-br from-gray-200 to-gray-300 p-2 md:p-4">
      <ToastContainer />

      <FormDocsGED
        titulo="Cadastrar documento"
        btnLabel="Cadastrar documento"
        listaOrgaos={user?.orgaos ?? []}
        onSubmit={handleEnviar}
        listaTipos={listaTipos}
        listaVereadores={isCamaraMunicipal ? listaVereadores : null}
      />
      <div className="bg-white mt-4 p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-10">Buscar Documentos Cadastrados</h2>
        <div className='mb-10'>
          <Search
            filtros={filtros}
            onFiltroChange={handleFiltroChange}
            onBuscar={handleBuscar}
          />
        </div>
        {loadingDOCS ? '' :
          <TableDocs
            listaDocs={documentosFiltrados}
            loading={loadingDOCS}
            onEditar={handleEditar}
            onDeletar={handleDeletar}
            onDownload={handleDownload}
            listaColunas={[
              { nomeColuna: 'Título', coluna: 'titulo' },
              { nomeColuna: 'Tipo', coluna: 'tipo' },
              { nomeColuna: 'Publicado em', coluna: 'pub_date' },
              { nomeColuna: 'Descrição', coluna: 'descricao' }
            ]}
          ></TableDocs>}
      </div>
        <Modal isOpen={modalAberta} onClose={() => setModalAberta(false)} title="Editar Documento">
          <FormEditarGED
            titulo='Editar Documento'
            btnLabel='Finalizar edição'
            onCancel={() => setModalAberta(false)}
            documento={documentoSelecionado}
            onSubmit={handleFinalizarEdicao}
            listaSituacoes={listaSituacoes}
            listaOrgaos={user?.orgaos ?? []}
            listaVereadores={isCamara(listaVereadores)}
            listaTipos={listaTipos}>
          </FormEditarGED>
        </Modal>
    </section>
  )
}