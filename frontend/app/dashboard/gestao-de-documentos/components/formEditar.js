'use client'
import { useState } from "react"
import { IoIosWarning } from "react-icons/io"
import { TbLoader2 } from "react-icons/tb"

export default function FormEditarGED({ btnLabel, documento, listaOrgaos, onCancel, onSubmit, listaVereadores, listaTipos }) {
    const [enviando, setEnviando] = useState(false)
    const [requerAssinatura, setRequerAssinatura] = useState(false)
    const [documentoAlterado, setDocumentoAlterado] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setEnviando(true)
        await onSubmit(e, requerAssinatura)
        setEnviando(false)
    }

    const handleSelecionarDocumento = () => {
        setDocumentoAlterado(true)
        setRequerAssinatura(true)
    }

    const listaSituacoes = [
        { nome: 'Vigente', id: 1 },
        { nome: 'Revogado', id: 2 },
        { nome: 'Revogado Parcialmente', id: 3 }
    ]

    return (
        <section className="bg-white p-4 rounded-lg shadow-md overflow-auto">
            <form className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-auto" onSubmit={handleSubmit}>
                <div>
                    <label className="block text-sm font-medium">Título</label>
                    <input
                        type="text"
                        name="titulo"
                        defaultValue={documento.titulo}
                        className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">Descrição</label>
                    <input
                        type="text"
                        name="descricao"
                        defaultValue={documento.descricao}
                        className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">Data de publicação</label>
                    <input
                        type="date"
                        name="pub_date"
                        defaultValue={documento.pub_date.split('/').reverse().join('-')}
                        className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">Órgão Responsável</label>
                    <select
                        name="orgao_id"
                        defaultValue={documento.orgao}
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
                            defaultValue={documento.vereador_id}
                            className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all"
                        >
                            <option value="null">Selecione um vereador (Opcional)</option>
                            {listaVereadores.map(vereador => (
                                <option key={vereador.id} value={vereador.id}>{vereador.nome}</option>
                            ))}
                        </select>
                    </div>
                )}
                <div>
                    <label className="block text-sm font-medium">Situação do documento</label>
                    <select
                        name="situacao"
                        defaultValue={documento.situacao}
                        className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all"
                    >
                        <option value="">Selecione a situação</option>
                        {listaSituacoes.map(situacao => (
                            <option key={situacao.nome} value={situacao.nome}>{situacao.nome}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium">Tipo de Documento</label>
                    <select
                        name="tipo_id"
                        defaultValue={documento.tipo_id}
                        className="mt-1 p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-laranja_escuro transition-all"
                    >
                        <option value="">Selecione o tipo</option>
                        {listaTipos.map(tipo => (
                            <option key={tipo.id} value={tipo.id}>{tipo.nome}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mt-1">Selecionar documento</label>
                    <input
                        type="file"
                        onChange={() => handleSelecionarDocumento()}
                        name="file"
                        accept=".pdf"
                        className="mt-1 file:bg-azul_escuro file:border-none file:text-white file:p-2 file:cursor-pointer file:rounded text-sm file:hover:bg-laranja_escuro file:transition-colors rounded w-full"
                    />
                </div>
                <div className={`md:col-span-2 flex items-center ${documentoAlterado ? 'justify-between' : 'justify-end'} mt-2`}>
                    {documentoAlterado && (
                        <div className="bg-yellow-100 text-yellow-800 flex items-center gap-2 border border-yellow-400 rounded-md px-4 py-2 text-sm">
                            <IoIosWarning size={24}></IoIosWarning>
                            <div className="">
                                AVISO, O DOCUMENTO SERÁ REASSINADO
                            </div>
                        </div>
                    )}
                    <div className="flex gap-2">
                        <button onClick={onCancel} className="px-8 py-2 bg-branco_cinza text-azul_escuro text-lg rounded hover:bg-gray-600 transition-colors flex items-center">
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={enviando}
                            className="px-8 py-2 bg-laranja_escuro text-white text-lg rounded hover:bg-laranja_claro transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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

                </div>
            </form>
        </section>
    );
}