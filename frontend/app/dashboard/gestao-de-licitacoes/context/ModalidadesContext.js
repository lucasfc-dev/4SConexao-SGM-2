'use client'
import { useAuth } from '@/app/context/AuthContext'
import Cookies from 'js-cookie'
import { createContext, useContext, useEffect, useState } from 'react'

const ModalidadesContext = createContext()
const acUrl = process.env.NEXT_PUBLIC_AC_ENDPOINT_URL


export function ModalidadesProvider({ children }) {
    const [listaModalidades, setListaModalidades] = useState([])
    const { user } = useAuth()
    const [loadingModalidades, setLoadingModalidades] = useState(false)
    const token = Cookies.get('auth-token')
    

    async function fetchModalidades() {
        try {
            setLoadingModalidades(true)
            const response = await fetch(`${acUrl}/modalidade/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })
            const modalidades = await response.json()
            setListaModalidades(modalidades)
            return modalidades
        } catch (error) {
            console.error('Erro ao obter modalidades:', error)
            return []
        }
        finally {
            setLoadingModalidades(false)
        }
    }

    useEffect(() => {
        if (user) {
            fetchModalidades()
        }
    }, [user])

    return (
        <ModalidadesContext.Provider value={{ listaModalidades, setListaModalidades, fetchModalidades, loadingModalidades }}>
            {children}
        </ModalidadesContext.Provider>
    )
}

export function useModalidades() {
    return useContext(ModalidadesContext)
}