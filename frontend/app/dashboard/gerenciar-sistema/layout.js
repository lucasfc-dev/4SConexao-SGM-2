import GerenciarSistema from "./gerenciarSistema"
import { TiposProvider } from "../gestao-de-documentos/context/tiposContext"

export const metadata = {
    title: "SGM - Gerenciar Sistema",
    description: "Desenvolvido por 4s Conexão e Tecnologia",
}

export default function GerenciarSistemaLayout({ children }) {

    return (
        <TiposProvider>
            <GerenciarSistema>{children}</GerenciarSistema>
        </TiposProvider>
    )
}