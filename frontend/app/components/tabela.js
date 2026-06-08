import { useState } from 'react';
import PaginacaoAvancada from './PaginacaoAvancada';

export default function Tabela({ listaDados, listaColunas, acoes, itensPorPagina = 5 }) {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPorPagina, setItemsPorPagina] = useState(itensPorPagina);

    const totalColunas = listaColunas.length + 1;
    const larguraColuna = 100 / totalColunas;

    const totalPages = Math.ceil(listaDados.length / itemsPorPagina);

    const indexOfLastItem = currentPage * itemsPorPagina;
    const indexOfFirstItem = indexOfLastItem - itemsPorPagina;
    const currentItems = listaDados.slice(indexOfFirstItem, indexOfLastItem);

    const handleMudarPagina = (novaPagina) => {
        setCurrentPage(novaPagina);
    };

    const handleMudarItensPorPagina = (novosItens) => {
        setItemsPorPagina(novosItens);
        setCurrentPage(1); // Reset para primeira página
    };

    // CPF/CNPJ formatting helpers
    const formatCPF = (value) => {
        const v = value?.replace(/\D/g, '').slice(0, 11);
        return v
            .replace(/^(\d{3})(\d)/, '$1.$2')
            .replace(/^(\d{3}\.\d{3})(\d)/, '$1.$2')
            .replace(/^(\d{3}\.\d{3}\.\d{3})(\d)/, '$1-$2');
    };
    
    const formatCNPJ = (value) => {
        const v = value?.replace(/\D/g, '').slice(0, 14);
        return v
            .replace(/^(\d{2})(\d)/, '$1.$2')
            .replace(/^(\d{2}\.\d{3})(\d)/, '$1.$2')
            .replace(/^(\d{2}\.\d{3}\.\d{3})(\d)/, '$1/$2')
            .replace(/^(\d{2}\.\d{3}\.\d{3}\/\d{4})(\d)/, '$1-$2');
    };

    return (
        <div className="overflow-x-auto">
            {/* TABELA PARA TELAS GRANDES */}
            <table className="min-w-full bg-white shadow-md rounded-lg hidden md:table">
                <thead>
                    <tr className='bg-azul_escuro bg-opacity-90  text-branco_cinza uppercase text-sm leading-normal'>
                        {listaColunas.map((coluna, index) => (
                            <th
                                key={index}
                                className="py-2 px-4 text-left border-b truncate max-w-[200px] overflow-hidden"
                            >
                                {coluna.nomeColuna}
                            </th>
                        ))}
                        <th className="py-2 px-4 border-b text-left truncate max-w-[200px] overflow-hidden">
                            Ações
                        </th>
                    </tr>
                </thead>
                <tbody className='text-gray-800 text-sm font-light'>
                    {currentItems.map((dado, index) => (
                        <tr key={index} className="hover:bg-gray-100">
                            {listaColunas.map((coluna, idx) => (
                                <td
                                    key={idx}
                                    className="py-2 px-4 border-b break-words max-w-[450px] max-h-20 overflow-hidden"
                                    title={dado[coluna.coluna]}
                                >
                                    {coluna.coluna === 'cpf' ? (
                                        <span>{formatCPF(dado.cpf || '')}</span>
                                    ) : coluna.coluna === 'cnpj' ? (
                                        <span>{formatCNPJ(dado.cnpj || '')}</span>
                                    ) : (
                                        <p
                                            className="whitespace-normal overflow-hidden text-ellipsis"
                                            style={{
                                                display: '-webkit-box',
                                                WebkitLineClamp: 3,
                                                WebkitBoxOrient: 'vertical',
                                            }}
                                        >
                                            {dado[coluna.coluna]}
                                        </p>
                                    )}
                                </td>
                            ))}
                            <td className="py-2 px-4 border-b text-left truncate max-w-[200px] overflow-hidden">
                                {acoes.map((acao, acaoIndex) => (
                                    <button
                                        key={acaoIndex}
                                        onClick={() => acao.handler(dado)}
                                        className="pr-4 py-2"
                                    >
                                        {acao.nome}
                                    </button>
                                ))}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* LISTAGEM PARA MOBILE */}
            <div className="md:hidden flex flex-col items-center w-full px-2 sm:px-4">
                {currentItems.map((dado, index) => (
                    <div key={index} className="w-full max-w-md p-4 mb-4 border border-gray-200 rounded-lg bg-white shadow-md">
                        {listaColunas.map((coluna, idx) => (
                            <div key={idx} className="flex flex-wrap break-words gap-2 mb-2">
                                <span className="font-bold whitespace-nowrap">{coluna.nomeColuna}:</span>
                                <span className="break-words">
                                    {coluna.coluna === 'cpf'
                                        ? formatCPF(dado.cpf || '')
                                        : coluna.coluna === 'cnpj'
                                            ? formatCNPJ(dado.cnpj || '')
                                            : dado[coluna.coluna]
                                    }
                                </span>
                            </div>
                        ))}
                        <div className="flex flex-wrap justify-start gap-2">
                            {acoes.map((acao, acaoIndex) => (
                                <button
                                    key={acaoIndex}
                                    onClick={() => acao.handler(dado)}
                                    className="px-4 py-2 text-white rounded-md hover:bg-blue-600 transition"
                                >
                                    {acao.nome}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* PAGINAÇÃO AVANÇADA */}
            {totalPages > 1 && (
                <PaginacaoAvancada
                    paginaAtual={currentPage}
                    totalPaginas={totalPages}
                    totalItens={listaDados.length}
                    itensPorPagina={itemsPorPagina}
                    onMudarPagina={handleMudarPagina}
                    onMudarItensPorPagina={handleMudarItensPorPagina}
                />
            )}
        </div>
    );
}
