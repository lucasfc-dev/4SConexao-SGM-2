'use client'
import PDFViewer from "@/app/components/pdfViewer";
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"


const doemUrl = process.env.NEXT_PUBLIC_DOEM_ENDPOINT_URL;
export default function DOEM() {
    const { id } = useParams()
    const [doemBlob, setDoemBlob] = useState()
    const [doemMetadata, setDoemMetadata] = useState()
    const [loading, setLoading] = useState(false)
    async function fetchData() {
        try {
            const response = await fetch(`${doemUrl}/diario/${id}/content/`, {
                method: "GET",
            });
            if (!response.ok) {
                throw new Error("Falha ao buscar o diário.")
            }
            const blob = await response.blob()
            setDoemBlob(blob)
        } catch (error) {
            console.error("Erro ao exibir o diário:", error)
        }
    }

    async function fetchMetadata() {
        const response = await fetch(`${doemUrl}/diario/${id}/`, {
            method: "GET",
        });
        if (!response.ok) {
            throw new Error("Falha ao buscar o diário.")
        }
        const metadata = await response.json()
        setDoemMetadata(metadata)
    }

    useEffect(() => {
        if (id) {
            setLoading(true)
            fetchData()
            fetchMetadata()
            setLoading(false)
        }
    }, [id])

    if (loading) { return 'Carregando dados' }

    return (
        <PDFViewer pdfBlob={doemBlob} titulo={doemMetadata?.titulo} id={id} downloadViewType={'doem'}></PDFViewer>
    );
}