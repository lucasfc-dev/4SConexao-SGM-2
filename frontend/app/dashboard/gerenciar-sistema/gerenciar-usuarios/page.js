'use client'
import { apiUsuarios } from '@/app/api/apiUsuarios'
import Formulario from '@/app/components/formulario'
import Modal from '@/app/components/modal'
import Tabela from '@/app/components/tabela'
import { useAuth } from '@/app/context/AuthContext'
import { useEffect, useState } from 'react'
import { toast, ToastContainer } from "react-toastify"
import 'react-toastify/dist/ReactToastify.css'

export default function GerenciarUsuarios() {
    const { user } = useAuth()
    const [usuarios, setUsuarios] = useState([])
    const [usuarioSelecionado, setUsuarioSelecionado] = useState(null)
    const [editando, setEditando] = useState(false)
    const [adicionando, setAdicionando] = useState(false)
    const [carregando, setCarregando] = useState(false)

    const colunasUsuario = [
        { coluna: 'username', nomeColuna: 'Nome de Usuário' },
        { coluna: 'email', nomeColuna: 'Email' },
        { coluna: 'cpf', nomeColuna: 'CPF' },
    ]

    const camposUsuarioAdd = [
        { name: 'nome', label: 'Nome completo', type: 'text', required: true, placeholder: 'Informe seu nome completo' },
        { name: 'username', label: 'Nome de usuário', type: 'text', required: true, placeholder: 'Digite o nome do usuário' },
        { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'Digite o email' },
        { name: 'cargo', label: 'Cargo (publicação)', type: 'text', required: true, placeholder: 'Ex: Secretário Municipal' },
        { name: 'password', label: 'Senha', type: 'password', required: true, placeholder: 'Digite a senha' },
        { name: 'cpf', label: 'CPF', type: 'cpf', required: true, placeholder: 'Digite seu CPF' }
    ]

    const camposUsuarioEditar = [
        { name: 'nome', label: 'Nome completo', type: 'text', required: true, placeholder: 'Informe seu nome completo' },
        { name: 'username', label: 'Nome de usuário', type: 'text', required: true, placeholder: 'Digite o nome do usuário' },
        { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'Digite o email' },
        { name: 'cargo', label: 'Cargo (publicação)', type: 'text', required: true, placeholder: 'Ex: Secretário Municipal' },
        { name: 'cpf', label: 'CPF', type: 'cpf', required: true, placeholder: 'Digite seu CPF' },
    ]

    useEffect(() => {
        async function fetchUsuarios() {
            setCarregando(true)
            try {
                const listaUsuarios = await apiUsuarios.getAll()
                setUsuarios(listaUsuarios)
            } catch (err) {
                toast.error('Erro ao obter usuários')
            } finally {
                setCarregando(false)
            }
        }
        fetchUsuarios()
    }, [])

    async function deletarUsuario(usuarioDeletado) {
        if (!confirm('Tem certeza que deseja deletar este usuário?')) return
        try {
            await apiUsuarios.delete(usuarioDeletado.id)
            setUsuarios(prevUsuarios => prevUsuarios.filter(usuario => usuario.id !== usuarioDeletado.id))
            toast.success('Usuário deletado com sucesso')
        } catch (err) {
            toast.error(err)
        }
    }

    async function editarUsuario(usuario) {
        try {
            const usuarioAtualizado = await apiUsuarios.update(usuario, usuarioSelecionado.id)
            toast.success('Dados do usuário salvos com sucesso.')
            setUsuarios(prevUsuarios => prevUsuarios.map(u => u.id === usuarioAtualizado.id ? usuarioAtualizado : u))
            setEditando(false)
            setUsuarioSelecionado(null)
        } catch (err) {
            toast.error(err)
        }
    }

    async function handleAdicionar() {
        setUsuarioSelecionado({ id: null, nome: '', username: '', email: '', password: '', cpf: '', cargo: '' })
        setAdicionando(true)
    }

    async function adicionarUsuario(usuario) {
        try {
            const novoUsuario = await apiUsuarios.add(usuario, user.estabelecimento.id)
            toast.success('Usuário cadastrado com sucesso!')
            setUsuarios(prevUsuarios => [...prevUsuarios, novoUsuario])
            setAdicionando(false)
            setUsuarioSelecionado(null)
        } catch (err) {
            toast.error(err)
        }
    }

    function submit(formData) {
        if (editando) {
            editarUsuario(formData)
        } else if (adicionando) {
            adicionarUsuario(formData)
        }
    }

    function cancelar() {
        setEditando(false)
        setAdicionando(false)
        setUsuarioSelecionado(null)
    }


    function handleEditar(usuario) {
        setUsuarioSelecionado(usuario)
        setEditando(true)
    }

    const acoes = [
        { nome: 'Editar', handler: handleEditar },
        { nome: 'Deletar', handler: deletarUsuario }
    ]

    return (
        <section className="flex flex-col flex-grow overflow-auto bg-gradient-to-br from-gray-200 to-gray-300 text-azul_escuro p-4 md:p-8">
            <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
            <div className="mb-6 flex gap-2 justify-between items-center">
                <h1 className="text-xl md:text-3xl font-extrabold">Gerenciar Usuários</h1>
                <button className="px-4 py-2 bg-azul_escuro text-white rounded-lg shadow hover:bg-azul_claro transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-azul_escuro focus:ring-opacity-50"
                    onClick={handleAdicionar}
                    aria-label="Adicionar Novo Usuário">
                    Adicionar
                </button>
            </div>
            <div className="bg-white p-2 shadow-md rounded-lg overflow-auto">
                {carregando ? (
                    <div className="p-4 text-center">Carregando usuários...</div>
                ) : (
                    <Tabela
                        listaDados={usuarios}
                        listaColunas={colunasUsuario}
                        acoes={acoes}
                    />
                )}
            </div>
            <Modal isOpen={adicionando || editando} onClose={cancelar} title={adicionando && 'Adicionar novo usuário' || editando && 'Editar usuário'}>
                <Formulario
                    campos={editando ? camposUsuarioEditar : camposUsuarioAdd}
                    dadosIniciais={editando ? usuarioSelecionado : {}}
                    onSubmit={submit}
                    onCancel={cancelar}
                    titulo={editando ? 'Editar Usuário' : 'Adicionar Novo Usuário'}
                />
            </Modal>
        </section>
    )
}
