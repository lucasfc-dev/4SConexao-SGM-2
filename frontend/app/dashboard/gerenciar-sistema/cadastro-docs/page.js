'use client'
import { useEffect, useState } from "react"
import FormDocsMultiplos from "../../gestao-de-documentos/components/formDocsMultiplos"
import { apiOrgaos } from "@/app/api/apiOrgaos"
import { toast, ToastContainer } from "react-toastify"
import Cookies from "js-cookie"
import 'react-toastify/dist/ReactToastify.css'


const gedUrl = process.env.NEXT_PUBLIC_GED_ENDPOINT_URL

export default function CadastroDocs() {
    const [ orgaos, setOrgaos ] = useState()
    const [ listaTipos, setListaTipos ] = useState()
    const token = Cookies.get('auth-token')

    const getOrgaos = async () => {
        try {
            const fetchOrgaos = await apiOrgaos.getAll()
            setOrgaos(fetchOrgaos)
        } catch (error) {
            toast.error('Erro ao carregar órgãos')
        }
    }

    const getTipos = async () => {
        try {
            const response = await fetch(`${gedUrl}/tipo/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })
            const tipos = await response.json()
            setListaTipos(tipos)
            return tipos
        } catch (error) {
            console.error('Erro ao obter tipos de documento:', error)
            return []
        }
    }


    async function handleEnviar(e) {
        const formulario = new FormData(e.target)
        try {
            const response = await fetch(`${gedUrl}/docs/multifiles/`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formulario,
            })
            if (!response.ok) {
                throw new Error('Falha ao enviar documentos')
            }
            e.target.reset()
            toast.success('Documentos enviados com sucesso!')
        }
        catch (error) {
            toast.error(error.message)
        }
    }

    useEffect(() => {
        getOrgaos()
        getTipos()
    }, [])

    return (
        <section className="flex flex-col flex-grow overflow-auto text-azul_escuro bg-gradient-to-br from-gray-200 to-gray-300 p-2 md:p-4">
            <ToastContainer></ToastContainer>
            <FormDocsMultiplos listaOrgaos={orgaos} onSubmit={handleEnviar} listaTipos={listaTipos} titulo="Cadastrar documentos" btnLabel="Cadastrar documentos"/>
        </section>
    )
}