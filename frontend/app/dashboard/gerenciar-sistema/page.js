'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FiLoader } from 'react-icons/fi'

export default function GerenciarSistema() {
    const router = useRouter()
    useEffect(() => {
        router.replace('/dashboard/gerenciar-sistema/configuracoes')
    }, [])

    return (
        <div className="flex items-center justify-center h-screen">
            <FiLoader className="animate-spin text-4xl text-azul_escuro" />
        </div>
    )
}