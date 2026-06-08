'use client'

import { useEffect, useMemo, useState } from 'react'
import { FaDownload } from 'react-icons/fa'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import Footer from './footer'
import { FiLoader } from 'react-icons/fi'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// Polyfill for Promise.withResolvers for Safari compatibility
if (typeof window !== 'undefined' && !Promise.withResolvers) {
    Promise.withResolvers = function() {
        let resolve, reject;
        const promise = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
        });
        return { promise, resolve, reject };
    };
}

const gedUrl = process.env.NEXT_PUBLIC_GED_ENDPOINT_URL
const doemUrl = process.env.NEXT_PUBLIC_DOEM_ENDPOINT_URL
pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.js`

export default function PDFViewer({ pdfBlob, titulo, id, downloadViewType }) {
  const [numPages, setNumPages] = useState(null)
  const [windowWidth, setWindowWidth] = useState(0)

  useEffect(() => {
    setWindowWidth(window.innerWidth)
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const scale = useMemo(() => {
    if (windowWidth > 1024) return 1.5
    if (windowWidth > 700) return 1.0
    if (windowWidth > 450) return 0.5
    return 0.5
  }, [windowWidth])

  const handleDownload = async (id, viewType) => {
    try {
      let response = null
      if (viewType === 'doem') {
        response = await fetch(`${doemUrl}/diario/${id}/content/`, {
          method: 'GET',
        })
      }
      else if (viewType === 'ged') {
        response = await fetch(`${gedUrl}/docs/${id}/content/`, {
          method: 'GET',
        })
      }

      if (!response.ok) {
        throw new Error('Falha ao baixar documento')
      }

      const blob = await response.blob()
      const urlBlob = URL.createObjectURL(blob)
      if (!blob) {
        throw new Error('Conteúdo do documento não encontrado')
      }

      const link = document.createElement('a')
      link.href = urlBlob
      link.download = titulo
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Download iniciado com sucesso!')
    }
    catch (error) {
      toast.error(error.message)
    }
  }

  const onLoadSuccess = ({ numPages }) => setNumPages(numPages)

  if (!pdfBlob) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-branco_cinza">
        <FiLoader size={50} className="animate-spin text-4xl text-azul_escuro" />
      </div>
    )
  }


  return (
    <div className='flex flex-col items-center min-w-screen min-h-screen bg-azul_escuro'>
      <ToastContainer></ToastContainer>
      <header className='flex h-24 shadow-2xl sticky justify-between top-0 z-10 items-center w-full text-azul_escuro bg-branco_cinza px-4'>
        <p className='text-lg font-bold'>{titulo}</p>
        {downloadViewType === 'doem' ? <button className='cursor-pointer' onClick={() => handleDownload(id, 'doem')}>
          <FaDownload size={24}></FaDownload>
        </button> :
          <button className='cursor-pointer' onClick={() => handleDownload(id, 'ged')}>
            <FaDownload size={24}></FaDownload>
          </button>}
      </header>
      <div className='px-2 w-full flex flex-col items-center'>
        <Document
          className={'mb-6'}
          file={pdfBlob}
          onLoadSuccess={onLoadSuccess}
          loading='Renderizando...'
        >
          {Array.from(new Array(numPages), (_, i) => (
            <Page
              className='m-8 shadow-lg'
              key={i}
              pageNumber={i + 1}
              scale={scale}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          ))}
        </Document>
      </div>
      <Footer></Footer>
    </div>
  )
}