'use client'
import { useAuth } from '@/app/context/AuthContext'
import Cookies from 'js-cookie'
import { createContext, useContext, useState } from 'react'

const LicitacoesContext = createContext()
const acUrl = process.env.NEXT_PUBLIC_AC_ENDPOINT_URL

export function LicitacoesProvider({ children }) {
    const [listaLicitacoes, setListaLicitacoes] = useState([])
    const [totalLicitacoes, setTotalLicitacoes] = useState(0)
    const [loadingLicitacoes, setLoadingLicitacoes] = useState(false)
    const token = Cookies.get('auth-token')

    async function fetchLicitacoes({ limit = 20, offset = 0, filters = {} } = {}) {
        try {
            setLoadingLicitacoes(true)
            const relations = 'relations=secao&relations=modalidade&relations=orgao&relations=certificado_publicacao'
            const filterParams = new URLSearchParams(
                Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '' && v != null))
            ).toString()
            const baseQuery = `${relations}&limit=${limit}&offset=${offset}${filterParams ? '&' + filterParams : ''}`

            const [listRes, countRes] = await Promise.all([
                fetch(`${acUrl}/licitacao/?${baseQuery}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                }),
                fetch(`${acUrl}/licitacao/?count=true${filterParams ? '&' + filterParams : ''}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                }),
            ])

            const licitacoes = await listRes.json()
            const total = await countRes.json()

            setListaLicitacoes(Array.isArray(licitacoes) ? licitacoes : [])
            setTotalLicitacoes(typeof total === 'number' ? total : 0)
            return licitacoes
        } catch (error) {
            console.error('Erro ao obter licitações:', error)
            return []
        } finally {
            setLoadingLicitacoes(false)
        }
    }

    return (
        <LicitacoesContext.Provider value={{ listaLicitacoes, setListaLicitacoes, totalLicitacoes, fetchLicitacoes, loadingLicitacoes }}>
            {children}
        </LicitacoesContext.Provider>
    )
}

export function useLicitacoes() {
    return useContext(LicitacoesContext)
}
