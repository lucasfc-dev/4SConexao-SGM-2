"use client"
import { useAuth } from "@/app/context/AuthContext"
import Cookies from "js-cookie"
import { useEffect, useState } from "react"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { CgSpinner } from "react-icons/cg";


const doemUrl = process.env.NEXT_PUBLIC_DOEM_ENDPOINT_URL

export default function CadastroDoem() {
  const token = Cookies.get('auth-token')
  const [listaDocs, setListaDocs] = useState({})
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  const handleFileChange = (e) => {
    const uploadedFiles = Array.from(e.target.files)
    setListaDocs(uploadedFiles)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const estabelecimentoId = e.target.estabelecimento_id.value
      const formData = new FormData()
      listaDocs.forEach((file) => {
        formData.append('files', file)
      })
      formData.append('estabelecimento_id', estabelecimentoId)
      const response = await fetch(`${doemUrl}/diario/upload/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData
      })
      if (response.ok) {
        setLoading(false)
        setListaDocs([])
        toast.success('Diário(s) cadastrado(s) com sucesso!')
      }
      else {
        toast.error(error)
        throw new Error(error.detail || 'Erro ao cadastrar. Tente novamente.')
      }
    }
    catch (error) {
      console.error(error)
    }
  }

  return (
    <section className="flex flex-col flex-grow overflow-auto text-azul_escuro bg-gradient-to-br from-gray-200 to-gray-300 p-8">
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
      <div className="flex flex-col w-full mx-auto bg-white shadow-lg rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-6 text-center text-azul_escuro">Cadastrar DOEM</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-medium mb-2">ID do estabelecimento</label>
            <input
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-azul_escuro"
              value={user?.estabelecimento.id ? user?.estabelecimento.id : ''}
              name="estabelecimento_id"
              readOnly
            ></input>
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">Faça o upload do DOEM</label>
            <input
              type="file"
              name="files"
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-azul_escuro"
              multiple
              onChange={(e) => handleFileChange(e)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading || listaDocs.length === 0}
            className={`w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-md transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${loading || listaDocs.length === 0
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed' // Estilo quando desativado
                : 'bg-azul_escuro text-white hover:bg-laranja_escuro focus:ring-laranja_escuro' // Estilo normal
              }`}
          >
            {loading ? (
              <>
                <CgSpinner className="w-5 h-5 animate-spin" />
                Cadastrando...
              </>
            ) : (
              "Cadastrar"
            )}
          </button>


          {/* Exibe os documentos carregados como cards */}
          <div className="mt-6">
            {listaDocs.length > 0 && listaDocs.map((file, index) => (
              <div key={index} className="bg-white p-4 mb-4 shadow-md rounded-md">
                <h3 className="font-semibold">Documento {index + 1}</h3>
                <p className="">Nome: {file.name}</p>
                <p className="">Tamanho: {(file.size / 1024).toFixed(2)} KB</p>
              </div>
            ))}
          </div>
        </form>
      </div>
    </section>
  )
}