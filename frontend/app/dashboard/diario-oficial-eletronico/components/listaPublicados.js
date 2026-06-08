'use client'
import Modal from "@/app/components/modal"
import Cookies from "js-cookie"
import { useState } from "react"
import { FaDownload, FaEdit, FaEye, FaFilePdf, FaTrash } from "react-icons/fa"
import { IoShareSocial } from "react-icons/io5"
import { AiOutlineClose } from "react-icons/ai"
import { BsThreeDotsVertical } from "react-icons/bs"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"

const doemUrl = process.env.NEXT_PUBLIC_DOEM_ENDPOINT_URL



export default function ListaPublicados({ lista, onDiarioClick, onDeletar, mostrarBotoes, onDownload, exibirDownload, exibirVisualizar }) {
    const router = useRouter()
    const [selectedId, setSelectedId] = useState(null)
    const [modalAberta, setModalAberta] = useState(false)
    const [menuPosition, setMenuPosition] = useState(null)
    const [mostrarMenu, setMostrarMenu] = useState(false)
    const [email, setEmail] = useState("")
    const token = Cookies.get("auth-token")
    const [emailList, setEmailList] = useState([])

    const handleClick = (item) => {
        if (selectedId === item.id) {
            return false
        }
        setMostrarMenu(false)
        setSelectedId(item.id)
        onDiarioClick(item)
    };

    const handleAddEmail = () => {
        if (email.trim() && !emailList.includes(email)) {
            setEmailList([...emailList, email])
            setEmail("")
        }
    };

    const handleExcluirEmail = (emailToRemove) => {
        setEmailList(emailList.filter((e) => e !== emailToRemove))
    };

    const handleEnviarEmails = async (itemID) => {
        try {
            const conexao = await fetch(`${doemUrl}/diario/share/${itemID}/`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-type": "application/json",
                },
                body: JSON.stringify({
                    email_address: emailList,
                }),
            });
            const resposta = await conexao.json()
            setModalAberta(false)
            setEmailList([])
        } catch (error) {
            console.error(error)
        }
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

    const handleDownload = (itemId) => {
        onDownload(itemId)
    }

    const handleDeletar = async (diarioId) => {
        onDeletar(diarioId)
    }

    const onEditar = (itemId) => {
        router.push(`/dashboard/diario-oficial-eletronico/editar/${itemId}`)
    }

    const onVisualizar = (itemId) => {
        window.open(`/doem_view/${itemId}`)
    }

    const closeMenu = () => {
        setMostrarMenu(false)
    };

    const abrirCompartilhar = () => {
        setMostrarMenu(false)
        setModalAberta(true)
    }

    return (
        <ul onClick={() => setMostrarMenu(false)} className="flex flex-col h-auto min-w-0 gap-2 overflow-y-auto">
            {lista.map((item) => (
                <li
                    key={item.id}
                    onClick={() => handleClick(item)}
                    className={`flex sm:text-lg text-center items-center justify-between p-6 gap-2 rounded-lg shadow-lg 
                        ${selectedId === item.id ? "bg-azul_escuro text-white" : "bg-white text-azul_escuro"}
                        hover:bg-azul_escuro hover:text-white transition-colors duration-200 cursor-pointer`}
                >
                    <div className="flex items-center mr-1 min-w-0 space-x-2">
                        <FaFilePdf size={24} />
                        <div className="flex flex-col min-w-0">
                            <span className="sm:text-sm md:text-lg truncate">{item.titulo}</span>
                        </div>
                    </div>
                    <div className="flex space-x-2 gap-2">
                        {mostrarBotoes &&
                            <button
                                onClick={(e) => handleMenuClick(e, item.id)}
                                className={`transition-colors duration-200`}
                            >
                                <BsThreeDotsVertical size={24} />
                            </button>}
                        {exibirDownload &&
                            <button
                                onClick={() => handleDownload(item.id)}
                                className={`transition-colors duration-200`}
                            >
                                <FaDownload size={24} />
                            </button>
                        }
                        {exibirVisualizar &&
                            <button
                                onClick={() => onVisualizar(item.id)}
                                className={`transition-colors duration-200`}
                            >
                                <FaEye size={24} />
                            </button>
                        }
                    </div>


                </li>
            ))}
            {mostrarMenu && menuPosition &&
                createPortal(
                    <div
                        style={{
                            position: "absolute",
                            top: `${menuPosition.top + 25}px`,
                            left: `${menuPosition.left - 180}px`,
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
                            <li onClick={() => abrirCompartilhar()} className="p-3 hover:bg-gray-100 hover:font-semibold hover:text-azul_escuro cursor-pointer flex items-center gap-2 transition">
                                <IoShareSocial size={24} />
                                <span>Compartilhar</span>
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
            {modalAberta && (
                <Modal isOpen={modalAberta} title="Compartilhar Diário" className="transition-all duration-300">
                    <div className="space-y-6 p-4">
                        {/* Seção de adicionar email */}
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700">
                                Adicionar destinatários
                            </label>
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Digite um e-mail válido"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul_escuro focus:border-azul_escuro transition-all duration-200 text-sm"
                                        onKeyPress={(e) => e.key === 'Enter' && handleAddEmail()}
                                    />
                                </div>
                                <button
                                    onClick={handleAddEmail}
                                    disabled={!email.trim()}
                                    className="bg-azul_escuro text-white px-6 py-3 rounded-lg hover:bg-laranja_escuro transition-all duration-200 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                                >
                                    Adicionar
                                </button>
                            </div>
                        </div>

                        {/* Seção de emails adicionados */}
                        <div className="space-y-3">
                            {emailList.length > 0 ? (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-700">
                                            Destinatários ({emailList.length})
                                        </span>
                                        <button
                                            onClick={() => setEmailList([])}
                                            className="text-xs text-red-500 hover:text-red-700 font-medium"
                                        >
                                            Limpar todos
                                        </button>
                                    </div>
                                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50">
                                        <ul className="divide-y divide-gray-200">
                                            {emailList.map((e, index) => (
                                                <li
                                                    key={index}
                                                    className="flex justify-between items-center p-3 hover:bg-white transition-colors duration-150"
                                                >
                                                    <span className="text-sm text-gray-800 font-medium truncate pr-3">
                                                        {e}
                                                    </span>
                                                    <button
                                                        onClick={() => handleExcluirEmail(e)}
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded-full transition-all duration-150"
                                                        title="Remover e-mail"
                                                    >
                                                        <AiOutlineClose size={16} />
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 px-4">
                                    <div className="text-gray-400 mb-2">
                                        <IoShareSocial size={32} className="mx-auto" />
                                    </div>
                                    <p className="text-gray-500 text-sm">
                                        Nenhum destinatário adicionado ainda.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Botões de ação */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                            <button
                                onClick={() => {
                                    setModalAberta(false)
                                    setEmailList([])
                                    setEmail("")
                                }}
                                className="px-6 py-2.5 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleEnviarEmails(selectedId)}
                                className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-md flex items-center gap-2"
                                disabled={emailList.length === 0}
                            >
                                <IoShareSocial size={16} />
                                Enviar para {emailList.length} {emailList.length === 1 ? 'destinatário' : 'destinatários'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </ul>
    )
}
