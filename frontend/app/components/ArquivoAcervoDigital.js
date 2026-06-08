'use client'
import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FaFilePdf, FaFileWord, FaFileImage, FaFileExcel, FaFile, FaEllipsisV, FaPencilAlt, FaTrashAlt, FaDownload } from 'react-icons/fa'

function tipoDeContentType(contentType = '') {
    if (contentType.includes('pdf')) return 'pdf'
    if (contentType.startsWith('image/')) return 'image'
    if (contentType.includes('spreadsheet') || contentType.includes('excel') || contentType.includes('csv')) return 'excel'
    if (contentType.includes('word') || contentType.includes('document')) return 'word'
    return 'outro'
}

function formatBytes(bytes = 0) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
    if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
    return `${(bytes / 1024 ** 3).toFixed(1)} GB`
}

function formatDate(iso) {
    if (!iso) return ''
    const d = new Date(iso)
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

const TYPE_CONFIG = {
    pdf:   { bg: 'bg-red-50',    icon: (s) => <FaFilePdf size={s} className="text-red-400" />,     iconSm: (s) => <FaFilePdf size={s} className="text-red-400" />,    label: 'PDF',    badge: 'bg-red-50 text-red-500' },
    excel: { bg: 'bg-green-50',  icon: (s) => <FaFileExcel size={s} className="text-green-500" />, iconSm: (s) => <FaFileExcel size={s} className="text-green-500" />, label: 'Excel',  badge: 'bg-green-50 text-green-600' },
    word:  { bg: 'bg-blue-50',   icon: (s) => <FaFileWord size={s} className="text-blue-400" />,   iconSm: (s) => <FaFileWord size={s} className="text-blue-400" />,   label: 'Word',   badge: 'bg-blue-50 text-blue-500' },
    image: { bg: 'bg-purple-50', icon: (s) => <FaFileImage size={s} className="text-purple-400" />,iconSm: (s) => <FaFileImage size={s} className="text-purple-400" />,label: 'Imagem', badge: 'bg-purple-50 text-purple-500' },
    outro: { bg: 'bg-gray-50',   icon: (s) => <FaFile size={s} className="text-gray-400" />,       iconSm: (s) => <FaFile size={s} className="text-gray-400" />,       label: 'Arquivo',badge: 'bg-gray-100 text-gray-500' },
}

function DropdownPortal({ visible, pos, onDownload, onRenomear, onExcluir }) {
    return createPortal(
        <AnimatePresence>
            {visible && pos && (
                <motion.div
                    key="arquivo-menu"
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
                    <button
                        onClick={onDownload}
                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        <FaDownload size={11} className="text-gray-400" />
                        Download
                    </button>
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

export default function ArquivoAcervoDigital({ arquivo, viewMode = 'list', index = 0, handleClick, menuAberto, onAbrirMenu, onDownload, onRenomear, onExcluir }) {
    const tipo = tipoDeContentType(arquivo.content_type)
    const cfg = TYPE_CONFIG[tipo]
    const isMenuOpen = menuAberto === arquivo.id
    const triggerRef = useRef(null)
    const [dropdownPos, setDropdownPos] = useState(null)

    const handleMenuClick = (e) => {
        e.stopPropagation()
        e.nativeEvent?.stopImmediatePropagation()
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect()
            setDropdownPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right })
        }
        onAbrirMenu?.(e, arquivo)
    }

    if (viewMode === 'grid') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.2, ease: 'easeOut' }}
                whileHover={{ y: -3, boxShadow: '0 10px 28px rgba(0,0,0,0.11)' }}
                whileTap={{ scale: 0.97 }}
                onClick={handleClick}
                className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm cursor-pointer group select-none relative"
            >
                <div className={`h-[72px] ${cfg.bg} flex items-center justify-center`}>
                    {cfg.icon(36)}
                </div>
                <div className="px-3 pt-2.5 pb-3">
                    <p className="text-sm font-medium text-gray-700 truncate leading-tight">{arquivo.nome}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatBytes(arquivo.size_bytes)}</p>
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
                <DropdownPortal visible={isMenuOpen} pos={dropdownPos} onDownload={onDownload} onRenomear={onRenomear} onExcluir={onExcluir} />
            </motion.div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.025, duration: 0.18, ease: 'easeOut' }}
            onClick={handleClick}
            className="grid grid-cols-10 items-center px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 group transition-colors"
        >
            <div className="col-span-10 sm:col-span-6 flex items-center gap-3 min-w-0">
                <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${cfg.bg}`}>
                    {cfg.iconSm(15)}
                </div>
                <span className="text-sm text-gray-700 truncate">{arquivo.nome}</span>
            </div>
            <div className="hidden sm:block col-span-2 text-xs text-gray-400">
                {formatBytes(arquivo.size_bytes)}
            </div>
            <div className="hidden sm:flex col-span-2 items-center justify-between gap-1">
                <span className="text-xs text-gray-400">{formatDate(arquivo.created_at)}</span>
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
                <DropdownPortal visible={isMenuOpen} pos={dropdownPos} onDownload={onDownload} onRenomear={onRenomear} onExcluir={onExcluir} />
            </div>
        </motion.div>
    )
}
