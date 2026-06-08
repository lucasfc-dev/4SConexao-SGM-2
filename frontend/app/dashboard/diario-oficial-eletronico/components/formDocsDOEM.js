'use client'
import { useState } from "react";
import { TbLoader2 } from "react-icons/tb";

export default function FormDocsDOEM({ listaOrgaos, onSubmit }) {
    const [enviando, setEnviando] = useState(false)
    const handleSubmit = async (e) => {
        e.preventDefault()
        setEnviando(true)
        await onSubmit(e)
        setEnviando(false)
    }
    return (
        <section className="bg-white p-4 rounded-lg shadow-md mb-8">
            <h1 className="text-2xl font-semibold mb-8">Enviar Novo Documento</h1>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={e => handleSubmit(e)}>
                <div>
                    <label className="block text-sm font-medium">
                        Título *
                    </label>
                    <input
                        required
                        type="text"
                        name='titulo'
                        className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">
                        Órgão Responsável *
                    </label>
                    <select
                        required
                        name='orgao_id'
                        className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all"
                    >
                        <option value="">Selecione um órgão</option>
                        {listaOrgaos.map(orgao => (
                            <option key={orgao.id} value={orgao.id}>{orgao.nome}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium">
                        Tipo de Documento *
                    </label>
                    <select
                        required
                        name='tipo'
                        className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all"
                    >
                        <option value="">Selecione o tipo</option>
                        <option value="Lei">Lei</option>
                        <option value="Portaria">Portaria</option>
                        <option value="Contrato">Contrato</option>
                        <option value="Aviso">Aviso</option>
                        <option value="Extrato">Extrato</option>
                        <option value="Termo">Termo</option>
                        <option value="Edital">Edital</option>
                        <option value="Decreto">Decreto</option>
                        <option value="Resolucao">Resolução</option>
                        <option value="Ato">Ato</option>
                        <option value="Imagem">Imagem</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mt-1">
                        Selecionar documento *
                    </label>
                    <input
                        required
                        type="file"
                        name='file'
                        accept=".doc,.docx,.pdf"
                        className="mt-1 file:bg-azul_escuro file:border-none file:text-white file:p-2 file:cursor-pointer file:rounded text-sm file:hover:bg-laranja_escuro file:transition-colors rounded w-full"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        name='force_scan'
                        id='force_scan'
                        value="true"
                        className="w-4 h-4 text-laranja_escuro border-gray-300 rounded focus:ring-2 focus:ring-laranja_escuro cursor-pointer"
                    />
                    <label htmlFor='force_scan' className="text-sm font-medium cursor-pointer select-none">
                        Renderizar como Imagem (PDF escaneado)
                    </label>
                </div>
                <div className="md:col-span-2 flex justify-end mt-2">
                    <button
                        type="submit"
                        disabled={enviando}
                        className="px-8 py-2 bg-laranja_escuro text-white text-lg rounded hover:bg-laranja_claro transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {enviando ?
                            <span className='flex items-center gap-2'>
                                <TbLoader2 className="w-5 h-5 animate-spin" />
                                Cadastrando documento
                            </span>
                            : 'Cadastrar documento'}
                    </button>
                </div>
            </form>
        </section>

    )
}