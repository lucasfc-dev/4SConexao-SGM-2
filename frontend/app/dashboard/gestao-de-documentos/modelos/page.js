'use client'
import { useCallback, useEffect, useState } from "react"
import Search from "../../diario-oficial-eletronico/components/search"
import { toast, ToastContainer } from "react-toastify"
import Cookies from "js-cookie"
import Modal from "@/app/components/modal"
import { FaDownload, FaFileWord, FaTrash } from "react-icons/fa"
import 'react-toastify/dist/ReactToastify.css'


const gedUrl = process.env.NEXT_PUBLIC_GED_ENDPOINT_URL

export default function Modelos() {
    const [listaModelos, setListaModelos] = useState([])
    const [modelosFiltrados, setModelosFiltrados] = useState([])
    const [modeloSelecionado, setModeloSelecionado] = useState(null)

    const [adicionando, setAdicionando] = useState(false)
    const token = Cookies.get('auth-token')
    const [filtros, setFiltros] = useState({
        titulo: '',
        dataInicial: '',
        dataFinal: ''
    })

    const fetchModelos = async () => {
        try {
            const response = await fetch(`${gedUrl}/docmodel/`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            if (response.ok) {
                const modelos = await response.json()
                setListaModelos(modelos)
            }
        }
        catch (error) {
            console.error(error)
        }
    }

    useEffect(() => {
        fetchModelos()
    }, [])

    const adicionarModelo = async (e) => {
        e.preventDefault()
        const formData = new FormData(e.target)
        try {
            const response = await fetch(`${gedUrl}/docmodel/`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData
            })
            if (response.ok) {
                const novoModelo = await response.json()
                toast.success('Modelo de cadastrado com sucesso!')
                setListaModelos(prevModelos => [...prevModelos, novoModelo])
                setAdicionando(false)
                setModeloSelecionado(null)
            }

        }
        catch (err) {
            toast.error('Erro ao adicionar tipo de documento')
        }
    }

    const handleAdicionar = async (e) => {
        setAdicionando(true)
    }

    const cancel = () => {
        setAdicionando(false)
    }

    async function handleDeletar(modelo) {
        if (!confirm('Tem certeza que deseja deletar este modelo de documento?')) return
        try {
            const response = await fetch(`${gedUrl}/docmodel/${modelo.id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            if (response.ok) {
                const modeloDeletado = await response.json()
                setListaModelos(prevModelos => prevModelos.filter(m => m.id !== modeloDeletado.id))
                toast.success('Modelo de documento deletado com sucesso!')
            }
            else {
                throw new Error('Erro ao deletar modelo de documento.')
            }

        } catch (err) {
            toast.error(err)
        }
    }

    const handleDownload = async (modelo) => {
        try {
            const response = await fetch(`${gedUrl}/docmodel/${modelo.id}/content/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })
            if (!response.ok) {
                throw new Error('Falha ao baixar o modelo de documento.')
            }
            const conteudo = await response.json()
            const conteudoDecodificado = atob(conteudo.content)
            const byteNumbers = new Uint8Array(conteudoDecodificado.length)
            for (let i = 0; i < conteudoDecodificado.length; i++) {
                byteNumbers[i] = conteudoDecodificado.charCodeAt(i)
            }
            const blob = new Blob([byteNumbers], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${modelo.tipo}.docx`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Erro ao baixar o modelo de documento:', error)
        }
    }

    const handleFiltroChange = (campo, valor) => {
        setFiltros(prev => ({
            ...prev,
            [campo]: valor
        }))
    }

    const handleBuscar = useCallback((event) => {
        if (event) {
            event.preventDefault()
        }
        const filtered = listaModelos.filter((documento) => {
            const tituloMatch = !filtros.titulo ||
                documento.tipo?.toLowerCase().includes(filtros.titulo.toLowerCase())

            const dataDocumento = new Date(documento.created_at.split('/').reverse().join('-'))
            const dataInicial = filtros.dataInicial ? new Date(filtros.dataInicial) : null
            const dataFinal = filtros.dataFinal ? new Date(filtros.dataFinal) : null

            const dataMatch =
                (!dataInicial || dataDocumento >= dataInicial) &&
                (!dataFinal || dataDocumento <= dataFinal)

            return tituloMatch && dataMatch
        })

        setModelosFiltrados(filtered.reverse())
    }, [filtros, listaModelos])

    useEffect(() => {
        handleBuscar()
    }, [handleBuscar])

    return (
        <section className="flex flex-col md:flex-row flex-grow overflow-auto gap-2 text-azul_escuro bg-gradient-to-br from-gray-200 to-gray-300 p-2 sm:p-6">
            <ToastContainer></ToastContainer>
            <div className="flex flex-col w-full h-auto">
                <h1 className="text-azul_escuro font-bold text-xl text-center mb-6">Gerenciar modelos</h1>
                <Search filtros={filtros} onFiltroChange={handleFiltroChange}></Search>
                <div className="flex w-full justify-between items-center mt-4 mb-4">
                    <h2 className='text-lg font-bold'>Modelos cadastrados</h2>
                    <button className="px-4 py-2 bg-azul_escuro text-white rounded-lg shadow hover:bg-azul_claro transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-azul_escuro focus:ring-opacity-50"
                        onClick={handleAdicionar}
                        aria-label="Adicionar Novo Usuário">
                        Adicionar
                    </button>
                </div>
                <div className="flex flex-col overflow-auto border rounded-lg gap-2 shadow-sm">
                    {modelosFiltrados.length === 0 ? <>Não existem modelos cadastrados</> :
                        modelosFiltrados.map((modelo, index) => (
                            <div
                                key={index}
                                className={`flex flex-col w-full text_azul_escuro p-6 rounded-lg shadow-lg
                        ${modeloSelecionado?.id === modelo.id ? "bg-azul_escuro text-white" : "bg-white text-azul_escuro"}
                        hover:bg-azul_escuro hover:text-white transition-colors duration-200 cursor-pointer`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex gap-2 items-center">
                                        <FaFileWord size={28}></FaFileWord>
                                        <div className="flex flex-col w-full pl-2">
                                            <h2 className="text-lg font-semibold">{modelo.tipo}</h2>
                                            <p className="mt-1 whitespace-pre-line text-sm">{modelo.descricao}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <button onClick={() => handleDeletar(modelo)} className="text-sm px-3 py-1 rounded-md hover:bg-white hover:text-azul_escuro transition-colors">
                                            <FaTrash />
                                        </button>
                                        <button onClick={() => handleDownload(modelo)} className="text-sm px-3 py-1 rounded-md hover:bg-white hover:text-azul_escuro transition-colors">
                                            <FaDownload />
                                        </button>
                                    </div>

                                </div>
                            </div>
                        ))}
                </div>
            </div>
            {
                adicionando && (
                    <Modal isOpen={adicionando} onClose={cancel} title="Adicionar Modelo de Documento">
                        <form onSubmit={(e) => adicionarModelo(e)} className="p-4 overflow-auto rounded">
                            <div className="mb-4">
                                <label className="text-sm font-medium text-gray-700">Nome do modelo</label>
                                <input
                                    type='text'
                                    name='tipo'
                                    className="w-full px-3 py-2 border rounded"
                                    required={true}
                                    placeholder='Digite o nome'
                                />
                            </div>
                            <div className="mb-4">
                                <label className="text-sm font-medium text-gray-700">Descrição do modelo</label>
                                <input
                                    type='text'
                                    name='descricao'
                                    className="w-full px-3 py-2 border rounded"
                                    required={true}
                                    placeholder='Informe a descrição'
                                />
                            </div>
                            <div className="mb-4">
                                <label className="text-sm font-medium text-gray-700">Arquivo</label>
                                <input
                                    type='file'
                                    name='file'
                                    className="w-full px-3 py-2 border rounded"
                                    required={true}
                                />
                            </div>
                            <div className='flex gap-4 justify-end mt-4'>
                                <button
                                    type="button"
                                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors"
                                    onClick={cancel}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-azul_escuro text-white font-medium rounded-lg hover:bg-blue-800 transition-colors"
                                >
                                    Adicionar
                                </button>
                            </div>
                        </form>

                    </Modal>
                )
            }
        </section >
    )
}