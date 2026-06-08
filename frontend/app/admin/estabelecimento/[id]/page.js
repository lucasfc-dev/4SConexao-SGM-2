'use client'
import Modal from '@/app/components/modal'
import { useAuth } from '@/app/context/AuthContext'
import Cookies from 'js-cookie'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { FiEdit, FiLoader, FiDownload } from 'react-icons/fi'
import { toast, ToastContainer } from "react-toastify"
import 'react-toastify/dist/ReactToastify.css'

const authUrl = process.env.NEXT_PUBLIC_AUTH_ENDPOINT_URL

export default function DetalhesEstabelecimento() {
    const { id } = useParams()
    const router = useRouter()
    const token = Cookies.get('auth-token')
    const [estabelecimento, setEstabelecimento] = useState()
    const [pacote, setPacote] = useState(null)
    const [funcionalidades, setFuncionalidades] = useState([])
    const [allFuncionalidades, setAllFuncionalidades] = useState([])
    const [loading, setLoading] = useState(true)
    const [adding, setAdding] = useState(false)
    const [selectedFuncIds, setSelectedFuncIds] = useState([])
    const { user } = useAuth()
    const [certificadoFile, setCertificadoFile] = useState(null)
    const [senhaCertificado, setSenhaCertificado] = useState('')
    const [isCertModalOpen, setIsCertModalOpen] = useState(false)
    const [certificadoBytes, setCertificadoBytes] = useState(null)
    const [iconeUrl, setIconeUrl] = useState(null)
    const [pacoteTransparencia, setPacoteTransparencia] = useState([])
    const [allModulos, setAllModulos] = useState([])
    const [creatingPacote, setCreatingPacote] = useState(false)
    const [managingModulos, setManagingModulos] = useState(false)
    const [localPacoteState, setLocalPacoteState] = useState(null)
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
    const [hasTransparenciaFunctionality, setHasTransparenciaFunctionality] = useState(false)
    const [tipo, setTipo] = useState('')
    const [anoRomano, setAnoRomano] = useState('')
    const [numLei, setNumLei] = useState(0)
    const [data, setData] = useState({ dia: '', mes: '', ano: '' })
    const [urlSite, setUrlSite] = useState('')


    useEffect(() => {
        if (user && user.is_super) {
            fetchEstabelecimento()
            fetchPacote()
            fetchAllFuncionalidades()
        }
    }, [token, user, id, router])

    useEffect(() => {
        if (hasTransparenciaFunctionality) {
            fetchPacoteTransparencia()
            fetchModulos()
        }
    }, [hasTransparenciaFunctionality])


    async function fetchPacoteTransparencia() {
        try {
            const response = await fetch(`${authUrl}/pacote_transparencia/estabelecimento/${id}/`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            if (response.ok) {
                const data = await response.json()
                setPacoteTransparencia(data)
                setLocalPacoteState(data)
            } else if (response.status === 404) {
                setPacoteTransparencia([])
                setLocalPacoteState(null)
            } else {
                throw new Error('Erro ao buscar dados do pacote de transparência')
            }
        } catch (error) {
            console.error('Erro ao buscar pacote de transparência:', error)
            setPacoteTransparencia([])
            setLocalPacoteState(null)
        }
    }

    async function fetchModulos() {
        try {
            const response = await fetch(`${authUrl}/pacote_transparencia/modulos/all/`, {
                method: 'GET', headers: {
                    Authorization: `Bearer ${token}`,
                }
            })
            if (response.ok) {
                const data = await response.json()
                setAllModulos(data.modulos)
            } else {
                throw new Error('Erro ao buscar módulos de transparência')
            }
        } catch (error) {
            console.error('Erro ao buscar módulos de transparência:', error)
            setAllModulos([])
        }
    }

    async function createPacoteTransparencia() {
        setCreatingPacote(true)
        try {
            const response = await fetch(`${authUrl}/pacote_transparencia/estabelecimento/${id}/`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            if (response.ok) {
                toast.success('Pacote de transparência criado com sucesso')
                await fetchPacoteTransparencia()
                setHasUnsavedChanges(false)
            } else {
                const errorData = await response.json()
                toast.error('Erro ao criar pacote: ' + (errorData.detail || 'Erro desconhecido'))
            }
        } catch (error) {
            toast.error('Erro na requisição: ' + error.message)
        } finally {
            setCreatingPacote(false)
        }
    }

    function toggleModuloInLocalState(moduloId) {
        if (!localPacoteState) return
        
        const moduloAtivo = localPacoteState.modulos && localPacoteState.modulos.find(m => m.id === moduloId)
        
        let novosModulos = []
        if (moduloAtivo) {
            // Remove o módulo se já estiver ativo
            novosModulos = localPacoteState.modulos.filter(m => m.id !== moduloId)
        } else {
            // Adiciona o módulo se não estiver ativo
            const moduloParaAdicionar = allModulos.find(m => m.id === moduloId)
            if (moduloParaAdicionar) {
                novosModulos = [...(localPacoteState.modulos || []), moduloParaAdicionar]
            }
        }
        
        setLocalPacoteState({
            ...localPacoteState,
            modulos: novosModulos
        })
        setHasUnsavedChanges(true)
    }

    async function salvarPacoteTransparencia() {
        if (!localPacoteState || !hasUnsavedChanges) return
        
        setManagingModulos(true)
        try {
            // Preparar os dados dos módulos para enviar
            const moduloIds = localPacoteState.modulos ? localPacoteState.modulos.map(m => m.id) : []
            
            // Para cada módulo que está no estado local mas não no servidor, adicionar
            const modulosServidor = pacoteTransparencia.modulos ? pacoteTransparencia.modulos.map(m => m.id) : []
            const modulosParaAdicionar = moduloIds.filter(id => !modulosServidor.includes(id))
            const modulosParaRemover = modulosServidor.filter(id => !moduloIds.includes(id))
            
            // Adicionar módulos
            for (const moduloId of modulosParaAdicionar) {
                const response = await fetch(`${authUrl}/pacote_transparencia/${localPacoteState.id}/modulo/${moduloId}/`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    }
                })
                if (!response.ok) {
                    throw new Error('Erro ao ativar módulo')
                }
            }
            
            // Remover módulos
            for (const moduloId of modulosParaRemover) {
                const response = await fetch(`${authUrl}/pacote_transparencia/${localPacoteState.id}/modulo/${moduloId}/`, {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    }
                })
                if (!response.ok) {
                    throw new Error('Erro ao desativar módulo')
                }
            }
            
            // Atualizar estado local e servidor
            await fetchPacoteTransparencia()
            setHasUnsavedChanges(false)
            toast.success('Pacote de transparência salvo com sucesso!')
            
        } catch (error) {
            toast.error('Erro ao salvar: ' + error.message)
        } finally {
            setManagingModulos(false)
        }
    }

    function cancelarEdicao() {
        setLocalPacoteState(pacoteTransparencia)
        setHasUnsavedChanges(false)
    }

    async function fetchEstabelecimento() {
        setLoading(true)
        try {
            const response = await fetch(`${authUrl}/estabelecimento/${id}/`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            if (response.ok) {
                const data = await response.json()
                if (data.icone) {
                    let mimeType = 'application/octet-stream'
                    const base64PrefixMatch = data.icone.match(/^data:(.*?);base64,/)
                    let base64Data = data.icone
                    if (base64PrefixMatch) {
                        mimeType = base64PrefixMatch[1]
                        base64Data = data.icone.replace(/^data:(.*?);base64,/, '')
                    }
                    const byteCharacters = atob(base64Data)
                    const byteNumbers = new Array(byteCharacters.length)
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i)
                    }
                    const byteArray = new Uint8Array(byteNumbers)
                    const blob = new Blob([byteArray], { type: mimeType })
                    const url = URL.createObjectURL(blob)
                    setIconeUrl(url)
                }
                if (data.certificado) {
                    const byteCharacters = atob(data.certificado)
                    const byteNumbers = new Array(byteCharacters.length)
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i)
                    }
                    const byteArray = new Uint8Array(byteNumbers)
                    setCertificadoBytes(byteArray)
                }
                setEstabelecimento(data)
                if (data.config) {
                    setTipo(data.config.tipo)
                    setAnoRomano(data.config.ano_romano)
                    setNumLei(data.config.num_lei || 0)
                    setData({
                        dia: data.config.dia,
                        mes: data.config.mes,
                        ano: data.config.ano
                    })
                    setUrlSite(data.config.url_site || '')
                }
                if (data.pacote_id) {
                    fetchPacote(data.pacote_id)
                }
            }
            else {
                throw new Error('Erro ao buscar dados do estabelecimento')
            }
        } catch (error) {
            toast.error(error)
        } finally {
            setLoading(false)
        }
    }

    async function fetchPacote() {
        try {
            const response = await fetch(`${authUrl}/pacote/funcionalidades/${id}/`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json()
                setPacote(data)
                setFuncionalidades(data.map(f => f) || [])

                // Verificar se tem funcionalidade Portal da Transparência
                const hasTransparencia = data.some(func => func.nome === 'Portal da Transparência')
                setHasTransparenciaFunctionality(hasTransparencia)
            } else {
                console.error('Erro ao buscar dados do pacote.')
            }
        } catch (error) {
            console.error(error)
        }
    }

    async function fetchAllFuncionalidades() {
        try {
            const response = await fetch(`${authUrl}/funcionalidade/all/`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            if (response.ok) {
                const getAllFunc = await response.json()
                setAllFuncionalidades(getAllFunc)
            } else {
                console.error('Erro ao buscar todas as funcionalidades.')
            }
        } catch (error) {
            console.error(error)
        }
    }

    function handleNumLei(valor) {
        setNumLei(valor)
        setEstabelecimento((prevState) => ({
            ...prevState,
            config: {
                ...prevState.config,
                num_lei: valor
            }
        }));
    }

    function handleTipo(valor) {
        setTipo(valor);
        let cargo = "";
        if (valor === "DA CÂMARA MUNICIPAL") {
            cargo = "PRESIDENTE DA CÂMARA MUNICIPAL";
        } else if (valor === "DO MUNICÍPIO") {
            cargo = "PREFEITO(A) MUNICIPAL";
        }
        setEstabelecimento((prevState) => ({
            ...prevState,
            config: {
                ...prevState.config,
                tipo: valor,
                cargo: cargo
            }
        }));
    }

    function handleData(valor) {
        const [ano, mes, dia] = valor.split('-')
        setEstabelecimento((prevState) => ({
            ...prevState,
            config: {
                ...prevState.config,
                ano: ano,
                mes: mes,
                dia: dia,
                data_lei: valor
            }
        }));
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setEstabelecimento((prevState) => ({ ...prevState, [name]: value }))
    };


    const handleIconeUpload = async (e) => {
        const file = e.target.files[0]
        if (file) {
            const formData = new FormData()
            formData.append('icone', file)
            await fetch(`${authUrl}/estabelecimento/${id}/`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            })
            await fetchEstabelecimento()
        }
    };


    const handleCertificadoUpload = (e) => {
        const file = e.target.files[0]
        if (file) {
            setCertificadoFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                const arrayBuffer = reader.result
                const byteArray = new Uint8Array(arrayBuffer)
                setCertificadoBytes(byteArray)
            }
            reader.readAsArrayBuffer(file)
        }
    }

    const handleAddFuncionalidades = async () => {
        if (selectedFuncIds.length === 0) {
            alert('Selecione pelo menos uma funcionalidade para adicionar.')
            return
        }

        setAdding(true)
        try {
            const response = await fetch(`${authUrl}/pacote/${estabelecimento.pacote_id}?action=add`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    func_ids: selectedFuncIds.map(id => parseInt(id)),
                }),
            })
            if (response.ok) {
                const newFuncs = allFuncionalidades.filter(func => selectedFuncIds.includes(String(func.id)))
                setFuncionalidades((prev) => [...prev, ...newFuncs])
                toast.success('Funcionalidades adicionadas com sucesso')
                setSelectedFuncIds([])
            } else {
                toast.error('Erro ao adicionar as funcionalidades.')
            }
        } catch (error) {
            toast.error('Erro na requisição: ' + error.detail)
        } finally {
            setAdding(false)
        }
    }

    const handleRemoveFuncionalidade = async (funcId) => {
        try {
            const response = await fetch(`${authUrl}/pacote/${estabelecimento.pacote_id}?action=remove`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    func_ids: [funcId],
                }),
            })
            if (response.ok) {
                setFuncionalidades((prev) => prev.filter((func) => func.id !== funcId))
                toast.success('Funcionalidade removida com sucesso')
            } else {
                toast.error('Erro ao remover a funcionalidade.')
            }
        } catch (error) {
            toast.error('Erro interno, tente novamente mais tarde' + error.message)
        }
    }

    function toRoman(num) {
        const romanNumerals = {
            M: 1000, CM: 900, D: 500, CD: 400,
            C: 100, XC: 90, L: 50, XL: 40,
            X: 10, IX: 9, V: 5, IV: 4, I: 1
        };
        let roman = "";
        for (let key in romanNumerals) {
            while (num >= romanNumerals[key]) {
                roman += key;
                num -= romanNumerals[key];
            }
        }
        return roman;

    }

    const handleSaveEstabelecimento = async () => {
        try {
            const formData = new FormData()
            const anoAtual = new Date().getFullYear();
            const anoDiferenca = anoAtual - Number(estabelecimento.config.ano);
            const config = {
                'num_lei': estabelecimento.config.num_lei,
                'ano': estabelecimento.config.ano,
                'dia': estabelecimento.config.dia,
                'tipo': tipo,
                'ano_romano': toRoman(anoDiferenca),
                'mes': estabelecimento.config.mes,
                'cargo': estabelecimento.config.cargo,
                'data_lei': `${estabelecimento.config.ano}-${estabelecimento.config.mes}-${estabelecimento.config.dia}`,
                'url_site': urlSite
            }
            formData.append('nome', estabelecimento.nome)
            formData.append('cidade', estabelecimento.cidade)
            formData.append('responsavel', estabelecimento.responsavel)
            if (certificadoFile) {
                formData.append('certificado', certificadoFile)
            }
            if (senhaCertificado) {
                formData.append('senha_cert', senhaCertificado)
            }

            const response = await fetch(`${authUrl}/estabelecimento/${id}/`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            })
            const configResponse = await fetch(`${authUrl}/estabelecimento/${id}/config/`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-type': 'Application/json'
                },
                body: JSON.stringify({ config })
            })

            if (response.ok && configResponse.ok) {
                await fetchEstabelecimento()
                setIsCertModalOpen(false)
            } else {
                const errorData = await response.json()
                toast.error(`Erro ao salvar os dados: ${errorData.detail}`)
            }
        } catch (error) {
            toast.error('Erro na requisição: ' + error.message)
        }
        finally {
            toast.success('Dados do estabelecimento salvos com sucesso!')
        }
    }

    const downloadCertificado = () => {
        if (!certificadoBytes) {
            toast.error('Certificado não disponível para download.')
            return
        }

        const blob = new Blob([certificadoBytes], { type: 'application/octet-stream' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'Certificado.pfx'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <FiLoader className="animate-spin text-4xl text-azul_escuro" />
            </div>
        )
    }

    return (
        <section className="flex flex-col flex-grow overflow-auto text-azul_escuro items-center bg-gray-50 p-4 md:p-6">
            <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
            <div className="w-full flex flex-col bg-white shadow-lg rounded-lg p-8">
                <h1 className="text-xl md:text-3xl font-bold mb-6 text-center text-azul_escuro">Configurações do Estabelecimento</h1>
                <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex flex-col items-center md:items-start">
                        <div className="relative group h-32 w-32 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                            {iconeUrl ? (
                                <Image
                                    src={iconeUrl}
                                    width={200}
                                    height={200}
                                    alt="Ícone Preview"
                                    className="object-cover w-full h-full"
                                />
                            ) : (
                                <span className="text-gray-400">Sem Ícone</span>
                            )}
                            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <label htmlFor="icone-upload" className="cursor-pointer text-white flex flex-col items-center">
                                    <FiEdit size={24} className="mb-2" />
                                    <span>Editar</span>
                                </label>
                                <input
                                    id="icone-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleIconeUpload(e)}
                                    className="hidden"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col flex-grow p-2">
                        <div className="mb-4">
                            <label className="font-medium mb-1 block text-gray-700">ID</label>
                            <input
                                type="text"
                                value={estabelecimento.id}
                                readOnly
                                className="border border-gray-300 p-3 rounded-lg bg-gray-100 w-full"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="font-medium mb-1 block text-gray-700">Nome</label>
                            <input
                                type="text"
                                name="nome"
                                value={estabelecimento.nome}
                                onChange={handleInputChange}
                                className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="font-medium mb-1 block text-gray-700">Cidade</label>
                            <input
                                type="text"
                                name="cidade"
                                value={estabelecimento.cidade}
                                onChange={handleInputChange}
                                className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="font-medium mb-1 block text-gray-700">Responsável</label>
                            <input
                                type="text"
                                name="responsavel"
                                value={estabelecimento.responsavel}
                                onChange={handleInputChange}
                                className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="font-medium mb-1 block text-gray-700">
                                Lei Municipal
                            </label>
                            <div className="flex gap-2">
                                <span className="p-3 bg-gray-200 rounded-lg">Lei</span>
                                <input
                                    type="number"
                                    onChange={(e) => handleNumLei(e.target.value)}
                                    placeholder="1234"
                                    value={estabelecimento.config.num_lei || ''}
                                    className="border border-gray-300 p-3 rounded-lg w-1/3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="p-3 bg-gray-200 rounded-lg">de</span>
                                <input
                                    type="date"
                                    value={estabelecimento.config.data_lei ? estabelecimento.config.data_lei : ''}
                                    onChange={(e) => handleData(e.target.value)}
                                    placeholder="1234"
                                    className="border border-gray-300 p-3 rounded-lg w-1/3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                </input>
                            </div>
                        </div>
                        <div className="mb-4">
                            <label className="font-medium mb-1 block text-gray-700">
                                URL do Portal da Prefeitura
                            </label>
                            <input
                                type="url"
                                value={urlSite}
                                onChange={(e) => setUrlSite(e.target.value)}
                                placeholder="https://portal.prefeitura.tc.gov.br"
                                className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <small className="text-gray-500">Esta URL será exibida como link nos PDFs de certificado de publicação</small>
                        </div>
                        <div className="mb-6">
                            <label className="font-semibold text-lg mb-2 block text-gray-800">
                                Tipo do estabelecimento
                            </label>

                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border border-gray-300 shadow-sm transition-all hover:bg-gray-100 peer-checked:bg-azul_escuro">
                                    <input
                                        type="radio"
                                        name="tipo"
                                        value="DA CÂMARA MUNICIPAL"
                                        checked={estabelecimento.config.tipo === "DA CÂMARA MUNICIPAL"}
                                        onChange={(e) => handleTipo(e.target.value)}
                                        className="hidden peer"
                                    />
                                    <span className="w-5 h-5 border border-gray-400 rounded-full flex items-center justify-center peer-checked:border-azul_escuro">
                                        {tipo === "DA CÂMARA MUNICIPAL" && <div className="w-3 h-3 bg-azul_escuro rounded-full"></div>}
                                    </span>
                                    Câmara
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border border-gray-300 shadow-sm transition-all hover:bg-gray-100 peer-checked:bg-azul_escuro">
                                    <input
                                        type="radio"
                                        name="tipo"
                                        value="DO MUNICÍPIO"
                                        checked={estabelecimento.config.tipo === "DO MUNICÍPIO"}
                                        onChange={(e) => handleTipo(e.target.value)}
                                        className="hidden peer"
                                    />
                                    <span className="w-5 h-5 border border-gray-400 rounded-full flex items-center justify-center peer-checked:border-azul_escuro">
                                        {tipo === "DO MUNICÍPIO" && <div className="w-3 h-3 bg-azul_escuro rounded-full"></div>}
                                    </span>
                                    Prefeitura
                                </label>
                            </div>
                        </div>
                        <div className="mb-4">
                            <label className="font-medium mb-1 block text-gray-700">Certificado</label>
                            <div className="flex items-center gap-2">
                                {certificadoBytes ? (
                                    <button
                                        onClick={downloadCertificado}
                                        className="flex items-center min-w-0 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
                                    >
                                        <FiDownload className="mr-2" /> Baixar certificado
                                    </button>
                                ) : (
                                    <span className="text-gray-400">Sem Certificado</span>
                                )}
                                <button
                                    onClick={() => setIsCertModalOpen(true)}
                                    className="flex items-center bg-azul_escuro hover:bg-laranja_escuro text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
                                >
                                    <FiEdit className="truncate" /> Gerenciar Certificado
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    <h2 className="text-2xl font-semibold mb-4 text-azul_escuro">Funcionalidades do Pacote</h2>
                    <ul className="space-y-2">
                        {funcionalidades.map((funcionalidade) => (
                            <li key={funcionalidade.id} className="flex items-center justify-between p-4 bg-gray-100 rounded-lg shadow-sm">
                                <span className="text-gray-800">{funcionalidade.nome}</span>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveFuncionalidade(funcionalidade.id)}
                                    className="text-red-500 hover:text-red-700 transition-colors duration-200"
                                >
                                    Remover
                                </button>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-6">
                        <label className="font-medium mb-2 block text-gray-700">Adicionar Funcionalidade:</label>
                        <div className="flex flex-col md:flex-row items-center gap-4">
                            <select
                                multiple
                                value={selectedFuncIds}
                                onChange={(e) => {
                                    const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value)
                                    setSelectedFuncIds(selectedOptions)
                                }}
                                className="border border-azul_escuro-300 p-3 rounded-lg w-full md:flex-1 focus:outline-none focus:ring-2 focus:ring-azul_escuro"
                            >
                                {allFuncionalidades
                                    .filter(
                                        (func) => !funcionalidades.some((f) => f.id === func.id)
                                    )
                                    .map((funcionalidade) => (
                                        <option key={funcionalidade.id} value={funcionalidade.id}>
                                            {funcionalidade.nome}
                                        </option>
                                    ))}
                            </select>
                            <button
                                onClick={handleAddFuncionalidades}
                                disabled={adding || selectedFuncIds.length === 0}
                                className={`flex items-center justify-center bg-azul_escuro hover:bg-laranja_escuro text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 ${adding || selectedFuncIds.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                            >
                                {adding ? <FiLoader className="animate-spin mr-2" /> : null}
                                Adicionar
                            </button>
                        </div>
                    </div>
                </div>

                {/* Pacote de Transparência */}
                {hasTransparenciaFunctionality && (
                    <div className="mt-8 border-t pt-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-semibold text-azul_escuro">Pacote de Transparência</h2>
                        </div>

                        {pacoteTransparencia.length === 0 ? (
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 text-center">
                                <div className="mb-4">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Nenhum pacote de transparência configurado</h3>
                                    <p className="text-gray-600 mb-6">Configure os módulos do portal de transparência para começar a disponibilizar informações públicas.</p>
                                </div>
                                <button
                                    onClick={createPacoteTransparencia}
                                    disabled={creatingPacote}
                                    className="bg-azul_escuro text-white font-semibold py-3 px-8 rounded-lg shadow-lg  disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {creatingPacote ? (
                                        <><FiLoader className="mr-2" /> Criando pacote...</>
                                    ) : (
                                        <>Configurar Pacote de Transparência</>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg shadow-sm border">
                                <div className="bg-azul_escuro text-white p-4 rounded-t-lg">
                                    <h3 className="font-semibold flex items-center">
                                        Módulos Disponíveis
                                    </h3>
                                    <p className="text-blue-100 text-sm mt-1">
                                        Ative os módulos que deseja disponibilizar no portal
                                    </p>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-3 max-h-96 overflow-y-auto">
                                        {allModulos.length > 0 && allModulos.map((modulo) => {
                                            const isActive = localPacoteState?.modulos && localPacoteState.modulos.some(p => p.id === modulo.id)
                                            const isToggling = managingModulos

                                            return (
                                                <div key={modulo.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200">
                                                    <div className="flex items-center space-x-3">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                            isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                                                            }`}>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-medium text-gray-900">{modulo.nome}</h4>
                                                            <p className="text-sm text-gray-500">
                                                                {isActive ? 'Módulo ativo no portal' : 'Módulo desativado'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Toggle Switch */}
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={isActive}
                                                            onChange={() => toggleModuloInLocalState(modulo.id)}
                                                            disabled={isToggling}
                                                            className="sr-only peer"
                                                        />
                                                        <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-azul_escuro ${
                                                            isToggling ? 'opacity-50 cursor-not-allowed' : ''
                                                            }`}></div>
                                                        {isToggling && (
                                                            <></>
                                                        )}
                                                    </label>
                                                </div>
                                            )
                                        })}
                                    </div>

                                    {allModulos.length === 0 && (
                                        <div className="text-center py-8 text-gray-500">
                                            <p>Nenhum módulo disponível</p>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Botões de ação */}
                                {hasUnsavedChanges && (
                                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-lg">
                                        <div className="flex justify-end space-x-3">
                                            <button
                                                onClick={cancelarEdicao}
                                                disabled={managingModulos}
                                                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={salvarPacoteTransparencia}
                                                disabled={managingModulos}
                                                className="px-4 py-2 bg-azul_escuro text-white rounded hover:bg-laranja_escuro transition-colors disabled:opacity-50"
                                            >
                                                {managingModulos ? 'Salvando...' : 'Salvar'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <button
                    onClick={handleSaveEstabelecimento}
                    className="mt-8 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300"
                >
                    Salvar Estabelecimento
                </button>
            </div>

            <Modal title={'Gerenciar Certificado'} isOpen={isCertModalOpen} onClose={() => setIsCertModalOpen(false)}>
                <div className="p-4">
                    {certificadoBytes ? (
                        <div className="mb-4">
                            <p className="font-medium">Certificado Atual:</p>
                            <button
                                onClick={downloadCertificado}
                                className="flex items-center bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 mt-2"
                            >
                                <FiDownload className="mr-2" /> Fazer download
                            </button>
                        </div>
                    ) : (
                        <p className="mb-4 text-gray-500">Nenhum certificado carregado.</p>
                    )}
                    <form onSubmit={(e) => { e.preventDefault(); handleSaveEstabelecimento(); }}>
                        <div className="mb-4">
                            <label className="block text-gray-700 font-medium mb-2">Enviar Novo Certificado</label>
                            <input
                                type='file'
                                accept='.pfx'
                                name='certificado'
                                onChange={handleCertificadoUpload}
                                className="w-full border border-gray-300 p-2 rounded-lg"
                                required={!certificadoBytes}
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 font-medium mb-2">Editar Senha do Certificado</label>
                            <input
                                type='password'
                                name='senha_cert'
                                onChange={(e) => setSenhaCertificado(e.target.value)}
                                className="w-full border border-gray-300 p-2 rounded-lg"
                                placeholder="Digite a nova senha"
                            />
                        </div>
                        <div className='flex w-full'>
                            <button
                                type="submit"
                                className="bg-azul_escuro w-full hover:bg-laranja_escuro text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
                            >
                                Salvar
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </section>
    )
}