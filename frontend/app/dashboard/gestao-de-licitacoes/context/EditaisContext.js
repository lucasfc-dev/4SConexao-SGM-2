'use client'
import { useAuth } from '@/app/context/AuthContext'
import Cookies from 'js-cookie'
import { createContext, useContext, useEffect, useState } from 'react'

const EditaisContext = createContext()
const acUrl = process.env.NEXT_PUBLIC_AC_ENDPOINT_URL

export function EditaisProvider({ children }) {
    const [listaEditais, setListaEditais] = useState([])
    const { user } = useAuth()
    const [loadingEditais, setLoadingEditais] = useState(false)
    const token = Cookies.get('auth-token')

    async function fetchEditais() {
        try {
            setLoadingEditais(true)
            const response = await fetch(`${acUrl}/edital/?relations=secao&relations=orgao`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })
            const editais = await response.json()
            setListaEditais(editais)
            return editais
        } catch (error) {
            console.error('Erro ao obter editais:', error)
            return []
        }
        finally {
            setLoadingEditais(false)
        }
    }

    useEffect(() => {
        if (user) {
            fetchEditais()
        }
    }, [user])

    return (
        <EditaisContext.Provider value={{ listaEditais, setListaEditais, fetchEditais, loadingEditais }}>
            {children}
        </EditaisContext.Provider>
    )
}

export function useEditais() {
    return useContext(EditaisContext)
}
