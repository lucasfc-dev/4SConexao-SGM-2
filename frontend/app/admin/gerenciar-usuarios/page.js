'use client';

import Formulario from "@/app/components/formulario";
import Modal from "@/app/components/modal";
import { useAuth } from "@/app/context/AuthContext";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { motion, AnimatePresence } from "framer-motion";
import { FiLoader, FiChevronDown, FiChevronUp, FiUserPlus, FiUsers, FiUser, FiSearch, FiShield } from "react-icons/fi";
import { FaEdit, FaEye } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { HiOutlineOfficeBuilding } from "react-icons/hi";



const camposUsuario = [
    { name: 'nome', label: 'Nome completo', type: 'text', required: true, placeholder: 'Informe seu nome completo' },
    { name: 'username', label: 'Nome de usuário', type: 'text', required: true, placeholder: 'Digite o nome do usuário' },
    { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'Digite o email' },
    { name: 'cargo', label: 'Cargo (publicação)', type: 'text', required: true, placeholder: 'Ex: Secretário Municipal' },
    { name: 'password', label: 'Senha', type: 'password', required: true, placeholder: 'Digite a senha' },
    { name: 'cpf', label: 'CPF', type: 'cpf', required: true, placeholder: 'Digite seu CPF' }
];

const authUrl = process.env.NEXT_PUBLIC_AUTH_ENDPOINT_URL


export default function GerenciarUsuarios() {
    const [tabelaAberta, setTabelaAberta] = useState({})
    const [data, setData] = useState([])
    const [busca, setBusca] = useState('')
    const [adicionando, setAdicionando] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isAdding, setIsAdding] = useState(false)
    const [isDeleting, setIsDeleting] = useState({})
    const { user } = useAuth()
    const token = Cookies.get('auth-token')

    useEffect(() => {
        if (user && user.is_super) {
            async function fetchData() {
                setIsLoading(true)
                try {
                    const conexao = await fetch(`${authUrl}/estabelecimento/all/users/`, {
                        method: 'GET',
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    })
                    if (!conexao.ok) {
                        const errorData = await conexao.json()
                        throw new Error(errorData.detail)
                    }
                    const dados = await conexao.json()
                    setData(dados)
                } catch (error) {
                    console.error(error.message)
                } finally {
                    setIsLoading(false)
                }
            }
            fetchData()
        }
    }, [user, token])

    function mostrarUsuarios(estabelecimentoId) {
        setTabelaAberta(prevState => ({
            ...prevState,
            [estabelecimentoId]: !prevState[estabelecimentoId]
        }));
    }

    function abrirAdicionarUsuario(estabelecimentoId) {
        setAdicionando(estabelecimentoId);
    }

    function fecharAdicionarUsuario() {
        setAdicionando(null)
    }

    async function handleAdicionarUsuario(estabelecimento_id, usuario) {
        setIsAdding(true)
        try {
            const response = await fetch(`${authUrl}/user/`, {
                method: 'POST',
                headers: {
                    'Content-type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    username: usuario.username,
                    email: usuario.email,
                    cpf: usuario.cpf,
                    nome: usuario.nome,
                    cargo: usuario.cargo || null,
                    password: usuario.password,
                    is_admin: true,
                    is_super: false,
                    estabelecimento: estabelecimento_id
                })
            })

            if (response.status === 400) {
                const erro = await response.json()
                toast.error(erro.detail)
                throw new Error(erro.detail)
            } else if (response.status === 422) {
                toast.error('Formato de senha inválido')
                throw new Error('Formato de senha inválido')
            } else if (response.status === 500) {
                toast.error('CPF inválido')
                throw new Error('CPF inválido')
            }

            const usuarioCadastrado = await response.json()

            const resetResponse = await fetch(`${authUrl}/user/password_reset/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email_address: usuario.email
                })
            })

            if (resetResponse.ok) {
                setData(prevData => prevData.map(estabelecimento => {
                    if (estabelecimento.estabelecimento.id === estabelecimento_id) {
                        return {
                            ...estabelecimento,
                            users: [...estabelecimento.users, usuarioCadastrado]
                        }
                    }
                    return estabelecimento
                }))
                fecharAdicionarUsuario()
                toast.success('Usuário adicionado com sucesso!')
            } else {
                toast.error('Erro ao enviar e-mail de reset de senha')
                throw new Error('Erro ao enviar e-mail de reset de senha')
            }
        } catch (error) {
            console.error(error)
        } finally {
            setIsAdding(false)
        }
    }

    function editarUsuario(usuarioId) {
        window.location.href = `/admin/gerenciar-usuarios/${usuarioId}`
    }


    async function deletarUsuario(estabelecimentoId, usuario) {
        const confirmacao = confirm("Tem certeza que deseja deletar este usuário?");
        if (!confirmacao) return;
        setIsDeleting(prev => ({ ...prev, [usuario.id]: true }));
        try {
            const resposta = await fetch(`${authUrl}/user/${usuario.id}/`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            })
            if (!resposta.ok) {
                const errorData = await resposta.json()
                throw new Error(errorData.detail)
            }

            setData(prevData => prevData.map(estabelecimento => {
                if (estabelecimento.estabelecimento.id === estabelecimentoId) {
                    return {
                        ...estabelecimento,
                        users: estabelecimento.users.filter(user => user.id !== usuario.id)
                    }
                }
                return estabelecimento;
            }));
            toast.success("Usuário deletado com sucesso.")
        } catch (error) {
            console.error(error);
            toast.error(error.message)
        } finally {
            setIsDeleting(prev => ({ ...prev, [usuario.id]: false }))
        }
    }

    const dadosFiltrados = data.filter(est =>
        est.estabelecimento?.nome?.toLowerCase().includes(busca.toLowerCase())
    )

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: (i) => ({
            opacity: 1,
            y: 0,
            transition: { delay: i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }
        })
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-branco_cinza">
                <FiLoader size={50} className="animate-spin text-azul_escuro" />
            </div>
        )
    }

    if (!user || !user.is_super) {
        return null
    }

    return (
        <section className="flex flex-col flex-grow bg-branco_cinza overflow-auto text-azul_escuro p-4 md:p-8">
            <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />

            {/* Header */}
            <div className="mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-extrabold text-azul_escuro">Gerenciar Usuários</h1>
                <p className="text-sm text-gray-500 mt-1">Visualize e gerencie os usuários de cada estabelecimento</p>
            </div>


            {/* Search */}
            {data.length > 3 && (
                <div className="relative mb-4">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={busca}
                        onChange={e => setBusca(e.target.value)}
                        placeholder="Buscar estabelecimento..."
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-azul_escuro placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-azul_escuro focus:ring-opacity-30"
                    />
                </div>
            )}

            {/* Establishment Cards */}
            <div className="flex flex-col gap-4">
                {dadosFiltrados.length === 0 && (
                    <div className="text-center py-10 text-gray-400">
                        <FiSearch className="mx-auto text-3xl mb-2 opacity-40" />
                        <p className="text-sm">Nenhum estabelecimento encontrado</p>
                    </div>
                )}
                {dadosFiltrados.map((estabelecimento, i) => {
                    const estId = estabelecimento.estabelecimento.id
                    const aberto = !!tabelaAberta[estId]

                    return (
                        <motion.div
                            key={estId}
                            custom={i}
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            className="bg-white rounded-xl shadow-md overflow-hidden border-l-4 border-laranja_escuro"
                        >
                            {/* Card Header */}
                            <div className="flex flex-wrap items-center justify-between gap-3 p-4 md:p-5">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="bg-azul_escuro bg-opacity-10 rounded-lg p-2 shrink-0">
                                        <HiOutlineOfficeBuilding className="text-xl text-azul_escuro" />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-base md:text-lg font-bold text-azul_escuro truncate max-w-xs md:max-w-md">
                                            {estabelecimento.estabelecimento.nome}
                                        </h2>
                                        <p className="text-xs text-gray-400">
                                            {estabelecimento.users.length}{' '}
                                            {estabelecimento.users.length === 1 ? 'usuário' : 'usuários'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => abrirAdicionarUsuario(estId)}
                                        className="flex items-center gap-1.5 px-3 md:px-4 py-2 bg-laranja_escuro text-white text-sm rounded-lg shadow hover:bg-laranja_claro transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-laranja_escuro focus:ring-opacity-50"
                                    >
                                        <FiUserPlus className="text-sm" />
                                        <span className="hidden sm:inline">Adicionar Usuário</span>
                                        <span className="sm:hidden">Adicionar</span>
                                    </button>
                                    <button
                                        onClick={() => mostrarUsuarios(estId)}
                                        className="flex items-center gap-1.5 px-3 md:px-4 py-2 border-2 border-azul_escuro text-azul_escuro text-sm rounded-lg hover:bg-azul_escuro hover:text-white transition-colors duration-300 focus:outline-none"
                                    >
                                        {aberto ? <FiChevronUp /> : <FiChevronDown />}
                                        <span className="hidden sm:inline">{aberto ? 'Ocultar' : 'Ver Usuários'}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Users Table */}
                            <AnimatePresence>
                                {aberto && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                                        className="overflow-hidden border-t border-gray-100"
                                    >
                                        <div className="p-4 md:p-5">
                                            {estabelecimento.users.length === 0 ? (
                                                <div className="text-center py-6 text-gray-400">
                                                    <FiUsers className="mx-auto text-3xl mb-2 opacity-40" />
                                                    <p className="text-sm">Nenhum usuário cadastrado</p>
                                                </div>
                                            ) : (
                                                <div className="overflow-x-auto">
                                                    <table className="min-w-full text-sm">
                                                        <thead>
                                                            <tr className="bg-azul_escuro bg-opacity-90 text-branco_cinza uppercase text-xs">
                                                                <th className="py-2 px-4 text-left font-medium rounded-tl-lg">Usuário</th>
                                                                <th className="py-2 px-4 text-left font-medium">Email</th>
                                                                <th className="py-2 px-4 text-left font-medium">Perfil</th>
                                                                <th className="py-2 px-4 text-left font-medium rounded-tr-lg">Ações</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100">
                                                            {estabelecimento.users.map((usuario, idx) => (
                                                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                                    <td className="py-2.5 px-4 font-medium text-azul_escuro">{usuario.username}</td>
                                                                    <td className="py-2.5 px-4 text-gray-600">{usuario.email}</td>
                                                                    <td className="py-2.5 px-4">
                                                                        {usuario.is_admin ? (
                                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-azul_escuro bg-opacity-10 text-azul_escuro">
                                                                                <FiShield className="text-xs" /> Admin
                                                                            </span>
                                                                        ) : (
                                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                                                                                <FiUser className="text-xs" /> Usuário
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    <td className="py-2.5 px-4">
                                                                        <div className="flex items-center gap-2">
                                                                            <button
                                                                                onClick={() => editarUsuario(usuario.id)}
                                                                                title="Editar"
                                                                                className="transition-colors"
                                                                            >
                                                                                <FaEye size={22} className="text-azul-escuro hover:text-azul_escuro/90 transition-colors" />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => deletarUsuario(estId, usuario)}
                                                                                title="Deletar"
                                                                                disabled={isDeleting[usuario.id]}
                                                                                className="transition-colors disabled:opacity-40"
                                                                            >
                                                                                {isDeleting[usuario.id]
                                                                                    ? <FiLoader size={20} className="animate-spin text-red-600" />
                                                                                    : <MdDelete size={22} className="text-red-600 hover:text-red-800 transition-colors" />}
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Modal */}
                            <Modal
                                title={`Adicionar novo usuário em ${estabelecimento.estabelecimento.nome}`}
                                isOpen={adicionando === estId}
                                onClose={fecharAdicionarUsuario}
                            >
                                <div className="p-4 overflow-auto">
                                    <Formulario
                                        dadosIniciais={{ username: '', estabelecimentoId: estId }}
                                        onSubmit={(novoUsuario) => handleAdicionarUsuario(estId, novoUsuario)}
                                        campos={camposUsuario}
                                        onCancel={fecharAdicionarUsuario}
                                    />
                                    {isAdding && (
                                        <div className="flex justify-center items-center mt-4">
                                            <FiLoader className="w-8 h-8 animate-spin text-azul_escuro" />
                                        </div>
                                    )}
                                </div>
                            </Modal>
                        </motion.div>
                    )
                })}
            </div>
        </section>
    )
}
