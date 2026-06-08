
'use client'
import { useComissoes } from "../context/ComissoesContext"
import { FaEdit, FaPlus, FaUsers } from "react-icons/fa"
import { useState, useEffect } from "react"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import Formulario from "@/app/components/formulario"
import Cookies from "js-cookie"
import { MdDelete } from "react-icons/md"
import Modal from "@/app/components/modal"
import { FiLoader } from "react-icons/fi"

export default function GerenciarComissoes() {
    const acUrl = process.env.NEXT_PUBLIC_AC_ENDPOINT_URL
    const { listaComissoes, setListaComissoes, loadingComissoes } = useComissoes()
    const [editando, setEditando] = useState()
    const [adicionando, setAdicionando] = useState()
    const [comissaoSelecionada, setComissaoSelecionada] = useState(null)
    const [mostrandoMembros, setMostrandoMembros] = useState(false)
    const [adicionandoMembro, setAdicionandoMembro] = useState(false)
    const [membros, setMembros] = useState([])
    const [pessoas, setPessoas] = useState([])
    const [loadingMembros, setLoadingMembros] = useState(false)
    const [loadingPessoas, setLoadingPessoas] = useState(false)
    const token = Cookies.get('auth-token')

    const acoesComissoes = [
        {
            nome: <FaUsers size={28} className="text-blue-600 hover:text-blue-800 transition-colors" />,
            handler: handleVerMembros,
            tooltip: "Ver membros"
        },
        {
            nome: <FaEdit size={28} className="text-green-800 hover:text-green-900 transition-colors" />,
            handler: handleEditar,
            tooltip: "Editar"
        },
        {
            nome: <MdDelete size={28} className="text-red-600 hover:text-red-800 transition-colors" />,
            handler: handleDeletar,
            tooltip: "Deletar"
        },
    ]

    const listaColunasComissoes = [
        { nomeColuna: 'Nome', coluna: 'nome' },
        { nomeColuna: 'Descrição', coluna: 'descricao' },
    ]

    const camposComissao = [
        { name: 'vigencia_inicio', label: 'Vigência Inicial', type: 'date', required: true, placeholder: 'Data de início da vigência' },
        { name: 'vigencia_fim', label: 'Vigência Final', type: 'date', required: true, placeholder: 'Data de fim da vigência' },
        { name: 'tipo_comissao', label: 'Tipo de comissão', type: 'select', required: true, options: [{ id: 'Especial', nome: 'Especial' }, { id: 'Permanente', nome: 'Permanente' }] },
        { name: 'tipo_ato', label: 'Tipo de ato', type: 'select', required: true, options: [{ id: 'Decreto', nome: 'Decreto' }, { id: 'Portaria', nome: 'Portaria' }] },
        { name: 'data_ato', label: 'Data do ato', type: 'date', required: true, placeholder: 'Data do ato' },
        { name: 'numero_ato', label: 'Número do ato', type: 'number', required: true, placeholder: 'Informe o número do ato' },
        { name: 'finalidade', label: 'Finalidade', type: 'text', required: true, placeholder: 'Descreva a finalidade da comissão' },
    ]

    const camposMembro = [
        { name: 'pessoa', label: 'Pessoa', type: 'select', required: true, options: pessoas.map(p => ({ id: p.pessoa_id, nome: p.nome || p.razao_social })) },
        { name: 'atribuicao', label: 'Atribuição', type: 'text', required: true, placeholder: 'Ex: Presidente, Secretário, Membro' },
        { name: 'cargo', label: 'Cargo', type: 'text', required: true, placeholder: 'Cargo da pessoa' },
        { name: 'natureza_cargo', label: 'Natureza do Cargo', type: 'text', required: false, placeholder: 'Natureza do cargo (opcional)' },
        { name: 'ato_pessoal', label: 'Ato Pessoal', type: 'text', required: true, placeholder: 'Ato de nomeação' },
        { name: 'vigencia_inicial', label: 'Vigência Inicial', type: 'date', required: true },
        { name: 'vigencia_final', label: 'Vigência Final', type: 'date', required: false },
    ]

    useEffect(() => {
        if (adicionandoMembro) {
            buscarPessoas()
        }
    }, [adicionandoMembro])

    async function buscarPessoas() {
        setLoadingPessoas(true)
        try {
            const response = await fetch(`${acUrl}/pessoa/fisica/`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            if (response.ok) {
                const data = await response.json()
                setPessoas(data)
            }
        } catch (err) {
            toast.error('Erro ao buscar pessoas')
        } finally {
            setLoadingPessoas(false)
        }
    }

    async function buscarMembros(comissaoId) {
        setLoadingMembros(true)
        try {
            const response = await fetch(`${acUrl}/membro_comissao/comissao/${comissaoId}/?relations=pessoa`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            if (response.ok) {
                const data = await response.json()
                setMembros(data)
            }
        } catch (err) {
            toast.error('Erro ao buscar membros da comissão')
        } finally {
            setLoadingMembros(false)
        }
    }

    async function handleVerMembros(comissao) {
        setComissaoSelecionada(comissao)
        setMostrandoMembros(true)
        await buscarMembros(comissao.id)
    }

    async function handleDeletar(comissao) {
        if (!confirm('Tem certeza que deseja deletar esta comissão?')) return
        try {
            const response = await fetch(`${acUrl}/comissao/${comissao.id}/`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            if (response.ok) {
                const comissaoDeletada = await response.json()
                setListaComissoes(prev => prev.filter(c => c.id !== comissaoDeletada.id))
                toast.success('Comissão deletada com sucesso!')
            } else {
                const jsonError = await response.json()
                toast.error(jsonError.error || jsonError.detail || 'Erro ao deletar comissão')
                throw new Error('Erro ao deletar comissão.')
            }
        } catch (err) {
            toast.error(err.message || err)
        }
    }

    async function editarComissao(comissao) {
        try {
            const response = await fetch(`${acUrl}/comissao/${comissaoSelecionada.id}/`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ...comissao })
            })
            if (response.ok) {
                const comissaoAtualizada = await response.json()
                toast.success('Dados da comissão salvos com sucesso.')
                setListaComissoes(prev => prev.map(c => c.id === comissaoAtualizada.id ? comissaoAtualizada : c))
                setEditando(false)
                setComissaoSelecionada(null)
            } else {
                const jsonError = await response.json()
                toast.error(jsonError.error || jsonError.detail || 'Erro ao editar comissão')
                throw new Error('Erro ao editar comissão')
            }
        } catch (err) {
            toast.error('Erro ao editar comissão')
        }
    }

    async function adicionarMembro(membroData) {
        try {
            const response = await fetch(`${acUrl}/membro_comissao/`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...membroData,
                    comissao: comissaoSelecionada.id
                })
            })
            if (response.ok) {
                const novoMembro = await response.json()
                toast.success('Membro adicionado com sucesso!')
                setAdicionandoMembro(false)
                await buscarMembros(comissaoSelecionada.id)
            } else {
                const errorData = await response.json()
                toast.error(errorData.error || errorData.detail || 'Erro ao adicionar membro')
                throw new Error(errorData.detail || 'Erro ao adicionar membro')
            }
        } catch (err) {
            toast.error(err.message)
        }
    }

    async function removerMembro(membroId) {
        if (!confirm('Tem certeza que deseja remover este membro da comissão?')) return
        try {
            const response = await fetch(`${acUrl}/membro_comissao/${membroId}/`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            if (response.ok) {
                toast.success('Membro removido com sucesso!')
                await buscarMembros(comissaoSelecionada.id)
            } else {
                const jsonError = await response.json()
                toast.error(jsonError.error || jsonError.detail || 'Erro ao remover membro')
                throw new Error('Erro ao remover membro')
            }
        } catch (err) {
            toast.error(err.message)
        }
    }

    async function handleAdicionar() {
        setComissaoSelecionada({ id: null, descricao: '', nome: '' })
        setAdicionando(true)
    }

    async function adicionarComissao(comissao) {
        try {
            const response = await fetch(`${acUrl}/comissao/`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ...comissao })
            })
            if (response.ok) {
                const novaComissao = await response.json()
                toast.success('Comissão cadastrada com sucesso!')
                setListaComissoes(prev => [...prev, novaComissao])
                setAdicionando(false)
                setComissaoSelecionada(null)
            }
            else{
                const jsonError = await response.json()
                toast.error(jsonError.error || jsonError.detail || 'Erro ao adicionar comissão')
                throw new Error('Erro ao adicionar comissão')
            }
        } catch (err) {
            toast.error('Erro ao adicionar comissão')
        }
    }

    function submit(formData) {
        if (editando) {
            editarComissao(formData)
        } else if (adicionando) {
            adicionarComissao(formData)
        } else if (adicionandoMembro) {
            adicionarMembro(formData)
        }
    }

    function cancelar() {
        setEditando(false)
        setAdicionando(false)
        setComissaoSelecionada(null)
        setMostrandoMembros(false)
        setAdicionandoMembro(false)
    }

    function handleEditar(comissao) {
        setComissaoSelecionada(comissao)
        setEditando(true)
    }

    function formatarDataBrasileira(data) {
        if (!data) return 'N/A'
        return data.split('-').reverse().join('/')
    }

    return (
        <section className="flex flex-col flex-grow overflow-auto text-azul_escuro bg-gradient-to-br from-gray-200 to-gray-300 p-4">
            <ToastContainer></ToastContainer>
            <div className="flex flex-col w-full mx-auto bg-white shadow-lg rounded-lg p-8">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-xl font-bold mb-6 text-azul_escuro">Gerenciar Comissões</h1>
                    <button onClick={handleAdicionar} className="bg-azul_escuro text-white px-4 py-2 rounded-md hover:bg-azul_escuro transition-all mb-4">
                        Cadastrar Comissão
                    </button>
                </div>

                <table className="min-w-full bg-white shadow-md rounded-lg">
                    <thead>
                        <tr className="bg-azul_escuro bg-opacity-90  text-branco_cinza uppercase text-sm leading-normal">
                            <th className="py-3 px-6 text-left">Número do ato</th>
                            <th className="py-3 px-6 text-left">Tipo de ato</th>
                            <th className="py-3 px-6 text-left">Finalidade</th>
                            <th className="py-3 px-6 text-center">Ações</th>
                        </tr>
                    </thead>
                    {loadingComissoes ? (
                        <tfoot>
                            <tr>
                                <td colSpan={4} className="items-center py-3 px-6 text-center">
                                    <div className="flex justify-center items-center">
                                        <FiLoader size={24} className="animate-spin text-4xl text-azul_escuro" />
                                    </div>
                                </td>
                            </tr>
                        </tfoot>
                    ) : listaComissoes.length === 0 ? (
                        <tfoot>
                            <tr>
                                <td colSpan="4" className="py-3 px-6 text-center">Nenhuma comissão encontrada</td>
                            </tr>
                        </tfoot>
                    ) : (
                        <tbody className="text-gray-800 text-sm font-light">
                            {listaComissoes.map((comissao) => (
                                <tr key={comissao.id} className="border-b border-gray-200 hover:bg-gray-100">
                                    <td className="py-3 px-6 text-left">{comissao.numero_ato}</td>
                                    <td className="py-3 px-6 text-left">{comissao.tipo_ato}</td>
                                    <td className="py-3 px-6 text-left">{comissao.finalidade}</td>
                                    <td className="py-3 px-6 text-center">
                                        {acoesComissoes.map((acao, index) => (
                                            <button 
                                                key={index} 
                                                onClick={() => acao.handler(comissao)} 
                                                className="px-2 py-1 mx-1"
                                                title={acao.tooltip}
                                            >
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

            {/* Modal para Editar/Adicionar Comissão */}
            <Modal isOpen={editando || adicionando} onClose={cancelar} title={editando ? 'Editar Comissão' : 'Adicionar Comissão'}>
                <Formulario
                    campos={camposComissao}
                    dadosIniciais={editando ? comissaoSelecionada : {}}
                    onSubmit={submit}
                    onCancel={cancelar}
                />
            </Modal>

            {/* Modal para Ver Membros da Comissão */}
            <Modal isOpen={mostrandoMembros} onClose={cancelar} title={`Membros da Comissão`}>
                    <div className="space-y-4 p-4 overflow-auto">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Lista de Membros</h3>
                            <button
                                onClick={() => setAdicionandoMembro(true)}
                                className="bg-azul_escuro hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
                            >
                                <FaPlus className="inline mr-1" /> Adicionar Membro
                            </button>
                        </div>                    {loadingMembros ? (
                        <div className="flex justify-center py-12">
                            <div className="flex flex-col items-center space-y-4">
                                <FiLoader className="animate-spin text-4xl text-azul_escuro" />
                                <p className="text-gray-600">Carregando membros...</p>
                            </div>
                        </div>
                    ) : membros.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="flex flex-col items-center space-y-4">
                                <FaUsers className="text-6xl text-gray-300" />
                                <h3 className="text-xl font-semibold text-gray-600">Nenhum membro encontrado</h3>
                                <p className="text-gray-500">Esta comissão ainda não possui membros cadastrados.</p>
                                <button
                                    onClick={() => setAdicionandoMembro(true)}
                                    className="mt-4 bg-azul_escuro hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                                >
                                    <FaPlus />
                                    <span>Adicionar Primeiro Membro</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Estatísticas rápidas */}
                            <div className="bg-gradient-to-r from-azul_escuro to-blue-600 text-white p-4 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm opacity-90">Total de membros</p>
                                        <p className="text-2xl font-bold">{membros.length}</p>
                                    </div>
                                    <FaUsers className="text-3xl opacity-80" />
                                </div>
                            </div>

                            {/* Lista de membros em cards */}
                            <div className="grid gap-4">
                                {membros.map((membro, index) => (
                                    <div key={membro.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <div className="w-10 h-10 bg-azul_escuro text-white rounded-full flex items-center justify-center font-semibold">
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900">
                                                            {membro.pessoa?.nome || membro.pessoa?.razao_social || 'Nome não encontrado'}
                                                        </h4>
                                                        <p className="text-sm text-gray-600">{membro.cargo}</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                                                    <div>
                                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Atribuição</p>
                                                        <p className="text-sm font-medium text-gray-900">{membro.atribuicao}</p>
                                                    </div>
                                                    
                                                    {membro.natureza_cargo && (
                                                        <div>
                                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Natureza</p>
                                                            <p className="text-sm text-gray-700">{membro.natureza_cargo}</p>
                                                        </div>
                                                    )}
                                                    
                                                    <div>
                                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ato de Nomeação</p>
                                                        <p className="text-sm text-gray-700">{membro.ato_pessoal}</p>
                                                    </div>
                                                </div>

                                                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <div>
                                                            <span className="font-medium text-gray-600">Vigência: </span>
                                                            <span className="text-gray-900">
                                                                {formatarDataBrasileira(membro.vigencia_inicial)}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="font-medium text-gray-600">até </span>
                                                            <span className="text-gray-900">
                                                                {membro.vigencia_final ?  formatarDataBrasileira(membro.vigencia_final) : 'o Presente Momento'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <button
                                                onClick={() => removerMembro(membro.id)}
                                                className="ml-4 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                                title="Remover membro"
                                            >
                                                <MdDelete size={20} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Modal para Adicionar Membro */}
            <Modal isOpen={adicionandoMembro} onClose={() => setAdicionandoMembro(false)} title="Adicionar Membro à Comissão">
                <div className="p-6 overflow-auto">
                    {loadingPessoas ? (
                        <div className="flex justify-center py-12">
                            <div className="flex flex-col items-center space-y-4">
                                <FiLoader className="animate-spin text-4xl text-azul_escuro" />
                                <p className="text-gray-600">Carregando pessoas...</p>
                            </div>
                        </div>
                    ) : pessoas.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="flex flex-col items-center space-y-4">
                                <FaUsers className="text-6xl text-gray-300" />
                                <h3 className="text-xl font-semibold text-gray-600">Nenhuma pessoa cadastrada</h3>
                                <p className="text-gray-500">É necessário cadastrar pessoas antes de adicionar membros à comissão.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="bg-blue-50 border-l-4 border-azul_escuro p-4 rounded-r-lg">
                                <div className="flex items-center">
                                    <FaUsers className="text-azul_escuro mr-3" />
                                    <div>
                                        <h4 className="font-semibold text-azul_escuro">Adicionando membro para:</h4>
                                        <p className="text-sm text-gray-600">{comissaoSelecionada?.finalidade}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <form onSubmit={(e) => {
                                e.preventDefault()
                                const formData = new FormData(e.target)
                                if(!formData.get('vigencia_final')){
                                    formData.delete('vigencia_final')
                                }
                                const data = Object.fromEntries(formData.entries())
                                adicionarMembro(data)
                            }} className="space-y-6">
                                
                                {/* Seleção de Pessoa */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700">
                                        Selecionar Pessoa *
                                    </label>
                                    <select 
                                        name="pessoa" 
                                        required 
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-azul_escuro focus:border-azul_escuro transition-colors bg-white"
                                    >
                                        <option value="">Escolha uma pessoa...</option>
                                        {pessoas.map(pessoa => (
                                            <option key={pessoa.pessoa_id} value={pessoa.pessoa_id}>
                                                {pessoa.nome} 
                                                {pessoa.cpf && ` - CPF: ${pessoa.cpf}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Grid para campos principais */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700">
                                            Atribuição *
                                        </label>
                                        <select 
                                            name="atribuicao" 
                                            required 
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-azul_escuro focus:border-azul_escuro transition-colors"
                                        >
                                            <option value="">Selecione a atribuição...</option>
                                            <option value="Presidente">Presidente</option>
                                            <option value="Vice-Presidente">Vice-Presidente</option>
                                            <option value="Secretário">Secretário</option>
                                            <option value="Membro">Membro</option>
                                            <option value="Suplente">Suplente</option>
                                            <option value="Coordenador">Coordenador</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700">
                                            Cargo *
                                        </label>
                                        <input 
                                            type="text" 
                                            name="cargo" 
                                            required 
                                            placeholder="Ex: Servidor Público, Assessor..."
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-azul_escuro focus:border-azul_escuro transition-colors"
                                        />
                                    </div>
                                </div>

                                {/* Campos opcionais */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700">
                                            Natureza do Cargo
                                        </label>
                                        <input 
                                            type="text" 
                                            name="natureza_cargo" 
                                            placeholder="Ex: Efetivo, Comissionado, Terceirizado... (opcional)"
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-azul_escuro focus:border-azul_escuro transition-colors"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700">
                                            Ato de Nomeação *
                                        </label>
                                        <input 
                                            type="text" 
                                            name="ato_pessoal" 
                                            required 
                                            placeholder="Ex: Portaria nº 123/2024, Decreto nº 456/2024..."
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-azul_escuro focus:border-azul_escuro transition-colors"
                                        />
                                    </div>
                                </div>

                                {/* Vigência */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h5 className="font-semibold text-gray-700 mb-3 flex items-center">
                                        <span className="w-2 h-2 bg-azul_escuro rounded-full mr-2"></span>
                                        Período de Vigência
                                    </h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-600">
                                                Data de Início *
                                            </label>
                                            <input 
                                                type="date" 
                                                name="vigencia_inicial" 
                                                required 
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-azul_escuro focus:border-azul_escuro transition-colors"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-600">
                                                Data de Fim
                                            </label>
                                            <input 
                                                type="date" 
                                                name="vigencia_final" 
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-azul_escuro focus:border-azul_escuro transition-colors"
                                            />
                                            <p className="text-xs text-gray-500">Deixe em branco para vigência indeterminada</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Botões de ação */}
                                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                                    <button 
                                        type="button" 
                                        onClick={() => setAdicionandoMembro(false)}
                                        className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit"
                                        className="px-6 py-3 bg-azul_escuro hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                                    >
                                        <FaPlus className="text-sm" />
                                        <span>Adicionar Membro</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </Modal>

        </section>
    );
}