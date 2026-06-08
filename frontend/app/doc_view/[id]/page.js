'use client'
import PDFViewer from "@/app/components/pdfViewer";
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { FiLoader } from "react-icons/fi";


const gedUrl = process.env.NEXT_PUBLIC_GED_ENDPOINT_URL;

export default function DocView() {
    const { id } = useParams()
    const [docBlob, setDocBlob] = useState()
    const [docMetadata, setDocMetadata] = useState()
    const [loading, setLoading] = useState(false)

    async function fetchData() {
        try {
            const response = await fetch(`${gedUrl}/docs/${id}/content/`, {
                method: "GET",
            });
            if (!response.ok) {
                throw new Error("Falha ao buscar o diário.")
            }
            const conteudo = await response.blob()
            setDocBlob(conteudo)
        } catch (error) {
            console.error("Erro ao exibir o diário:", error)
        }
    }

    async function fetchMetadata() {
        const response = await fetch(`${gedUrl}/docs/${id}/`, {
            method: "GET",
        });
        if (!response.ok) {
            throw new Error("Falha ao buscar o diário.")
        }
        const metadata = await response.json()
        setDocMetadata(metadata)
    }

    useEffect(() => {
        if (id) {
            setLoading(true)
            fetchData()
            fetchMetadata()
            setLoading(false)
        }
    }, [id])


    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-branco_cinza">
                <FiLoader size={50} className="animate-spin text-4xl text-azul_escuro" />
            </div>
        )
    }

    return (
        <PDFViewer pdfBlob={docBlob} titulo={docMetadata?.titulo} id={docMetadata?.id} downloadViewType={'docs'}></PDFViewer>

    )
}