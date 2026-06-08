'use client'
import { useAuth } from '@/app/context/AuthContext'
import Cookies from 'js-cookie'
import { createContext, useContext, useEffect, useState } from 'react'

const DocumentosGEDContext = createContext()
const gedUrl = process.env.NEXT_PUBLIC_GED_ENDPOINT_URL


export function DocumentosGEDProvider({ children }) {
  const [listaDocumentos, setListaDocumentos] = useState([])
  const { user } = useAuth()
  const [loadingDOCS, setLoadingDOCS] = useState(false)
  const token = Cookies.get('auth-token')

  async function fetchDocumentos() {
    try {
      setLoadingDOCS(true)
      const response = await fetch(`${gedUrl}/docs/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const resposta = await response.json()
      const documentosData = resposta.map((documento) => ({
        titulo: documento.titulo,
        descricao: documento.descricao,
        situacao: documento.situacao,
        orgao: documento.orgao,
        id: documento.id,
        tipo: documento.tipo__nome,
        vereador:documento.vereador__nome,
        vereador_id:documento.vereador__id,
        tipo_id: documento.tipo__id,
        pub_date: documento.pub_date.split('-').reverse().join('/'),
      }))
      setListaDocumentos(documentosData)
      return documentosData
    } catch (error) {
      console.error('Erro ao obter documentos:', error)
      return []
    }
    finally{
      setLoadingDOCS(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchDocumentos()
    }
  }, [user])

  return (
    <DocumentosGEDContext.Provider value={{ listaDocumentos, setListaDocumentos, fetchDocumentos, loadingDOCS }}>
      {children}
    </DocumentosGEDContext.Provider>
  )
}

export function useGED() {
  return useContext(DocumentosGEDContext)
}
