'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/app/context/AuthContext'
import Cookies from 'js-cookie'
import { MdFeedback, MdPending, MdCheckCircle, MdCancel, MdAssignment, MdOutlineTrendingUp } from 'react-icons/md'
import { FiLoader } from 'react-icons/fi'
import { HiOutlineExternalLink } from 'react-icons/hi'
import Grafico from '@/app/components/grafico'
import { motion, AnimatePresence } from 'framer-motion'

const ouvidoriaUrl = process.env.NEXT_PUBLIC_OUVIDORIA_ENDPOINT_URL

export default function VisaoGeral() {
    const token = Cookies.get('auth-token')
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [estatisticas, setEstatisticas] = useState({ total: 0, pendentes: 0, em_andamento: 0, resolvidos: 0, cancelados: 0 })
    const [chamadosPorTipo, setChamadosPorTipo] = useState([])
    const [chamadosRecentes, setChamadosRecentes] = useState([])

    const fetchAllData = async () => {
        try {
            setLoading(true)
            
            const response = await fetch(`${ouvidoriaUrl}/chamado/estabelecimento/`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                throw new Error('Erro ao buscar chamados')
            }

            const data = await response.json()
            
            // Processar todos os dados de uma vez
            await Promise.all([
                processEstatisticas(data),
                processChamadosPorTipo(data),
                processChamadosRecentes(data)
            ])
        } catch (error) {
            console.error('Erro ao buscar dados:', error)
            // Fallback para dados vazios
            setEstatisticas({
                total: 0,
                pendentes: 0,
                em_andamento: 0,
                resolvidos: 0,
                cancelados: 0
            })
            setChamadosPorTipo([])
            setChamadosRecentes([])
        } finally {
            setLoading(false)
        }
    }

    const processEstatisticas = async (data) => {
        const total = data.length
        const pendentes = data.filter(chamado => chamado.status?.toLowerCase() === 'pendente').length
        const encerrados = data.filter(chamado => chamado.status?.toLowerCase() === 'encerrado').length
        const deferidos = data.filter(chamado => chamado.status?.toLowerCase() === 'encerrado' && chamado.tipo_resposta?.toLowerCase() === 'deferido').length
        const indeferidos = data.filter(chamado => chamado.status?.toLowerCase() === 'encerrado' && chamado.tipo_resposta?.toLowerCase() === 'indeferido').length

        setEstatisticas({
            total,
            pendentes,
            em_andamento: 0,
            resolvidos: deferidos,
            cancelados: indeferidos
        })
    }

    const processChamadosPorTipo = async (data) => {
        const tiposCount = data.reduce((acc, chamado) => {
            const tipo = chamado.tipo_abertura
            if (tipo) {
                acc[tipo] = (acc[tipo] || 0) + 1
            }
            return acc
        }, {})

        const getTipoNome = (tipo) => {
            switch (tipo?.toLowerCase()) {
                case 'informacao': return 'Informação'
                case 'elogio': return 'Elogio'
                case 'sugestao': return 'Sugestão'
                case 'reclamacao': return 'Reclamação'
                case 'comunicacao': return 'Comunicação'
                case 'irregularidade': return 'Irregularidade'
                case 'denuncia': return 'Denúncia'
                case 'representacao': return 'Representação'
                case 'demanda': return 'Demanda'
                case 'critica': return 'Crítica'
                default: return tipo
            }
        }

        const tiposFormatados = Object.entries(tiposCount).map(([tipo, quantidade]) => ({
            tipo: getTipoNome(tipo),
            quantidade
        }))

        setChamadosPorTipo(tiposFormatados)
    }

    const processChamadosRecentes = async (data) => {
        const getTipoNome = (tipo) => {
            switch (tipo?.toLowerCase()) {
                case 'informacao': return 'Informação'
                case 'elogio': return 'Elogio'
                case 'sugestao': return 'Sugestão'
                case 'reclamacao': return 'Reclamação'
                case 'comunicacao': return 'Comunicação'
                case 'irregularidade': return 'Irregularidade'
                case 'denuncia': return 'Denúncia'
                case 'representacao': return 'Representação'
                case 'demanda': return 'Demanda'
                case 'critica': return 'Crítica'
                default: return tipo || 'Não informado'
            }
        }

        const getStatusExibicao = (chamado) => {
            if (chamado.status?.toLowerCase() === 'pendente') {
                return 'Pendente'
            } else if (chamado.status?.toLowerCase() === 'encerrado') {
                if (chamado.tipo_resposta?.toLowerCase() === 'deferido') {
                    return 'Resolvido'
                } else if (chamado.tipo_resposta?.toLowerCase() === 'indeferido') {
                    return 'Cancelado'
                }
                return 'Encerrado'
            }
            return chamado.status || 'Indefinido'
        }

        const chamadosFormatados = data
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5)
            .map(chamado => ({
                id: chamado.id,
                protocolo: chamado.num_protocolo,
                tipo: getTipoNome(chamado.tipo_abertura),
                assunto: chamado.assunto,
                data: chamado.data_envio || chamado.created_at,
                status: getStatusExibicao(chamado)
            }))

        setChamadosRecentes(chamadosFormatados)
    }

    useEffect(() => {
        if (token) {
            fetchAllData()
        } else {
            setLoading(false)
        }
    }, [token])

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pendente': return 'text-yellow-700 bg-yellow-100'
            case 'Em andamento': return 'text-blue-700 bg-blue-100'
            case 'Resolvido': return 'text-green-700 bg-green-100'
            case 'Cancelado': return 'text-red-700 bg-red-100'
            default: return 'text-gray-600 bg-gray-100'
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-branco_cinza">
                <FiLoader className="animate-spin text-4xl text-azul_escuro" />
            </div>
        )
    }

    const statCards = [
        {
            label: 'Total de Chamados',
            value: estatisticas.total,
            icon: <MdAssignment className="text-3xl" />,
            color: 'border-azul_escuro text-azul_escuro',
            iconBg: 'bg-azul_escuro/10 text-azul_escuro',
        },
        {
            label: 'Pendentes',
            value: estatisticas.pendentes,
            icon: <MdPending className="text-3xl" />,
            color: 'border-yellow-500 text-yellow-600',
            iconBg: 'bg-yellow-100 text-yellow-600',
        },
        {
            label: 'Encerrados',
            value: estatisticas.resolvidos + estatisticas.cancelados,
            icon: <MdFeedback className="text-3xl" />,
            color: 'border-blue-500 text-blue-600',
            iconBg: 'bg-blue-100 text-blue-600',
        },
        {
            label: 'Deferidos',
            value: estatisticas.resolvidos,
            icon: <MdCheckCircle className="text-3xl" />,
            color: 'border-green-500 text-green-600',
            iconBg: 'bg-green-100 text-green-600',
        },
        {
            label: 'Indeferidos',
            value: estatisticas.cancelados,
            icon: <MdCancel className="text-3xl" />,
            color: 'border-red-500 text-red-600',
            iconBg: 'bg-red-100 text-red-600',
        },
    ]

    return (
        <section className="flex flex-col flex-grow bg-branco_cinza overflow-auto text-azul_escuro p-4 md:p-8">

            {/* Header */}
            <div className="mb-6 md:mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-azul_escuro rounded-lg">
                        <MdOutlineTrendingUp className="text-2xl text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-extrabold text-azul_escuro">Visão Geral</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Ouvidoria — painel de estatísticas</p>
                    </div>
                </div>
            </div>

            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <AnimatePresence>
                    {statCards.map((card, i) => (
                        <motion.div
                            key={card.label}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25, delay: i * 0.06 }}
                            className={`bg-white rounded-xl shadow-md p-5 border-t-4 ${card.color.split(' ')[0]} flex items-center justify-between gap-3`}
                        >
                            <div>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{card.label}</p>
                                <p className={`text-3xl font-extrabold mt-1 ${card.color.split(' ')[1]}`}>{card.value}</p>
                            </div>
                            <div className={`p-2.5 rounded-xl ${card.iconBg}`}>
                                {card.icon}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Gráfico + Recentes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Gráfico de Chamados por Tipo */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.35 }}
                    className="bg-white rounded-xl shadow-md overflow-hidden"
                >
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                        <span className="w-1 h-5 rounded-full bg-azul_claro inline-block" />
                        <h2 className="text-sm font-bold text-azul_escuro uppercase tracking-wide">Chamados por Tipo</h2>
                    </div>
                    <div className="p-4">
                        <Grafico
                            data={chamadosPorTipo}
                            fillCor={'#0097B2'}
                            dataKeyX={'tipo'}
                            dataKeyY={'quantidade'}
                        />
                    </div>
                </motion.div>

                {/* Chamados Recentes */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.42 }}
                    className="bg-white rounded-xl shadow-md overflow-hidden"
                >
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                        <span className="w-1 h-5 rounded-full bg-laranja_escuro inline-block" />
                        <h2 className="text-sm font-bold text-azul_escuro uppercase tracking-wide">Chamados Recentes</h2>
                    </div>

                    <div className="divide-y divide-gray-100">
                        <AnimatePresence>
                            {chamadosRecentes.map((chamado, i) => (
                                <motion.div
                                    key={chamado.id}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.2, delay: 0.45 + i * 0.05 }}
                                    className="flex items-start justify-between gap-3 px-5 py-4 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-xs text-azul_escuro">{chamado.protocolo}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(chamado.status)}`}>
                                                {chamado.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-800 font-medium truncate">{chamado.assunto}</p>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                            <span>{chamado.tipo}</span>
                                            <span>·</span>
                                            <span>{new Date(chamado.data).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
                        <a
                            href="/dashboard/chamados-ouvidoria/gerenciar"
                            className="flex items-center justify-center gap-1.5 text-sm font-semibold text-azul_escuro hover:text-azul_claro transition-colors"
                        >
                            Ver todos os chamados
                            <HiOutlineExternalLink className="text-base" />
                        </a>
                    </div>
                </motion.div>

            </div>
        </section>
    )
}