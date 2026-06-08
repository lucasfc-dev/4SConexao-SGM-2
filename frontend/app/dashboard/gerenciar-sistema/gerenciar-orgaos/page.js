'use client'
import Tabela from '@/app/components/tabela'
import Formulario from '@/app/components/formulario'
import { useEffect, useState } from 'react'
import { apiOrgaos } from '@/app/api/apiOrgaos'
import { useAuth } from '@/app/context/AuthContext'
import { toast, ToastContainer } from 'react-toastify'
import Modal from '@/app/components/modal'
import 'react-toastify/dist/ReactToastify.css';

export default function GerenciarOrgaos() {
    const { user } = useAuth()
    const [orgaos, setOrgaos] = useState([])
    const [orgaoSelecionado, setOrgaoSelecionado] = useState(null)
    const [editando, setEditando] = useState(false)
    const [adicionando, setAdicionando] = useState(false)
    const colunasOrgao = [
        { coluna: 'nome', nomeColuna: 'Órgão' },
        { coluna: 'cnpj', nomeColuna: 'CNPJ' },
    ]

    const camposOrgao = [
        { name: 'nome', label: 'Nome', type: 'text', required: true, placeholder: 'Informe o nome do órgão' },
        { name: 'cnpj', label: 'CNPJ', type: 'cnpj', required: true, placeholder: 'Digite o CNPJ do órgão' },
        { name: 'poder', label: 'Selecione o poder correspondente', type: 'select', required: true, options:[{label: 'Poder Executivo', value:'executivo'}, {label: 'Poder Legislativo', value:'legislativo'}, {label: 'Fundos', value:'fundos'}] },
        { name: 'endereco', label: 'Endereço', type: 'text', required: true, placeholder: 'Digite o endereço do órgão' },
        { name:'icone', label: 'Imagem do Orgão', type: 'file', required: !editando, placeholder: 'Selecione a imagem do órgão' },
        { name: 'is_estabelecimento', label: 'É estabelecimento?', type: 'checkbox', required: false }
    ]


    useEffect(() => {
        async function fetchOrgaos() {
            try {
                const listaOrgaos = await apiOrgaos.getAll()
                setOrgaos(listaOrgaos)
            } catch (err) {
                toast.error('Erro ao obter órgãos')
            } finally {
            }
        }
        fetchOrgaos()
    }, [])

    async function deletarOrgao(orgaoDeletado) {
        if (!confirm('Tem certeza que deseja deletar este órgão?')) return
        try {
            await apiOrgaos.delete(orgaoDeletado.id)
            setOrgaos(prevOrgaos => prevOrgaos.filter(orgao => orgao.id !== orgaoDeletado.id))
            toast.success('Órgão deletado com sucesso')
        } catch (err) {
            toast.error('Erro ao deletar Órgão')
        }
    }

    async function editarOrgao(orgao) {
        try {
            // Separar ícone dos outros dados
            const { icone, ...dadosOrgao } = orgao
            
            // Atualizar dados básicos do órgão
            const orgaoAtualizado = await apiOrgaos.update(dadosOrgao, orgaoSelecionado.id)
            
            // Se foi fornecido um novo ícone, fazer o upload
            if (icone && icone instanceof File) {
                await apiOrgaos.uploadIcone(icone, orgaoSelecionado.id)
            }
            
            toast.success('Dados do órgão salvos com sucesso.')
            setOrgaos(prevOrgaos => prevOrgaos.map(orgao => orgao.id === orgaoAtualizado.id ? orgaoAtualizado : orgao))
            setEditando(false)
            setOrgaoSelecionado(null)
        } catch (err) {
            toast.error('Erro ao editar órgão')
        }
    }

    async function handleAdicionar() {
        setOrgaoSelecionado({ id: null, descricao: '', cnpj: '', endereco: '' })
        setAdicionando(true)
    }

    async function adicionarOrgao(orgao) {
        try {
            // Separar ícone dos outros dados
            const { icone, ...dadosOrgao } = orgao
            
            const novoOrgao = await apiOrgaos.add(dadosOrgao, user.estabelecimento.id)
            
            if (icone && icone instanceof File) {
                await apiOrgaos.uploadIcone(icone, novoOrgao.id)
            }
            
            toast.success('Órgão cadastrado com sucesso!')
            setOrgaos(prevOrgaos => [...prevOrgaos, novoOrgao])
            setAdicionando(false)
            setOrgaoSelecionado(null)
        } catch (err) {
            toast.error('Erro ao adicionar órgão')
        }
    }

    function submit(formData) {
        if (editando) {
            editarOrgao(formData)
        } else if (adicionando) {
            adicionarOrgao(formData)
        }
    }

    function cancelar() {
        setEditando(false)
        setAdicionando(false)
        setOrgaoSelecionado(null)
    }


    function handleEditar(orgao) {
        setOrgaoSelecionado(orgao)
        setEditando(true)
    }

    const acoes = [
        { nome: 'Editar', handler: handleEditar },
        { nome: 'Deletar', handler: deletarOrgao }
    ]

    return (
        <section className="flex flex-col flex-grow overflow-auto bg-gradient-to-br from-gray-200 to-gray-300 text-azul_escuro p-4 md:p-8">
            <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
            <div className="mb-6 flex gap-2 justify-between items-center">
                <h1 className="text-xl md:text-3xl font-extrabold min-w-0 truncate">Gerenciar Órgãos</h1>
                <button className="px-4 py-2 bg-azul_escuro text-white rounded-lg shadow hover:bg-azul_claro transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-azul_escuro focus:ring-opacity-50"
                    onClick={handleAdicionar}
                    aria-label="Adicionar Novo Usuário">
                    Adicionar
                </button>
            </div>
            <div className="bg-white p-2 shadow-md rounded-lg overflow-auto">
                <Tabela
                    listaDados={orgaos}
                    listaColunas={colunasOrgao}
                    acoes={acoes}
                />
            </div>
                <Modal isOpen={editando || adicionando} onClose={cancelar} title={adicionando ? 'Adicionar Órgão' : 'Editar Órgão'}>
                    <Formulario
                        campos={camposOrgao}
                        dadosIniciais={editando ? orgaoSelecionado : {}}
                        onSubmit={submit}
                        onCancel={cancelar}
                    />
                </Modal>
        </section>
    )
}
