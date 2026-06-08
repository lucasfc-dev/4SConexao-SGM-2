'use client'

import Tabela from "@/app/components/tabela";
import { useSecao } from "../context/SecaoContext";
import { useAuth } from "@/app/context/AuthContext";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";
import Modal from "@/app/components/modal";
import Formulario from "@/app/components/formulario";
import { usePessoas } from "@/app/context/pessoasContext";
import { FaEdit } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"
import { FiLoader } from "react-icons/fi";


export default function Secoes() {
    const { listaSecoes, setListaSecoes, fetchSecoes, loadingSecoes } = useSecao()
    const acUrl = process.env.NEXT_PUBLIC_AC_ENDPOINT_URL
    const { listaPessoasFisicas, listaPessoasJuridicas } = usePessoas()
    const { user } = useAuth()
    const listaPessoas = [...listaPessoasFisicas, ...listaPessoasJuridicas]
    const [secaoSelecionada, setSecaoSelecionada] = useState(null)
    const [editando, setEditando] = useState(false)
    const [adicionando, setAdicionando] = useState(false)
    const token = Cookies.get('auth-token')

    const acoesSecao = [
        {
            nome: <FaEdit size={28} className="text-green-800 hover:text-green-900 transition-colors" />,
            handler: handleEditar,
        },
        {
            nome: <MdDelete size={28} className="text-red-600 hover:text-red-800 transition-colors" />,
            handler: handleDeletar,
        },
    ]

    const camposSecao = [
        { name: 'nome', label: 'Nome', type: 'text', required: true, placeholder: 'Informe o nome da seção' },
        { name: 'responsavel', label: 'Responsável', type: 'select', required: true, options: listaPessoas },
        { name: 'orgao', label: 'Órgão', type: 'select', required: true, options: user?.orgaos ?? [] },
    ]

    async function handleDeletar(secao) {
        if (!confirm('Tem certeza que deseja deletar esta seção?')) return
        try {
            const response = await fetch(`${acUrl}/secao/${secao.id}/`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            if (response.ok) {
                const secaoDeletada = await response.json()
                setListaSecoes(prevSecoes => prevSecoes.filter(secao => secao.id !== secaoDeletada.id))
                fetchSecoes()
                toast.success('Seção deletada com sucesso!')
            }
            else {
                const jsonError = await response.json()
                toast.error(jsonError.error || jsonError.detail || 'Erro ao deletar seção')
                throw new Error('Erro ao deletar seção.')
            }

        } catch (err) {
            toast.error(err)
        }
    }

    async function editarSecao(secao) {
        try {
            const response = await fetch(`${acUrl}/secao/${secaoSelecionada.id}/`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ...secao })
            })
            if (response.ok) {
                const secaoAtualizada = await response.json()
                toast.success('Dados da seção salvos com sucesso.')
                setListaSecoes(prevSecoes => prevSecoes.map(secao => secao.id === secaoAtualizada.id ? secaoAtualizada : secao))
                await fetchSecoes()
                setEditando(false)
                setSecaoSelecionada(null)
            }
            else {
                const jsonError = await response.json()
                toast.error(jsonError.error || jsonError.detail || 'Erro ao editar seção')
                throw new Error('Erro ao editar seção')
            }

        } catch (err) {
            toast.error('Erro ao editar seção')
        }
    }

    async function handleAdicionar() {
        setSecaoSelecionada({ id: null, responsavel: '', orgao: '' })
        setAdicionando(true)
    }

    async function adicionarSecao(secao) {
        try {
            const response = await fetch(`${acUrl}/secao/`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ...secao })
            })
            if (response.ok) {
                const secaoAdicionada = await response.json()
                setListaSecoes(prevSecoes => [...prevSecoes, secaoAdicionada])
                toast.success('Seção cadastrada com sucesso!')
                await fetchSecoes()
                setAdicionando(false)
                setSecaoSelecionada(null)
            }
            else{
                const jsonError = await response.json()
                toast.error(jsonError.error || jsonError.detail || 'Erro ao adicionar seção')
                throw new Error('Erro ao adicionar seção')
            }
        } catch (err) {
            console.error('Erro ao adicionar seção:', err)
            toast.error('Erro ao adicionar seção')
        }
    }

    function submit(formData) {
        if (editando) {
            editarSecao(formData)
        } else if (adicionando) {
            adicionarSecao(formData)
        }
    }

    function cancelar() {
        setEditando(false)
        setAdicionando(false)
        setSecaoSelecionada(null)
    }


    function handleEditar(secao) {
        setSecaoSelecionada(secao)
        setEditando(true)
    }

    return (
        <section className="flex flex-col flex-grow overflow-auto text-azul_escuro bg-gradient-to-br from-gray-200 to-gray-300 p-4">
            <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
            <div className="flex flex-col w-full mx-auto bg-white shadow-lg rounded-lg p-8">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-xl font-bold mb-6 text-azul_escuro">Gerenciar Seções de Licitação</h1>
                    <button onClick={handleAdicionar} className="bg-azul_escuro text-white px-4 py-2 rounded-md hover:bg-azul_escuro transition-all mb-4">
                        Cadastrar Seção
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white shadow-md rounded-lg">
                        <thead>
                            <tr className="bg-azul_escuro bg-opacity-90  text-branco_cinza uppercase text-sm leading-normal">
                                <th className="py-3 px-6 text-left">Nome</th>
                                <th className="py-3 px-6 text-left">Responsável</th>
                                <th className="py-3 px-6 text-left">Órgão</th>
                                <th className="py-3 px-6 text-center">Ações</th>
                            </tr>
                        </thead>
                        {loadingSecoes ? (
                            <tfoot>
                                <tr>
                                    <td colSpan={6} className="items-center py-3 px-6 text-center">
                                        <div className="flex justify-center items-center">
                                            <FiLoader size={24} className="animate-spin text-4xl text-azul_escuro" />
                                        </div>
                                    </td>
                                </tr>
                            </tfoot>
                        ) : listaSecoes.length === 0 ? (
                            <tbody>
                                <tr>
                                    <td colSpan={4} className="py-3 px-6 text-center">Nenhuma seção cadastrada</td>
                                </tr>
                            </tbody>
                        ) : (
                            <tbody className="text-gray-800 text-sm font-light">
                                {listaSecoes.map((secao) => (
                                    <tr onClick={() => setSecaoSelecionada(secao)} key={secao.id} className="border-b border-gray-200 hover:bg-gray-100">
                                        <td className="py-3 px-6 text-left">{secao.nome}</td>
                                        <td className="py-3 px-6 text-left">{secao.responsavel.nome || secao.responsavel.nome_fantasia}</td>
                                        <td className="py-3 px-6 text-left">{secao.orgao.nome}</td>
                                        <td className="py-3 px-6 text-center">
                                            {acoesSecao.map((acao, index) => (
                                                <button key={index} onClick={() => acao.handler(secao)} className="px-2 py-1 mx-1">
                                                    {acao.nome}
                                                </button>
                                            ))}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        )}
                    </table>
                </div>
            </div>
            <Modal isOpen={editando || adicionando} onClose={cancelar} title={editando ? 'Editar Seção' : 'Adicionar Seção'}>
                <Formulario
                    campos={camposSecao}
                    dadosIniciais={editando ? secaoSelecionada : {}}
                    onSubmit={submit}
                    onCancel={cancelar}
                />
            </Modal>
        </section>
    )
}