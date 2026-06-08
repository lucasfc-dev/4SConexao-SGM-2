"use client"
import Cookies from "js-cookie"
import { useEffect, useState } from "react"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { CgSpinner } from "react-icons/cg"

const acUrl = process.env.NEXT_PUBLIC_AC_ENDPOINT_URL

export default function CadastroContratos() {
  const token = Cookies.get('auth-token')
  const [listaDocs, setListaDocs] = useState([])
  const [listaSecoes, setListaSecoes] = useState([])
  const [loading, setLoading] = useState(false)
  const [parseNumContrato, setParseNumContrato] = useState(false)

  const fetchSecoes = async () => {
    try {
      const response = await fetch(`${acUrl}/secao/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error()
      setListaSecoes(await response.json())
    } catch {
      toast.error('Erro ao carregar seções')
    }
  }

  useEffect(() => {
    fetchSecoes()
  }, [])

  const handleFileChange = (e) => {
    setListaDocs(Array.from(e.target.files))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('secao_id', e.target.secao_id.value)
      formData.append('pub_date', e.target.pub_date.value)
      listaDocs.forEach((file) => formData.append('files', file))

      const url = new URL(`${acUrl}/contrato/multiple/`)
      if (parseNumContrato) url.searchParams.set('parse_num_contrato', 'true')
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.detail || 'Erro ao cadastrar contratos')
      }

      e.target.reset()
      setListaDocs([])
      toast.success('Contrato(s) cadastrado(s) com sucesso!')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="flex flex-col flex-grow overflow-auto text-azul_escuro bg-gradient-to-br from-gray-200 to-gray-300 p-8">
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
      <div className="flex flex-col w-full mx-auto bg-white shadow-lg rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-6 text-center text-azul_escuro">Cadastrar Contratos</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Seção</label>
            <select
              name="secao_id"
              required
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-azul_escuro"
            >
              <option value="">Selecione uma seção</option>
              {listaSecoes.map((secao) => (
                <option key={secao.id} value={secao.id}>{secao.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">Data de publicação</label>
            <input
              type="date"
              name="pub_date"
              required
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-azul_escuro"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="parse_num_contrato"
              checked={parseNumContrato}
              onChange={(e) => setParseNumContrato(e.target.checked)}
              className="w-4 h-4 accent-azul_escuro cursor-pointer"
            />
            <label htmlFor="parse_num_contrato" className="text-gray-700 font-medium cursor-pointer select-none">
              Extrair Numero/Ano do arquivo
            </label>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">Arquivos dos contratos</label>
            <input
              type="file"
              name="files"
              multiple
              required
              onChange={handleFileChange}
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-azul_escuro"
            />
          </div>

          <button
            type="submit"
            disabled={loading || listaDocs.length === 0}
            className={`w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-md transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              loading || listaDocs.length === 0
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-azul_escuro text-white hover:bg-laranja_escuro focus:ring-laranja_escuro'
            }`}
          >
            {loading ? (
              <>
                <CgSpinner className="w-5 h-5 animate-spin" />
                Cadastrando...
              </>
            ) : (
              'Cadastrar'
            )}
          </button>

          <div className="mt-6">
            {listaDocs.map((file, index) => (
              <div key={index} className="bg-white p-4 mb-4 shadow-md rounded-md border border-gray-100">
                <h3 className="font-semibold">Contrato {index + 1}</h3>
                <p>Nome: {file.name}</p>
                <p>Tamanho: {(file.size / 1024).toFixed(2)} KB</p>
              </div>
            ))}
          </div>
        </form>
      </div>
    </section>
  )
}
