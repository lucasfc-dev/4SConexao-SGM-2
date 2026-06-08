'use client'
import { useAuth } from '@/app/context/AuthContext'
import Cookies from 'js-cookie'
import { createContext, useContext, useState } from 'react'

const DispensasContext = createContext()
const acUrl = process.env.NEXT_PUBLIC_AC_ENDPOINT_URL

export function DispensasProvider({ children }) {
    const [listaDispensas, setListaDispensas] = useState([])
    const [totalDispensas, setTotalDispensas] = useState(0)
    const [loadingDispensas, setLoadingDispensas] = useState(false)
    const token = Cookies.get('auth-token')

    async function fetchDispensas({ limit = 20, offset = 0, filters = {} } = {}) {
        try {
            setLoadingDispensas(true)
            const relations = 'relations=secao&relations=orgao&relations=certificado_publicacao'
            const filterParams = new URLSearchParams(
                Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '' && v != null))
            ).toString()
            const baseQuery = `${relations}&limit=${limit}&offset=${offset}${filterParams ? '&' + filterParams : ''}`

            const [listRes, countRes] = await Promise.all([
                fetch(`${acUrl}/dispensa/?${baseQuery}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                }),
                fetch(`${acUrl}/dispensa/?count=true${filterParams ? '&' + filterParams : ''}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                }),
            ])

            const dispensas = await listRes.json()
            const total = await countRes.json()

            setListaDispensas(Array.isArray(dispensas) ? dispensas : [])
            setTotalDispensas(typeof total === 'number' ? total : 0)
            return dispensas
        } catch (error) {
            console.error('Erro ao obter dispensas:', error)
            return []
        } finally {
            setLoadingDispensas(false)
        }
    }

    return (
        <DispensasContext.Provider value={{ listaDispensas, setListaDispensas, totalDispensas, fetchDispensas, loadingDispensas }}>
            {children}
        </DispensasContext.Provider>
    )
}

export function useDispensas() {
    return useContext(DispensasContext)
}
