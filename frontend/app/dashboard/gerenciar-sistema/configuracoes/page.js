'use client'

import { apiOrgaos } from '@/app/api/apiOrgaos'
import Modal from '@/app/components/modal'
import { useAuth } from '@/app/context/AuthContext'
import Cookies from 'js-cookie'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { FiChevronDown, FiChevronUp, FiDownload, FiEdit, FiLoader } from 'react-icons/fi'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const authUrl = process.env.NEXT_PUBLIC_AUTH_ENDPOINT_URL

export default function DetalhesEstabelecimento() {
    const router = useRouter()
    const token = Cookies.get('auth-token')
    const [estabelecimento, setEstabelecimento] = useState({})
    const [pacote, setPacote] = useState(null)
    const [funcionalidades, setFuncionalidades] = useState([])
    const [loading, setLoading] = useState(true)
    const [certificadoBytes, setCertificadoBytes] = useState(null)
    const [senhaCertificado, setSenhaCertificado] = useState(null)
    const [isCertModalOpen, setIsCertModalOpen] = useState(false)
    const [iconeUrl, setIconeUrl] = useState(null)
    const [certificadoFile, setCertificadoFile] = useState()
    const [orgaos, setOrgaos] = useState([])
    const [numeracaoFiscalizacaoPorOrgao, setNumeracaoFiscalizacaoPorOrgao] = useState({})
    const [isOrgaosConfigExpanded, setIsOrgaosConfigExpanded] = useState(false)
    const { user } = useAuth()

    useEffect(() => {
        if (user && user.estabelecimento && user.estabelecimento.id) {
            fetchEstabelecimento(user.estabelecimento.id)
            fetchOrgaos()
        } else {
            toast.error('Usuário ou estabelecimento não está disponível.')
            setLoading(false)
        }
    }, [token, user])

    useEffect(() => {
        if (iconeUrl) {
            return () => URL.revokeObjectURL(iconeUrl)
        }
    }, [iconeUrl])

    async function fetchEstabelecimento() {
        setLoading(true)
        try {
            const response = await fetch(`${authUrl}/estabelecimento/${user.estabelecimento.id}/`, {
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
                setNumeracaoFiscalizacaoPorOrgao(
                    data?.config?.numero_inicial_fiscalizacao_por_orgao || {}
                )
                if (data.pacote_id) {
                    fetchPacote(data.pacote_id)
                }
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    async function fetchOrgaos() {
        try {
            const data = await apiOrgaos.getAll()
            setOrgaos(data || [])
        } catch (error) {
            toast.error('Erro ao carregar órgãos para configuração de numeração.')
        }
    }

    async function fetchPacote(pacoteId) {
        setLoading(true)
        try {
            const response = await fetch(`${authUrl}/pacote/funcionalidades/${user.estabelecimento.id}/`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
            if (response.ok) {
                const data = await response.json()
                setPacote(data)
                setFuncionalidades(data || [])
            } else {
                const errorData = await response.json()
                toast.error(`Erro ao buscar dados do pacote: ${errorData.detail || 'Desconhecido'}`)
            }
        } catch (error) {
            console.error('Erro na requisição de pacote:', error)
        }
        finally {
            setLoading(false)
        }
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setEstabelecimento((prevState) => ({ ...prevState, [name]: value }))
    }

    const handleIconeUpload = async (e) => {
        const file = e.target.files[0]
        if (file) {
            const formData = new FormData()
            formData.append('icone', file)
            const response = await fetch(`${authUrl}/estabelecimento/${user.estabelecimento.id}/`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            })
            if (response.ok) {
                const data = await response.json()
                setEstabelecimento((prevState) => ({
                    ...prevState,
                    icone: data.icone,
                }))
                await fetchEstabelecimento()
                toast.success('Ícone do estabelecimento atualizado com sucesso!')
            } else {
                toast.error('Erro ao fazer upload do ícone.');
            }
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

    const handleNumeroInicialOrgaoChange = (orgaoId, value) => {
        const valorNumerico = Number(value)
        if (value !== '' && (!Number.isInteger(valorNumerico) || valorNumerico < 1)) {
            return
        }

        setNumeracaoFiscalizacaoPorOrgao((prev) => ({
            ...prev,
            [orgaoId]: value === '' ? '' : valorNumerico,
        }))
    }


    const handleSaveEstabelecimento = async () => {
        try {
            const numeroInicialConfig = Object.entries(numeracaoFiscalizacaoPorOrgao).reduce(
                (acc, [orgaoId, valor]) => {
                    const numero = Number(valor)
                    if (Number.isInteger(numero) && numero >= 1) {
                        acc[orgaoId] = numero
                    }
                    return acc
                },
                {}
            )

            const formData = new FormData()
            formData.append('nome', estabelecimento.nome)
            formData.append('cidade', estabelecimento.cidade)
            formData.append('responsavel', estabelecimento.responsavel)
            if (certificadoFile) {
                formData.append('certificado', certificadoFile)
            }
            if (senhaCertificado) {
                formData.append('senha_cert', senhaCertificado)
            }

            const response = await fetch(`${authUrl}/estabelecimento/${user.estabelecimento.id}/`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            })

            const configResponse = await fetch(`${authUrl}/estabelecimento/${user.estabelecimento.id}/config/`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    config: {
                        numero_inicial_fiscalizacao_por_orgao: numeroInicialConfig,
                    },
                }),
            })

            if (response.ok && configResponse.ok) {
                toast.success('Dados do estabelecimento salvos com sucesso!')
                await Promise.all([response.json(), configResponse.json()])
                router.refresh()
                setIsCertModalOpen(false)
                await fetchEstabelecimento()
            } else {
                const errorData = response.ok ? await configResponse.json() : await response.json()
                toast.error(`Erro ao salvar os dados: ${errorData.detail}`)
            }
        } catch (error) {
            toast.error('Erro na requisição: ' + error.message)
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
        <section className="flex flex-col flex-grow overflow-auto items-center justify-start bg-gradient-to-br from-gray-200 to-gray-300 p-4 md:p-8">
            <ToastContainer size={500} hideProgressBar={false}></ToastContainer>
            <div className="w-full bg-white shadow-lg rounded-lg p-4">
                <h1 className="text-2xl font-bold mb-6 text-center text-azul_escuro">Configurações do Estabelecimento</h1>
                <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex flex-col items-center md:items-start">
                        <div className="relative group rounded-full h-36 w-36 overflow-hidden bg-gray-100 flex items-center justify-center">
                            {iconeUrl ? (
                                <Image
                                    src={`${iconeUrl}`}
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
                                    onChange={handleIconeUpload}
                                    className="hidden"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col flex-grow">
                        <div className="mb-4">
                            <label className="font-medium mb-1 block text-gray-700">ID</label>
                            <input
                                type="text"
                                value={estabelecimento.id || ''}
                                readOnly
                                className="border border-gray-300 p-3 rounded-lg bg-gray-100 w-full"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="font-medium mb-1 block text-gray-700">Nome</label>
                            <input
                                type="text"
                                name="nome"
                                value={estabelecimento.nome || ''}
                                onChange={handleInputChange}
                                className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="font-medium mb-1 block text-gray-700">Cidade</label>
                            <input
                                type="text"
                                name="cidade"
                                value={estabelecimento.cidade || ''}
                                onChange={handleInputChange}
                                className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="font-medium mb-1 block text-gray-700">Responsável</label>
                            <input
                                type="text"
                                name="responsavel"
                                value={estabelecimento.responsavel || ''}
                                onChange={handleInputChange}
                                className="border border-gray-300 p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <label className="font-medium block text-gray-700">Numeração inicial da fiscalização por órgão</label>
                                <button
                                    type="button"
                                    onClick={() => setIsOrgaosConfigExpanded((prev) => !prev)}
                                    aria-label={isOrgaosConfigExpanded ? 'Recolher lista de órgãos' : 'Expandir lista de órgãos'}
                                    className="h-8 w-8 flex items-center justify-center rounded-md border border-gray-300 bg-gray-100 text-azul_escuro hover:bg-gray-200 transition-colors duration-200"
                                >
                                    {isOrgaosConfigExpanded ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
                                </button>
                            </div>

                            {isOrgaosConfigExpanded && (
                                <div className="space-y-2 max-h-48 overflow-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                                    {orgaos.length > 0 ? (
                                        orgaos.map((orgao) => (
                                            <div key={orgao.id} className="flex items-center justify-between gap-3">
                                                <span className="text-sm text-gray-700 truncate">{orgao.nome}</span>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    step={1}
                                                    value={numeracaoFiscalizacaoPorOrgao[orgao.id] ?? ''}
                                                    onChange={(e) => handleNumeroInicialOrgaoChange(orgao.id, e.target.value)}
                                                    placeholder="1"
                                                    className="w-24 border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500">Nenhum órgão encontrado.</p>
                                    )}
                                </div>
                            )}
                            <p className="text-xs text-gray-500 mt-1">Se vazio, o sistema usa 1 como número inicial.</p>
                        </div>
                        <div className="mb-4">
                            <label className="font-medium mb-1 block text-gray-700">Certificado</label>
                            <div className="flex items-center space-x-4">
                                {certificadoBytes ? (
                                    <button
                                        onClick={downloadCertificado}
                                        className="flex items-center bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
                                    >
                                        <FiDownload className="mr-2" /> Fazer download do certificado
                                    </button>
                                ) : (
                                    <span className="text-gray-400">Sem Certificado</span>
                                )}
                                <button
                                    onClick={() => setIsCertModalOpen(true)}
                                    className="flex items-center bg-azul_escuro hover:bg-laranja_escuro text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
                                >
                                    <FiEdit className="mr-2" /> Gerenciar Certificado
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    <h2 className="text-2xl font-semibold mb-4 text-azul_escuro">Funcionalidades do Pacote</h2>
                    {funcionalidades.length > 0 ? (
                        <ul className="space-y-2">
                            {funcionalidades.map((funcionalidade) => (
                                <li key={funcionalidade.id} className="flex items-center justify-between p-4 bg-gray-100 rounded-lg shadow-sm">
                                    <span className="text-gray-800">{funcionalidade.nome}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-600">Nenhuma funcionalidade disponível.</p>
                    )}
                </div>
                <div className='flex w-full justify-end'>
                    <button
                        onClick={handleSaveEstabelecimento}
                        className="mt-8 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-12 rounded-lg transition-colors duration-300"
                    >
                        Salvar Estabelecimento
                    </button>
                </div>

            </div>
            <Modal isOpen={isCertModalOpen} title={'Gerenciar Certificado'} onClose={() => setIsCertModalOpen(false)}>
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
                                value={senhaCertificado ? senhaCertificado : ''}
                                onChange={(e) => setSenhaCertificado(e.target.value)}
                                className="w-full border border-gray-300 p-2 rounded-lg"
                                placeholder="Digite a nova senha"
                            />
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                type="button"
                                onClick={() => setIsCertModalOpen(false)}
                                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-azul_escuro text-white font-medium rounded-lg hover:bg-blue-800 transition-colors"
                            >
                                Salvar Alterações
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </section>
    )
}
