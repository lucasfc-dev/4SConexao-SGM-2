'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
    FaFilePdf, FaFileWord, FaFileImage, FaFileExcel, FaFile,
    FaSearch, FaThLarge, FaList, FaPlus, FaUpload, FaChevronRight,
    FaHome, FaTimes, FaCloudUploadAlt, FaFolderPlus,
    FaPencilAlt, FaTrashAlt,
} from 'react-icons/fa'
import { FiLoader } from 'react-icons/fi'
import { toast } from 'react-toastify'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { apiAcervo } from '@/app/api/apiAcervo'
import { useAuth } from '@/app/context/AuthContext'
import ModalBase from '@/app/components/modal'
import PastaAcervoDigital from '@/app/components/PastaAcervoDigital'
import ArquivoAcervoDigital from '@/app/components/ArquivoAcervoDigital'

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

function Toggle({ checked, onChange, disabled = false }) {
    return (
        <button
            type="button"
            onClick={onChange}
            disabled={disabled}
            title={disabled ? 'Acesso herdado (órgão/dono/admin) — não editável aqui' : undefined}
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none ${checked ? 'bg-azul_escuro' : 'bg-gray-300'} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
            <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
        </button>
    )
}

const ORIGEM_LABEL = {
    admin: 'Admin',
    owner: 'Dono',
    orgao: 'Órgão',
    herdado: 'Herdado',
    grant: 'Concedido',
}

function FileIcon({ contentType, size = 18 }) {
    const tipo = tipoDeContentType(contentType)
    const map = {
        pdf: <FaFilePdf size={size} className="text-red-500" />,
        excel: <FaFileExcel size={size} className="text-green-600" />,
        word: <FaFileWord size={size} className="text-blue-500" />,
        image: <FaFileImage size={size} className="text-purple-500" />,
    }
    return map[tipo] ?? <FaFile size={size} className="text-gray-400" />
}

export default function AcervoDigital() {
    const { user } = useAuth()
    const isAdmin = !!(user?.is_admin || user?.is_super)
    const [viewMode, setViewMode] = useState('grid')
    const [busca, setBusca] = useState('')
    const [raizId, setRaizId] = useState(null)
    const [conteudo, setConteudo] = useState(null)
    const [loading, setLoading] = useState(true)
    const [erro, setErro] = useState(null)
    const [modalNovaPasta, setModalNovaPasta] = useState(false)
    const [modalUpload, setModalUpload] = useState(false)
    const [nomePasta, setNomePasta] = useState('')
    const [salvando, setSalvando] = useState(false)
    const [erroModal, setErroModal] = useState(null)
    const [arquivosUpload, setArquivosUpload] = useState([])
    const [uploadProgresso, setUploadProgresso] = useState({})
    const [dragOver, setDragOver] = useState(false)
    const inputFileRef = useRef(null)
    const [menuAberto, setMenuAberto] = useState(null)
    const [pastaAcao, setPastaAcao] = useState(null)
    const [modalRenomear, setModalRenomear] = useState(false)
    const [modalExcluir, setModalExcluir] = useState(false)
    const [nomeRenomear, setNomeRenomear] = useState('')
    const [arquivoAcao, setArquivoAcao] = useState(null)
    const [modalRenomearArquivo, setModalRenomearArquivo] = useState(false)
    const [modalExcluirArquivo, setModalExcluirArquivo] = useState(false)
    const [nomeRenomearArquivo, setNomeRenomearArquivo] = useState('')
    const [modalPermissoes, setModalPermissoes] = useState(false)
    const [permissoes, setPermissoes] = useState([])
    const [permissoesLoading, setPermissoesLoading] = useState(false)
    const [permissoesErro, setPermissoesErro] = useState(null)
    const [permAdicionados, setPermAdicionados] = useState([])
    const [permSelectAberto, setPermSelectAberto] = useState(false)

    const carregarConteudo = useCallback(async (id) => {
        setLoading(true)
        setErro(null)
        try {
            const data = await apiAcervo.pastas.getConteudo(id)
            setConteudo(data)
        } catch (e) {
            setErro(e.message)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        const fechar = () => setMenuAberto(null)
        document.addEventListener('click', fechar)
        return () => document.removeEventListener('click', fechar)
    }, [])

    useEffect(() => {
        async function init() {
            try {
                const raiz = await apiAcervo.pastas.getRaiz()
                setRaizId(raiz.id)
                await carregarConteudo(raiz.id)
            } catch (e) {
                setErro(e.message)
                setLoading(false)
            }
        }
        init()
    }, [carregarConteudo])

    const abrirPasta = (id) => carregarConteudo(id)

    const voltarPara = (id) => carregarConteudo(id)

    const abrirModalNovaPasta = () => {
        setNomePasta('')
        setErroModal(null)
        setModalNovaPasta(true)
    }

    const criarPasta = async () => {
        const nome = nomePasta.trim()
        if (!nome) return
        setSalvando(true)
        setErroModal(null)
        try {
            await apiAcervo.pastas.criar(nome, conteudo.folder.id)
            setModalNovaPasta(false)
            toast.success('Pasta criada com sucesso!')
            await carregarConteudo(conteudo.folder.id)
        } catch (e) {
            setErroModal(e.message)
        } finally {
            setSalvando(false)
        }
    }

    const adicionarArquivos = (lista) => {
        setArquivosUpload(prev => {
            const existentes = new Set(prev.map(f => f.name + f.size))
            const novos = Array.from(lista).filter(f => !existentes.has(f.name + f.size))
            return [...prev, ...novos]
        })
    }

    const removerArquivo = (idx) => {
        setArquivosUpload(prev => prev.filter((_, i) => i !== idx))
    }

    const fazerUpload = async () => {
        if (!arquivosUpload.length) return
        setSalvando(true)
        setErroModal(null)
        const progresso = {}
        for (const [i, arquivo] of arquivosUpload.entries()) {
            progresso[i] = 'enviando'
            setUploadProgresso({ ...progresso })
            try {
                await apiAcervo.arquivos.upload(conteudo.folder.id, arquivo)
                progresso[i] = 'ok'
            } catch (e) {
                progresso[i] = 'erro'
                setErroModal(`Erro em "${arquivo.name}": ${e.message}`)
            }
            setUploadProgresso({ ...progresso })
        }
        setSalvando(false)
        const temErro = Object.values(progresso).some(v => v === 'erro')
        if (!temErro) {
            setModalUpload(false)
            setArquivosUpload([])
            setUploadProgresso({})
            toast.success('Arquivos enviados com sucesso!')
        }
        await carregarConteudo(conteudo.folder.id)
    }

    const fecharUpload = () => {
        setModalUpload(false)
        setArquivosUpload([])
        setUploadProgresso({})
        setErroModal(null)
    }

    const abrirMenu = (e, pasta) => {
        e.stopPropagation()
        e.nativeEvent.stopImmediatePropagation()
        setMenuAberto(prev => prev === pasta.id ? null : pasta.id)
        setPastaAcao(pasta)
    }

    const abrirRenomear = (e) => {
        e.stopPropagation()
        setNomeRenomear(pastaAcao.nome)
        setErroModal(null)
        setMenuAberto(null)
        setModalRenomear(true)
    }

    const confirmarRenomear = async () => {
        const nome = nomeRenomear.trim()
        if (!nome || nome === pastaAcao.nome) return
        setSalvando(true)
        setErroModal(null)
        try {
            await apiAcervo.pastas.renomear(pastaAcao.id, nome)
            setModalRenomear(false)
            toast.success('Pasta renomeada com sucesso!')
            await carregarConteudo(conteudo.folder.id)
        } catch (e) {
            setErroModal(e.message)
        } finally {
            setSalvando(false)
        }
    }

    const abrirExcluir = (e) => {
        e.stopPropagation()
        setErroModal(null)
        setMenuAberto(null)
        setModalExcluir(true)
    }

    const confirmarExcluir = async () => {
        setSalvando(true)
        setErroModal(null)
        try {
            await apiAcervo.pastas.deletar(pastaAcao.id)
            setModalExcluir(false)
            toast.success('Pasta excluída com sucesso!')
            await carregarConteudo(conteudo.folder.id)
        } catch (e) {
            setErroModal(e.message)
        } finally {
            setSalvando(false)
        }
    }

    const abrirMenuArquivo = (e, arquivo) => {
        e.stopPropagation()
        e.nativeEvent.stopImmediatePropagation()
        setMenuAberto(prev => prev === arquivo.id ? null : arquivo.id)
        setArquivoAcao(arquivo)
    }

    const baixarArquivo = async (e) => {
        e.stopPropagation()
        setMenuAberto(null)
        try {
            const blob = await apiAcervo.arquivos.download(arquivoAcao.id)
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = arquivoAcao.nome
            a.click()
            URL.revokeObjectURL(url)
        } catch (err) {
            toast.error('Erro ao baixar o arquivo.')
        }
    }

    const abrirRenomearArquivo = (e) => {
        e.stopPropagation()
        setNomeRenomearArquivo(arquivoAcao.nome)
        setErroModal(null)
        setMenuAberto(null)
        setModalRenomearArquivo(true)
    }

    const confirmarRenomearArquivo = async () => {
        const nome = nomeRenomearArquivo.trim()
        if (!nome || nome === arquivoAcao.nome) return
        setSalvando(true)
        setErroModal(null)
        try {
            await apiAcervo.arquivos.renomear(arquivoAcao.id, nome)
            setModalRenomearArquivo(false)
            toast.success('Arquivo renomeado com sucesso!')
            await carregarConteudo(conteudo.folder.id)
        } catch (e) {
            setErroModal(e.message)
        } finally {
            setSalvando(false)
        }
    }

    const abrirExcluirArquivo = (e) => {
        e.stopPropagation()
        setErroModal(null)
        setMenuAberto(null)
        setModalExcluirArquivo(true)
    }

    const confirmarExcluirArquivo = async () => {
        setSalvando(true)
        setErroModal(null)
        try {
            await apiAcervo.arquivos.deletar(arquivoAcao.id)
            setModalExcluirArquivo(false)
            toast.success('Arquivo excluído com sucesso!')
            await carregarConteudo(conteudo.folder.id)
        } catch (e) {
            setErroModal(e.message)
        } finally {
            setSalvando(false)
        }
    }

    const abrirPermissoes = async (e) => {
        e.stopPropagation()
        setMenuAberto(null)
        if (!isAdmin) return
        setPermissoes([])
        setPermissoesErro(null)
        setPermAdicionados([])
        setPermSelectAberto(false)
        setModalPermissoes(true)
        setPermissoesLoading(true)
        try {
            // A matriz já vem com todos os usuários do estab + acesso efetivo.
            const perms = await apiAcervo.permissoes.listarPorPasta(pastaAcao.id)
            setPermissoes(perms)
        } catch (e) {
            setPermissoesErro(e.message)
        } finally {
            setPermissoesLoading(false)
        }
    }

    const recarregarPermissoes = async () => {
        const perms = await apiAcervo.permissoes.listarPorPasta(pastaAcao.id)
        setPermissoes(perms)
    }

    // Os toggles editam apenas a camada de GRANT explícito da pasta. Acesso herdado
    // (órgão/dono/admin) é travado e não passa por aqui.
    const togglePermissao = async (userId, field) => {
        setPermissoesErro(null)
        const row = permissoes.find(p => p.user_id === userId)
        if (!row) return
        const locked = { can_read: row.locked_read, can_write: row.locked_write, cascade: row.locked_cascade }
        if (locked[field]) return

        const grant = { can_read: row.grant_read, can_write: row.grant_write, cascade: row.grant_cascade }
        grant[field] = !grant[field]
        const allOff = !grant.can_read && !grant.can_write && !grant.cascade
        try {
            if (allOff && row.grant_id) {
                await apiAcervo.permissoes.revogar(row.grant_id)
            } else if (row.grant_id) {
                await apiAcervo.permissoes.atualizar(row.grant_id, grant)
            } else if (!allOff) {
                await apiAcervo.permissoes.conceder({ user_id: userId, folder_id: pastaAcao.id, ...grant })
            }
            await recarregarPermissoes()
        } catch (e) {
            setPermissoesErro(e.message)
        }
    }

    const revogarPermissao = async (grantId) => {
        setPermissoesErro(null)
        try {
            await apiAcervo.permissoes.revogar(grantId)
            await recarregarPermissoes()
            toast.success('Permissão revogada!')
        } catch (e) {
            setPermissoesErro(e.message)
        }
    }

    const adicionarUsuarioPermissao = (userId) => {
        setPermAdicionados(prev => prev.includes(userId) ? prev : [...prev, userId])
        setPermSelectAberto(false)
    }

    // Envolvidos = quem tem acesso/grant (source != none) + os adicionados manualmente.
    const permEnvolvidos = permissoes.filter(
        p => p.source !== 'none' || permAdicionados.includes(p.user_id)
    )
    const permCandidatos = permissoes.filter(
        p => p.source === 'none' && !permAdicionados.includes(p.user_id)
    )

    const subpastas = (conteudo?.subpastas ?? []).filter(p =>
        p.nome.toLowerCase().includes(busca.toLowerCase())
    )
    const arquivos = conteudo?.arquivos ?? []

    // breadcrumb: a API retorna root + caminho; exibimos root como ícone home
    const breadcrumb = conteudo?.breadcrumb ?? []
    const isNaRaiz = conteudo?.folder?.is_root

    return (
        <>
        <ToastContainer position="top-right" autoClose={3000} />
        <div className="flex flex-col flex-1 overflow-hidden bg-branco_cinza">

            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-4 gap-4 shrink-0 border-b border-gray-200">
                {/* Breadcrumb */}
                <div className="flex items-center gap-1.5 text-sm min-w-0 overflow-x-auto [&::-webkit-scrollbar]:hidden">
                    <button
                        onClick={() => raizId && voltarPara(raizId)}
                        className="shrink-0 text-azul_escuro hover:text-laranja_escuro transition-colors"
                        title="Acervo"
                    >
                        <FaHome size={16} />
                    </button>
                    {breadcrumb.filter(b => !b.is_root && b.id !== conteudo?.folder?.id).map((b) => (
                        <span key={b.id} className="flex items-center gap-1 shrink-0">
                            <FaChevronRight size={9} className="opacity-30" />
                            <button
                                onClick={() => voltarPara(b.id)}
                                className="text-gray-500 hover:text-azul_escuro transition-colors truncate max-w-[120px]"
                            >
                                {b.nome}
                            </button>
                        </span>
                    ))}
                    {!isNaRaiz && conteudo?.folder && (
                        <span className="flex items-center gap-1 shrink-0">
                            <FaChevronRight size={9} className="opacity-30" />
                            <span className="font-semibold text-azul_escuro truncate max-w-[160px]">
                                {conteudo.folder.nome}
                            </span>
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {/* Search */}
                    <div className="relative hidden sm:flex items-center">
                        <FaSearch size={12} className="absolute left-3 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar pastas..."
                            value={busca}
                            onChange={e => setBusca(e.target.value)}
                            className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul_escuro/20 focus:border-azul_escuro/40 w-56 transition-all"
                        />
                    </div>

                    {/* View toggle */}
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-azul_escuro text-white' : 'text-gray-400 hover:bg-gray-50'}`}
                            title="Grade"
                        >
                            <FaThLarge size={15} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-azul_escuro text-white' : 'text-gray-400 hover:bg-gray-50'}`}
                            title="Lista"
                        >
                            <FaList size={15} />
                        </button>
                    </div>

                    {conteudo?.can_write && (
                        <>
                            <button
                                onClick={() => { setErroModal(null); setModalUpload(true) }}
                                className="flex items-center gap-2 bg-azul_escuro text-white px-5 py-2.5 text-sm rounded-md hover:bg-laranja_escuro transition-all"
                            >
                                <FaUpload size={13} />
                                <span className="hidden sm:inline">Upload</span>
                            </button>
                            <button
                                onClick={abrirModalNovaPasta}
                                className="flex items-center gap-2 bg-azul_escuro text-white px-5 py-2.5 text-sm rounded-md hover:bg-laranja_escuro transition-all"
                            >
                                <FaPlus size={13} />
                                <span className="hidden sm:inline">Nova Pasta</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* States */}
            {loading && (
                <div className="flex flex-1 items-center justify-center">
                    <FiLoader className="animate-spin text-3xl text-azul_escuro" />
                </div>
            )}

            {erro && !loading && (
                <div className="flex flex-1 items-center justify-center">
                    <p className="text-sm text-red-500">{erro}</p>
                </div>
            )}

            {/* Main content */}
            {!loading && !erro && conteudo && (
                <div className="flex-1 overflow-y-auto p-6">
                    {viewMode === 'grid' ? (
                        <div className="space-y-8">
                            {subpastas.length > 0 && (
                                <section>
                                    <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        Pastas
                                        <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">{subpastas.length}</span>
                                    </h2>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5 gap-3">
                                        {subpastas.map((pasta, i) => (
                                            <PastaAcervoDigital
                                                key={pasta.id}
                                                pasta={pasta}
                                                viewMode="grid"
                                                index={i}
                                                isAdmin={isAdmin}
                                                onAbrirPasta={abrirPasta}
                                                onRenomear={abrirRenomear}
                                                onExcluir={abrirExcluir}
                                                onPermissoes={abrirPermissoes}
                                                menuAberto={menuAberto}
                                                onAbrirMenu={abrirMenu}
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {arquivos.length > 0 && (
                                <section>
                                    <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        Arquivos
                                        <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">{arquivos.length}</span>
                                    </h2>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                        {arquivos.map((arquivo, i) => (
                                            <ArquivoAcervoDigital
                                                key={arquivo.id}
                                                arquivo={arquivo}
                                                viewMode="grid"
                                                index={i}
                                                handleClick={() => { }}
                                                menuAberto={menuAberto}
                                                onAbrirMenu={abrirMenuArquivo}
                                                onDownload={baixarArquivo}
                                                onRenomear={abrirRenomearArquivo}
                                                onExcluir={abrirExcluirArquivo}
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {subpastas.length === 0 && arquivos.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-24 text-center">
                                    <FaFolderPlus size={44} className="text-gray-200 mb-4" />
                                    <p className="text-sm text-gray-400 font-medium">Esta pasta está vazia</p>
                                    {conteudo?.can_write && (
                                        <p className="text-xs text-gray-400 mt-1">Crie uma pasta ou faça upload de arquivos</p>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="hidden sm:grid grid-cols-10 px-4 py-2.5 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50/80">
                                <div className="col-span-6">Nome</div>
                                <div className="col-span-2">Tamanho</div>
                                <div className="col-span-2">Data</div>
                            </div>
                            {subpastas.map((pasta, i) => (
                                <PastaAcervoDigital
                                    key={pasta.id}
                                    pasta={pasta}
                                    viewMode="list"
                                    index={i}
                                    isAdmin={isAdmin}
                                    onAbrirPasta={abrirPasta}
                                    onRenomear={abrirRenomear}
                                    onExcluir={abrirExcluir}
                                    onPermissoes={abrirPermissoes}
                                    menuAberto={menuAberto}
                                    onAbrirMenu={abrirMenu}
                                />
                            ))}
                            {arquivos.map((arquivo, i) => (
                                <ArquivoAcervoDigital
                                    key={arquivo.id}
                                    arquivo={arquivo}
                                    viewMode="list"
                                    index={subpastas.length + i}
                                    handleClick={() => { }}
                                    menuAberto={menuAberto}
                                    onAbrirMenu={abrirMenuArquivo}
                                    onRenomear={abrirRenomearArquivo}
                                    onExcluir={abrirExcluirArquivo}
                                />
                            ))}
                            {subpastas.length === 0 && arquivos.length === 0 && (
                                <div className="py-16 text-center text-sm text-gray-400">Pasta vazia</div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Modal Nova Pasta */}
            <ModalBase isOpen={modalNovaPasta} onClose={() => setModalNovaPasta(false)} title="Nova Pasta" size="sm">
                <div className="px-6 py-5">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome da pasta</label>
                    <input
                        autoFocus
                        type="text"
                        value={nomePasta}
                        onChange={e => setNomePasta(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && criarPasta()}
                        placeholder="Ex: Documentos 2025"
                        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul_escuro/20 focus:border-azul_escuro/50 transition-all"
                    />
                    {erroModal && <p className="mt-2 text-xs text-red-500">{erroModal}</p>}
                </div>
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
                    <button onClick={() => setModalNovaPasta(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">
                        Cancelar
                    </button>
                    <button
                        onClick={criarPasta}
                        disabled={salvando || !nomePasta.trim()}
                        className="flex items-center gap-2 px-5 py-2 text-sm bg-azul_escuro text-white rounded-lg hover:bg-laranja_escuro transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {salvando ? <FiLoader className="animate-spin" size={13} /> : <FaFolderPlus size={13} />}
                        Criar
                    </button>
                </div>
            </ModalBase>

            {/* Modal Upload */}
            <ModalBase isOpen={modalUpload} onClose={fecharUpload} title="Upload de Arquivos" size="md">
                <div className="px-6 py-5 space-y-4">
                    <div
                        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={e => { e.preventDefault(); setDragOver(false); adicionarArquivos(e.dataTransfer.files) }}
                        onClick={() => inputFileRef.current?.click()}
                        className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl py-10 cursor-pointer transition-colors ${dragOver ? 'border-azul_escuro bg-azul_escuro/5' : 'border-gray-200 hover:border-azul_escuro/50 hover:bg-gray-50'}`}
                    >
                        <FaCloudUploadAlt size={32} className="text-gray-300" />
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-600">Arraste arquivos aqui</p>
                            <p className="text-xs text-gray-400 mt-0.5">ou clique para selecionar</p>
                        </div>
                        <input ref={inputFileRef} type="file" multiple className="hidden" onChange={e => adicionarArquivos(e.target.files)} />
                    </div>
                    {arquivosUpload.length > 0 && (
                        <ul className="space-y-2 max-h-48 overflow-y-auto">
                            {arquivosUpload.map((f, i) => (
                                <li key={i} className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg">
                                    <FileIcon contentType={f.type} size={16} />
                                    <span className="flex-1 text-xs text-gray-700 truncate">{f.name}</span>
                                    <span className="text-xs text-gray-400 shrink-0">{formatBytes(f.size)}</span>
                                    {uploadProgresso[i] === 'enviando' && <FiLoader size={13} className="animate-spin text-azul_escuro shrink-0" />}
                                    {uploadProgresso[i] === 'ok' && <span className="text-xs text-green-500 shrink-0">✓</span>}
                                    {uploadProgresso[i] === 'erro' && <span className="text-xs text-red-500 shrink-0">✗</span>}
                                    {!uploadProgresso[i] && (
                                        <button onClick={() => removerArquivo(i)} className="text-gray-300 hover:text-red-400 transition-colors shrink-0">
                                            <FaTimes size={11} />
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                    {erroModal && <p className="text-xs text-red-500">{erroModal}</p>}
                </div>
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
                    <button onClick={fecharUpload} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">Cancelar</button>
                    <button
                        onClick={fazerUpload}
                        disabled={salvando || !arquivosUpload.length}
                        className="flex items-center gap-2 px-5 py-2 text-sm bg-azul_escuro text-white rounded-lg hover:bg-laranja_escuro transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {salvando ? <FiLoader className="animate-spin" size={13} /> : <FaUpload size={13} />}
                        {salvando ? 'Enviando...' : `Enviar${arquivosUpload.length > 0 ? ` (${arquivosUpload.length})` : ''}`}
                    </button>
                </div>
            </ModalBase>

            {/* Modal Renomear */}
            <ModalBase isOpen={modalRenomear} onClose={() => setModalRenomear(false)} title="Renomear Pasta" size="sm">
                <div className="px-6 py-5">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Novo nome</label>
                    <input
                        autoFocus
                        type="text"
                        value={nomeRenomear}
                        onChange={e => setNomeRenomear(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && confirmarRenomear()}
                        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul_escuro/20 focus:border-azul_escuro/50 transition-all"
                    />
                    {erroModal && <p className="mt-2 text-xs text-red-500">{erroModal}</p>}
                </div>
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
                    <button onClick={() => setModalRenomear(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">Cancelar</button>
                    <button
                        onClick={confirmarRenomear}
                        disabled={salvando || !nomeRenomear.trim()}
                        className="flex items-center gap-2 px-5 py-2 text-sm bg-azul_escuro text-white rounded-lg hover:bg-laranja_escuro transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {salvando ? <FiLoader className="animate-spin" size={13} /> : <FaPencilAlt size={13} />}
                        Salvar
                    </button>
                </div>
            </ModalBase>

            {/* Modal Renomear Arquivo */}
            <ModalBase isOpen={modalRenomearArquivo} onClose={() => setModalRenomearArquivo(false)} title="Renomear Arquivo" size="sm">
                <div className="px-6 py-5">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Novo nome</label>
                    <input
                        autoFocus
                        type="text"
                        value={nomeRenomearArquivo}
                        onChange={e => setNomeRenomearArquivo(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && confirmarRenomearArquivo()}
                        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul_escuro/20 focus:border-azul_escuro/50 transition-all"
                    />
                    {erroModal && <p className="mt-2 text-xs text-red-500">{erroModal}</p>}
                </div>
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
                    <button onClick={() => setModalRenomearArquivo(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">Cancelar</button>
                    <button
                        onClick={confirmarRenomearArquivo}
                        disabled={salvando || !nomeRenomearArquivo.trim()}
                        className="flex items-center gap-2 px-5 py-2 text-sm bg-azul_escuro text-white rounded-lg hover:bg-laranja_escuro transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {salvando ? <FiLoader className="animate-spin" size={13} /> : <FaPencilAlt size={13} />}
                        Salvar
                    </button>
                </div>
            </ModalBase>

            {/* Modal Excluir Arquivo */}
            <ModalBase isOpen={modalExcluirArquivo} onClose={() => setModalExcluirArquivo(false)} title="Excluir Arquivo" size="sm">
                <div className="px-6 py-5">
                    <p className="text-sm text-gray-600">
                        Tem certeza que deseja excluir o arquivo <span className="font-semibold text-gray-800">&ldquo;{arquivoAcao?.nome}&rdquo;</span>?
                    </p>
                    <p className="text-xs text-red-500 mt-2">Esta ação não pode ser desfeita.</p>
                    {erroModal && <p className="mt-3 text-xs text-red-500">{erroModal}</p>}
                </div>
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
                    <button onClick={() => setModalExcluirArquivo(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">Cancelar</button>
                    <button
                        onClick={confirmarExcluirArquivo}
                        disabled={salvando}
                        className="flex items-center gap-2 px-5 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {salvando ? <FiLoader className="animate-spin" size={13} /> : <FaTrashAlt size={13} />}
                        Excluir
                    </button>
                </div>
            </ModalBase>

            {/* Modal Permissões */}
            <ModalBase isOpen={modalPermissoes} onClose={() => setModalPermissoes(false)} title={`Permissões — ${pastaAcao?.nome}`} size="lg">
                {permissoesLoading ? (
                    <div className="flex justify-center py-12">
                        <FiLoader className="animate-spin text-2xl text-azul_escuro" />
                    </div>
                ) : (
                    <>
                        {/* Cabeçalho da tabela */}
                        <div className="flex items-center px-5 py-2.5 border-b border-gray-200 bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-widest">
                            <span className="flex-1">Nome</span>
                            <span className="w-20 text-center">Leitura</span>
                            <span className="w-20 text-center">Escrita</span>
                            <span className="w-20 text-center">Subpastas</span>
                            <div className="w-7" />
                        </div>

                        {/* Usuários envolvidos (com acesso) + adicionados manualmente */}
                        <div className="overflow-y-auto max-h-72 divide-y divide-gray-50">
                            {permEnvolvidos.length === 0 ? (
                                <div className="flex flex-col items-center gap-2 py-10">
                                    <p className="text-sm text-gray-400">Ninguém com acesso ainda — use &ldquo;Adicionar Permissão&rdquo;.</p>
                                </div>
                            ) : permEnvolvidos.map(perm => {
                                const nome = perm.nome || '—'
                                const initials = nome.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
                                const temAcesso = perm.can_read || perm.can_write
                                const origem = ORIGEM_LABEL[perm.source]
                                return (
                                    <div key={perm.user_id} className={`flex items-center px-5 py-3 hover:bg-gray-50/60 transition-colors group ${!temAcesso ? 'opacity-50' : ''}`}>
                                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${temAcesso ? 'bg-azul_escuro/10 text-azul_escuro' : 'bg-gray-100 text-gray-400'}`}>
                                                {initials}
                                            </div>
                                            <span className="text-sm font-medium text-gray-700 truncate">{nome}</span>
                                            {origem && (
                                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 shrink-0">{origem}</span>
                                            )}
                                        </div>
                                        <div className="w-20 flex justify-center">
                                            <Toggle checked={perm.can_read} disabled={perm.locked_read} onChange={() => togglePermissao(perm.user_id, 'can_read')} />
                                        </div>
                                        <div className="w-20 flex justify-center">
                                            <Toggle checked={perm.can_write} disabled={perm.locked_write} onChange={() => togglePermissao(perm.user_id, 'can_write')} />
                                        </div>
                                        <div className="w-20 flex justify-center">
                                            <Toggle checked={perm.cascade} disabled={perm.locked_cascade} onChange={() => togglePermissao(perm.user_id, 'cascade')} />
                                        </div>
                                        <div className="w-7 flex justify-center">
                                            {perm.grant_id && (
                                                <button
                                                    onClick={() => revogarPermissao(perm.grant_id)}
                                                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all"
                                                    title="Revogar grant explícito"
                                                >
                                                    <FaTimes size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Adicionar permissão para qualquer usuário do estabelecimento */}
                        <div className="px-5 py-3 border-t border-gray-100 relative">
                            <button
                                type="button"
                                onClick={() => setPermSelectAberto(v => !v)}
                                className="flex items-center gap-2 text-sm font-medium text-azul_escuro hover:opacity-80 transition-opacity"
                            >
                                <FaPlus size={11} /> Adicionar Permissão
                            </button>
                            {permSelectAberto && (
                                <div className="absolute bottom-full left-5 mb-1 w-64 max-h-56 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                    {permCandidatos.length === 0 ? (
                                        <p className="px-3 py-2.5 text-xs text-gray-400">Todos os usuários já estão na lista.</p>
                                    ) : permCandidatos.map(c => (
                                        <button
                                            key={c.user_id}
                                            type="button"
                                            onClick={() => adicionarUsuarioPermissao(c.user_id)}
                                            className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors truncate"
                                        >
                                            {c.nome || '—'}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {permissoesErro && (
                            <div className="px-5 py-3 bg-red-50 border-t border-red-100">
                                <p className="text-xs text-red-500">{permissoesErro}</p>
                            </div>
                        )}
                    </>
                )}
            </ModalBase>

            {/* Modal Excluir */}
            <ModalBase isOpen={modalExcluir} onClose={() => setModalExcluir(false)} title="Excluir Pasta" size="sm">
                <div className="px-6 py-5">
                    <p className="text-sm text-gray-600">
                        Tem certeza que deseja excluir a pasta <span className="font-semibold text-gray-800">&ldquo;{pastaAcao?.nome}&rdquo;</span>?
                    </p>
                    <p className="text-xs text-red-500 mt-2">Esta ação não pode ser desfeita. Todo o conteúdo será removido.</p>
                    {erroModal && <p className="mt-3 text-xs text-red-500">{erroModal}</p>}
                </div>
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
                    <button onClick={() => setModalExcluir(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">Cancelar</button>
                    <button
                        onClick={confirmarExcluir}
                        disabled={salvando}
                        className="flex items-center gap-2 px-5 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {salvando ? <FiLoader className="animate-spin" size={13} /> : <FaTrashAlt size={13} />}
                        Excluir
                    </button>
                </div>
            </ModalBase>
        </div>
        </>
    )
}
