'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { ToastContainer } from 'react-toastify'
import { FaDownload } from 'react-icons/fa'
import Footer from '@/app/components/footer'
import { FiLoader } from 'react-icons/fi'
import { Document, Page, pdfjs } from 'react-pdf'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'


const doemUrl = process.env.NEXT_PUBLIC_DOEM_ENDPOINT_URL

const formatSigningDate = (dateString) => {
  if (!dateString) return 'N/A'
  const match = dateString.match(/D:(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/)
  if (match) {
    const [, year, month, day, hour, minute, second] = match
    return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`).toLocaleString('pt-BR')
  }
  return dateString
}

// Polyfill for Promise.withResolvers for Safari compatibility
if (typeof window !== 'undefined' && !Promise.withResolvers) {
  Promise.withResolvers = function () {
    let resolve, reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.js`


export default function ValidarDoem() {
  const params = useParams()
  const assinatura_ref = params.assinatura_ref
  const [status, setStatus] = useState('loading')
  const [doemBlob, setDoemBlob] = useState()
  const [doemMetadata, setDoemMetadata] = useState()
  const [metadataAssinatura, setMetadataAssinatura] = useState()
  const [diarioID, setDiarioID] = useState(false)
  const [numPages, setNumPages] = useState(null)
  const [windowWidth, setWindowWidth] = useState(0)
  const [mobileInfoOpen, setMobileInfoOpen] = useState(false)


  const validarAssinatura = async () => {
    try {
      const res = await fetch(`${doemUrl}/diario/valida/${assinatura_ref}/`)
      if (!res.ok) throw new Error('Assinatura inválida')
      const data = await res.json()
      setStatus('valido')
      setMetadataAssinatura(data.dados_assinatura)
      setDiarioID(data.diario_id)
    } catch (err) {
      setStatus('invalido')
    }
  }

  async function fetchData() {
    try {
      const response = await fetch(`${doemUrl}/diario/${diarioID}/content/`, { method: 'GET' })
      if (!response.ok) throw new Error('Falha ao buscar o diário.')
      const blob = await response.blob()
      setDoemBlob(blob)
    } catch (error) {
      console.error('Erro ao exibir o diário:', error)
    }
  }

  async function fetchMetadata() {
    const response = await fetch(`${doemUrl}/diario/${diarioID}/`, { method: 'GET' })
    if (!response.ok) throw new Error('Falha ao buscar o diário.')
    const metadata = await response.json()
    setDoemMetadata(metadata)
  }

  useEffect(() => {
    if (!assinatura_ref) return
    validarAssinatura()
  }, [assinatura_ref])

  useEffect(() => {
    if (diarioID) {
      fetchData()
      fetchMetadata()
    }
  }, [diarioID])

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

  const handleDownload = async () => {
    try {
      let response = null
      response = await fetch(`${doemUrl}/diario/${diarioID}/content/`, {
        method: 'GET',
      })

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
      link.download = doemMetadata.titulo
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

  if (status === 'loading') return (
    <div className="flex items-center justify-center min-h-screen bg-branco_cinza">
      <FiLoader size={50} className="animate-spin text-4xl text-azul_escuro" />
    </div>
  )

  if (status === 'invalido') return (
    <div className="flex flex-col min-h-screen bg-[#EAECF0]">
      {/* Body */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
          {/* Red top band */}
          <div className="bg-red-600 px-6 py-8 flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-lg leading-tight">Documento Inválido</p>
              <p className="text-red-100 text-sm mt-1">Não foi possível verificar a autenticidade</p>
            </div>
          </div>

          {/* Details */}
          <div className="px-6 py-6 space-y-4">
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-1">Motivo</p>
              <p className="text-gray-700 text-sm font-medium">O código informado não corresponde a nenhum diário registrado ou a assinatura digital não pôde ser verificada.</p>
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Código consultado</p>
              <p className="text-gray-500 text-xs font-mono break-all">{assinatura_ref}</p>
            </div>

            <p className="text-xs text-gray-400 text-center">Consulta realizada em {new Date().toLocaleString('pt-BR')}</p>
          </div>
        </div>
      </div>
    </div>
  )

  if (!doemBlob) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-branco_cinza">
        <FiLoader size={50} className="animate-spin text-4xl text-azul_escuro" />
      </div>
    )
  }


  const InfoFields = () => (
    <div className='px-4 sm:px-6 pb-5 space-y-3 text-sm'>
      <div className='bg-gray-50 rounded-xl px-4 py-3 border border-gray-100'>
        <p className='text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1'>Motivo</p>
        <p className='text-gray-800 font-medium leading-snug'>{metadataAssinatura?.reason}</p>
      </div>
      <div className='bg-gray-50 rounded-xl px-4 py-3 border border-gray-100'>
        <p className='text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1'>Data e Hora</p>
        <p className='text-gray-800 font-medium'>{formatSigningDate(metadataAssinatura?.signingdate)}</p>
      </div>
      {metadataAssinatura?.location && (
        <div className='bg-gray-50 rounded-xl px-4 py-3 border border-gray-100'>
          <p className='text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1'>Localização</p>
          <p className='text-gray-800 font-medium'>{metadataAssinatura.location}</p>
        </div>
      )}
      {metadataAssinatura?.contact && (
        <div className='bg-gray-50 rounded-xl px-4 py-3 border border-gray-100'>
          <p className='text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1'>Contato</p>
          <p className='text-gray-800 font-medium break-all'>{metadataAssinatura.contact}</p>
        </div>
      )}
      {metadataAssinatura?.proprietario && (
        <div className='bg-gray-50 rounded-xl px-4 py-3 border border-gray-100'>
          <p className='text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1'>Proprietário</p>
          <p className='text-gray-800 font-medium'>{metadataAssinatura.proprietario}</p>
        </div>
      )}
      <div className='rounded-xl border border-dashed border-gray-200 px-4 py-3 bg-white'>
        <p className='text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2'>Código de Referência</p>
        <p className='text-gray-500 text-[11px] font-mono break-all leading-relaxed'>{metadataAssinatura?.cod_ref}</p>
      </div>
      <p className='text-[11px] text-gray-400 text-center pt-1'>Validado em {new Date().toLocaleString('pt-BR')}</p>
    </div>
  )

  return (
    <div className='flex flex-col h-svh bg-[#EAECF0]'>
      <ToastContainer />

      {/* Header */}
      <header className='shrink-0 bg-azul_escuro text-white shadow-2xl px-4 sm:px-8 flex flex-col justify-center' style={{ minHeight: '70px' }}>
        <div className='flex items-center justify-between gap-3'>
          <div className='flex flex-col min-w-0'>
            <span className='hidden sm:block text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40 mb-0.5'>Diário Oficial Eletrônico Municipal</span>
            <p className='text-sm sm:text-base lg:text-lg font-bold leading-snug truncate text-white'>{doemMetadata?.titulo}</p>
            {doemMetadata?.data_publicacao && (
              <span className='hidden sm:block text-xs text-white/50 mt-0.5'>
                Publicado em {doemMetadata.data_publicacao.split('-').reverse().join('/')}
              </span>
            )}
          </div>

          <div className='flex items-center gap-2 shrink-0'>
            {/* Botão de info — apenas mobile */}
            <button
              className='lg:hidden flex items-center gap-1.5 bg-green-500/80 hover:bg-green-500 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors'
              onClick={() => setMobileInfoOpen(v => !v)}
              title='Ver dados da assinatura'
            >
              <svg className='w-3.5 h-3.5' fill='currentColor' viewBox='0 0 20 20'>
                <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' />
              </svg>
              <span>{mobileInfoOpen ? 'Fechar' : 'Assinado'}</span>
            </button>

            <button
              className='flex items-center gap-2 bg-white text-azul_escuro text-xs sm:text-sm font-semibold px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl shadow-md hover:bg-branco_cinza transition-colors duration-150'
              onClick={handleDownload}
              title='Baixar documento'
            >
              <FaDownload size={13} />
              <span className='hidden sm:inline'>Baixar PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* Painel de info mobile — colapsável abaixo do header */}
      <div
        className={`lg:hidden bg-white border-b border-gray-200 overflow-y-auto transition-all duration-300 ease-in-out ${mobileInfoOpen ? 'max-h-[50vh] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
          }`}
      >
        <div className='bg-gradient-to-br from-green-500 to-green-700 px-4 py-4 flex items-center gap-3'>
          <div className='w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center shrink-0'>
            <svg className='w-4 h-4 text-white' fill='currentColor' viewBox='0 0 20 20'>
              <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' />
            </svg>
          </div>
          <div>
            <p className='text-white font-bold text-sm'>Documento Verificado</p>
            <p className='text-green-100 text-xs'>Assinatura digital válida</p>
          </div>
        </div>
        <div className='px-4 pt-4 pb-1'>
          <p className='text-[11px] font-bold uppercase tracking-widest text-gray-400'>Dados da Assinatura</p>
        </div>
        <InfoFields />
      </div>

      {/* Corpo: sidebar + PDF */}
      <div className='flex flex-1 overflow-hidden'>

        {/* Sidebar — visível apenas em lg+ */}
        <aside className='hidden lg:flex w-80 shrink-0 bg-white flex-col overflow-y-auto shadow-[1px_0_0_0_#e5e7eb]'>
          <div className='bg-gradient-to-br from-green-500 to-green-700 px-6 py-6 flex items-center gap-3'>
            <div className='w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 shadow-inner'>
              <svg className='w-6 h-6 text-white' fill='currentColor' viewBox='0 0 20 20'>
                <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' />
              </svg>
            </div>
            <div>
              <p className='text-white font-bold text-base leading-tight'>Documento Verificado</p>
              <p className='text-green-100 text-xs mt-1'>Assinatura digital válida</p>
            </div>
          </div>
          <div className='px-6 pt-5 pb-2'>
            <p className='text-[11px] font-bold uppercase tracking-widest text-gray-400'>Dados da Assinatura</p>
          </div>
          <InfoFields />
          <div className='mt-auto px-6 py-4 border-t border-gray-100 bg-gray-50'>
            <p className='text-[11px] text-gray-400 text-center'>Validado em {new Date().toLocaleString('pt-BR')}</p>
          </div>
        </aside>

        {/* Área do PDF */}
        <div className='flex-1 overflow-y-auto'>
          <div className='flex flex-col items-center py-4 sm:py-8 px-2 sm:px-6 gap-1'>
            <Document
              file={doemBlob}
              onLoadSuccess={onLoadSuccess}
              loading={
                <div className='flex items-center justify-center py-20'>
                  <FiLoader size={32} className='animate-spin text-azul_escuro' />
                </div>
              }
            >
              {Array.from(new Array(numPages), (_, i) => (
                <Page
                  className='mb-4 shadow-2xl rounded overflow-hidden'
                  key={i}
                  pageNumber={i + 1}
                  scale={scale}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              ))}
            </Document>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}
