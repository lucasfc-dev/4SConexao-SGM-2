'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

const GEDUrl = process.env.NEXT_PUBLIC_GED_ENDPOINT_URL

export default function ValidarDoc() {
  const params = useParams()
  const assinatura_ref = params.assinatura_ref
  const [status, setStatus] = useState('loading')
  const [iframeSrc, setIframeSrc] = useState()
  const [docID, setDocID] = useState(false)
  const [docInfo, setDocInfo] = useState(null)

  const validarAssinatura = async () => {
    try {
      const res = await fetch(`${GEDUrl}/docs/valida/${assinatura_ref}/`)
      if (!res.ok) throw new Error('Assinatura inválida')
      const data = await res.json()
      setDocInfo(data)
      setStatus('valido')
      setDocID(data.doc_id)
    } catch (err) {
      setStatus('invalido')
    }
  }

  const getData = async (docID) => {
    try {
      const resContent = await fetch(`${GEDUrl}/docs/${docID}/content/`)
      const docContent = await resContent.blob()
      const url = URL.createObjectURL(docContent)
      setIframeSrc(url)
    }
    catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    if (!assinatura_ref) return
    validarAssinatura()
  }, [assinatura_ref])

  useEffect(() => {
    if (docID) getData(docID)
  }, [docID])

  if (status === 'loading') return (
    <div className="flex items-center justify-center h-screen text-xl font-medium">
      Validando documento...
    </div>
  )

  if (status === 'invalido') return (
    <div className="flex items-center justify-center h-screen text-red-600 text-xl font-semibold">
      Assinatura inválida ou documento não encontrado.
    </div>
  )

  return (
    <div className="relative w-screen h-screen">
      <iframe 
        src={iframeSrc} 
        className="w-full h-full border-none"
      />

      <div className="absolute top-16 left-4 bg-white bg-opacity-90 shadow-xl rounded-xl p-4 text-sm max-w-sm">
        <h2 className="text-lg font-semibold mb-2 text-green-700">Documento Assinado ✅</h2>
        <p><span className="font-medium">Assinado em:</span> {docInfo?.signed_at}</p>
      </div>
    </div>
  )
}
