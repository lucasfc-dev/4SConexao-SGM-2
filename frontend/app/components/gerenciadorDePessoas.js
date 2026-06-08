'use client';
import Cookies from "js-cookie";
import { useState } from "react";
import "react-toastify/dist/ReactToastify.css"
import { toast, ToastContainer } from "react-toastify";
import { usePessoas } from "@/app/context/pessoasContext";
import Tabela from "@/app/components/tabela";
import { FaEdit } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import Modal from "@/app/components/modal";
import FormularioPessoaFisica from "@/app/components/FormularioPessoaFisica";
import FormularioPessoaJuridica from "@/app/components/FormularioPessoaJuridica";
import { FiLoader } from "react-icons/fi";
import { fromJSON } from "postcss";

export default function GerenciadorDePessoas() {
    const acUrl = process.env.NEXT_PUBLIC_AC_ENDPOINT_URL
    const [tipoDeFormulario, setTipoDeFormulario] = useState(true)
    const [tipoDePessoa, setTipoDePessoa] = useState(true)
    const {
        listaPessoasFisicas,
        setListaPessoasFisicas,
        listaPessoasJuridicas,
        setListaPessoasJuridicas,
        fetchPessoasFisicas,
        fetchPessoasJuridicas,
        loadingPessoasFisicas,
        loadingPessoasJuridicas
    } = usePessoas()
    const [pessoaSelecionada, setPessoaSelecionada] = useState({})
    const [editando, setEditando] = useState(false)
    const token = Cookies.get('auth-token')

    const acoesPessoa = [
        {
            nome: <FaEdit size={28} className="text-green-800 hover:text-green-900 transition-colors" />,
            handler: (pessoa) => handleEditar(pessoa),
        },
        {
            nome: <MdDelete size={28} className="text-red-600 hover:text-red-800 transition-colors" />,
            handler: (pessoa) => handleDeletar(pessoa),
        },
    ]

    const editarPessoa = async (e) => {
        e.preventDefault()
        const formData = new FormData(e.target)
        const pessoa = Object.fromEntries(formData.entries())
        
        // Função para remover campos vazios
        const removerCamposVazios = (dados) => {
            const dadosFiltrados = {}
            for (const [key, value] of Object.entries(dados)) {
                if (value !== "" && value !== null && value !== undefined) {
                    dadosFiltrados[key] = value
                }
            }
            return dadosFiltrados
        }
        
        // Função para limpar formatação dos campos
        const limparFormatacao = (dados) => {
            const dadosLimpos = { ...dados }
            // Limpar CPF, RG, Título de Eleitor, CNPJ, Telefones - remover tudo que não é dígito
            if (dadosLimpos.cpf) dadosLimpos.cpf = dadosLimpos.cpf.replace(/\D/g, '')
            if (dadosLimpos.rg) dadosLimpos.rg = dadosLimpos.rg.replace(/\D/g, '')
            if (dadosLimpos.titulo_eleitor) dadosLimpos.titulo_eleitor = dadosLimpos.titulo_eleitor.replace(/\D/g, '')
            if (dadosLimpos.cnpj) dadosLimpos.cnpj = dadosLimpos.cnpj.replace(/\D/g, '')
            if (dadosLimpos.telefone) dadosLimpos.telefone = dadosLimpos.telefone.replace(/\D/g, '')
            if (dadosLimpos.telefone_comercial) dadosLimpos.telefone_comercial = dadosLimpos.telefone_comercial.replace(/\D/g, '')
            return dadosLimpos
        }
        
        // Primeiro remove campos vazios, depois limpa formatação
        const pessoaSemVazios = removerCamposVazios(pessoa)
        const pessoaLimpa = limparFormatacao(pessoaSemVazios)
        
        try {
            const response = await fetch(`${acUrl}/pessoa/${pessoaSelecionada.tipo}/${pessoaSelecionada.id}/`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ...pessoaLimpa })
            })
            if (response.ok) {
                const pessoaAtualizada = await response.json()
                if (pessoaSelecionada.tipo === 'fisica') {
                    setTipoDeFormulario(true)
                    setTipoDePessoa(true)
                    setListaPessoasFisicas(prev => prev.map(p => p.id === pessoaAtualizada.id ? pessoaAtualizada : p))
                    await fetchPessoasFisicas()
                }
                else if (pessoaSelecionada.tipo === 'juridica') {
                    setTipoDeFormulario(false)
                    setTipoDePessoa(false)
                    setListaPessoasJuridicas(prev => prev.map(p => p.id === pessoaAtualizada.id ? pessoaAtualizada : p))
                    await fetchPessoasJuridicas()
                }
                setEditando(false)
                setPessoaSelecionada({})
                toast.success('Dados da pessoa alterados com sucesso!')
            } else {
                const data = await response.json().catch(() => null)
                throw new Error(data?.detail || 'Erro ao editar Pessoa')
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const handleDeletar = async (pessoa) => {
        setPessoaSelecionada(pessoa)
        try {
            const response = await fetch(`${acUrl}/pessoa/${pessoa.pessoa_id}/`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            })
            if (response.ok) {
                if (pessoa.tipo === 'fisica') {
                    setListaPessoasFisicas(prev => prev.filter(p => p.id !== pessoa.id))
                    await fetchPessoasFisicas()
                } else if (pessoa.tipo === 'juridica') {
                    setListaPessoasJuridicas(prev => prev.filter(p => p.id !== pessoa.id))
                    await fetchPessoasJuridicas()
                }
                setPessoaSelecionada({})
                toast.success('Pessoa deletada com sucesso!')
            } else {
                throw new Error('Erro ao deletar Pessoa')
            }
        } catch (error) {
            toast.error(error.message)
        }
    }
    const handleEditar = (pessoa) => {
        setEditando(true);
        setPessoaSelecionada(pessoa);
    }

    const listaColunasPessoaFisica = [
        { nomeColuna: 'Nome', coluna: 'nome' },
        { nomeColuna: 'Telefone', coluna: 'telefone' },
        { nomeColuna: 'Email', coluna: 'email' },
    ]

    const listaColunasPessoaJuridica = [
        { nomeColuna: 'Razão social', coluna: 'razao_social' },
        { nomeColuna: 'Nome Fantasia', coluna: 'nome_fantasia' },
        { nomeColuna: 'Telefone', coluna: 'telefone' },
        { nomeColuna: 'Email', coluna: 'email' },
    ]

    const handleCadastro = async (event) => {
        event.preventDefault()
        const formData = new FormData(event.target)
        const formJson = Object.fromEntries(formData.entries())
        
        // Função para remover campos vazios
        const removerCamposVazios = (dados) => {
            const dadosFiltrados = {}
            for (const [key, value] of Object.entries(dados)) {
                if (value !== "" && value !== null && value !== undefined) {
                    dadosFiltrados[key] = value
                }
            }
            return dadosFiltrados
        }

        // Função para limpar formatação dos campos
        const limparFormatacao = (dados) => {
            const dadosLimpos = { ...dados }
            // Limpar CPF, RG, Título de Eleitor, CNPJ, Telefones - remover tudo que não é dígito
            if (dadosLimpos.cpf) dadosLimpos.cpf = dadosLimpos.cpf.replace(/\D/g, '')
            if (dadosLimpos.rg) dadosLimpos.rg = dadosLimpos.rg.replace(/\D/g, '')
            if (dadosLimpos.titulo_eleitor) dadosLimpos.titulo_eleitor = dadosLimpos.titulo_eleitor.replace(/\D/g, '')
            if (dadosLimpos.cnpj) dadosLimpos.cnpj = dadosLimpos.cnpj.replace(/\D/g, '')
            if (dadosLimpos.telefone) dadosLimpos.telefone = dadosLimpos.telefone.replace(/\D/g, '')
            if (dadosLimpos.telefone_comercial) dadosLimpos.telefone_comercial = dadosLimpos.telefone_comercial.replace(/\D/g, '')
            return dadosLimpos
        }
        
        // Primeiro remove campos vazios, depois limpa formatação
        const formJsonSemVazios = removerCamposVazios(formJson)
        const formJsonLimpo = limparFormatacao(formJsonSemVazios)
        
        if (tipoDeFormulario) {
            try {
                const response = await fetch(`${acUrl}/pessoa/fisica/`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formJsonLimpo)
                })
                if (response.ok) {
                    toast.success('Pessoa Física cadastrada com sucesso!')
                    fetchPessoasFisicas()
                    event.target.reset()
                } else {
                    const data = await response.json().catch(() => null)
                    throw new Error(data?.detail || 'Erro ao cadastrar Pessoa Física')
                }
            }
            catch (error) {
                toast.error(error.message)
            }
        }
        else {
            try {
                const response = await fetch(`${acUrl}/pessoa/juridica/`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formJsonLimpo)
                })
                if (response.ok) {
                    toast.success('Pessoa Jurídica cadastrada com sucesso!')
                    fetchPessoasJuridicas()
                    event.target.reset()
                } else {
                    const data = await response.json().catch(() => null)
                    throw new Error(data?.detail || 'Erro ao cadastrar Pessoa Jurídica')
                }

            }
            catch (error) {
                toast.error(error.message)
            }

        }

    }
    return (
        <section className="flex flex-col flex-grow overflow-auto text-azul_escuro bg-gradient-to-br from-gray-200 to-gray-300 p-8">
            <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
            <h1 className="text-2xl font-bold mb-4">Cadastro de Pessoas</h1>
            <div className="rounded flex flex-col min-h-[600px] overflow-auto gap-4 bg-white p-6 shadow-lg">
                <div className="flex gap-4">
                    <button
                        onClick={() => setTipoDeFormulario(true)}
                        className={`px-4 py-2 rounded-md ${tipoDeFormulario ? 'bg-laranja_escuro text-white' : 'bg-gray-300 text-black'}`}
                    >
                        Pessoa Física
                    </button>
                    <button
                        onClick={() => setTipoDeFormulario(false)}
                        className={`px-4 py-2 rounded-md ${!tipoDeFormulario ? 'bg-laranja_escuro text-white' : 'bg-gray-300 text-black'}`}
                    >
                        Pessoa Jurídica
                    </button>
                </div>
                <form className="flex flex-col overflow-auto gap-6" onSubmit={handleCadastro}>
                    {tipoDeFormulario ? (
                        <FormularioPessoaFisica />
                    ) : (
                        <FormularioPessoaJuridica />
                    )}
                    <button type="submit" className="px-4 py-3 bg-azul_escuro text-white rounded-md hover:bg-laranja_escuro transition-colors">
                        Cadastrar Pessoa
                    </button>
                </form>
            </div>
            <div className="rounded flex flex-col gap-4 bg-white p-6 shadow-lg mt-4">
                <div className="flex gap-4">
                    <button
                        onClick={() => setTipoDePessoa(true)}
                        className={`px-4 py-2 rounded-md ${tipoDePessoa ? 'bg-laranja_escuro text-white' : 'bg-gray-300 text-black'}`}
                    >
                        Pessoa Física
                    </button>
                    <button
                        onClick={() => setTipoDePessoa(false)}
                        className={`px-4 py-2 rounded-md ${!tipoDePessoa ? 'bg-laranja_escuro text-white' : 'bg-gray-300 text-black'}`}
                    >
                        Pessoa Jurídica
                    </button>
                </div>
                <div className="flex flex-col w-full mx-auto rounded-lg">
                    {tipoDePessoa ? (
                        <>
                            <h2 className="text-azul_escuro text-xl font-bold mb-4">Pessoas físicas cadastradas</h2>
                            {loadingPessoasFisicas ? (
                                <div className='flex items-center justify-center w-full bg-white'>
                                    <FiLoader size={50} className="animate-spin text-4xl text-azul_escuro" />
                                </div>
                            ) : (
                                <Tabela listaDados={listaPessoasFisicas} listaColunas={listaColunasPessoaFisica} acoes={acoesPessoa}></Tabela>
                            )}
                        </>
                    ) : (
                        <>
                            <h2 className="text-azul_escuro text-xl font-bold mb-4">Pessoas jurídicas cadastradas</h2>
                            {loadingPessoasJuridicas ? (
                                <div className='flex items-center justify-center h-screen bg-white'>
                                    <FiLoader size={50} className="animate-spin text-4xl text-azul_escuro" />
                                </div>
                            ) : (
                                <Tabela listaDados={listaPessoasJuridicas} listaColunas={listaColunasPessoaJuridica} acoes={acoesPessoa}></Tabela>
                            )}
                        </>
                    )}
                </div>
            </div>
            <Modal isOpen={editando} onClose={() => setEditando(false)} title={pessoaSelecionada.tipo === 'fisica' ? "Editar Pessoa Física" : "Editar Pessoa Jurídica"}>
                <form onSubmit={(e) => editarPessoa(e)} className="flex flex-col gap-6 p-4 overflow-auto">
                    {pessoaSelecionada.tipo === 'fisica' ? (
                        <FormularioPessoaFisica defaultValues={pessoaSelecionada}></FormularioPessoaFisica>
                    ) : (
                        <FormularioPessoaJuridica defaultValues={pessoaSelecionada}></FormularioPessoaJuridica>
                    )}
                    <button type="submit" className="px-4 py-3 bg-azul_escuro text-white rounded-md hover:bg-laranja_escuro transition-colors">
                        Salvar Pessoa
                    </button>
                </form>
            </Modal>
        </section>
    );
}
