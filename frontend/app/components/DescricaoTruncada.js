'use client'
import { useState } from 'react'

export default function DescricaoTruncada({ texto, maxLength = 100 }) {
    const [mostrarCompleto, setMostrarCompleto] = useState(false)
    
    if (!texto) {
        return <span className="text-gray-400">-</span>
    }

    const textoTruncado = texto.length > maxLength
    const textoExibido = mostrarCompleto ? texto : texto.slice(0, maxLength) + (textoTruncado ? '...' : '')

    return (
        <div className="relative">
            <span className="break-words">
                {textoExibido}
            </span>
            {textoTruncado && (
                <button
                    onClick={() => setMostrarCompleto(!mostrarCompleto)}
                    className="ml-2 text-blue-600 hover:text-blue-800 text-sm font-medium underline"
                >
                    {mostrarCompleto ? 'Ver menos' : 'Ver mais'}
                </button>
            )}
        </div>
    )
}