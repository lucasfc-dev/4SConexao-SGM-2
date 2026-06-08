'use client'
import { useAuth } from '@/app/context/AuthContext'
import Cookies from 'js-cookie'
import { createContext, useContext, useEffect, useState } from 'react'

const TiposContext = createContext()
const gedUrl = process.env.NEXT_PUBLIC_GED_ENDPOINT_URL


export function TiposProvider({ children }) {
  const [listaTipos, setListaTipos] = useState([])
  const { user } = useAuth()
  const [loadingTipos, setLoadingTipos] = useState(false)
  const token = Cookies.get('auth-token')

  async function fetchTipos() {
    try {
      setLoadingTipos(true)
      const response = await fetch(`${gedUrl}/tipo/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const tipos = await response.json()
      setListaTipos(tipos)
      return tipos
    } catch (error) {
      console.error('Erro ao obter tipos de documento:', error)
      return []
    }
    finally{
      setLoadingTipos(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchTipos()
    }
  }, [user])

  return (
    <TiposContext.Provider value={{ listaTipos, setListaTipos, fetchTipos, loadingTipos }}>
      {children}
    </TiposContext.Provider>
  )
}

export function useTipos() {
  return useContext(TiposContext)
}