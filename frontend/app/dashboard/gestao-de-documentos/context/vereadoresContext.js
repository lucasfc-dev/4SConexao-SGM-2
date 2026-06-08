'use client'
import { useAuth } from '@/app/context/AuthContext'
import Cookies from 'js-cookie'
import { createContext, useContext, useEffect, useState } from 'react'

const VereadoresContext = createContext()
const gedUrl = process.env.NEXT_PUBLIC_GED_ENDPOINT_URL


export function VereadoresProvider({ children }) {
  const [listaVereadores, setListaVereadores] = useState([])
  const { user } = useAuth()
  const [loadingVereadores, setLoadingVereadores] = useState(false)
  const token = Cookies.get('auth-token')

  async function fetchVereadores() {
    try {
      setLoadingVereadores(true)
      const response = await fetch(`${gedUrl}/vereador/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const vereadores = await response.json()
      setListaVereadores(vereadores)
      return vereadores
    } catch (error) {
      console.error('Erro ao obter vereadores:', error)
      return []
    }
    finally{
      setLoadingVereadores(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchVereadores()
    }
  }, [user])

  return (
    <VereadoresContext.Provider value={{ listaVereadores, setListaVereadores, fetchVereadores, loadingVereadores }}>
      {children}
    </VereadoresContext.Provider>
  )
}

export function useVereadores() {
  return useContext(VereadoresContext)
}