'use client'
import Cookies from "js-cookie"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import {
    FiLoader, FiUser, FiMail, FiShield, FiCalendar,
    FiArrowLeft, FiPackage, FiGrid, FiCheck, FiPlus, FiX
} from "react-icons/fi"
import { HiOutlineOfficeBuilding } from "react-icons/hi"

const authApiUrl = process.env.NEXT_PUBLIC_AUTH_ENDPOINT_URL

function formatCPF(v = '') {
    return v.replace(/\D/g, '').slice(0, 11)
        .replace(/^(\d{3})(\d)/, '$1.$2')
        .replace(/^(\d{3}\.\d{3})(\d)/, '$1.$2')
        .replace(/^(\d{3}\.\d{3}\.\d{3})(\d)/, '$1-$2')
}

function formatDate(iso) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function UserPage() {
    const { id } = useParams()
    const router = useRouter()
    const token = Cookies.get('auth-token')

    const [userData, setUserData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [editandoDados, setEditandoDados] = useState(false)
    const [salvandoDados, setSalvandoDados] = useState(false)
    const [formDados, setFormDados] = useState({
        nome: '',
        username: '',
        email: '',
        cpf: '',
        cargo: '',
    })
    const [pacoteData, setPacoteData] = useState([])
    const [orgaosDisponiveis, setOrgaosDisponiveis] = useState([])

    const [orgaosUser, setOrgaosUser] = useState([])
    const [funcUser, setFuncUser] = useState([])

    // loading individual por item: { [itemId]: true/false }
    const [loadingOrgao, setLoadingOrgao] = useState({})
    const [loadingFunc, setLoadingFunc] = useState({})

    // ── fetch ──────────────────────────────────────────────
    async function fetchUserData() {
        try {
            const response = await fetch(`${authApiUrl}/user/${id}/`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!response.ok) throw new Error('Falha ao buscar usuário')
            const data = await response.json()
            setUserData(data)
            setFormDados({
                nome: data.nome || '',
                username: data.username || '',
                email: data.email || '',
                cpf: data.cpf || '',
                cargo: data.cargo || '',
            })
            setOrgaosUser(data.orgaos || [])
            setFuncUser(data.funcionalidades || [])
        } catch (error) {
            console.error(error)
            toast.error('Erro ao carregar dados do usuário')
        } finally {
            setLoading(false)
        }
    }

    function normalizeCPF(v = '') {
        return v.replace(/\D/g, '').slice(0, 11)
    }

    async function handleSalvarDadosBasicos(e) {
        e.preventDefault()
        setSalvandoDados(true)
        try {
            const payload = {
                nome: formDados.nome || null,
                username: formDados.username || null,
                email: formDados.email || null,
                cpf: normalizeCPF(formDados.cpf) || null,
                cargo: (formDados.cargo || '').trim() || null,
            }

            const response = await fetch(`${authApiUrl}/user/${id}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            })
            if (!response.ok) throw new Error('Falha ao salvar usuário')
            const updated = await response.json()
            setUserData(updated)
            setFormDados({
                nome: updated.nome || '',
                username: updated.username || '',
                email: updated.email || '',
                cpf: updated.cpf || '',
                cargo: updated.cargo || '',
            })
            setEditandoDados(false)
            toast.success('Dados do usuário atualizados!')
        } catch (error) {
            console.error(error)
            toast.error('Erro ao salvar dados do usuário')
        } finally {
            setSalvandoDados(false)
        }
    }

    async function fetchPacote(estabelecimentoId) {
        try {
            const response = await fetch(`${authApiUrl}/pacote/funcionalidades/${estabelecimentoId}/`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (response.ok) setPacoteData((await response.json()) || [])
        } catch (error) { console.error(error) }
    }

    async function fetchOrgaos(estabelecimentoId) {
        try {
            const response = await fetch(`${authApiUrl}/orgao/estabelecimento/${estabelecimentoId}/`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!response.ok) throw new Error('Erro ao obter órgãos')
            setOrgaosDisponiveis((await response.json()) || [])
        } catch (error) { console.error(error) }
    }

    useEffect(() => { fetchUserData() }, [id])

    useEffect(() => {
        if (userData?.estabelecimento?.id) {
            fetchPacote(userData.estabelecimento.id)
            fetchOrgaos(userData.estabelecimento.id)
        }
    }, [userData])

    // ── toggles com chamada imediata ───────────────────────
    async function handleToggleOrgao(orgao) {
        const vinculado = orgaosUser.some(o => o.id === orgao.id)
        setLoadingOrgao(prev => ({ ...prev, [orgao.id]: true }))
        try {
            const endpoint = vinculado
                ? `${authApiUrl}/user/${id}/remove_orgao/${orgao.id}/`
                : `${authApiUrl}/user/${id}/add_orgao/${orgao.id}/`
            const response = await fetch(endpoint, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            })
            if (!response.ok) throw new Error()
            setOrgaosUser(prev =>
                vinculado ? prev.filter(o => o.id !== orgao.id) : [...prev, orgao]
            )
            toast.success(vinculado ? 'Órgão removido.' : 'Órgão adicionado.')
        } catch {
            toast.error(vinculado ? 'Erro ao remover órgão.' : 'Erro ao adicionar órgão.')
        } finally {
            setLoadingOrgao(prev => ({ ...prev, [orgao.id]: false }))
        }
    }

    async function handleToggleFunc(func) {
        const vinculada = funcUser.some(f => f.id === func.id)
        setLoadingFunc(prev => ({ ...prev, [func.id]: true }))
        try {
            const endpoint = vinculada
                ? `${authApiUrl}/user/${id}/remove_funcionalidade/${func.id}/`
                : `${authApiUrl}/user/${id}/add_funcionalidade/${func.id}/`
            const response = await fetch(endpoint, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            })
            if (!response.ok) throw new Error()
            setFuncUser(prev =>
                vinculada ? prev.filter(f => f.id !== func.id) : [...prev, func]
            )
            toast.success(vinculada ? 'Funcionalidade removida.' : 'Funcionalidade adicionada.')
        } catch {
            toast.error(vinculada ? 'Erro ao remover funcionalidade.' : 'Erro ao adicionar funcionalidade.')
        } finally {
            setLoadingFunc(prev => ({ ...prev, [func.id]: false }))
        }
    }

    // ── render ─────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-branco_cinza">
                <FiLoader size={48} className="animate-spin text-azul_escuro" />
            </div>
        )
    }

    if (!userData) return null

    const sectionVariants = {
        hidden: { opacity: 0, y: 16 },
        visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.35 } })
    }

    return (
        <section className="flex flex-col flex-grow bg-branco_cinza overflow-auto p-4 md:p-8 text-azul_escuro">
            <ToastContainer position="top-right" autoClose={4000} hideProgressBar={false} />

            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <button
                    onClick={() => router.back()}
                    className="p-2 rounded-lg hover:bg-white transition-colors"
                    title="Voltar"
                >
                    <FiArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-azul_escuro leading-tight">{userData.nome}</h1>
                    <p className="text-sm text-gray-400">@{userData.username}</p>
                </div>
            </div>

            <div className="flex flex-col gap-6">

                {/* ── Dados do Usuário ── */}
                <motion.div custom={0} variants={sectionVariants} initial="hidden" animate="visible"
                    className="bg-white rounded-xl shadow-md p-6"
                >
                    <h2 className="text-sm font-bold text-azul_escuro uppercase tracking-wide border-b border-gray-100 pb-3 mb-5">
                        Dados do Usuário
                    </h2>

                    <div className="flex flex-wrap gap-2 justify-end mb-4">
                        {!editandoDados ? (
                            <button
                                onClick={() => setEditandoDados(true)}
                                className="px-4 py-2 bg-azul_escuro text-white rounded-lg shadow hover:bg-azul_claro transition-colors"
                            >
                                Editar dados
                            </button>
                        ) : (
                            <button
                                onClick={() => {
                                    setEditandoDados(false)
                                    setFormDados({
                                        nome: userData.nome || '',
                                        username: userData.username || '',
                                        email: userData.email || '',
                                        cpf: userData.cpf || '',
                                        cargo: userData.cargo || '',
                                    })
                                }}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                        )}
                    </div>

                    {editandoDados ? (
                        <form onSubmit={handleSalvarDadosBasicos} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            <div className="flex flex-col gap-2">
                                <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Nome completo</span>
                                <input
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul_escuro/30"
                                    value={formDados.nome}
                                    onChange={(e) => setFormDados(prev => ({ ...prev, nome: e.target.value }))}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Username</span>
                                <input
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul_escuro/30"
                                    value={formDados.username}
                                    onChange={(e) => setFormDados(prev => ({ ...prev, username: e.target.value }))}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">E-mail</span>
                                <input
                                    type="email"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul_escuro/30"
                                    value={formDados.email}
                                    onChange={(e) => setFormDados(prev => ({ ...prev, email: e.target.value }))}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">CPF</span>
                                <input
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul_escuro/30"
                                    value={formDados.cpf}
                                    onChange={(e) => setFormDados(prev => ({ ...prev, cpf: e.target.value }))}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Cargo (publicação)</span>
                                <input
                                    required
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-azul_escuro/30"
                                    value={formDados.cargo}
                                    onChange={(e) => setFormDados(prev => ({ ...prev, cargo: e.target.value }))}
                                />
                            </div>
                            <div className="flex items-end">
                                <button
                                    type="submit"
                                    disabled={salvandoDados}
                                    className="w-full px-4 py-3 bg-laranja_escuro text-white rounded-lg shadow hover:bg-laranja_claro transition-colors disabled:opacity-60"
                                >
                                    {salvandoDados ? 'Salvando...' : 'Salvar'}
                                </button>
                            </div>
                        </form>
                    ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        <InfoField icon={<FiUser />} label="Nome completo" value={userData.nome} />
                        <InfoField icon={<FiUser />} label="Username" value={`@${userData.username}`} />
                        <InfoField icon={<FiMail />} label="E-mail" value={userData.email} />
                        <InfoField icon={<FiShield />} label="CPF" value={formatCPF(userData.cpf)} />
                        <InfoField icon={<FiShield />} label="Cargo (publicação)" value={userData.cargo || '—'} />
                        <InfoField icon={<FiCalendar />} label="Criado em" value={formatDate(userData.created_at)} />
                        <div className="flex flex-col gap-2">
                            <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Perfil</span>
                            <div className="flex gap-2 flex-wrap">
                                {userData.is_super && <Badge color="orange" label="Super Admin" />}
                                {userData.is_admin && <Badge color="blue" label="Admin" />}
                                {!userData.is_super && !userData.is_admin && (
                                    <Badge color="gray" label="Usuário" />
                                )}
                            </div>
                        </div>
                    </div>
                    )}

                    {/* Estabelecimento inline */}
                    {userData.estabelecimento && (
                        <div className="mt-6 pt-5 border-t border-gray-100 flex items-center gap-4">
                            <div className="bg-azul_escuro bg-opacity-10 rounded-lg p-2.5 shrink-0">
                                <HiOutlineOfficeBuilding className="text-xl text-azul_escuro" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Estabelecimento</p>
                                <p className="font-bold text-azul_escuro">{userData.estabelecimento.nome}</p>
                                <p className="text-xs text-gray-400">{userData.estabelecimento.cidade} · Resp. {userData.estabelecimento.responsavel}</p>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* ── Órgãos ── */}
                <motion.div custom={1} variants={sectionVariants} initial="hidden" animate="visible"
                    className="bg-white rounded-xl shadow-md p-6"
                >
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-5">
                        <div>
                            <h2 className="text-sm font-bold text-azul_escuro uppercase tracking-wide">Órgãos</h2>
                            <p className="text-xs text-gray-400 mt-0.5">Órgãos que este usuário pode acessar</p>
                        </div>
                        <span className="bg-azul_escuro bg-opacity-10 text-azul_escuro text-xs font-semibold px-3 py-1 rounded-full">
                            {orgaosUser.length} vinculado{orgaosUser.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    {orgaosDisponiveis.length === 0 ? (
                        <div className="text-center py-8 text-gray-300">
                            <HiOutlineOfficeBuilding className="mx-auto text-4xl mb-2" />
                            <p className="text-sm">Nenhum órgão disponível</p>
                        </div>
                    ) : (
                        <div className="flex flex-col divide-y divide-gray-50">
                            {orgaosDisponiveis.map(orgao => {
                                const vinculado = orgaosUser.some(o => o.id === orgao.id)
                                const carregando = !!loadingOrgao[orgao.id]
                                return (
                                    <div key={orgao.id} className="flex items-center justify-between py-3 gap-4">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="bg-azul_escuro bg-opacity-5 rounded-lg p-1.5 shrink-0">
                                                <HiOutlineOfficeBuilding className="text-base text-azul_escuro" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-azul_escuro truncate">{orgao.nome}</p>
                                                {orgao.sigla && <p className="text-xs text-gray-400">{orgao.sigla}</p>}
                                            </div>
                                        </div>
                                        <ToggleButton
                                            ativo={vinculado}
                                            loading={carregando}
                                            onToggle={() => handleToggleOrgao(orgao)}
                                        />
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </motion.div>

                {/* ── Funcionalidades ── */}
                <motion.div custom={2} variants={sectionVariants} initial="hidden" animate="visible"
                    className="bg-white rounded-xl shadow-md p-6"
                >
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-5">
                        <div>
                            <h2 className="text-sm font-bold text-azul_escuro uppercase tracking-wide">Funcionalidades</h2>
                            <p className="text-xs text-gray-400 mt-0.5">Módulos que este usuário tem acesso</p>
                        </div>
                        <span className="bg-azul_claro bg-opacity-10 text-azul_claro text-xs font-semibold px-3 py-1 rounded-full">
                            {funcUser.length} vinculada{funcUser.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    {pacoteData.length === 0 ? (
                        <div className="text-center py-8 text-gray-300">
                            <FiPackage className="mx-auto text-4xl mb-2" />
                            <p className="text-sm">Nenhuma funcionalidade disponível no pacote</p>
                        </div>
                    ) : (
                        <div className="flex flex-col divide-y divide-gray-50">
                            {pacoteData.map(func => {
                                const vinculada = funcUser.some(f => f.id === func.id)
                                const carregando = !!loadingFunc[func.id]
                                return (
                                    <div key={func.id} className="flex items-center justify-between py-3 gap-4">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="bg-azul_claro bg-opacity-10 rounded-lg p-1.5 shrink-0">
                                                <FiGrid className="text-base text-azul_claro" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-azul_escuro truncate">{func.nome}</p>
                                                {func.descricao && <p className="text-xs text-gray-400 truncate">{func.descricao}</p>}
                                            </div>
                                        </div>
                                        <ToggleButton
                                            ativo={vinculada}
                                            loading={carregando}
                                            onToggle={() => handleToggleFunc(func)}
                                            cor="azul_claro"
                                        />
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </motion.div>

            </div>
        </section>
    )
}

// ── sub-components ─────────────────────────────────────────
function ToggleButton({ ativo, loading, onToggle, cor = 'azul_escuro' }) {
    const activeClass = cor === 'azul_claro'
        ? 'bg-azul_claro text-white'
        : 'bg-azul_escuro text-white'

    return (
        <button
            onClick={onToggle}
            disabled={loading}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all duration-200 disabled:opacity-50 ${ativo
                ? `${activeClass} border-transparent`
                : 'bg-white text-gray-500 border-gray-200 hover:border-azul_claro hover:text-azul_claro'
                }`}
        >
            {loading
                ? <FiLoader size={13} className="animate-spin" />
                : ativo
                    ? <><FiCheck size={14} /> Vinculado</>
                    : <><FiPlus size={14} /> Vincular</>
            }
        </button>
    )
}

function InfoField({ icon, label, value }) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</span>
            <div className="flex items-center gap-2 text-sm font-medium text-azul_escuro">
                <span className="text-azul_claro shrink-0">{icon}</span>
                {value || '—'}
            </div>
        </div>
    )
}

function Badge({ color, label }) {
    const styles = {
        blue: 'bg-azul_escuro bg-opacity-10 text-azul_escuro',
        orange: 'bg-laranja_claro bg-opacity-15 text-laranja_escuro',
        green: 'bg-verde bg-opacity-10 text-verde',
        gray: 'bg-gray-100 text-gray-500',
    }
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[color]}`}>
            <FiShield className="text-xs" />
            {label}
        </span>
    )
}
