'use client'
import { useState } from 'react';
import { TbLoader2 } from 'react-icons/tb';

export default function FormDocsMultiplos({
  titulo = 'Cadastrar documentos em lote',
  btnLabel = 'Cadastrar documentos',
  listaTipos = [],
  listaOrgaos = [],
  onSubmit,
}) {

  const [enviando, setEnviando] = useState(false)
  const [arquivos, setArquivos] = useState([])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setEnviando(true)
    await onSubmit(e)
    setArquivos([])
    setEnviando(false)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-4 rounded-lg shadow-sm border"
    >
      <h2 className="text-xl font-semibold mb-4 text-azul_escuro">{titulo}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Tipo de Documento *
          </label>
          <select
            name="tipo_id"
            className="w-full border rounded px-3 py-2"
            required
          >
            <option value="">Selecione o tipo</option>
            {listaTipos.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Órgão Responsável *
          </label>
          <select
            name="orgao_id"
            className="w-full border rounded px-3 py-2"
            required
          >
            <option value="">Selecione um órgão</option>
            {listaOrgaos.map((orgao) => (
              <option key={orgao.id} value={orgao.id}>
                {orgao.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Data de Publicação *
          </label>
          <input
            type="date"
            name="pub_date"
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">
          Selecionar documentos *
        </label>
        <input
          type="file"
          accept='.pdf'
          name='files'
          multiple
          className="block w-full text-sm file:cursor-pointer text-gray-900
            file:mr-4 file:py-2 file:px-4
            file:rounded file:border-0
            file:text-sm
            file:bg-azul_escuro file:text-white"
          onChange={(e) => setArquivos(Array.from(e.target.files))}
        />
        {arquivos.length > 0 && (
          <p className="text-sm text-gray-600 mt-1">
            {arquivos.length} arquivo(s) selecionado(s)
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={enviando}
          className="bg-laranja_escuro text-white px-5 py-2 rounded hover:bg-orange-700 transition"
        >
          {enviando ? (
            <span className='flex items-center gap-2'>
              <TbLoader2 className="w-5 h-5 animate-spin" />
              Cadastrando documentos
            </span>
          ) : (
            <span>{btnLabel}</span>
          )}
        </button>
      </div>
    </form>
  );
}
