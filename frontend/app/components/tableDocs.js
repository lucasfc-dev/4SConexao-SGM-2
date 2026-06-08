import { FaDownload, FaEdit } from "react-icons/fa"
import { FiLoader } from "react-icons/fi"
import { MdDelete } from "react-icons/md"
import Tabela from "./tabela"

export default function TableDocs({ listaDocs, loading, onDeletar, onDownload, onEditar, listaColunas }) {
    const acoes = [
        {
            nome: <FaDownload size={28} className="text-azul_escuro hover:text-laranja_escuro transition-colors" />,
            handler: onDownload
        },
        {
            nome: <MdDelete size={28} className="text-red-700 hover:text-red-900 transition-colors" />,
            handler: onDeletar
        }
    ]
    if (onEditar){
        acoes.push({
            nome: <FaEdit size={28} className="text-green-900 hover:text-laranja_escuro transition-colors"></FaEdit>,
            handler: onEditar
        })
    }
    
    return (
        <div className="mt-8">
            <h3 className="text-xl font-semibold mb-2 text-azul_escuro">
                Documentos cadastrados ({listaDocs.length})
            </h3>
            {listaDocs.length > 0 ? (
                <Tabela
                    listaColunas={listaColunas}
                    listaDados={listaDocs}
                    acoes={acoes}
                />
            ) : loading ?
                <div className="flex flex-grow h-16 text-center items-center justify-center">
                    <FiLoader className="animate-spin text-4xl text-azul_escuro" />
                </div>
                :
                <p className="text-center font-bold text-azul_escuro">Nenhum documento para visualizar.</p>}
        </div>
    )
}