'use client'
import { useAuth } from '@/app/context/AuthContext'
import Cookies from 'js-cookie'
import { createContext, useContext, useEffect, useState } from 'react'

const SecaoContext = createContext()
const acUrl = process.env.NEXT_PUBLIC_AC_ENDPOINT_URL


export function SecaoProvider({ children }) {
    const [listaSecoes, setListaSecoes] = useState([])
    const { user } = useAuth()
    const [loadingSecoes, setLoadingSecoes] = useState(false)
    const token = Cookies.get('auth-token')
    

    async function fetchSecoes() {
        try {
            setLoadingSecoes(true)
            const response = await fetch(`${acUrl}/secao/?relations=responsavel&relations=orgao`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })
            const secoes = await response.json()
            setListaSecoes(secoes)
            return secoes
        } catch (error) {
            console.error('Erro ao obter seções:', error)
            return []
        }
        finally {
            setLoadingSecoes(false)
        }
    }

    useEffect(() => {
        if (user) {
            fetchSecoes()
        }
    }, [user])

    return (
        <SecaoContext.Provider value={{ listaSecoes, setListaSecoes, fetchSecoes, loadingSecoes }}>
            {children}
        </SecaoContext.Provider>
    )
}

export function useSecao() {
    return useContext(SecaoContext)
}