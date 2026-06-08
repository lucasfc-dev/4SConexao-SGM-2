'use client'
import { useAuth } from '@/app/context/AuthContext'
import Cookies from 'js-cookie'
import { createContext, useContext, useEffect, useState } from 'react'

const RelatoriosContext = createContext()
const gedUrl = process.env.NEXT_PUBLIC_GED_ENDPOINT_URL


export function RelatoriosProvider({ children }) {
    const [listaRelatorios, setListaRelatorios] = useState([])
    const { user } = useAuth()
    const [loadingRelatorios, setLoadingRelatorios] = useState(false)
    const token = Cookies.get('auth-token')

    async function fetchRelatorios() {
        try {
            setLoadingRelatorios(true)
            const response = await fetch(`${gedUrl}/relatorio/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })
            const relatorios = await response.json()
            const documentosData = relatorios.map((documento) => ({
                titulo: documento.titulo,
                id: documento.id,
                uploaded_at: new Date(documento.created_at).toLocaleDateString('pt-br'),
            }))
            setListaRelatorios(documentosData)
            return documentosData
        } catch (error) {
            console.error('Erro ao obter relatórios:', error)
            return []
        }
        finally {
            setLoadingRelatorios(false)
        }
    }

    useEffect(() => {
        if (user) {
            fetchRelatorios()
        }
    }, [user])

    return (
        <RelatoriosContext.Provider value={{ listaRelatorios, setListaRelatorios, fetchRelatorios, loadingRelatorios }}>
            {children}
        </RelatoriosContext.Provider>
    )
}

export function useRelatorios() {
    return useContext(RelatoriosContext)
}