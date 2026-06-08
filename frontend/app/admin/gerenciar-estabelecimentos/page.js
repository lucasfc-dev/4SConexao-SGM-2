'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import { useAuth } from '@/app/context/AuthContext'
import Formulario from '@/app/components/formulario'
import PaginacaoAvancada from '@/app/components/PaginacaoAvancada'
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import Modal from "@/app/components/modal"
import { motion, AnimatePresence } from 'framer-motion'
import { FiLoader, FiSearch, FiPlus, FiMapPin, FiUser } from 'react-icons/fi'
import { FaEye } from 'react-icons/fa'
import { HiOutlineOfficeBuilding } from 'react-icons/hi'

const authUrl = process.env.NEXT_PUBLIC_AUTH_ENDPOINT_URL
const ITENS_POR_PAGINA = 15

export default function GerenciarEstabelecimentos() {
    const router = useRouter()
    const [listaEstabelecimentos, setListaEstabelecimentos] = useState([])
    const [loading, setLoading] = useState(true)
    const { user } = useAuth()
    const token = Cookies.get('auth-token')
    const [estabelecimentoSelecionado, setEstabelecimentoSelecionado] = useState(null)
    const [adicionando, setAdicionando] = useState(false)
    const [busca, setBusca] = useState('')
    const [paginaAtual, setPaginaAtual] = useState(1)

    const camposEstabelecimentoAdd = [
        { name: 'nome', label: 'Nome', type: 'text', required: true, placeholder: 'Digite o nome do estabelecimento' },
        { name: 'cidade', label: 'Cidade', type: 'text', required: true, placeholder: 'Digite a cidade do estabelecimento' },
        { name: 'responsavel', label: 'Responsável', type: 'text', required: true, placeholder: 'Digite o responsável pelo estabelecimento' }
    ]

    useEffect(() => {
        if (user && user.is_super) {
            async function fetchEstabelecimentos() {
                setLoading(true)
                try {
                    const conexao = await fetch(`${authUrl}/estabelecimento/all/`, {
                        method: 'GET',
                        headers: { Authorization: `Bearer ${token}` }
                    })
                    const dados = await conexao.json()
                    setListaEstabelecimentos(dados)
                } catch (error) {
                    console.error(error)
                    toast.error('Erro ao carregar estabelecimentos.')
                } finally {
                    setLoading(false)
                }
            }
            fetchEstabelecimentos()
        }
    }, [user, token])

    function handleAdicionar() {
        setEstabelecimentoSelecionado({ id: null, nome: '', cidade: '', responsavel: '' })
        setAdicionando(true)
    }

    async function adicionarEstabelecimento(estabelecimento) {
        try {
            const response = await fetch(`${authUrl}/estabelecimento/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(estabelecimento),
            })
            if (response.ok) {
                const novo = await response.json()
                setListaEstabelecimentos(prev => [novo, ...prev])
                setAdicionando(false)
                setEstabelecimentoSelecionado(null)
                toast.success('Estabelecimento adicionado com sucesso!')
            } else {
                toast.error('Erro ao criar estabelecimento.')
            }
        } catch (error) {
            toast.error('Erro ao criar estabelecimento.')
        }
    }

    function cancelar() {
        setAdicionando(false)
        setEstabelecimentoSelecionado(null)
    }

    const dadosFiltrados = listaEstabelecimentos.filter(est =>
        est.nome?.toLowerCase().includes(busca.toLowerCase()) ||
        est.cidade?.toLowerCase().includes(busca.toLowerCase()) ||
        est.responsavel?.toLowerCase().includes(busca.toLowerCase())
    )

    const totalPaginas = Math.ceil(dadosFiltrados.length / ITENS_POR_PAGINA)
    const itensPagina = dadosFiltrados.slice(
        (paginaAtual - 1) * ITENS_POR_PAGINA,
        paginaAtual * ITENS_POR_PAGINA
    )

    function handleBusca(e) {
        setBusca(e.target.value)
        setPaginaAtual(1)
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center flex-grow bg-branco_cinza">
                <FiLoader size={50} className="animate-spin text-azul_escuro" />
            </div>
        )
    }

    if (!user || !user.is_super) return null

    return (
        <section className="flex flex-col flex-grow bg-branco_cinza overflow-auto text-azul_escuro p-4 md:p-8">
            <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />

            {/* Header */}
            <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-azul_escuro">Gerenciar Estabelecimentos</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {listaEstabelecimentos.length}{' '}
                        {listaEstabelecimentos.length === 1 ? 'estabelecimento cadastrado' : 'estabelecimentos cadastrados'}
                    </p>
                </div>
                <button
                    onClick={handleAdicionar}
                    className="flex items-center gap-2 px-4 py-2.5 bg-laranja_escuro text-white text-sm rounded-lg shadow hover:bg-laranja_claro transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-laranja_escuro focus:ring-opacity-50"
                >
                    <FiPlus />
                    Adicionar Estabelecimento
                </button>
            </div>

            {/* Search */}
            <div className="relative mb-4">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    value={busca}
                    onChange={handleBusca}
                    placeholder="Buscar por nome, cidade ou responsável..."
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-azul_escuro placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-azul_escuro focus:ring-opacity-30"
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col">
                {dadosFiltrados.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <HiOutlineOfficeBuilding className="mx-auto text-4xl mb-2 opacity-40" />
                        <p className="text-sm">Nenhum estabelecimento encontrado</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto flex-1 min-h-0">
                            <table className="min-w-full text-sm h-full">
                                <thead>
                                    <tr className="bg-azul_escuro bg-opacity-90 text-branco_cinza uppercase text-xs">
                                        <th className="py-3 px-4 text-left font-medium">
                                            <span className="flex items-center gap-1.5">
                                                <HiOutlineOfficeBuilding size={13} /> Nome
                                            </span>
                                        </th>
                                        <th className="py-3 px-4 text-left font-medium">
                                            <span className="flex items-center gap-1.5">
                                                <FiMapPin size={12} /> Cidade
                                            </span>
                                        </th>
                                        <th className="py-3 px-4 text-left font-medium">
                                            <span className="flex items-center gap-1.5">
                                                <FiUser size={12} /> Responsável
                                            </span>
                                        </th>
                                        <th className="py-3 px-4 text-center font-medium rounded-tr-lg">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    <AnimatePresence>
                                        {itensPagina.map((est, i) => (
                                            <motion.tr
                                                key={est.id}
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.03, duration: 0.25 }}
                                                className="hover:bg-gray-50 transition-colors"
                                            >
                                                <td className="py-3 px-4 text-azul_escuro">{est.nome}</td>
                                                <td className="py-3 px-4 text-gray-600">{est.cidade || '—'}</td>
                                                <td className="py-3 px-4 text-gray-600">{est.responsavel || '—'}</td>
                                                <td className="py-3 px-4 text-center">
                                                    <button
                                                        onClick={() => router.push(`/admin/estabelecimento/${est.id}`)}
                                                        title="Visualizar"
                                                        className="transition-colors"
                                                    >
                                                        <FaEye size={22} className="text-azul_escuro hover:text-azul_claro transition-colors" />
                                                    </button>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>

                        <div className="overflow-x-auto px-4 py-4">
                            <PaginacaoAvancada
                                totalItens={dadosFiltrados.length}
                                itensPorPagina={ITENS_POR_PAGINA}
                                paginaAtual={paginaAtual}
                                onMudarPagina={setPaginaAtual}
                            />
                        </div>
                    </>
                )}
            </div>

            <Modal title="Adicionar Novo Estabelecimento" isOpen={adicionando} onClose={cancelar}>
                <Formulario
                    campos={camposEstabelecimentoAdd}
                    dadosIniciais={estabelecimentoSelecionado}
                    onSubmit={adicionarEstabelecimento}
                    onCancel={cancelar}
                />
            </Modal>
        </section>
    )
}
