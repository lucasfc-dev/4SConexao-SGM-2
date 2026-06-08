'use client'
import Tabela from '@/app/components/tabela'
import Formulario from '@/app/components/formulario'
import { useEffect, useState } from 'react'
import { useAuth } from '@/app/context/AuthContext'
import { toast, ToastContainer } from 'react-toastify'
import Modal from '@/app/components/modal'
import 'react-toastify/dist/ReactToastify.css';
import Cookies from 'js-cookie'
import { useTipos } from '../../gestao-de-documentos/context/tiposContext'
const gedUrl = process.env.NEXT_PUBLIC_GED_ENDPOINT_URL

export default function Tipos() {
    const { user } = useAuth()
    const { listaTipos, setListaTipos }= useTipos()
    const [tipoSelecionado, setTipoSelecionado] = useState(null)
    const [editando, setEditando] = useState(false)
    const token = Cookies.get('auth-token')
    const [adicionando, setAdicionando] = useState(false)
    const colunasTipo = [
        { coluna: 'nome', nomeColuna: 'Tipo' },
        { coluna: 'descricao', nomeColuna: 'Descrição' },
    ]

    const camposTipo = [
        { name: 'nome', label: 'Nome', type: 'text', required: true, placeholder: 'Informe o nome do tipo de documento' },
        { name: 'descricao', label: 'Descrição', type: 'text', required: true, placeholder: 'Descreva o tipo de documento' },
    ]


    async function deletarTipo(tipo) {
        if (!confirm('Tem certeza que deseja deletar este tipo de documento?')) return
        try {
            const response = await fetch(`${gedUrl}/tipo/${tipo.id}/`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            if (response.ok){
                const tipoDeletado = await response.json()
                setListaTipos(prevTipos => prevTipos.filter(tipo => tipo.id !== tipoDeletado.id))
                toast.success('Tipo deletado com sucesso!')
            }
            else{
                throw new Error('Erro ao deletar tipo de documento.')
            }
            
        } catch (err) {
            toast.error(err)
        }
    }

    async function editarTipo(tipo) {
        try {
            const response = await fetch(`${gedUrl}/tipo/${tipoSelecionado.id}/`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ...tipo })
            })
            if (response.ok) {
                const tipoAtualizado = await response.json()
                toast.success('Dados do tipo de documento salvos com sucesso.')
                setListaTipos(prevTipos => prevTipos.map(tipo => tipo.id === tipoAtualizado.id ? tipoAtualizado : tipo))
                setEditando(false)
                setTipoSelecionado(null)
            }
            else {
                throw new Error('Erro ao editar tipo de documento')
            }

        } catch (err) {
            toast.error('Erro ao editar tipo de documento')
        }
    }

    async function handleAdicionar() {
        setTipoSelecionado({ id: null, descricao: '', nome: '' })
        setAdicionando(true)
    }

    async function adicionarTipo(tipo) {
        try {
            const response = await fetch(`${gedUrl}/tipo/`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ...tipo })
            })
            if (response.ok) {
                const novoTipo = await response.json()
                toast.success('Tipo de documento cadastrado com sucesso!')
                setListaTipos(prevTipos => [...prevTipos, novoTipo])
                setAdicionando(false)
                setTipoSelecionado(null)
            }

        } catch (err) {
            toast.error('Erro ao adicionar tipo de documento')
        }
    }

    function submit(formData) {
        if (editando) {
            editarTipo(formData)
        } else if (adicionando) {
            adicionarTipo(formData)
        }
    }

    function cancelar() {
        setEditando(false)
        setAdicionando(false)
        setTipoSelecionado(null)
    }


    function handleEditar(tipo) {
        setTipoSelecionado(tipo)
        setEditando(true)
    }

    const acoes = [
        { nome: 'Editar', handler: handleEditar },
        { nome: 'Deletar', handler: deletarTipo }
    ]

    return (
        <section className="flex flex-col flex-grow overflow-auto bg-gradient-to-br from-gray-200 to-gray-300 text-azul_escuro p-4 md:p-8">
            <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
            <div className="mb-6 flex gap-2 justify-between items-center">
                <h1 className="text-xl md:text-3xl font-extrabold min-w-0 truncate">Gerenciar Tipos de Documento</h1>
                <button className="px-4 py-2 bg-azul_escuro text-white rounded-lg shadow hover:bg-azul_claro transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-azul_escuro focus:ring-opacity-50"
                    onClick={handleAdicionar}
                    aria-label="Adicionar Novo Usuário">
                    Adicionar
                </button>
            </div>
            <div className="bg-white p-2 shadow-md rounded-lg overflow-auto">
                <Tabela
                    listaDados={listaTipos}
                    listaColunas={colunasTipo}
                    acoes={acoes}
                />
            </div>

            {(editando || adicionando) && (
                <Modal isOpen={editando || adicionando} onClose={cancelar} title={adicionando ? 'Adicionar Tipo de Documento' : 'Editar Tipo de Documento'}>
                    <Formulario
                        campos={camposTipo}
                        dadosIniciais={editando ? tipoSelecionado : {}}
                        onSubmit={submit}
                        onCancel={cancelar}
                    />
                </Modal>
            )}
        </section>
    )
}
