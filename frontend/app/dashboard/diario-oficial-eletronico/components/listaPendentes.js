"use client"
import { useState } from "react"
import { createPortal } from "react-dom"
import { FaDownload, FaEye, FaFilePdf } from "react-icons/fa"
import { BsThreeDotsVertical } from "react-icons/bs"
import { FaTrash } from "react-icons/fa"
import { FaEdit } from "react-icons/fa"
import { useRouter } from "next/navigation"



export default function ListaPendentes({ lista, onDiarioClick, onDeletar, onDownload }) {
    const router = useRouter()
    const [selectedId, setSelectedId] = useState(null)
    const [menuPosition, setMenuPosition] = useState(null)
    const [mostrarMenu, setMostrarMenu] = useState(false)

    const handleClick = (item) => {
        setSelectedId(item.id)
        onDiarioClick(item)
    };

    const handleMenuClick = (event, itemId) => {
        event.stopPropagation()
        setSelectedId(itemId)

        const { clientX, clientY } = event
        const menuHeight = 200 // altura aproximada do menu
        const viewportHeight = window.innerHeight
        const spaceBelow = viewportHeight - clientY
        const spaceAbove = clientY
        
        // Determina se deve abrir acima ou abaixo
        const shouldOpenAbove = spaceBelow < menuHeight && spaceAbove > spaceBelow
        
        const top = shouldOpenAbove ? clientY - menuHeight - 10 : clientY + 25
        const left = clientX - 180
        
        setMenuPosition({ top, left, openAbove: shouldOpenAbove })
        setMostrarMenu(true)
    }

    const handleDeletar = (diarioId) => {
        onDeletar(diarioId)
    }

    const handleDownload = (diarioId) => {
        onDownload(diarioId)
    }

    const onVisualizar = (itemId) => {
        window.open(`/doem_view/${itemId}`)
    }

    const onEditar = (itemId) => {
        router.push(`/dashboard/diario-oficial-eletronico/editar/${itemId}`)
    }

    const closeMenu = () => {
        setMostrarMenu(false)
    };

    return (
        <div onClick={closeMenu}>
            <ul className="flex flex-col gap-2 pb-4">
                {lista.map((item) => (
                    <li
                        key={item.id}
                        onClick={() => handleClick(item)}
                        className={`flex items-center justify-between min-w-0 p-6 rounded-lg shadow-lg 
                            ${selectedId === item.id ? "bg-azul_escuro text-white" : "bg-white text-azul_escuro"}
                            hover:bg-azul_escuro hover:text-white transition-colors duration-200 cursor-pointer`}
                    >
                        <div className="flex items-center gap-2 min-w-0">
                            <FaFilePdf size={24} />
                            <div className="flex flex-col min-w-0">
                                <span className="sm:text-lg truncate text-sm">{item.titulo}</span>
                            </div>
                        </div>
                        <div className="flex">
                            <button
                                onClick={(e) => handleMenuClick(e, item.id)}
                                className={`transition-colors duration-200`}
                            >
                                <BsThreeDotsVertical size={24} />
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
            {mostrarMenu &&
                menuPosition &&
                createPortal(
                    <div
                        style={{
                            position: "absolute",
                            top: `${menuPosition.top}px`,
                            left: `${menuPosition.left}px`,
                        }}
                        className="w-48 bg-white text-gray-800 shadow-lg rounded-lg z-50 overflow-hidden border border-gray-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <ul className="divide-y divide-gray-200">
                            <li
                                onClick={() => {
                                    handleDeletar(selectedId)
                                    closeMenu()
                                }}
                                className="p-3 hover:bg-gray-100 hover:font-semibold hover:text-red-500 cursor-pointer flex items-center gap-2 transition"
                            >
                                <FaTrash></FaTrash>
                                <span>Deletar</span>
                            </li>
                            <li
                                onClick={() => {
                                    onEditar(selectedId)
                                    closeMenu()
                                }}
                                className="p-3 hover:bg-gray-100 hover:font-semibold hover:text-azul_escuro cursor-pointer flex items-center gap-2 transition"
                            >
                                <FaEdit></FaEdit>
                                <span>Editar</span>
                            </li>
                            <li
                                onClick={() => {
                                    handleDownload(selectedId)
                                    closeMenu()
                                }}
                                className="p-3 hover:bg-gray-100 hover:font-semibold hover:text-green-500 cursor-pointer flex items-center gap-2 transition"
                            >
                                <FaDownload></FaDownload>
                                <span>Baixar</span>
                            </li>
                            <li
                                onClick={() => {
                                    onVisualizar(selectedId)
                                    closeMenu()
                                }}
                                className="p-3 hover:bg-gray-100 hover:font-semibold hover:text-blue-500 cursor-pointer flex items-center gap-2 transition"
                            >
                                <FaEye></FaEye>
                                <span>Visualizar</span>
                            </li>
                        </ul>
                    </div>,
                    document.body
                )}

        </div>
    );
}
