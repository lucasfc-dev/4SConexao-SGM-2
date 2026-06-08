'use client'
import { useAuth } from '@/app/context/AuthContext'
import Cookies from 'js-cookie'
import { createContext, useContext, useEffect, useState } from 'react'

const DOContext = createContext()
const doemUrl = process.env.NEXT_PUBLIC_DOEM_ENDPOINT_URL

export function DOProvider({ children }) {
    const [listaDiarios, setListaDiarios] = useState([])
    const { user } = useAuth()
    const token = Cookies.get('auth-token')
    const [listaPublicados, setListaPublicados] = useState([])
    const [listaPendentes, setListaPendentes] = useState([])
    const [loading, setLoading] = useState(true)

    async function fetchDiarios(filtros = {}, count = false, page = 1, itensPorPagina = 20, isPublished) {
        setLoading(true)
        try {
            if (count) {
                const params = new URLSearchParams({
                    count: String(count),
                    is_published: isPublished,
                    ...(filtros.titulo && { titulo: filtros.titulo }),
                    ...(filtros.data_pub__gte && { data_pub__gte: filtros.data_pub__gte }),
                    ...(filtros.data_pub__lte && { data_pub__lte: filtros.data_pub__lte }),
                })
                const respCount = await fetch(`${doemUrl}/diario/all/?${params}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })
                if (!respCount.ok) throw new Error('Erro ao buscar total de documentos')
                const totalCount = await respCount.json()
                return totalCount
            } else {
                const params = new URLSearchParams({
                    offset: String((page - 1) * itensPorPagina),
                    is_published: isPublished,
                    limit: 10,
                    ...(filtros.titulo && { titulo: filtros.titulo }),
                    ...(filtros.data_pub__gte && { data_pub__gte: filtros.data_pub__gte }),
                    ...(filtros.data_pub__lte && { data_pub__lte: filtros.data_pub__lte }),
                })
                const response = await fetch(`${doemUrl}/diario/all/?${params}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })
                const dos = await response.json()
                setListaDiarios(dos)
                return dos
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (user) {
            const loadData = async () => {
                const publicados = await fetchDiarios({}, false, 1, 20, true)
                const pendentes = await fetchDiarios({}, false, 1, 20, false)
                setListaPublicados(publicados)
                setListaPendentes(pendentes)
            }
            loadData()
        }
    }, [user])


    return (
        <DOContext.Provider value={{ fetchDiarios, listaDiarios, listaPendentes, listaPublicados, setListaDiarios, setListaPendentes, setListaPublicados, loading }}>
            {children}
        </DOContext.Provider>
    )
}

export function useDiarios() {
    return useContext(DOContext)
}
