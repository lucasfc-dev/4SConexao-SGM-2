'use client'
import { toast, ToastContainer } from "react-toastify"
import { useEditais } from "../context/EditaisContext"
import { useEffect, useState } from "react"
import { FaDownload, FaEdit, FaEye, FaTrash } from "react-icons/fa"
import { MdDelete } from "react-icons/md"
import { useSecao } from "../context/SecaoContext"
import "react-toastify/dist/ReactToastify.css"
import { useAuth } from "@/app/context/AuthContext"
import Cookies from "js-cookie"
import Modal from "@/app/components/modal"
import FormularioEdital from "@/app/components/FormularioEdital"
import { list } from "postcss"
import { FiLoader } from "react-icons/fi"


export default function GerenciarEditais() {
    const { listaEditais, setListaEditais, fetchEditais, loadingEditais } = useEditais()
    const { listaSecoes } = useSecao()
    const acUrl = process.env.NEXT_PUBLIC_AC_ENDPOINT_URL
    const token = Cookies.get('auth-token')
    const { user } = useAuth()
    const [adicionando, setAdicionando] = useState(false)
    const [editalSelecionado, setEditalSelecionado] = useState(null)
    const [editando, setEditando] = useState(false)
    const [visualizando, setVisualizando] = useState(false)
    const [documentosEdital, setDocumentosEdital] = useState([])

    function formatarData(dataString){
        return dataString.split('-').reverse().join('/')
    }

    const acoesEditais = [
        {
            nome: <FaEdit size={28} className="text-green-800 hover:text-green-900 transition-colors" />,
            handler: handleEditar,
        },
        {
            nome: <MdDelete size={28} className="text-red-600 hover:text-red-800 transition-colors" />,
            handler: handleDeletar,
        },
        {
            nome: <FaEye size={28} className="text-azul_escuro transition-colors" />,
            handler: handleVisualizar,
        },
    ]

    async function handleVisualizar(edital) {
        setEditalSelecionado(edital)
        setVisualizando(true)
        await getDocumentosEdital(edital)
    }


    const getDocumentosEdital = async (edital) => {
        try {
            const response = await fetch(`${acUrl}/edital/${edital.id}/docs/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })
            if (response.ok) {
                const documentos = await response.json()
                setDocumentosEdital(documentos)
            }
        }
        catch (error) {
            console.error('Erro ao obter documentos do edital:', error)
        }
    }

    async function handleDeletar(edital) {
        if (!confirm('Tem certeza que deseja deletar este edital?')) return
        try {
            const response = await fetch(`${acUrl}/edital/${edital.id}/`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            if (response.ok) {
                const editalDeletado = await response.json()
                setListaEditais(prev => prev.filter(e => e.id !== editalDeletado.id))
                toast.success('Edital deletado com sucesso!')
            } else {
                const jsonError = await response.json()
                toast.error(jsonError.error || jsonError.detail || 'Erro ao deletar edital')
                throw new Error('Erro ao deletar edital.')
            }
        } catch (err) {
            toast.error(err.message || err)
        }
    }

    async function editarEdital(e) {
        e.preventDefault()
        const formData = new FormData(e.target)
        const edital = Object.fromEntries(formData.entries())

        // Converte valor formatado de volta para número
        if (edital.valor_estimado) {
            edital.valor_estimado = parseFloat(String(edital.valor_estimado).replace(',', '.'))
        }

        try {
            const response = await fetch(`${acUrl}/edital/${editalSelecionado.id}/`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ...edital })
            })
            if (response.ok) {
                const editalAtualizado = await response.json()
                toast.success('Dados do edital salvos com sucesso.')
                await fetchEditais()
                setEditando(false)
                setEditalSelecionado(null)
            } else {
                const jsonError = await response.json()
                toast.error(jsonError.error || jsonError.detail || 'Erro ao editar edital')
                throw new Error('Erro ao editar edital')
            }
        } catch (err) {
            toast.error('Erro ao editar edital')
        }
    }

    async function handleAdicionar() {
        setEditalSelecionado({ id: null, titulo: '', descricao: '', data_abertura: '', data_encerramento: '' })
        setAdicionando(true)
    }

    async function cadastrarDocsEdital(files, edital) {
        const fileData = new FormData()
        fileData.append('target_id', edital.id)
        fileData.append('target_type', 'edital')
        for (const file of files) {
            fileData.append('files', file)
        }
        try {
            const response = await fetch(`${acUrl}/docs/`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: fileData
            })
            if (response.ok) {
                const dados = await response.json()
                toast.success('Documentos cadastrados com sucesso!')
                setEditalSelecionado(dados)
            } else {
                const jsonError = await response.json()
                toast.error(jsonError.error || jsonError.detail || 'Erro ao cadastrar documentos do edital.')
                throw new Error('Erro ao cadastrar documentos do edital.')
            }
        }
        catch (err) {
            toast.error('Erro ao cadastrar documentos do edital')
        }
    }

    async function adicionarEdital(e) {
        e.preventDefault()
        const formData = new FormData(e.target)
        const edital = Object.fromEntries(Array.from(formData.entries().filter(([key]) => key !== 'files')))

        // Converte valor formatado de volta para número
        if (edital.valor_estimado) {
            edital.valor_estimado = parseFloat(String(edital.valor_estimado).replace(',', '.'))
        }

        try {
            const response = await fetch(`${acUrl}/edital/`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ...edital })
            })
            if (response.ok) {
                const novoEdital = await response.json()
                await cadastrarDocsEdital(formData.getAll('files'), novoEdital)
                toast.success('Edital cadastrado com sucesso!')
                await fetchEditais()
                setAdicionando(false)
                setEditalSelecionado(null)
            }
            else {
                const jsonError = await response.json()
                toast.error(jsonError.error || jsonError.detail || 'Erro ao adicionar edital')
                throw new Error('Erro ao adicionar edital')
            }
        } catch (err) {
            toast.error('Erro ao adicionar edital')
        }
    }

    function submit(formData) {
        if (editando) {
            editarEdital(formData)
        } else if (adicionando) {
            adicionarEdital(formData)
        }
    }

    function cancelar() {
        setEditando(false)
        setAdicionando(false)
        setEditalSelecionado(null)
    }

    function handleEditar(edital) {
        setEditalSelecionado(edital)
        setEditando(true)
    }

    const handleCadastrarDocs = async (edital, files) => {
        const fileData = new FormData()
        fileData.append('target_id', edital.id)
        fileData.append('target_type', 'edital')
        for (const file of files) {
            fileData.append('files', file)
        }
        try {
            const response = await fetch(`${acUrl}/docs/`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: fileData
            })
            if (response.ok) {
                const novoDocumento = await response.json()
                toast.success('Documento cadastrado com sucesso!')
                setDocumentosEdital(prev => [...prev, novoDocumento[0]])
            } else {
                const jsonError = await response.json()
                toast.error(jsonError.error || jsonError.detail || 'Erro ao cadastrar documento.')
                throw new Error('Erro ao cadastrar documento.')
            }
        }
        catch (err) {
            console.error('Erro ao cadastrar documento:', err)
            toast.error('Erro ao cadastrar documento')
        }
    }

    const handleDownloadDoc = async (doc) => {
        try {
            const response = await fetch(`${acUrl}/docs/${doc.id}/content/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            })
            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = doc.titulo
                a.click()
                window.URL.revokeObjectURL(url)
                toast.success('Download realizado com sucesso!')
            } else {
                const jsonError = await response.json()
                toast.error(jsonError.error || jsonError.detail || 'Erro ao baixar documento')
                throw new Error('Erro ao baixar documento.')
            }
        }
        catch (error) {
            console.error('Erro ao baixar documento:', error)
            toast.error('Erro ao baixar documento')
        }
    }

    const handleExcluirDoc = async (doc) => {
        if (!confirm('Tem certeza que deseja excluir este documento?')) return
        try {
            const response = await fetch(`${acUrl}/docs/${doc.id}/`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            })
            if (response.ok) {
                setDocumentosEdital(prev => prev.filter(d => d.id !== doc.id))
                toast.success('Documento excluído com sucesso!')
            } else {
                const jsonError = await response.json()
                toast.error(jsonError.error || jsonError.detail || 'Erro ao excluir documento')
                throw new Error('Erro ao excluir documento')
            }
        }
        catch (error) {
            console.error('Erro ao excluir documento:', error)
            toast.error('Erro ao excluir documento')
        }
    }

    const handleDownloadAllDocs = async () => {
        if (documentosEdital.length === 0) {
            toast.warning('Não há documentos para baixar')
            return
        }
        toast.info('Iniciando download de todos os documentos...')
        for (const doc of documentosEdital) {
            await handleDownloadDoc(doc)
        }
        toast.success('Download de todos os documentos concluído!')
    }

    return (
        <section className="flex flex-col flex-grow text-azul_escuro bg-gradient-to-br from-gray-200 to-gray-300 p-4">
            <ToastContainer></ToastContainer>
            <div className="flex flex-col w-full mx-auto bg-white shadow-lg rounded-lg p-8">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-xl font-bold">Gerenciar Editais</h1>
                    <button onClick={handleAdicionar} className="bg-azul_escuro text-white px-4 py-2 rounded-md hover:bg-azul_escuro transition-all mb-4">
                        Cadastrar Edital
                    </button>
                </div>
                <div className="overflow-auto">
                    <table className="min-w-full bg-white shadow-md rounded-lg">
                        <thead>
                            <tr className="bg-azul_escuro bg-opacity-90  text-branco_cinza uppercase text-sm leading-normal">
                                <th className="py-3 px-6 text-left">Número do Edital</th>
                                <th className="py-3 px-6 text-left">Seção</th>
                                <th className="py-3 px-6 text-left">Órgão</th>
                                <th className="py-3 px-6 text-left">Data de publicação</th>
                                <th className="py-3 px-6 text-center">Descrição</th>
                                <th className="py-3 px-6 text-center">Ações</th>
                            </tr>
                        </thead>
                        {loadingEditais ? (
                            <tfoot>
                                <tr>
                                    <td colSpan={6} className="items-center py-3 px-6 text-center">
                                        <div className="flex justify-center items-center">
                                            <FiLoader size={24} className="animate-spin text-4xl text-azul_escuro" />
                                        </div>
                                    </td>
                                </tr>
                            </tfoot>
                        ) : listaEditais.length === 0 ? (
                            <tfoot>
                                <tr>
                                    <td colSpan="6" className="py-3 px-6 text-center">Nenhum edital encontrado</td>
                                </tr>
                            </tfoot>
                        ) :
                            (
                                <tbody className="text-gray-800 text-sm font-light">
                                    {listaEditais.map((edital) => (
                                        <tr onClick={() => setEditalSelecionado(edital)} key={edital.id} className="border-b border-gray-200 hover:bg-gray-100">
                                            <td className="py-3 px-6 text-left">{edital.numero_edital}</td>
                                            <td className="py-3 px-6 text-left">{edital.secao.nome}</td>
                                            <td className="py-3 px-6 text-left">{edital.orgao.nome}</td>
                                            <td className="py-3 px-6 text-left">{formatarData(edital.data_publicacao)}</td>
                                            <td className="py-3 px-6 text-left">{edital.descricao}</td>
                                            <td className="flex py-3 px-6 items-end justify-end">
                                                {acoesEditais.map((acao, index) => (
                                                    <button key={index} onClick={() => acao.handler(edital)} className="px-2 py-6 mx-1">
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
            <Modal isOpen={editando || adicionando} onClose={cancelar} title={editando ? 'Editar Edital' : 'Adicionar Edital'}>
                <FormularioEdital
                    edital={editando ? editalSelecionado : {}}
                    onSubmit={submit}
                    orgaos={user?.orgaos ?? []}
                    listaSecoes={listaSecoes}
                />
            </Modal>
            {editalSelecionado && visualizando && (
                <Modal isOpen={visualizando} onClose={() => setVisualizando(false)} title="Detalhes do Edital">
                    <div className="p-6 overflow-y-auto">
                        <div className="flex flex-wrap gap-4 bg-white p-4 shadow-lg rounded mb-6">
                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Órgão:</strong>
                                <span className="break-words">{editalSelecionado.orgao.nome}</span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Seção:</strong>
                                <span className="break-words">{editalSelecionado.secao.nome}</span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Número de publicação:</strong>
                                <span className="break-words">{editalSelecionado.numero_publicacao}</span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Data de Publicação:</strong>
                                <span className="break-words">
                                    {formatarData(editalSelecionado.data_publicacao)}
                                </span>
                            </div>

                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Número do Edital:</strong>
                                <span className="break-words">{editalSelecionado.numero_edital}</span>
                            </div>
                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Valor Estimado:</strong>
                                <span className="break-words">{String(editalSelecionado.valor_estimado).replace('.', ',')}</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center w-full p-2">
                            <h2 className="text-md font-semibold mb-2">Documentos inclusos no edital</h2>
                            <div className="flex gap-4 items-center">
                                <button onClick={handleDownloadAllDocs} className="text-sm bg-azul_escuro text-white px-4 cursor-pointer py-2 rounded-md hover:bg-laranja_escuro transition-all">
                                    Baixar todos
                                </button>
                                <div className="relative text-sm inline-block cursor-pointer">
                                    <label className="bg-azul_escuro text-white px-4 cursor-pointer py-2 rounded-md cursor-pointer hover:bg-laranja_escuro transition-all">
                                        Adicionar Documento
                                        <input
                                            onChange={(e) => handleCadastrarDocs(editalSelecionado, e.target.files)}
                                            type="file"
                                            name="files"
                                            accept=".docx, .pdf"
                                            className="absolute left-0 top-0 w-full h-full opacity-0 cursor-pointer file:cursor-pointer"
                                        />
                                    </label>
                                </div>
                            </div>


                        </div>
                        {documentosEdital.length > 0 ? (
                            <table className="min-w-full bg-white shadow-md rounded-lg">
                                <thead>
                                    <tr className="bg-azul_escuro bg-opacity-90 text-branco_cinza uppercase text-sm leading-normal">
                                        <th className="py-3 px-6 text-left">Título</th>
                                        <th className="py-3 px-6 text-left">Data de Inclusão</th>
                                        <th className="py-3 px-6 text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-800 text-sm font-light">
                                    {documentosEdital.map((doc) => (
                                        <tr key={doc.id} className="border-b border-gray-200 hover:bg-gray-100">
                                            <td className="py-3 px-6 text-left">{doc.titulo}</td>
                                            <td className="py-3 px-6 text-left">{formatarData(doc.created_at)}</td>
                                            <td className="py-3 px-6 text-center">
                                                <button onClick={() => handleDownloadDoc(doc)} className="mr-2 text-azul_escuro hover:text-green-900 transition-colors">
                                                    <FaDownload size={18} className="text-azul_escuro" />
                                                </button>
                                                <button onClick={() => handleExcluirDoc(doc)} >
                                                    <FaTrash size={18} className="text-azul_escuro hover:text-red-700 transition-colors" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : <></>}
                    </div>
                </Modal>
            )}

        </section>
    )
}