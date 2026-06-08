'use client'

import { useEffect, useState } from 'react'
import Footer from "@/app/components/footer"
import Header from "@/app/components/header"
import { motion, AnimatePresence } from 'framer-motion'
import {
    FaChartBar,
    FaFileAlt,
    FaGavel,
    FaSearch,
    FaArrowRight,
    FaHandshake,
    FaUniversity,
    FaUserTie,
    FaDatabase,
    FaHeart,
    FaMedkit,
    FaClock,
    FaPalette,
    FaClipboardList,
    FaGraduationCap,
    FaStethoscope,
    FaExclamationTriangle,
    FaReceipt,
    FaLeaf,
    FaFileContract,
    FaUserGraduate,
    FaBaby,
    FaTools,
    FaTheaterMasks,
} from 'react-icons/fa'
import Cookies from 'js-cookie'
import { useAuth } from '@/app/context/AuthContext'



const authUrl = process.env.NEXT_PUBLIC_AUTH_ENDPOINT_URL

export default function PortalDaTransparenciaPage() {
    const token = Cookies.get('auth-token')
    const [busca, setBusca] = useState("")
    const { user } = useAuth()
    const [modulosTransparencia, setModulosTransparencia] = useState([])
    const [focoBusca, setFocoBusca] = useState(false)

    const getIconePorTitulo = (titulo) => {
        const tituloLower = titulo.toLowerCase()

        if (tituloLower.includes('acordo')) return FaHandshake
        if (tituloLower.includes('apreciação') || tituloLower.includes('tribunal')) return FaGavel
        if (tituloLower.includes('concurso') || tituloLower.includes('seleção')) return FaUserTie
        if (tituloLower.includes('aprovados')) return FaUserGraduate
        if (tituloLower.includes('emenda')) return FaUniversity
        if (tituloLower.includes('medicamento') || tituloLower.includes('estoque')) return FaMedkit
        if (tituloLower.includes('profissionais') || tituloLower.includes('horário')) return FaClock
        if (tituloLower.includes('aldir blanc') || tituloLower.includes('política nacional')) return FaPalette
        if (tituloLower.includes('paulo gustavo') || tituloLower.includes('lpg')) return FaTheaterMasks
        if (tituloLower.includes('cultural') || tituloLower.includes('incentivo')) return FaPalette
        if (tituloLower.includes('obras paralisadas') || tituloLower.includes('obras')) return FaTools
        if (tituloLower.includes('julgamento') || tituloLower.includes('executivo')) return FaGavel
        if (tituloLower.includes('regulação') || tituloLower.includes('espera')) return FaClipboardList
        if (tituloLower.includes('creche') || tituloLower.includes('municipal')) return FaBaby
        if (tituloLower.includes('estagiário')) return FaGraduationCap
        if (tituloLower.includes('terceirizado')) return FaTools
        if (tituloLower.includes('estratégico') || tituloLower.includes('objetivo')) return FaChartBar
        if (tituloLower.includes('contratação') || tituloLower.includes('pac')) return FaFileContract
        if (tituloLower.includes('educação') || tituloLower.includes('plano')) return FaGraduationCap
        if (tituloLower.includes('saúde')) return FaStethoscope
        if (tituloLower.includes('relatório') || tituloLower.includes('gestão')) return FaFileAlt
        if (tituloLower.includes('sancionado') || tituloLower.includes('licitante')) return FaExclamationTriangle
        if (tituloLower.includes('renúncia') || tituloLower.includes('fiscal')) return FaReceipt
        if (tituloLower.includes('meio ambiente') || tituloLower.includes('ambiente')) return FaLeaf
        if (tituloLower.includes('diária') || tituloLower.includes('diarias')) return FaReceipt

        return FaDatabase // ícone padrão
    }

    const criarSlug = (titulo) => {
        return titulo.toLowerCase()
            .normalize('NFD') // decompõe caracteres acentuados
            .replace(/[\u0300-\u036f]/g, '') // remove apenas os acentos/diacríticos
            .replace(/[()]/g, '') // remove parênteses
            .replace(/[–—]/g, '-') // normaliza travessões para hífen
            .replace(/\//g, '-') // substitui barras por hífens
            .replace(/\s+/g, '-') // substitui espaços por hífens
            .replace(/-+/g, '-') // colapsa múltiplos hífens em um único
            .trim()
    }

    // Formatação dos dados vindos da API
    const formatarModulosTransparencia = (modulos) => {
        return modulos.map(modulo => ({
            id: modulo.id,
            titulo: modulo.nome,
            descricao: modulo.descricao || `Acesse informações sobre ${modulo.nome.toLowerCase()}`,
            icone: getIconePorTitulo(modulo.nome),
            slug: criarSlug(modulo.nome),
            url: `/dashboard/portal-da-transparencia/${criarSlug(modulo.nome)}`
        }))
    }

    const modulosFiltrados = modulosTransparencia.filter(modulo => {
        const termo = busca.toLowerCase()
        return modulo.titulo?.toLowerCase().includes(termo) ||
            modulo.descricao?.toLowerCase().includes(termo)
    })

    useEffect(() => {
        if (user) {
            const fetchModulos = async () => {
                try {
                    const response = await fetch(`${authUrl}/pacote_transparencia/estabelecimento/${user.estabelecimento.id}/`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    })

                    if (response.ok) {
                        const data = await response.json()
                        const modulosFormatados = formatarModulosTransparencia(data.modulos || [])
                        setModulosTransparencia(modulosFormatados)
                    }
                    else {
                        throw new Error('Erro ao buscar módulos de transparência')
                    }
                }
                catch (error) {
                    console.error('Erro ao buscar módulos de transparência:', error)
                    setModulosTransparencia([])
                }
            }
            fetchModulos()
        }

    }, [user])

    const containerVariants = {
        hidden: { opacity: 0 }, visible: {
            opacity: 1,
            transition: { staggerChildren: 0.08, delayChildren: 0.1 }
        }
    }

    const cardVariants = {
        hidden: { y: 30, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
        }
    }

    return (
        <main className="flex flex-col bg-branco_cinza w-screen h-screen">
            <Header
                nomePagina={"SGM"}
                corFonte={"text-branco_cinza"}
                ocultarNav={true}
                opacidade={"bg-opacity-100"}
                navItems={[]}
            />

            <div className="overflow-auto flex-1">
                {/* Hero Section */}
                <section className="relative overflow-hidden bg-azul_escuro">
                    {/* Background decorativo */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-azul_claro blur-3xl" />
                        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-laranja_escuro blur-3xl" />
                    </div>

                    <div className="relative max-w-7xl mx-auto px-4 py-8 lg:py-20">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="text-center"
                        >
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-12 tracking-tight">
                                Portal da Transparência
                            </h1>
                            {/* Barra de Busca integrada no hero */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.3 }}
                                className="max-w-xl mx-auto"
                            >
                                <div className={`relative transition-all mb-12 duration-300 ${focoBusca ? 'scale-[1.02]' : ''}`}>
                                    <FaSearch className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${focoBusca ? 'text-azul_claro' : 'text-gray-400'}`} />
                                    <input
                                        type="text"
                                        placeholder="Busque por serviços..."
                                        value={busca}
                                        onChange={(e) => setBusca(e.target.value)}
                                        onFocus={() => setFocoBusca(true)}
                                        onBlur={() => setFocoBusca(false)}
                                        className="w-full pl-11 pr-5 py-4 bg-white rounded-2xl shadow-2xl shadow-black/20 text-gray-800 placeholder-gray-400 outline-none transition-all duration-300 focus:ring-2 focus:ring-azul_claro/50 text-sm md:text-base"
                                    />
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>

                    {/* Wave divider */}
                    <div className="absolute bottom-0 left-0 right-0">
                        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full block transform translate-y-px">
                            <path d="M0 60V20C240 0 480 0 720 20C960 40 1200 40 1440 20V60H0Z" fill="#F2F2F2" />
                        </svg>
                    </div>
                </section>

                {/* Grid de Serviços */}
                <section className="max-w-7xl mx-auto px-4 pt-10 pb-20 lg:pt-14">
                    {busca && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-sm text-gray-500 mb-6"
                        >
                            {modulosFiltrados.length} {modulosFiltrados.length === 1 ? 'resultado encontrado' : 'resultados encontrados'} para <span className="font-semibold text-azul_escuro">&quot;{busca}&quot;</span>
                        </motion.p>
                    )}

                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
                    >
                        <AnimatePresence mode="popLayout">
                            {modulosFiltrados.map((modulo) => {
                                const Icone = modulo.icone
                                return (
                                    <motion.a
                                        key={modulo.id}
                                        href={modulo.url}
                                        variants={cardVariants}
                                        layout
                                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                        whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                                        whileTap={{ scale: 0.98 }}
                                        className="group block"
                                    >
                                        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-laranja_escuro h-[220px] p-6 flex flex-col">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="w-12 h-12 rounded-lg bg-azul_escuro group-hover:bg-laranja_escuro flex items-center justify-center transition-colors duration-300 flex-shrink-0">
                                                    <Icone className="text-white text-xl" />
                                                </div>
                                                <h3 className="text-md font-bold text-azul_escuro transition-colors duration-300 line-clamp-2">
                                                    {modulo.titulo}
                                                </h3>
                                            </div>

                                            <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                                                {modulo.descricao}
                                            </p>

                                            <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
                                                <span className="text-sm text-azul_escuro group-hover:text-laranja_escuro font-semibold transition-colors duration-300">
                                                    Acessar
                                                </span>
                                                <FaArrowRight className="text-azul_escuro group-hover:text-laranja_escuro transition-colors duration-300" />
                                            </div>
                                        </div>
                                    </motion.a>
                                )
                            })}
                        </AnimatePresence>
                    </motion.div>

                    {/* Empty state */}
                    <AnimatePresence>
                        {modulosFiltrados.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="text-center py-20"
                            >
                                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                                    <FaSearch className="text-2xl text-gray-400" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-700 mb-2">
                                    Nenhum serviço encontrado
                                </h3>
                                <p className="text-gray-400 text-sm max-w-sm mx-auto">
                                    Não encontramos resultados para &quot;<span className="text-gray-600">{busca}</span>&quot;. Tente buscar por outro termo.
                                </p>
                                <button
                                    onClick={() => setBusca("")}
                                    className="mt-5 text-sm font-semibold text-azul_claro hover:text-azul_escuro transition-colors"
                                >
                                    Limpar busca
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </section>
            </div>

            <Footer />
        </main>
    )
}