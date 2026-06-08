'use client'

import { useAuth } from "@/app/context/AuthContext"
import { usePessoas } from "@/app/context/pessoasContext"
import { useCallback, useEffect, useState } from "react"
import { useFiscais } from "../context/FiscaisContext"
import Cookies from "js-cookie"
import { FaDownload, FaEdit, FaEye, FaTrash, FaCalendarAlt } from "react-icons/fa"
import { MdDelete } from "react-icons/md"
import { toast, ToastContainer } from "react-toastify"
import 'react-toastify/dist/ReactToastify.css'
import Modal from "@/app/components/modal"

const acUrl = process.env.NEXT_PUBLIC_AC_ENDPOINT_URL

export default function FiscalContrato() {
    const { listaFiscaisContrato, setListaFiscaisContrato, fetchFiscaisContrato, loadingFiscais } = useFiscais()
    const { listaPessoasFisicas } = usePessoas()
    const { user } = useAuth()
    const [documentosFiscal, setDocumentosFiscal] = useState([])
    const [comprovanteNomeacao, setComprovanteNomeacao] = useState(null)
    const token = Cookies.get('auth-token')
    const [visualizando, setVisualizando] = useState(false)

    const [adicionando, setAdicionando] = useState(false)
    const [fiscalSelecionado, setFiscalSelecionado] = useState(null)
    const [editando, setEditando] = useState(false)

    // Estado das vigências
    const [gerenciandoVigencias, setGerenciandoVigencias] = useState(false)
    const [vigenciasFiscal, setVigenciasFiscal] = useState([])
    const [adicionandoVigencia, setAdicionandoVigencia] = useState(false)
    const [editandoVigencia, setEditandoVigencia] = useState(false)
    const [vigenciaSelecionada, setVigenciaSelecionada] = useState(null)

    function formatarData(dataString) {
        if (!dataString) return '-'
        return dataString.split('-').reverse().join('/')
    }

    // --- Vigências ---

    const handleGetVigencias = useCallback(async (fiscal) => {
        try {
            const response = await fetch(`${acUrl}/vigencia/fiscal/${fiscal.id}/`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (response.ok) {
                setVigenciasFiscal(await response.json())
            }
        } catch {
            setVigenciasFiscal([])
        }
    }, [token])

    async function handleGerenciarVigencias(fiscal) {
        setFiscalSelecionado(fiscal)
        setGerenciandoVigencias(true)
        await handleGetVigencias(fiscal)
    }

    function fecharGerenciarVigencias() {
        setGerenciandoVigencias(false)
        setFiscalSelecionado(null)
        setVigenciasFiscal([])
        setAdicionandoVigencia(false)
        setEditandoVigencia(false)
        setVigenciaSelecionada(null)
    }

    async function adicionarVigencia(e) {
        e.preventDefault()
        const form = new FormData(e.target)
        const body = Object.fromEntries(form.entries())
        if (!body.data_fim) delete body.data_fim
        body.fiscal = fiscalSelecionado.id

        try {
            const response = await fetch(`${acUrl}/vigencia/`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
            if (response.ok) {
                const nova = await response.json()
                setVigenciasFiscal(prev => [...prev, nova])
                setAdicionandoVigencia(false)
                toast.success('Vigência cadastrada com sucesso!')
            } else {
                const err = await response.json()
                toast.error(err.detail || 'Erro ao cadastrar vigência')
            }
        } catch {
            toast.error('Erro ao cadastrar vigência')
        }
    }

    async function salvarEdicaoVigencia(e) {
        e.preventDefault()
        const form = new FormData(e.target)
        const body = Object.fromEntries(form.entries())
        if (!body.data_fim) delete body.data_fim

        try {
            const response = await fetch(`${acUrl}/vigencia/${vigenciaSelecionada.id}/`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
            if (response.ok) {
                const atualizada = await response.json()
                setVigenciasFiscal(prev => prev.map(v => v.id === atualizada.id ? atualizada : v))
                setEditandoVigencia(false)
                setVigenciaSelecionada(null)
                toast.success('Vigência atualizada com sucesso!')
            } else {
                const err = await response.json()
                toast.error(err.detail || 'Erro ao atualizar vigência')
            }
        } catch {
            toast.error('Erro ao atualizar vigência')
        }
    }

    async function deletarVigencia(vigencia) {
        if (!confirm('Tem certeza que deseja deletar esta vigência?')) return
        try {
            const response = await fetch(`${acUrl}/vigencia/${vigencia.id}/`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            })
            if (response.ok) {
                setVigenciasFiscal(prev => prev.filter(v => v.id !== vigencia.id))
                toast.success('Vigência deletada com sucesso!')
            } else {
                toast.error('Erro ao deletar vigência')
            }
        } catch {
            toast.error('Erro ao deletar vigência')
        }
    }

    // --- Fiscal CRUD ---

    async function handleVisualizar(fiscal) {
        setFiscalSelecionado(fiscal)
        setVisualizando(true)
    }

    async function handleDeletar(fiscal) {
        if (!confirm('Tem certeza que deseja deletar este fiscal?')) return
        try {
            const response = await fetch(`${acUrl}/fiscal_contrato/${fiscal.id}/`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            })
            if (response.ok) {
                const fiscalDeletado = await response.json()
                setListaFiscaisContrato(prev => prev.filter(f => f.id !== fiscalDeletado.id))
                toast.success('Fiscal deletado com sucesso!')
            } else {
                throw new Error('Erro ao deletar Fiscal.')
            }
        } catch (err) {
            toast.error(err.message || err)
        }
    }

    async function editarFiscal(formData) {
        const objeto = Object.fromEntries(formData.entries())
        try {
            const response = await fetch(`${acUrl}/fiscal_contrato/${fiscalSelecionado.id}/`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...objeto }),
            })
            if (response.ok) {
                toast.success('Dados do fiscal salvos com sucesso.')
                await fetchFiscaisContrato()
                setEditando(false)
                setFiscalSelecionado(null)
            } else {
                throw new Error('Erro ao editar dados do fiscal')
            }
        } catch {
            toast.error('Erro ao editar dados do fiscal')
        }
    }

    async function handleAdicionar() {
        setFiscalSelecionado(null)
        setAdicionando(true)
    }

    async function handleCadastrarDocs(file, fiscal) {
        if (!file) return
        const fileData = new FormData()
        fileData.append('file', file)
        try {
            const response = await fetch(`${acUrl}/fiscal_contrato/${fiscal.id}/comprovante_nomeacao/`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: fileData,
            })
            if (response.ok) {
                const documento = await response.json()
                setComprovanteNomeacao(documento)
                toast.success('Comprovante de nomeação cadastrado com sucesso!')
                await handleGetDocumentos(fiscal)
            } else {
                throw new Error('Erro ao cadastrar comprovante de nomeação')
            }
        } catch (err) {
            toast.error(err.message || err)
        }
    }

    async function handleCadastrarPortarias(files, fiscal) {
        if (!files || files.length === 0) return
        const fileData = new FormData()
        fileData.append('target_id', fiscal.id)
        fileData.append('target_type', 'fiscal_contrato')
        for (const file of files) {
            fileData.append('files', file)
        }
        try {
            const response = await fetch(`${acUrl}/docs/`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: fileData,
            })
            if (response.ok) {
                const documentos = await response.json()
                setDocumentosFiscal(prev => [...prev, ...documentos])
                toast.success(`${documentos.length} portaria(s) cadastrada(s) com sucesso!`)
                await handleGetDocumentos(fiscal)
            } else {
                throw new Error('Erro ao cadastrar portarias')
            }
        } catch (err) {
            toast.error(err.message || err)
        }
    }

    async function adicionarFiscal(formData) {
        const dadosFiscal = JSON.stringify(
            Object.fromEntries(Array.from(formData.entries()).filter(([key]) => key !== 'files'))
        )
        try {
            const response = await fetch(`${acUrl}/fiscal_contrato/`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: dadosFiscal,
            })
            if (response.ok) {
                const novoFiscal = await response.json()
                await handleCadastrarDocs(formData.get('file'), novoFiscal)
                toast.success('Fiscal cadastrado com sucesso!')
                setListaFiscaisContrato(prev => [...prev, novoFiscal])
                await fetchFiscaisContrato()
                setAdicionando(false)
                setFiscalSelecionado(null)
            } else {
                const json = await response.json()
                if (json.detail) toast.error(json.detail)
            }
        } catch {
            toast.error('Erro ao cadastrar fiscal')
        }
    }

    function submit(e) {
        e.preventDefault()
        const formData = new FormData(e.target)
        if (editando) {
            editarFiscal(formData)
        } else if (adicionando) {
            adicionarFiscal(formData)
        }
    }

    function cancelar() {
        setEditando(false)
        setAdicionando(false)
        setFiscalSelecionado(null)
    }

    const handleDownloadDoc = async (doc) => {
        try {
            const response = await fetch(`${acUrl}/docs/${doc.id}/content/`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = doc.titulo
                a.click()
                window.URL.revokeObjectURL(url)
            }
        } catch {
            toast.error('Erro ao baixar documento')
        }
    }

    const handleDownloadComprovante = async (fiscal) => {
        try {
            const response = await fetch(`${acUrl}/fiscal_contrato/${fiscal.id}/comprovante_nomeacao/download/`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = comprovanteNomeacao.titulo || 'comprovante_nomeacao.pdf'
                a.click()
                window.URL.revokeObjectURL(url)
            } else {
                throw new Error('Erro ao baixar comprovante')
            }
        } catch {
            toast.error('Erro ao baixar comprovante de nomeação')
        }
    }

    const handleExcluirDoc = async (doc) => {
        try {
            const response = await fetch(`${acUrl}/docs/${doc.id}/`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            })
            if (response.ok) {
                setDocumentosFiscal(prev => prev.filter(d => d.id !== doc.id))
                toast.success('Documento excluído com sucesso!')
            } else {
                throw new Error('Erro ao excluir documento')
            }
        } catch {
            toast.error('Erro ao excluir documento')
        }
    }

    const handleGetDocumentos = useCallback(async (fiscal) => {
        try {
            const response = await fetch(`${acUrl}/fiscal_contrato/${fiscal.id}/docs/`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (response.ok) {
                const documento = await response.json()
                setDocumentosFiscal(documento.portarias || [])
                setComprovanteNomeacao(documento.comprovante_nomeacao || null)
            } else {
                throw new Error('Erro ao obter documentos do fiscal')
            }
        } catch (err) {
            setDocumentosFiscal([])
            setComprovanteNomeacao(null)
            toast.error(err.message || 'Erro ao obter documentos do fiscal')
        }
    }, [token])

    useEffect(() => {
        if (fiscalSelecionado && visualizando) {
            handleGetDocumentos(fiscalSelecionado)
        }
    }, [handleGetDocumentos, fiscalSelecionado, visualizando])

    function handleEditar(fiscal) {
        setFiscalSelecionado(fiscal)
        setEditando(true)
    }

    const acoesFiscal = [
        {
            titulo: 'Editar',
            nome: <FaEdit size={22} className="text-green-800 hover:text-green-900 transition-colors" />,
            handler: handleEditar,
        },
        {
            titulo: 'Gerenciar Vigências',
            nome: <FaCalendarAlt size={22} className="text-indigo-600 hover:text-indigo-800 transition-colors" />,
            handler: handleGerenciarVigencias,
        },
        {
            titulo: 'Detalhes / Documentos',
            nome: <FaEye size={22} className="text-azul_escuro hover:text-blue-800 transition-colors" />,
            handler: handleVisualizar,
        },
        {
            titulo: 'Deletar',
            nome: <MdDelete size={22} className="text-red-600 hover:text-red-800 transition-colors" />,
            handler: handleDeletar,
        },
    ]

    return (
        <section className="flex flex-col flex-grow overflow-auto text-azul_escuro gap-4 bg-gradient-to-br from-gray-200 to-gray-300 p-4">
            <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
            <div className="flex flex-col w-full mx-auto bg-white shadow-lg rounded-lg p-8">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-xl font-bold text-azul_escuro">Fiscais de Contrato</h1>
                    <button className="bg-azul_escuro text-white px-4 py-2 rounded hover:bg-laranja_escuro transition-colors" onClick={handleAdicionar}>
                        Cadastrar Fiscal
                    </button>
                </div>
                <table className="min-w-full bg-white shadow-md rounded-lg">
                    <thead>
                        <tr className="bg-azul_escuro bg-opacity-90 text-branco_cinza uppercase text-sm leading-normal">
                            <th className="py-3 px-6 text-left">NOME</th>
                            <th className="py-3 px-6 text-left">ÓRGÃO</th>
                            <th className="py-3 px-6 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-800 text-sm font-light">
                        {listaFiscaisContrato.length > 0 && listaFiscaisContrato.map((fiscal) => (
                            <tr key={fiscal.id} className="border-b border-gray-200 hover:bg-gray-100">
                                <td className="py-3 px-6 text-left">{fiscal.pessoa.nome || fiscal.pessoa.nome_fantasia}</td>
                                <td className="py-3 px-6 text-left">{fiscal.orgao.nome}</td>
                                <td className="py-3 px-6 text-center">
                                    {acoesFiscal.map((acao, index) => (
                                        <button key={index} title={acao.titulo} onClick={(e) => { e.stopPropagation(); acao.handler(fiscal) }} className="px-2 py-1 mx-1">
                                            {acao.nome}
                                        </button>
                                    ))}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal Adicionar / Editar Fiscal */}
            <Modal isOpen={adicionando || editando} onClose={cancelar} title={editando ? 'Editar Fiscal' : 'Adicionar Fiscal'}>
                <form className="p-4 flex flex-col overflow-auto gap-2" onSubmit={submit}>
                    <div className="flex flex-col gap-2 overflow-auto">
                        <label className="font-medium">Pessoa</label>
                        <select
                            name="pessoa"
                            required
                            defaultValue={editando && fiscalSelecionado?.pessoa?.pessoa_id}
                            className="border rounded px-3 py-2"
                        >
                            <option value="">Selecione</option>
                            {listaPessoasFisicas.map(p => (
                                <option key={p.id} value={p.pessoa_id}>{p.nome}</option>
                            ))}
                        </select>

                        <label className="font-medium">Órgão</label>
                        <select
                            name="orgao"
                            required
                            defaultValue={editando && fiscalSelecionado?.orgao?.id}
                            className="border rounded px-3 py-2"
                        >
                            <option value="">Selecione</option>
                            {(user?.orgaos ?? []).map(o => (
                                <option key={o.id} value={o.id}>{o.nome}</option>
                            ))}
                        </select>

                        {!editando && (
                            <>
                                <label className="font-medium">Comprovante de nomeação</label>
                                <input
                                    name="file"
                                    type="file"
                                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                                    className="border rounded px-3 py-2"
                                />
                            </>
                        )}
                    </div>
                    <div className="flex gap-2 justify-end pt-4 w-full">
                        <button
                            type="submit"
                            className="px-4 py-2 w-full bg-azul_escuro text-white font-medium rounded-lg hover:bg-laranja_escuro transition-colors"
                        >
                            {editando ? 'Salvar Alterações' : 'Adicionar'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal Gerenciar Vigências */}
            {fiscalSelecionado && gerenciandoVigencias && (
                <Modal
                    isOpen={gerenciandoVigencias}
                    onClose={fecharGerenciarVigencias}
                    title={`Vigências — ${fiscalSelecionado.pessoa.nome || fiscalSelecionado.pessoa.nome_fantasia}`}
                >
                    <div className="p-6 overflow-y-auto flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                            <p className="text-sm text-gray-500">Órgão: <strong>{fiscalSelecionado.orgao.nome}</strong></p>
                            <button
                                onClick={() => { setAdicionandoVigencia(true); setEditandoVigencia(false); setVigenciaSelecionada(null) }}
                                className="bg-azul_escuro text-white px-4 py-2 rounded-md hover:bg-laranja_escuro transition-colors text-sm"
                            >
                                + Nova Vigência
                            </button>
                        </div>

                        {(adicionandoVigencia || editandoVigencia) && (
                            <form
                                className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex flex-col gap-3"
                                onSubmit={editandoVigencia ? salvarEdicaoVigencia : adicionarVigencia}
                            >
                                <h3 className="font-semibold text-indigo-800 text-sm">{editandoVigencia ? 'Editar Vigência' : 'Nova Vigência'}</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Data de Início *</label>
                                        <input
                                            key={`di-${vigenciaSelecionada?.id}`}
                                            name="data_inicio"
                                            type="date"
                                            required
                                            defaultValue={editandoVigencia ? vigenciaSelecionada?.data_inicio : ''}
                                            className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Data de Fim</label>
                                        <input
                                            key={`df-${vigenciaSelecionada?.id}`}
                                            name="data_fim"
                                            type="date"
                                            defaultValue={editandoVigencia ? vigenciaSelecionada?.data_fim ?? '' : ''}
                                            className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <button
                                        type="button"
                                        onClick={() => { setAdicionandoVigencia(false); setEditandoVigencia(false); setVigenciaSelecionada(null) }}
                                        className="px-3 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm"
                                    >
                                        Cancelar
                                    </button>
                                    <button type="submit" className="px-3 py-2 bg-azul_escuro text-white rounded-lg hover:bg-laranja_escuro text-sm">
                                        {editandoVigencia ? 'Salvar' : 'Adicionar'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {vigenciasFiscal.length > 0 ? (
                            <table className="min-w-full bg-white shadow-md rounded-lg">
                                <thead>
                                    <tr className="bg-azul_escuro bg-opacity-90 text-branco_cinza uppercase text-sm leading-normal">
                                        <th className="py-3 px-6 text-left">Data de Início</th>
                                        <th className="py-3 px-6 text-left">Data de Fim</th>
                                        <th className="py-3 px-6 text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-800 text-sm font-light">
                                    {vigenciasFiscal.map((v) => (
                                        <tr key={v.id} className="border-b border-gray-200 hover:bg-gray-50">
                                            <td className="py-3 px-6">{formatarData(v.data_inicio)}</td>
                                            <td className="py-3 px-6">{v.data_fim ? formatarData(v.data_fim) : <span className="text-green-600 font-medium">Vigente</span>}</td>
                                            <td className="py-3 px-6 text-center">
                                                <button
                                                    title="Editar"
                                                    onClick={() => { setVigenciaSelecionada(v); setEditandoVigencia(true); setAdicionandoVigencia(false) }}
                                                    className="mr-3 text-green-700 hover:text-green-900 transition-colors"
                                                >
                                                    <FaEdit size={16} />
                                                </button>
                                                <button
                                                    title="Deletar"
                                                    onClick={() => deletarVigencia(v)}
                                                    className="text-red-600 hover:text-red-800 transition-colors"
                                                >
                                                    <FaTrash size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="text-center py-8 text-gray-400">
                                Nenhuma vigência cadastrada para este fiscal.
                            </div>
                        )}
                    </div>
                </Modal>
            )}

            {/* Modal Visualizar Fiscal */}
            {fiscalSelecionado && visualizando && (
                <Modal
                    isOpen={visualizando}
                    onClose={() => {
                        setVisualizando(false)
                        setFiscalSelecionado(null)
                        setDocumentosFiscal([])
                        setComprovanteNomeacao(null)
                    }}
                    title="Detalhes do Fiscal"
                >
                    <div className="p-6 overflow-y-auto">
                        {/* Info básica */}
                        <div className="flex flex-wrap gap-4 bg-white p-4 shadow-lg rounded mb-6">
                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Nome:</strong>
                                <span className="break-words">{fiscalSelecionado.pessoa.nome || fiscalSelecionado.pessoa.nome_fantasia}</span>
                            </div>
                            <div className="flex flex-col w-full sm:w-1/2 lg:w-1/3">
                                <strong>Órgão:</strong>
                                <span className="break-words">{fiscalSelecionado.orgao.nome}</span>
                            </div>
                        </div>

                        {/* Comprovante de Nomeação */}
                        <div className="flex justify-between items-center w-full p-2 mb-4">
                            <h2 className="text-lg font-semibold">Comprovante de Nomeação</h2>
                            <div className="relative text-sm inline-block cursor-pointer">
                                <label className="bg-azul_escuro text-white px-4 cursor-pointer py-2 rounded-md hover:bg-laranja_escuro transition-all">
                                    {comprovanteNomeacao ? 'Substituir Comprovante' : 'Adicionar Comprovante'}
                                    <input
                                        onChange={(e) => handleCadastrarDocs(e.target.files[0], fiscalSelecionado)}
                                        type="file"
                                        name="file"
                                        accept=".docx, .pdf"
                                        className="absolute left-0 top-0 w-full h-full opacity-0 cursor-pointer file:cursor-pointer"
                                    />
                                </label>
                            </div>
                        </div>

                        {comprovanteNomeacao ? (
                            <div className="bg-gray-50 p-4 rounded-lg mb-6">
                                <table className="min-w-full bg-white shadow-md rounded-lg">
                                    <thead>
                                        <tr className="bg-azul_escuro bg-opacity-90 text-branco_cinza uppercase text-sm leading-normal">
                                            <th className="py-3 px-6 text-left">Arquivo</th>
                                            <th className="py-3 px-6 text-left">Data de Upload</th>
                                            <th className="py-3 px-6 text-center">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-gray-800 text-sm font-light">
                                        <tr className="border-b border-gray-200 hover:bg-gray-100">
                                            <td className="py-3 px-6 text-left">{comprovanteNomeacao.titulo}</td>
                                            <td className="py-3 px-6 text-left">{formatarData(comprovanteNomeacao.upload_date || comprovanteNomeacao.created_at)}</td>
                                            <td className="py-3 px-6 text-center">
                                                <button
                                                    onClick={() => handleDownloadComprovante(fiscalSelecionado)}
                                                    className="mr-2 text-azul_escuro hover:text-green-900 transition-colors"
                                                >
                                                    <FaDownload size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="bg-gray-50 p-4 rounded-lg mb-6 text-center text-gray-500">
                                Nenhum comprovante de nomeação cadastrado
                            </div>
                        )}

                        {/* Portarias */}
                        <div className="flex justify-between items-center w-full p-2 mb-4">
                            <h2 className="text-lg font-semibold">Portarias</h2>
                            <div className="relative text-sm inline-block cursor-pointer">
                                <label className="bg-azul_escuro text-white px-4 cursor-pointer py-2 rounded-md hover:bg-laranja_escuro transition-all">
                                    Adicionar Portarias
                                    <input
                                        onChange={(e) => handleCadastrarPortarias(e.target.files, fiscalSelecionado)}
                                        type="file"
                                        name="portarias"
                                        accept=".docx, .pdf"
                                        multiple
                                        className="absolute left-0 top-0 w-full h-full opacity-0 cursor-pointer file:cursor-pointer"
                                    />
                                </label>
                            </div>
                        </div>

                        {documentosFiscal && documentosFiscal.length > 0 ? (
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <table className="min-w-full bg-white shadow-md rounded-lg">
                                    <thead>
                                        <tr className="bg-azul_escuro bg-opacity-90 text-branco_cinza uppercase text-sm leading-normal">
                                            <th className="py-3 px-6 text-left">Título</th>
                                            <th className="py-3 px-6 text-left">Data de Inclusão</th>
                                            <th className="py-3 px-6 text-center">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-gray-800 text-sm font-light">
                                        {documentosFiscal.map((doc) => (
                                            <tr key={doc.id} className="border-b border-gray-200 hover:bg-gray-100">
                                                <td className="py-3 px-6 text-left">{doc.titulo}</td>
                                                <td className="py-3 px-6 text-left">{formatarData(doc.updated_at || doc.created_at)}</td>
                                                <td className="py-3 px-6 text-center">
                                                    <button onClick={() => handleDownloadDoc(doc)} className="mr-2 text-azul_escuro hover:text-green-900 transition-colors">
                                                        <FaDownload size={18} />
                                                    </button>
                                                    <button onClick={() => handleExcluirDoc(doc)} className="text-red-600 hover:text-red-800 transition-colors">
                                                        <FaTrash size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
                                Nenhuma portaria cadastrada
                            </div>
                        )}
                    </div>
                </Modal>
            )}
        </section>
    )
}
