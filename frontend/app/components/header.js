'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import ConteudoUsuario from './conteudoUsuario'
import { useAuth } from '../context/AuthContext'
import { FaHome, FaSignOutAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'

export default function Header({ nomePagina, navItems, opacidade = 'bg-opacity-10', corFonte = 'text-azul_escuro', ocultarNav = false }) {
    const [mostrarMenuUsuario, setMostrarMenuUsuario] = useState(false)
    const { user, logout } = useAuth()
    const pathname = usePathname()
    const router = useRouter()
    const menuRef = useRef(null)

    const data = new Date()
    const dataFormatada = `${String(data.getDate()).padStart(2, '0')}/${String(data.getMonth() + 1).padStart(2, '0')}/${data.getFullYear()}`

    useEffect(() => {
        function handleOutsideClick(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMostrarMenuUsuario(false)
            }
        }
        document.addEventListener('mousedown', handleOutsideClick)
        return () => document.removeEventListener('mousedown', handleOutsideClick)
    }, [])

    return (
        <div>
            <header className={`flex items-center justify-between bg-azul_escuro ${opacidade} shadow-lg w-full h-28 sm:h-32 px-4 md:px-8 border-b-2 border-azul_escuro border-opacity-70`}>
                {/* Left: back/forward + title */}
                <div className={`flex items-center gap-3 ${corFonte}`}>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => router.back()}
                            title="Voltar"
                            className="flex items-center justify-center w-8 h-8 rounded-lg opacity-60 hover:opacity-100 hover:bg-black/5 transition-all"
                        >
                            <FaChevronLeft size={13} />
                        </button>
                        <button
                            onClick={() => router.forward()}
                            title="Avançar"
                            className="flex items-center justify-center w-8 h-8 rounded-lg opacity-60 hover:opacity-100 hover:bg-black/5 transition-all"
                        >
                            <FaChevronRight size={13} />
                        </button>
                    </div>
                    <div className="w-px h-5 bg-current opacity-20" />
                    <div className="flex flex-col">
                        <h1 className={`font-semibold text-sm sm:text-base leading-tight`}>{nomePagina.toUpperCase()}</h1>
                        <span className="text-xs hidden sm:block opacity-60">{dataFormatada}</span>
                    </div>
                </div>

                {/* Right: user menu */}
                <div className="relative" ref={menuRef}>
                    <button onClick={() => setMostrarMenuUsuario(v => !v)}>
                        <ConteudoUsuario />
                    </button>

                    <AnimatePresence>
                        {mostrarMenuUsuario && user && (
                            <motion.div
                                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                                transition={{ duration: 0.15 }}
                                className="absolute right-0 mt-2 w-64 bg-white shadow-2xl rounded-xl z-20 overflow-hidden border border-gray-100"
                            >
                                <div className="flex items-center gap-3 px-4 py-4 bg-azul_escuro">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 text-white font-bold text-base border border-white/30 shrink-0">
                                        {user.username?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-semibold text-white text-sm truncate">{user.username}</span>
                                        {user.estabelecimento && (
                                            <span className="text-white/55 text-xs truncate">{user.estabelecimento.nome}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="p-2">
                                    <Link
                                        href="/dashboard/"
                                        onClick={() => setMostrarMenuUsuario(false)}
                                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-azul_escuro text-sm font-medium hover:bg-gray-50 transition-colors"
                                    >
                                        <FaHome size={14} className="text-azul_escuro/60" />
                                        Dashboard
                                    </Link>
                                    <button
                                        onClick={logout}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
                                    >
                                        <FaSignOutAlt size={14} className="text-red-400" />
                                        Sair
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </header>

            {/* Mobile navigation strip */}
            {!ocultarNav && navItems?.length > 0 && (
                <nav className="flex sm:hidden bg-azul_escuro border-t border-white/10 shadow-lg overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <ul className="flex gap-1 px-3 py-2">
                        {navItems.map(item => (
                            <li key={item.href} className="flex-shrink-0">
                                <Link
                                    href={item.href}
                                    className={`block px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                                        pathname === item.href
                                            ? 'bg-laranja_escuro text-white shadow-sm'
                                            : 'text-white/65 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    {item.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
            )}
        </div>
    )
}