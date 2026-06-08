'use client'
import { useAuth } from '@/app/context/AuthContext'
import Cookies from 'js-cookie'
import { createContext, useContext, useEffect, useState } from 'react'

const ComissoesContext = createContext()
const acUrl = process.env.NEXT_PUBLIC_AC_ENDPOINT_URL

export function ComissoesProvider({ children }) {
    const [listaComissoes, setListaComissoes] = useState([])
    const { user } = useAuth()
    const [loadingComissoes, setLoadingComissoes] = useState(false)
    const token = Cookies.get('auth-token')

    async function fetchComissoes() {
        try {
            setLoadingComissoes(true)
            const response = await fetch(`${acUrl}/comissao/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })
            const comissoes = await response.json()
            setListaComissoes(comissoes)
            return comissoes
        } catch (error) {
            console.error('Erro ao obter comissões:', error)
            return []
        }
        finally {
            setLoadingComissoes(false)
        }
    }

    useEffect(() => {
        if (user) {
            fetchComissoes()
        }
    }, [user])

    return (
        <ComissoesContext.Provider value={{ listaComissoes, setListaComissoes, fetchComissoes, loadingComissoes }}>
            {children}
        </ComissoesContext.Provider>
    )
}

export function useComissoes() {
    return useContext(ComissoesContext)
}
