'use client'
import Cookies from "js-cookie"
import { createContext, useContext, useEffect, useState } from "react"
import { useAuth } from "./AuthContext"

const FuncContext = createContext()
const authUrl = process.env.NEXT_PUBLIC_AUTH_ENDPOINT_URL

export function FuncProvider({ children }) {
    const [pacote, setPacote] = useState([])
    const { user } = useAuth()
    const token = Cookies.get('auth-token')

    async function getFuncionalidades() {
        try {
            const response = await fetch(`${authUrl}/pacote/funcionalidades/${user.estabelecimento.id}/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            if (!response.ok) {
                throw new Error('Erro ao buscar funcionalidades')
            }
            const funcionalidades = await response.json()
            setPacote(funcionalidades)
        } catch (error) {
            console.error("Erro ao buscar funcionalidades:", error)
        }
    }

    useEffect(() => {
        if (user){
            getFuncionalidades()
        }
    }, [user])

    return (
        <FuncContext.Provider value={{ pacote, setPacote, getFuncionalidades }} >
            {children}
        </FuncContext.Provider>

    )
}

export function useFunc(){
    return useContext(FuncContext)
} 
