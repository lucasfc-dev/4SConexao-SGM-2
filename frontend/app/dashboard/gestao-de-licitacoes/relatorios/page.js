
'use client'
import { useAuth } from "@/app/context/AuthContext";
import Cookies from "js-cookie";
import { useEffect, useState } from "react"
import { FaDownload } from "react-icons/fa";
import { FiLoader } from "react-icons/fi";
import { MdDelete } from "react-icons/md";
import { ToastContainer, toast } from "react-toastify"
import { TbLoader2 } from "react-icons/tb";
import 'react-toastify/dist/ReactToastify.css'
import { usePessoas } from "@/app/context/pessoasContext";
import { useModalidades } from "../context/ModalidadesContext";
import PaginacaoAvancada from "@/app/components/PaginacaoAvancada";

export default function Relatorios() {
    const [loadingRelatorios, setLoadingRelatorios] = useState(false);
    const [listaRelatorios, setListaRelatorios] = useState([]);
    const [gerando, setGerando] = useState(false);;
    const [paginaAtual, setPaginaAtual] = useState(1);
    const [itensPorPagina, setItensPorPagina] = useState(10);
    const { listaPessoasJuridicas, listaPessoasFisicas } = usePessoas()
    const pessoas = [...listaPessoasJuridicas, ...listaPessoasFisicas]
    const [tipoSelecionado, setTipoSelecionado] = useState('licitacao');
    const { user } = useAuth()
    const acUrl = process.env.NEXT_PUBLIC_AC_ENDPOINT_URL
    const token = Cookies.get('auth-token')

    const listaTipos = [
        { id: 'licitacao', nome: 'Licitação' },
        { id: 'dispensa', nome: 'Dispensa' },
        { id: 'contrato', nome: 'Contrato' },
    ];


    const gerarRelatorio = async (e) => {
        e.preventDefault()
        setGerando(true)

        const form = e.target
        const formData = new FormData(form)
        let body = {}
        formData.forEach((value, key) => {
            if (value && key !== 'tipo') {
                body[key] = value
            }
        })

        try {
            const response = await fetch(`${acUrl}/relatorio/${formData.get('tipo')}/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            })

            if (response.ok) {
                const data = await response.json()
                setListaRelatorios([...listaRelatorios, data])
                toast.success('Relatório gerado com sucesso!')
                form.reset()
            } else {
                const erro = await response.json()
                toast.error(`Erro ao gerar relatório: ${erro.detail || 'Erro desconhecido'}`)
            }
        } catch (error) {
            toast.error(`Erro ao gerar relatório: ${error.message}`)
        } finally {
            setGerando(false)
        }
    }

    async function handleDeletar(relatorio) {
        try {
            const response = await fetch(`${acUrl}/relatorio/${relatorio.id}/`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            })
            if (response.ok) {
                setListaRelatorios(listaRelatorios.filter(rel => rel.id !== relatorio.id))
                toast.success('Relatório deletado com sucesso!')
            } else {
                toast.error('Erro ao deletar relatório:', response.statusText)
            }
        } catch (error) {
            toast.error('Erro ao deletar relatório:', error.message)
        }

    }

    async function handleDownload(relatorio) {
        const response = await fetch(`${acUrl}/relatorio/${relatorio.id}/content/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        })
        if (response.ok) {
            const blob = await response.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${relatorio.titulo}.pdf`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
        } else {
            console.error('Erro ao baixar relatório:', response.statusText)
        }
    }

    const acoesRelatorio = [
        {
            nome: <MdDelete size={28} className="text-red-600 hover:text-red-800 transition-colors" />,
            handler: handleDeletar,
        },
        {
            nome: <FaDownload size={18} className="text-azul_escuro" />,
            handler: handleDownload,
        },
    ]

    async function fetchRelatorios() {
        try {
            setLoadingRelatorios(true)
            const response = await fetch(`${acUrl}/relatorio/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })
            const relatorio = await response.json()
            setListaRelatorios(relatorio)
            return relatorio
        } catch (error) {
            console.error('Erro ao obter relatório:', error)
            return []
        }
        finally {
            setLoadingRelatorios(false)
        }
    }

    useEffect(() => {
        if (user) {
            fetchRelatorios()
        }
    }, [user])

    const handleMudarPagina = (novaPagina) => {
        setPaginaAtual(novaPagina)
    }

    const handleMudarItensPorPagina = (novosItens) => {
        setItensPorPagina(novosItens)
        setPaginaAtual(1) 
    }

    const indiceInicial = (paginaAtual - 1) * itensPorPagina
    const indiceFinal = indiceInicial + itensPorPagina
    const relatoriosPaginados = listaRelatorios.slice(indiceInicial, indiceFinal)

    return (
        <section className="flex flex-col flex-grow text-azul_escuro bg-gradient-to-br from-gray-200 gap-4 overflow-auto to-gray-300 p-4">
            <ToastContainer></ToastContainer>

            <div className="w-full flex flex-col bg-white shadow-lg min-h-[45%] overflow-auto rounded-lg p-8">
                <h1 className="font-bold text-lg md:text-xl text-azul_escuro mb-4">Gerar Novo Relatório</h1>
                <form className="flex  flex-col gap-4 " onSubmit={(e) => gerarRelatorio(e)}>
                    <div className="grid grid-cols-1 md:grid-cols-2 overflow-auto gap-6 p-2">
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
                            <label className="block text-sm font-medium">Tipo de documento</label>
                            <select name="tipo" value={tipoSelecionado} onChange={(e) => setTipoSelecionado(e.target.value)} className="mt-1 p-2 border rounded w-full focus:ring-2 focus:ring-laranja_escuro transition-all">
                                <option value="">Selecione um tipo</option>
                                {listaTipos.map(tipo => (
                                    <option key={tipo.id} value={tipo.id}>{tipo.nome}</option>
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
                    </div>
                    <div className="md:col-span-2 flex justify-end mt-2">
                        <button
                            type="submit"
                            disabled={gerando}
                            className="px-8 py-2 text-center bg-azul_escuro text-white text-lg rounded hover:bg-laranja_escuro transition-colors disabled:opacity-50 disabled:cursor-not-allowed gap-2"
                        >
                            {gerando ?
                                <span className='flex items-center text-center gap-2'>
                                    <TbLoader2 className="w-5 h-5 animate-spin" />
                                    Gerando relatório
                                </span>
                                : 'Gerar relatório'}
                        </button>
                    </div>  

                </form>

            </div>
            <div className="flex flex-col w-full mx-auto bg-white shadow-lg rounded-lg p-8">
                <h2 className="text-xl font-bold mb-4">Relatórios</h2>
                <div className="overflow-auto">
                    <table className="min-w-full bg-white shadow-md rounded-lg">
                        <thead>
                            <tr className="bg-azul_escuro bg-opacity-90  text-branco_cinza uppercase text-sm leading-normal">
                                <th className="py-3 px-6 text-left">Titulo</th>
                                <th className="py-3 px-6 text-left">Data de publicação</th>
                                <th className="py-3 px-6 text-center">Ações</th>
                            </tr>
                        </thead>
                        {loadingRelatorios ? (
                            <tfoot>
                                <tr>
                                    <td colSpan={6} className="items-center py-3 px-6 text-center">
                                        <div className="flex justify-center items-center">
                                            <FiLoader size={24} className="animate-spin text-4xl text-azul_escuro" />
                                        </div>
                                    </td>
                                </tr>
                            </tfoot>
                        ) : listaRelatorios.length === 0 ? (
                            <tfoot>
                                <tr>
                                    <td colSpan="6" className="py-3 px-6 text-center">Nenhum relatório encontrado</td>
                                </tr>
                            </tfoot>
                        ) :
                            (
                                <tbody className="text-gray-800 text-sm font-light">
                                    {relatoriosPaginados.map((relatorio) => (
                                        <tr key={relatorio.id}>
                                            <td className="py-3 px-6">{relatorio.titulo}</td>
                                            <td className="py-3 px-6">{relatorio.pub_date.split('-').reverse().join('/')}</td>
                                            <td className="flex py-3 px-6 items-center justify-center">
                                                {acoesRelatorio.map((acao, index) => (
                                                    <button key={index} onClick={() => acao.handler(relatorio)} className="px-2 py-6 mx-1">
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
                
                <PaginacaoAvancada
                    totalItens={listaRelatorios.length}
                    itensPorPagina={itensPorPagina}
                    paginaAtual={paginaAtual}
                    onMudarPagina={handleMudarPagina}
                    onMudarItensPorPagina={handleMudarItensPorPagina}
                />
            </div>
        </section>
    )
}