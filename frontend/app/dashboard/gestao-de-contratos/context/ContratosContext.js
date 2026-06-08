'use client'
import { useAuth } from '@/app/context/AuthContext'
import Cookies from 'js-cookie'
import { createContext, useContext, useEffect, useRef, useState } from 'react'

const ContratosContext = createContext()
const acUrl = process.env.NEXT_PUBLIC_AC_ENDPOINT_URL

function buildFilterParams(filters) {
    const params = new URLSearchParams()
    if (filters.orgao) params.append('secao__orgao', filters.orgao)
    if (filters.numero) params.append('num_contrato__icontains', filters.numero)
    if (filters.objeto) params.append('objeto__icontains', filters.objeto)
    if (filters.modalidade) params.append('modalidade', filters.modalidade)
    if (filters.fiscalContrato) params.append('vigencia__fiscal', filters.fiscalContrato)
    if (filters.dataInicial) params.append('pub_date__gte', filters.dataInicial)
    if (filters.dataFinal) params.append('pub_date__lte', filters.dataFinal)
    return params.toString()
}

export function ContratosProvider({ children }) {
    const [listaContratos, setListaContratos] = useState([])
    const [totalContratos, setTotalContratos] = useState(0)
    const { user } = useAuth()
    const [loadingContratos, setLoadingContratos] = useState(false)
    const token = Cookies.get('auth-token')
    const lastParams = useRef({ page: 1, pageSize: 10, filters: {} })

    async function fetchContratos({ page, pageSize, filters } = {}) {
        const p = page !== undefined ? page : lastParams.current.page
        const ps = pageSize !== undefined ? pageSize : lastParams.current.pageSize
        const f = filters !== undefined ? filters : lastParams.current.filters
        lastParams.current = { page: p, pageSize: ps, filters: f }

        try {
            setLoadingContratos(true)
            const offset = (p - 1) * ps
            const filterStr = buildFilterParams(f)
            const filterSep = filterStr ? `&${filterStr}` : ''
            const relations = 'relations=secao__orgao&relations=modalidade&relations=licitacao__orgao&relations=vigencia__fiscal__pessoa&relations=dispensa__orgao&relations=certificado_publicacao'

            const [countRes, dataRes] = await Promise.all([
                fetch(`${acUrl}/contrato/?count=true${filterSep}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                }),
                fetch(`${acUrl}/contrato/?${relations}&limit=${ps}&offset=${offset}${filterSep}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                }),
            ])

            const [total, results] = await Promise.all([countRes.json(), dataRes.json()])
            setListaContratos(Array.isArray(results) ? results : [])
            setTotalContratos(typeof total === 'number' ? total : 0)
        } catch (error) {
            console.error('Erro ao obter contratos:', error)
        } finally {
            setLoadingContratos(false)
        }
    }

    useEffect(() => {
        if (user) {
            fetchContratos()
        }
    }, [user])

    return (
        <ContratosContext.Provider value={{ listaContratos, setListaContratos, fetchContratos, loadingContratos, totalContratos }}>
            {children}
        </ContratosContext.Provider>
    )
}

export function useContratos() {
    return useContext(ContratosContext)
}
