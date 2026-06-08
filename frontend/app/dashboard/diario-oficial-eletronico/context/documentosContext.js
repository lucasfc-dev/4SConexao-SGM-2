'use client'
import { useAuth } from '@/app/context/AuthContext'
import Cookies from 'js-cookie'
import { createContext, useContext, useEffect, useState } from 'react'

const DocumentosContext = createContext()
const doemUrl = process.env.NEXT_PUBLIC_DOEM_ENDPOINT_URL


export function DocumentosProvider({ children }) {
  const [listaDocumentos, setListaDocumentos] = useState([])
  const { user } = useAuth()
  const [loadingDOCS, setLoadingDOCS] = useState(false)
  const token = Cookies.get('auth-token')

  async function fetchDocumentos() {
    try {
      setLoadingDOCS(true)
      const response = await fetch(`${doemUrl}/docs/all/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const resposta = await response.json()
      const documentosData = resposta.map((documento) => ({
        titulo: documento.titulo,
        id: documento.id,
        tipo: documento.tipo,
        uploaded_at: new Date(documento.uploaded_at).toLocaleDateString('pt-br'),
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
    <DocumentosContext.Provider value={{ listaDocumentos, setListaDocumentos, fetchDocumentos, loadingDOCS }}>
      {children}
    </DocumentosContext.Provider>
  )
}

export function useDocumentos() {
  return useContext(DocumentosContext)
}
