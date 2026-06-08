'use client'
import Formulario from "@/app/components/formulario"
import Modal from "@/app/components/modal"
import Tabela from "@/app/components/tabela"
import { useAuth } from "@/app/context/AuthContext"
import Cookies from "js-cookie"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast, ToastContainer } from "react-toastify"
import 'react-toastify/dist/ReactToastify.css'
import { FaEdit, FaEye, FaTrash } from "react-icons/fa"

const gedUrl = process.env.NEXT_PUBLIC_GED_ENDPOINT_URL

export default function GerenciarVereadores() {
    const token = Cookies.get('auth-token')
    const { user } = useAuth()
    const router = useRouter()
    const colunasVereador = [
        { coluna: 'nome', nomeColuna: 'Nome' },
        { coluna: 'nome_campanha', nomeColuna: 'Nome de Campanha' },
        { coluna: 'partido', nomeColuna: 'Partido' },
        { coluna: 'email', nomeColuna: 'E-mail' },
        { coluna: 'telefone', nomeColuna: 'Telefone' },
    ]

    const camposVereadorAdd = [
        { name: 'nome', label: 'Nome completo', type: 'text', required: true, placeholder: 'Informe o nome completo' },
        { name: 'nome_campanha', label: 'Nome de Campanha', type: 'text', required: true, placeholder: 'Digite o nome de campanha' },
        { name: 'partido', label: 'Partido', type: 'text', required: false, placeholder: 'Informe o partido' },
        { name: 'email', label: 'E-mail', type: 'email', required: false, placeholder: 'Digite o e-mail' },
        { name: 'telefone', label: 'Telefone', type: 'text', required: false, placeholder: 'Digite o telefone' },
        { name: 'endereco', label: 'Endereço', type: 'text', required: false, placeholder: 'Informe o endereço' },
        { name: 'inicio_mandato', label: 'Início do Mandato', type: 'date', required: false },
        { name: 'fim_mandato', label: 'Fim do Mandato', type: 'date', required: false },
        { name: 'biografia', label: 'Biografia', type: 'textarea', required: false, placeholder: 'Digite a biografia' },
        { name: 'foto', label: 'Foto', type: 'file', required: false, accept: 'image/*' },
    ]

    const camposVereador = [
        { name: 'nome', label: 'Nome completo', type: 'text', required: true, placeholder: 'Informe o nome completo' },
        { name: 'nome_campanha', label: 'Nome de Campanha', type: 'text', required: true, placeholder: 'Digite o nome de campanha' },
        { name: 'partido', label: 'Partido', type: 'text', required: false, placeholder: 'Informe o partido' },
        { name: 'email', label: 'E-mail', type: 'email', required: false, placeholder: 'Digite o e-mail' },
        { name: 'telefone', label: 'Telefone', type: 'text', required: false, placeholder: 'Digite o telefone' },
        { name: 'endereco', label: 'Endereço', type: 'text', required: false, placeholder: 'Informe o endereço' },
        { name: 'inicio_mandato', label: 'Início do Mandato', type: 'date', required: false },
        { name: 'fim_mandato', label: 'Fim do Mandato', type: 'date', required: false },
        { name: 'biografia', label: 'Biografia', type: 'textarea', required: false, placeholder: 'Digite a biografia' },
        { name: 'foto', label: 'Foto', type: 'file', required: false, accept: 'image/*' },
    ]

    const [vereadores, setVereadores] = useState([])
    const [editando, setEditando] = useState(false)
    const [adicionando, setAdicionando] = useState(false)
    const [visualizando, setVisualizando] = useState(false)
    const [vereadorSelecionado, setVereadorSelecionado] = useState()
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (user.estabelecimento.config.tipo === 'DA CÂMARA MUNICIPAL') {
            async function fetchVereadores() {
                setLoading(true)
                try {
                    const response = await fetch(`${gedUrl}/vereador/`,{
                        headers:{
                            Authorization: `Bearer ${token}`
                        }
                    })
                    const listaVereadores = await response.json()
                    setVereadores(listaVereadores)
                } catch (err) {
                    toast.error('Erro ao obter vereadores')
                } finally {
                    setLoading(false)
                }
            }
            fetchVereadores()
        }
        else(
            router.replace('/dashboard/')
        )
    }, [])

    const handleEditar = (vereador) => {
        setVereadorSelecionado(vereador)
        setEditando(true)
    }

    const handleAdicionar = async () => {
        setVereadorSelecionado({ nome: '', nome_campanha: '', partido: '', email: '', telefone: '', endereco: '', inicio_mandato: '', fim_mandato: '', biografia: '', foto: null })
        setAdicionando(true)
    }

    const handleVisualizar = (vereador) => {
        setVereadorSelecionado(vereador)
        setVisualizando(true)
    }

    const submit = (formData) => {
        if (editando) {
            editarVereador(formData)
        } else if (adicionando) {
            adicionarVereador(formData)
        }
    }

    const cancelar = () => {
        setEditando(false)
        setAdicionando(false)
        setVisualizando(false)
        setVereadorSelecionado(null)
    }

    const adicionarVereador = async (vereador, estabelecimentoId) => {
        try {
            const formData = new FormData()
            formData.append('nome', vereador.nome)
            formData.append('nome_campanha', vereador.nome_campanha)
            
            // Adiciona campos opcionais apenas se preenchidos
            if (vereador.partido) formData.append('partido', vereador.partido)
            if (vereador.email) formData.append('email', vereador.email)
            if (vereador.telefone) formData.append('telefone', vereador.telefone)
            if (vereador.endereco) formData.append('endereco', vereador.endereco)
            if (vereador.inicio_mandato) formData.append('inicio_mandato', vereador.inicio_mandato)
            if (vereador.fim_mandato) formData.append('fim_mandato', vereador.fim_mandato)
            if (vereador.biografia) formData.append('biografia', vereador.biografia)
            if (vereador.foto) formData.append('foto', vereador.foto)

            const response = await fetch(`${gedUrl}/vereador/`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData
            })
            if (response.ok) {
                const novoVereador = await response.json()
                setVereadores(prevVereadores => [...prevVereadores, novoVereador])
                setAdicionando(false)
                setVereadorSelecionado(null)
                toast.success('Vereador cadastrado com sucesso!')
            }
            else {
                throw new Error(response.detail)
            }
        }
        catch (error) {
            toast.error(`Erro ao adicionar vereador, ${error}`)
        }
    }

    const removerVereador = async (vereador) => {
        try {
            const response = await fetch(`${gedUrl}/vereador/${vereador.id}/`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`
                },
            })
            if (response.ok) {
                setVereadores(prevVereadores => prevVereadores.filter(v => v.id !== vereador.id))
                toast.success('Vereador deletado com sucesso')
            }
            else {
                throw new Error(response.statusText)
            }
        }
        catch (error) {
            toast.error(`Erro ao remover vereador: ${error}`)
        }
    }


    const editarVereador = async (vereador) => {
        try {
            // Se há foto nova, usa endpoint separado para atualizar foto
            if (vereador.foto && vereador.foto instanceof File) {
                const formDataFoto = new FormData()
                formDataFoto.append('foto', vereador.foto)
                
                const responseFoto = await fetch(`${gedUrl}/vereador/${vereadorSelecionado.id}/foto/`, {
                    method: 'PUT',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formDataFoto
                })
                
                if (!responseFoto.ok) {
                    throw new Error('Erro ao atualizar foto do vereador')
                }
            }
            
            // Atualiza os demais campos (exceto foto)
            const { foto, ...dadosVereador } = vereador
            const response = await fetch(`${gedUrl}/vereador/${vereadorSelecionado.id}/`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-type':'application/json'
                },
                body: JSON.stringify(dadosVereador)
            })
            if (response.ok) {
                const vereadorAtualizado = await response.json()
                setVereadores(prevVereadores => prevVereadores.map(v => v.id === vereadorAtualizado.id ? vereadorAtualizado : v))
                setEditando(false)
                setVereadorSelecionado(null)
                toast.success('Dados do vereador salvos com sucesso.')
            }
            else {
                throw new Error(response.statusText)
            }
        }
        catch (error) {
            toast.error(`Erro ao atualizar dados do vereador: ${error}`)
        }
    }

    return (
        
        <section className="flex flex-col flex-grow overflow-auto bg-gradient-to-br from-gray-200 to-gray-300 text-azul_escuro p-4 md:p-8">
            <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
            <div className="mb-6 flex gap-2 justify-between items-center">
                <h1 className="text-xl md:text-3xl font-extrabold">Gerenciar Vereadores</h1>
                <button className="px-4 py-2 bg-azul_escuro text-white rounded-lg shadow hover:bg-azul_claro transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-azul_escuro focus:ring-opacity-50"
                    onClick={handleAdicionar}
                    aria-label="Adicionar novo vereador">
                    Adicionar
                </button>
            </div>
            <div className="bg-white p-2 shadow-md rounded-lg overflow-auto">
                {vereadores.length === 0 ?
                <p className="te">Não existem vereadores cadastrados neste estabelecimento</p>
                : loading ? (
                    <div className="p-4 text-center">Carregando vereadores...</div>
                ) : (
                    <Tabela
                        listaDados={vereadores}
                        listaColunas={colunasVereador}
                        acoes={[
                            { nome: <FaEye size={20} className="text-azul_escuro hover:text-blue-600 transition-colors" />, handler: (vereador) => handleVisualizar(vereador) },
                            { nome: <FaEdit size={20} className="text-green-700 hover:text-green-900 transition-colors" />, handler: (vereador) => handleEditar(vereador) },
                            { nome: <FaTrash size={20} className="text-red-600 hover:text-red-800 transition-colors" />, handler: (vereador) => removerVereador(vereador) }
                        ]}
                    />
                )}
            </div>
                <Modal isOpen={editando || adicionando} onClose={cancelar} title={editando ? 'Editar Vereador' : 'Adicionar Vereador'}>
                    <Formulario
                        campos={editando ? camposVereador : camposVereadorAdd}
                        dadosIniciais={editando ? vereadorSelecionado : {}}
                        onSubmit={submit}
                        onCancel={cancelar}
                        titulo={editando ? 'Editar vereador' : 'Adicionar vereador'}
                    />
                </Modal>

                <Modal isOpen={visualizando} onClose={cancelar} title="Detalhes do Vereador">
                    {vereadorSelecionado && (
                        <div className="flex flex-col gap-6 p-6 overflow-y-auto max-h-[70vh]">
                            {/* Foto */}
                            <div className="flex justify-center mb-4">
                                <div className="relative">
                                    <img
                                        src={`${gedUrl}/vereador/${vereadorSelecionado.id}/foto/`}
                                        alt={`Foto de ${vereadorSelecionado.nome}`}
                                        className="w-48 h-48 rounded-full object-cover border-4 border-azul_escuro shadow-xl"
                                        onError={(e) => {
                                            e.target.onerror = null
                                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23e5e7eb" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="48" fill="%239ca3af"%3ESem foto%3C/text%3E%3C/svg%3E'
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Informações em Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                                    <label className="block font-medium text-gray-600 mb-1">Nome Completo</label>
                                    <p className="text-azul_escuro">{vereadorSelecionado.nome || '-'}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                                    <label className="block font-medium text-gray-600 mb-1">Nome de Campanha</label>
                                    <p className="text-azul_escuro">{vereadorSelecionado.nome_campanha || '-'}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                                    <label className="block font-medium text-gray-600 mb-1">Partido</label>
                                    <p className="text-azul_escuro">{vereadorSelecionado.partido || '-'}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                                    <label className="block font-medium text-gray-600 mb-1">E-mail</label>
                                    <p className="text-azul_escuro break-all">{vereadorSelecionado.email || '-'}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                                    <label className="block font-medium text-gray-600 mb-1">Telefone</label>
                                    <p className="text-azul_escuro">{vereadorSelecionado.telefone || '-'}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                                    <label className="block font-medium text-gray-600 mb-1">Endereço</label>
                                    <p className="text-azul_escuro">{vereadorSelecionado.endereco || '-'}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                                    <label className="block font-medium text-gray-600 mb-1">Início do Mandato</label>
                                    <p className="text-azul_escuro">{vereadorSelecionado.inicio_mandato ? vereadorSelecionado.inicio_mandato.split('-').reverse().join('/') : '-'}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                                    <label className="block font-medium text-gray-600 mb-1">Fim do Mandato</label>
                                    <p className="text-azul_escuro">{vereadorSelecionado.fim_mandato ? vereadorSelecionado.fim_mandato.split('-').reverse().join('/') : '-'}</p>
                                </div>
                            </div>

                            {/* Biografia */}
                            <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                                <label className="block font-medium text-gray-600 mb-2">Biografia</label>
                                <p className="text-azul_escuro whitespace-pre-wrap">
                                    {vereadorSelecionado.biografia || 'Nenhuma biografia cadastrada.'}
                                </p>
                            </div>

                            {/* Botão Fechar */}
                            <div className="flex justify-end mt-2">
                                <button
                                    onClick={cancelar}
                                    className="px-6 py-3 bg-azul_escuro text-white font-semibold rounded-lg shadow-md hover:bg-azul_claro transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-azul_escuro focus:ring-opacity-50"
                                >
                                    Fechar
                                </button>
                            </div>
                        </div>
                    )}
                </Modal>
        </section>
    )
}