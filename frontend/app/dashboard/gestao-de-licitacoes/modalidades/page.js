'use client'
import Tabela from "@/app/components/tabela"
import { useModalidades } from "../context/ModalidadesContext"
import { FaEdit } from "react-icons/fa"
import { useEffect, useState } from "react"
import { toast, ToastContainer } from "react-toastify"
import Modal from "@/app/components/modal"
import Formulario from "@/app/components/formulario"
import Cookies from "js-cookie"
import { MdDelete } from "react-icons/md"
import { FiLoader } from "react-icons/fi"

export default function Modalidades() {
    const acUrl = process.env.NEXT_PUBLIC_AC_ENDPOINT_URL
    const { listaModalidades, setListaModalidades, loadingModalidades } = useModalidades()
    const [editando, setEditando] = useState()
    const [adicionando, setAdicionando] = useState()
    const [modalidadeSelecionada, setModalidadeSelecionada] = useState(null)
    const token = Cookies.get('auth-token')

    const acoesModalidades = [
        {
            nome: <FaEdit size={28} className="text-green-800 hover:text-green-900 transition-colors" />,
            handler: handleEditar,
        },
        {
            nome: <MdDelete size={28} className="text-red-600 hover:text-red-800 transition-colors" />,
            handler: handleDeletar,
        },
    ]

    const listaColunasModalidades = [
        { nomeColuna: 'Nome', coluna: 'nome' },
        { nomeColuna: 'Observação', coluna: 'observacao' },
    ]


    const camposModalidade = [
        { name: 'nome', label: 'Nome', type: 'text', required: true, placeholder: 'Informe o nome da modalidade' },
        { name: 'observacao', label: 'Observação', type: 'text', required: true, placeholder: 'Descreva a modalidade' },
    ]


    async function handleDeletar(modalidade) {
        if (!confirm('Tem certeza que deseja deletar esta modalidade?')) return
        try {
            const response = await fetch(`${acUrl}/modalidade/${modalidade.id}/`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            if (response.ok) {
                const modalidadeDeletada = await response.json()
                setListaModalidades(prevModalidades => prevModalidades.filter(modalidade => modalidade.id !== modalidadeDeletada.id))
                toast.success('Modalidade deletada com sucesso!')
            }
            else {
                const jsonError = await response.json()
                toast.error(jsonError.error || jsonError.detail || 'Erro ao deletar modalidade')
                throw new Error('Erro ao deletar modalidade')
            }

        } catch (err) {
            toast.error('Erro ao deletar modalidade')
            throw new Error(err.message)
        }
    }

    async function editarModalidade(modalidade) {
        try {
            const response = await fetch(`${acUrl}/modalidade/${modalidadeSelecionada.id}/`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ...modalidade })
            })
            if (response.ok) {
                const modalidadeAtualizada = await response.json()
                toast.success('Dados da modalidade salvos com sucesso.')
                setListaModalidades(prevModalidades => prevModalidades.map(modalidade => modalidade.id === modalidadeAtualizada.id ? modalidadeAtualizada : modalidade))
                setEditando(false)
                setModalidadeSelecionada(null)
            }
            else {
                const jsonError = await response.json()
                toast.error(jsonError.error || jsonError.detail || 'Erro ao editar modalidade')
                throw new Error('Erro ao editar modalidade')
            }

        } catch (err) {
            toast.error('Erro ao editar modalidade')
            throw new Error(err.message)
        }
    }

    async function handleAdicionar() {
        setModalidadeSelecionada({ id: null, observacao: '', nome: '' })
        setAdicionando(true)
    }

    async function adicionarModalidade(modalidade) {
        try {
            const response = await fetch(`${acUrl}/modalidade/`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ...modalidade })
            })
            if (response.ok) {
                const novaModalidade = await response.json()
                toast.success('Modalidade cadastrada com sucesso!')
                setListaModalidades(prevModalidades => [...prevModalidades, novaModalidade])
                setAdicionando(false)
                setModalidadeSelecionada(null)
            }
            else {
                const jsonError = await response.json()
                toast.error(jsonError.error || jsonError.detail || 'Erro ao adicionar modalidade')
                throw new Error('Erro ao adicionar modalidade')
            }
        } catch (err) {
            toast.error('Erro ao adicionar modalidade')
            throw new Error(err.message)
        }
    }

    function submit(formData) {
        if (editando) {
            editarModalidade(formData)
        } else if (adicionando) {
            adicionarModalidade(formData)
        }
    }

    function cancelar() {
        setEditando(false)
        setAdicionando(false)
        setModalidadeSelecionada(null)
    }


    function handleEditar(modalidade) {
        setModalidadeSelecionada(modalidade)
        setEditando(true)
    }



    return (
        <section className="flex flex-col flex-grow overflow-auto text-azul_escuro bg-gradient-to-br from-gray-200 to-gray-300 p-4">
            <ToastContainer />
            <div className="flex flex-col w-full mx-auto bg-white shadow-lg rounded-lg p-8">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-xl font-bold mb-6 text-azul_escuro">Gerenciar Modalidades</h1>
                    <button onClick={handleAdicionar} className="bg-azul_escuro text-white px-4 py-2 rounded-md hover:bg-azul_escuro transition-all mb-4">
                        Cadastrar Modalidade
                    </button>
                </div>
                {loadingModalidades ? (
                    <div>
                        <div colSpan={6} className="items-center py-3 px-6 text-center">
                            <div className="flex justify-center items-center">
                                <FiLoader size={24} className="animate-spin text-4xl text-azul_escuro" />
                            </div>
                        </div>
                    </div>
                )
                    : listaModalidades.length === 0 ?
                        (
                            <div className="flex items-center justify-center h-full">
                                <p className="">Nenhuma modalidade cadastrada</p>
                            </div>
                        ) : (
                            <Tabela listaDados={listaModalidades} acoes={acoesModalidades} listaColunas={listaColunasModalidades} />

                        )}
            </div>
            <Modal isOpen={editando || adicionando} onClose={cancelar} title={editando ? 'Editar Modalidade' : 'Adicionar Modalidade'}>
                <Formulario
                    campos={camposModalidade}
                    dadosIniciais={editando ? modalidadeSelecionada : {}}
                    onSubmit={submit}
                    onCancel={cancelar}
                />
            </Modal>
        </section>
    );
}