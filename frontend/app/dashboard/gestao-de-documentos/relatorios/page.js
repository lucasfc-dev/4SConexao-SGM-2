'use client'

import Cookies from "js-cookie"
import { useCallback, useEffect, useState } from "react"
import { useTipos } from "../context/tiposContext"
import { useVereadores } from "../context/vereadoresContext"
import 'react-toastify/dist/ReactToastify.css'
import { useAuth } from "@/app/context/AuthContext"
import Search from "../../diario-oficial-eletronico/components/search"
import { useRelatorios } from "../context/relatoriosContext"
import { toast, ToastContainer } from "react-toastify"
import { FaDownload } from "react-icons/fa"
import { MdDelete } from "react-icons/md"
import Tabela from "@/app/components/tabela"
import { FiLoader } from "react-icons/fi"
import { TbLoader2 } from "react-icons/tb"

const gedUrl = process.env.NEXT_PUBLIC_GED_ENDPOINT_URL

export default function Relatorios() {
    const { user } = useAuth()
    const [iframeSrc, setIframeSrc] = useState()
    const { listaVereadores } = useVereadores()
    const { listaTipos } = useTipos()
    const { listaRelatorios, loadingRelatorios, fetchRelatorios, setListaRelatorios } = useRelatorios()
    const [relatoriosFiltrados, setRelatoriosFiltrados] = useState([])
    const [gerando, setGerando] = useState(false)
    const token = Cookies.get('auth-token')
    const [filtros, setFiltros] = useState({
        titulo: '',
        dataInicial: '',
        dataFinal: ''
    })
    const isCamara = user?.estabelecimento.config.tipo === "DA CÂMARA MUNICIPAL"

    const listaSituacoes = [
        { nome: 'Vigente', id: 1 },
        { nome: 'Revogado', id: 2 },
        { nome: 'Revogado Parcialmente', id: 3 }
    ]

    const handleDeletar = async (relatorio) => {
        try {
            const response = await fetch(`${gedUrl}/relatorio/${relatorio.id}/`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            if (response.ok) {
                setListaRelatorios((prevRelatorios) =>
                    prevRelatorios.filter((r) => r.id !== relatorio.id)
                )
                toast.success('Relatório deletado com sucesso!')
            }
            else {
                const erro = await response.json()
                throw new Error(erro.detail)
            }
        }
        catch (error) {
            toast.error(error)
            console.error(error)
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

        const filtered = listaRelatorios.filter((relatorio) => {
            const tituloMatch = !filtros.titulo ||
                relatorio.titulo?.toLowerCase().includes(filtros.titulo.toLowerCase())

            const dataDocumento = new Date(relatorio.uploaded_at.split('/').reverse().join('-'))
            const dataInicial = filtros.dataInicial ? new Date(filtros.dataInicial) : null
            const dataFinal = filtros.dataFinal ? new Date(filtros.dataFinal) : null

            const dataMatch =
                (!dataInicial || dataDocumento >= dataInicial) &&
                (!dataFinal || dataDocumento <= dataFinal)

            return tituloMatch && dataMatch
        })

        setRelatoriosFiltrados(filtered.reverse())
    }, [filtros, listaRelatorios])

    const gerarRelatorio = async (e) => {
        e.preventDefault()

        const form = e.target
        const formData = new FormData(form)
        let body = {}
        formData.forEach((value, key) => {
            if (value) {
                body[key] = value
            }
        })
        try {
            const response = await fetch(`${gedUrl}/relatorio/`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            })
            if (response.ok) {
                await fetchRelatorios()
                toast.success('Relatório gerado com sucesso!')
            }
            else {
                const erro = await response.json()
                throw new Error(erro.detail)
            }
        } catch (error) {
            toast.error(`Erro ao gerar relatório: ${error}`)
        }
    }

    useEffect(() => {
        handleBuscar()
    }, [handleBuscar])

    const handleDownload = async (relatorio) => {
        try {
            const response = await fetch(`${gedUrl}/relatorio/${relatorio.id}/content/`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            if (response.ok) {
                const blobData = await response.blob()
                const linkBlob = URL.createObjectURL(blobData)
                const link = document.createElement('a')
                link.href = linkBlob
                link.download = relatorio.titulo
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                toast.success('Download iniciado com sucesso!')
            } else {
                throw new Error(response.statusText)
            }
        } catch (error) {
            toast.error(`Erro ao fazer download do relatório ${error}`)
        }
    }

    return (
        <>
            <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
            <section className="flex flex-grow flex-col overflow-auto p-2 gap-4 md:p-4 bg-gradient-to-br from-gray-200 to-gray-300">

                <div className="w-full flex flex-col bg-white shadow-lg rounded-lg p-4">
                    <h1 className="font-bold text-xl md:text-2xl text-azul_escuro mb-6">Gerar Novo Relatório</h1>
                    <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={(e) => gerarRelatorio(e)}>
                        <div>
                            <label className="block text-sm font-medium">Tipo de documento</label>
                            <select name="tipo" className="mt-1 p-2 border rounded w-full focus:ring-2 focus:ring-laranja_escuro transition-all">
                                <option value="">Selecione um tipo</option>
                                {listaTipos.map(tipo => (
                                    <option key={tipo.id} value={tipo.id}>{tipo.nome}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Situação do documento</label>
                            <select name='situacao' className="mt-1 p-2 border rounded w-full focus:ring-2 focus:ring-laranja_escuro transition-all">
                                <option value="">Selecione a situação</option>
                                {listaSituacoes.map(situacao => (
                                    <option key={situacao.id} value={situacao.nome}>{situacao.nome}</option>
                                ))}
                            </select>
                        </div>
                        {isCamara ?
                            <div>
                                <label className="block text-sm font-medium">Vereador responsável *</label>
                                <select name='vereador' className="mt-1 p-2 border rounded w-full focus:ring-2 focus:ring-laranja_escuro transition-all">
                                    <option value="">Selecione um vereador</option>
                                    {listaVereadores.map(vereador => (
                                        <option key={vereador.id} value={vereador.id}>{vereador.nome}</option>
                                    ))}
                                </select>
                            </div>
                            : null
                        }
                        <div>
                            <label className="block text-sm font-medium">Órgão responsável</label>
                            <select name="orgao" className="mt-1 p-2 border rounded w-full focus:ring-2 focus:ring-laranja_escuro transition-all">
                                <option value="">Selecione um órgão</option>
                                {(user?.orgaos ?? []).map(orgao => (
                                    <option key={orgao.id} value={orgao.id}>{orgao.nome}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Data Inicial</label>
                            <input name="created_at__gte" type="date" className="mt-1 p-2 border rounded-lg w-full focus:ring-2 focus:ring-blue-600 transition-all" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Data Final</label>
                            <input name="created_at__lte" type="date" className="mt-1 p-2 border rounded-lg w-full focus:ring-2 focus:ring-blue-600 transition-all" />
                        </div>
                        <div className="md:col-span-2 flex justify-end mt-2 p-2">
                            <button
                                type="submit"
                                disabled={gerando}
                                className="px-8 py-2 bg-laranja_escuro text-white text-lg rounded hover:bg-laranja_claro transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {gerando ?
                                    <span className='flex items-center gap-2'>
                                        <TbLoader2 className="w-5 h-5 animate-spin" />
                                        Gerando relatório
                                    </span>
                                    : 'Gerar relatório'}
                            </button>
                        </div>
                    </form>

                </div>
                <div className="bg-white p-4 rounded-lg shadow-md">
                    <h2 className="text-xl text-azul_escuro font-semibold mb-6">Buscar relatórios cadastrados</h2>
                    <div className='mb-10'>
                        <Search
                            filtros={filtros}
                            onFiltroChange={handleFiltroChange}
                        />
                    </div>
                    <div className="mt-8">
                        <h3 className="text-xl font-semibold mb-2 text-azul_escuro">
                            Relatórios cadastrados ({listaRelatorios.length})
                        </h3>
                        {listaRelatorios.length > 0 ? (
                            <Tabela
                                listaColunas={[
                                    { nomeColuna: 'Título', coluna: 'titulo' },
                                    { nomeColuna: 'Enviado em', coluna: 'uploaded_at' }
                                ]}
                                listaDados={relatoriosFiltrados}
                                acoes={[
                                    {
                                        nome: <FaDownload size={28} className="text-azul_escuro hover:text-laranja_escuro transition-colors" />,
                                        handler: (relatorio) => handleDownload(relatorio),
                                    },
                                    {
                                        nome: <MdDelete size={28} className="text-red-600 hover:text-red-700 transition-colors" />,
                                        handler: (relatorio) => handleDeletar(relatorio),
                                    },
                                ]
                                }
                            />
                        ) : loadingRelatorios ?
                            <div className="flex flex-grow h-16 text-center items-center justify-center">
                                <FiLoader className="animate-spin text-4xl text-azul_escuro" />
                            </div>
                            :
                            <p className="text-center font-bold text-azul_escuro">Nenhum documento para visualizar.</p>}
                    </div>
                </div>
            </section>
        </>

    )
}
