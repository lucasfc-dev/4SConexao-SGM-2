'use client'
import { useAuth } from '@/app/context/AuthContext'
import Cookies from 'js-cookie'

import { createContext, useContext, useEffect, useState } from 'react'

const PessoasContext = createContext()
const acUrl = process.env.NEXT_PUBLIC_AC_ENDPOINT_URL


export function PessoasProvider({ children }) {
    const [listaPessoasFisicas, setListaPessoasFisicas] = useState([])
    const [listaPessoasJuridicas, setListaPessoasJuridicas] = useState([])
    const { user } = useAuth()
    const [loadingPessoas, setLoadingPessoas] = useState(false)
    const token = Cookies.get('auth-token')


    async function fetchPessoasFisicas() {
        try {
            setLoadingPessoas(true)
            const response = await fetch(`${acUrl}/pessoa/fisica/?include_pessoa=true`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })
            const pessoas = await response.json()
            setListaPessoasFisicas(pessoas)
            return pessoas
        } catch (error) {
            console.error('Erro ao obter pessoas:', error)
            return []
        }
        finally {
            setLoadingPessoas(false)
        }
    }

    async function fetchPessoasJuridicas() {
        try {
            setLoadingPessoas(true)
            const response = await fetch(`${acUrl}/pessoa/juridica/?include_pessoa=true`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })
            const pessoas = await response.json()
            setListaPessoasJuridicas(pessoas)
            return pessoas
        } catch (error) {
            console.error('Erro ao obter pessoas jurídicas:', error)
            return []
        }
        finally {
            setLoadingPessoas(false)

        }
    }

    useEffect(() => {
        if (user) {
            fetchPessoasFisicas()
            fetchPessoasJuridicas()
        }
    }, [user])

    return (
        <PessoasContext.Provider value={{
            listaPessoasFisicas,
            setListaPessoasFisicas,
            fetchPessoasFisicas,
            listaPessoasJuridicas,
            setListaPessoasJuridicas,
            fetchPessoasJuridicas,
            loadingPessoas
        }}>
            {children}
        </PessoasContext.Provider>
    )
}

export function usePessoas() {
    return useContext(PessoasContext)
}