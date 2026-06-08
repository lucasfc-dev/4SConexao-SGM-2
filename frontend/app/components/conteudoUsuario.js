'use client'
import { useEffect, useState } from "react"
import { useAuth } from "../context/AuthContext"
import Image from "next/image"
import Cookies from "js-cookie"


const authUrl = process.env.NEXT_PUBLIC_AUTH_ENDPOINT_URL



export default function ConteudoUsuario() {
    const { user } = useAuth()
    const token = Cookies.get('auth-token')

    const [estabelecimento, setEstabelecimento] = useState()
    const [iconeUrl, setIconeUrl] = useState()

    async function fetchEstabelecimento() {
        if (user.estabelecimento) {
            try {
                const response = await fetch(`${authUrl}/estabelecimento/${user.estabelecimento.id}/`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
                if (response.ok) {
                    const data = await response.json()
                    if (data.icone) {
                        let mimeType = 'application/octet-stream'
                        const base64PrefixMatch = data.icone.match(/^data:(.*?);base64,/)

                        let base64Data = data.icone
                        if (base64PrefixMatch) {
                            mimeType = base64PrefixMatch[1]
                            base64Data = data.icone.replace(/^data:(.*?);base64,/, '')
                        }
                        const byteCharacters = atob(base64Data)
                        const byteNumbers = new Array(byteCharacters.length)
                        for (let i = 0; i < byteCharacters.length; i++) {
                            byteNumbers[i] = byteCharacters.charCodeAt(i)
                        }
                        const byteArray = new Uint8Array(byteNumbers)
                        const blob = new Blob([byteArray], { type: mimeType })
                        const url = URL.createObjectURL(blob)
                        setIconeUrl(url)
                    }
                    setEstabelecimento(data)
                } else {
                    console.error('Erro ao buscar dados do estabelecimento.')
                }
            } catch (error) {
                console.error(error)
            }
        }
    }

    useEffect(() => {
        if (user) {
            fetchEstabelecimento()
        }
    }, [user])

    if (!user) {
        return <div className="w-8 h-8 rounded-full bg-white/20 animate-pulse" />
    }
    return (
        <div className="flex items-center p-3 gap-3 rounded-md sm:bg-branco_cinza sm:shadow-md bg-transparent transition-transform transform hover:scale-105 min-w-[180px] max-w-sm sm:max-w-md mx-auto">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-azul_escuro/10 sm:bg-azul_escuro border border-azul_escuro/20 shrink-0 overflow-hidden">
                {iconeUrl
                    ? <Image alt="ícone" width={32} height={32} src={iconeUrl} className="object-cover w-full h-full" />
                    : <span className="text-azul_escuro sm:text-white font-semibold text-sm">{user.username?.[0]?.toUpperCase() || 'U'}</span>
                }
            </div>
            <div className="hidden sm:flex flex-col items-start leading-tight">
                <span className="text-sm font-bold text-azul_escuro truncate max-w-[110px]">{user.username}</span>
                {user.estabelecimento && (
                    <span className="text-xs text-azul_escuro">{user.estabelecimento.nome.toUpperCase()}</span>
                )}
            </div>
        </div>
    )
}
