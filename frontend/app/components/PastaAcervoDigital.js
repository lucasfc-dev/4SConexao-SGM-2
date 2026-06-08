'use client'
import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FaFolder, FaFolderOpen, FaEllipsisV, FaPencilAlt, FaTrashAlt, FaLock } from 'react-icons/fa'

function formatDate(iso) {
    if (!iso) return ''
    const d = new Date(iso)
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

function DropdownPortal({ visible, pos, isAdmin, onRenomear, onExcluir, onPermissoes }) {
    return createPortal(
        <AnimatePresence>
            {visible && pos && (
                <motion.div
                    key="pasta-menu"
                    style={{ position: 'fixed', top: pos.top, right: pos.right, transformOrigin: 'top right' }}
                    initial={{ opacity: 0, scale: 0.92, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: -4 }}
                    transition={{ duration: 0.13, ease: 'easeOut' }}
                    className="z-[9999] bg-white rounded-xl border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.10)] py-1 min-w-[148px]"
                    onClick={e => e.stopPropagation()}
                >
                    <button
                        onClick={onRenomear}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        <FaPencilAlt size={11} className="text-gray-400" />
                        Renomear
                    </button>
                    {isAdmin && (
                        <button
                            onClick={onPermissoes}
                            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            <FaLock size={11} className="text-gray-400" />
                            Permissões
                        </button>
                    )}
                    <div className="mx-3 my-0.5 border-t border-gray-100" />
                    <button
                        onClick={onExcluir}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                        <FaTrashAlt size={11} className="text-red-400" />
                        Excluir
                    </button>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    )
}

export default function PastaAcervoDigital({ pasta, viewMode = 'list', index = 0, isAdmin = false, onAbrirPasta, onRenomear, onExcluir, onPermissoes, menuAberto, onAbrirMenu }) {
    const isMenuOpen = menuAberto === pasta.id
    const triggerRef = useRef(null)
    const [dropdownPos, setDropdownPos] = useState(null)
    const [hovered, setHovered] = useState(false)

    const handleMenuClick = (e) => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect()
            setDropdownPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right })
        }
        onAbrirMenu(e, pasta)
    }

    if (viewMode === 'grid') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.2, ease: 'easeOut' }}
                whileHover={{ y: -3, boxShadow: '0 10px 28px rgba(0,0,0,0.11)' }}
                whileTap={{ scale: 0.97 }}
                onHoverStart={() => setHovered(true)}
                onHoverEnd={() => setHovered(false)}
                onClick={() => onAbrirPasta(pasta.id)}
                className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm cursor-pointer group select-none relative"
            >
                <div className="h-[72px] bg-laranja_escuro/10 flex items-center justify-center">
                    <motion.div
                        animate={{ scale: hovered ? 1.1 : 1 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                    >
                        {hovered
                            ? <FaFolderOpen size={40} className="text-laranja_escuro" />
                            : <FaFolder size={40} className="text-laranja_escuro" />
                        }
                    </motion.div>
                </div>
                <div className="px-3 pt-2.5 pb-3">
                    <p className="text-sm font-medium text-gray-700 truncate leading-tight">{pasta.nome}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(pasta.created_at)}</p>
                </div>
                <button
                    ref={triggerRef}
                    onClick={handleMenuClick}
                    className={`absolute top-2 right-2 p-1.5 rounded-lg transition-all ${isMenuOpen
                        ? 'opacity-100 bg-white/80 text-gray-600'
                        : 'opacity-0 group-hover:opacity-100 text-gray-500 hover:bg-white/80'
                    }`}
                >
                    <FaEllipsisV size={11} />
                </button>
                <DropdownPortal visible={isMenuOpen} pos={dropdownPos} isAdmin={isAdmin} onRenomear={onRenomear} onExcluir={onExcluir} onPermissoes={onPermissoes} />
            </motion.div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.025, duration: 0.18, ease: 'easeOut' }}
            onClick={() => onAbrirPasta(pasta.id)}
            className="grid grid-cols-10 items-center px-4 py-3 hover:bg-amber-50/50 cursor-pointer border-b border-gray-50 last:border-0 group transition-colors"
        >
            <div className="col-span-10 sm:col-span-6 flex items-center gap-3 min-w-0">
                <div className="shrink-0 w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                    <FaFolder size={15} className="text-amber-400" />
                </div>
                <span className="text-sm text-gray-700 font-medium truncate">{pasta.nome}</span>
            </div>
            <div className="hidden sm:block col-span-2 text-xs text-gray-400">—</div>
            <div className="hidden sm:flex col-span-2 items-center justify-between gap-1">
                <span className="text-xs text-gray-400">{formatDate(pasta.created_at)}</span>
                <button
                    ref={triggerRef}
                    onClick={handleMenuClick}
                    className={`p-1.5 rounded-lg transition-all ${isMenuOpen
                        ? 'opacity-100 bg-gray-100 text-gray-500'
                        : 'opacity-0 group-hover:opacity-100 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                    }`}
                >
                    <FaEllipsisV size={11} />
                </button>
                <DropdownPortal visible={isMenuOpen} pos={dropdownPos} isAdmin={isAdmin} onRenomear={onRenomear} onExcluir={onExcluir} onPermissoes={onPermissoes} />
            </div>
        </motion.div>
    )
}
