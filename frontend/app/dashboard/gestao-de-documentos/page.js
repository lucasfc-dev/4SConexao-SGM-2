'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FiLoader } from 'react-icons/fi'

export default function GestaoDeDocumentos() {
    const router = useRouter()
    useEffect(() => {
        router.replace('/dashboard/gestao-de-documentos/visao-geral')
    }, [])

    return (
        <div className="flex items-center justify-center h-screen">
            <FiLoader className="animate-spin text-4xl text-azul_escuro" />
        </div>
    )
}
