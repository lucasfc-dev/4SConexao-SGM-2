'use client'
import { useState } from "react";
import { TbLoader2 } from "react-icons/tb";

export default function FormDocsGED({ titulo, btnLabel, listaOrgaos, onSubmit, listaVereadores, listaTipos }) {
    const getToday = () => {
        const today = new Date()
        const year = today.getFullYear()
        const month = String(today.getMonth() + 1).padStart(2, '0')
        const day = String(today.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    const [enviando, setEnviando] = useState(false);
    const [compartilhar, setCompartilhar] = useState(false)
    const [assinar, setAssinar] = useState(false);
    const dataPublicacao = getToday()

    const handleSubmit = async (e) => {
        e.preventDefault();
        setEnviando(true);
        await onSubmit(e, assinar, compartilhar);
        setEnviando(false);
    };

    const listaSituacoes = [
        { nome: 'Vigente', id: 1 },
        { nome: 'Revogado', id: 2 },
        { nome: 'Revogado Parcialmente', id: 3 }
    ];

    return (
        <section className="bg-white p-4 rounded-lg shadow-md">
            <h1 className="text-xl font-semibold mb-4">{titulo}</h1>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleSubmit}>
                <div>
                    <label className="block text-sm font-medium">Título *</label>
                    <input
                        required
                        type="text"
                        name="titulo"
                        className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">Descrição *</label>
                    <input
                        required
                        type="text"
                        name="descricao"
                        className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">Órgão Responsável *</label>
                    <select
                        required
                        name="orgao_id"
                        className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all"
                    >
                        <option value="">Selecione um órgão</option>
                        {listaOrgaos.map(orgao => (
                            <option key={orgao.id} value={orgao.id}>{orgao.nome}</option>
                        ))}
                    </select>
                </div>
                {listaVereadores && (
                    <div>
                        <label className="block text-sm font-medium">Vereador responsável</label>
                        <select
                            name="vereador_id"
                            className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all"
                        >
                            <option value="">Selecione um vereador (Opcional)</option>
                            {listaVereadores.map(vereador => (
                                <option key={vereador.id} value={vereador.id}>{vereador.nome}</option>
                            ))}
                        </select>
                    </div>
                )}
                <div>
                    <label className="block text-sm font-medium">Situação do documento *</label>
                    <select
                        required
                        name="situacao"
                        className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all"
                    >
                        <option value="">Selecione a situação</option>
                        {listaSituacoes.map(situacao => (
                            <option key={situacao.id} value={situacao.nome}>{situacao.nome}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium">Tipo de Documento *</label>
                    <select
                        required
                        name="tipo_id"
                        className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all"
                    >
                        <option value="">Selecione o tipo</option>
                        {listaTipos.map(tipo => (
                            <option key={tipo.id} value={tipo.id}>{tipo.nome}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mt-1">Data de Publicação:</label>
                    <input
                        name="pub_date"
                        type="date"
                        defaultValue={dataPublicacao}
                        className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mt-1">Selecionar documento *</label>
                    <input
                        required
                        type="file"
                        name="file"
                        accept=".pdf"
                        className="mt-1 file:bg-azul_escuro file:border-none file:text-white file:p-2 file:cursor-pointer file:rounded text-sm file:hover:bg-laranja_escuro file:transition-colors rounded w-full"
                    />
                </div>
                <div className="flex flex-col sm:flex-row gap-2 justify-start sm:justify-between">
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="assinar"
                            name="assinar"
                            checked={assinar}
                            onChange={() => setAssinar(!assinar)}
                            className="w-5 h-5 cursor-pointer"
                        />
                        <label htmlFor="assinar" className="text-sm font-medium cursor-pointer">Deseja assinar este documento? </label>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="compartilhar-doem"
                            name="compartilhar"
                            checked={compartilhar}
                            onChange={() => setCompartilhar(!compartilhar)}
                            className="w-5 h-5 cursor-pointer"
                        />
                        <label htmlFor="assinar" className="text-sm font-medium cursor-pointer">Adicionar este documento ao módulo DOEM?</label>
                    </div>

                </div>
                <div className="md:col-span-2 flex justify-end mt-2">
                    <button
                        type="submit"
                        disabled={enviando}
                        className="px-8 py-2 bg-laranja_escuro text-white text-lg rounded hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {enviando ? (
                            <span className='flex items-center gap-2'>
                                <TbLoader2 className="w-5 h-5 animate-spin" />
                                Cadastrando documento
                            </span>
                        ) : (
                            <span>{btnLabel}</span>
                        )}
                    </button>
                </div>
            </form>
        </section>
    );
}