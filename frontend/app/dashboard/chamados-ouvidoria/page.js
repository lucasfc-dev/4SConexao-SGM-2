'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FiLoader } from 'react-icons/fi'

export default function ChamadosOuvidoria() {
    const router = useRouter()
    
    useEffect(() => {
        // Redireciona para a visão geral do módulo de ouvidoria
        router.replace('/dashboard/chamados-ouvidoria/visao-geral')
    }, [router])

    return (
        <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-200 to-gray-300">
            <FiLoader className="animate-spin text-4xl text-azul_escuro" />
        </div>
    )
}
