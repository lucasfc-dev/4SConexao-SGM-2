'use client'
import { useAuth } from '@/app/context/AuthContext'
import Cookies from 'js-cookie'

import { createContext, useContext, useEffect, useState } from 'react'

const FiscaisContext = createContext()
const acUrl = process.env.NEXT_PUBLIC_AC_ENDPOINT_URL


export function FiscaisProvider({ children }) {
    const [listaFiscaisContrato, setListaFiscaisContrato] = useState([])
    const { user } = useAuth()
    const [loadingFiscais, setLoadingFiscais] = useState(false)
    const token = Cookies.get('auth-token')


    async function fetchFiscaisContrato() {
        try {
            setLoadingFiscais(true)
            const url = `${acUrl}/fiscal_contrato/?relations=pessoa&relations=orgao`
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })
            const fiscais = await response.json()
            setListaFiscaisContrato(fiscais)
            return fiscais
        } catch (error) {
            console.error('Erro ao obter fiscais:', error)
            return []
        }
        finally {
            setLoadingFiscais(false)
        }
    }


    useEffect(() => {
        if (user) {
            fetchFiscaisContrato()
        }
    }, [user])

    return (
        <FiscaisContext.Provider value={{
            fetchFiscaisContrato,
            listaFiscaisContrato,
            setListaFiscaisContrato,
            loadingFiscais
        }}>
            {children}
        </FiscaisContext.Provider>
    )
}

export function useFiscais() {
    return useContext(FiscaisContext)
}
