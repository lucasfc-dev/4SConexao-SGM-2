import Header from "../../components/header"
import MenuLateral from "../../components/menuLateral"
import { DocumentosGEDProvider } from "./context/docsGEDContext"
import { RelatoriosProvider } from "./context/relatoriosContext"
import { TiposProvider } from "./context/tiposContext"
import { VereadoresProvider } from "./context/vereadoresContext"

export const metadata = {
    title: "SGM - Gestão de Documentos",
    description: "Desenvolvido por 4s Conexão e Tecnologia",
}

export default function GEDLayout({ children }) {
    const navItemsGED = [
        { href: "/dashboard/gestao-de-documentos/visao-geral", label: "Visão geral" },
        { href: "/dashboard/gestao-de-documentos/documentos", label: "Cadastrar Documentos" },
        { href: "/dashboard/gestao-de-documentos/relatorios", label: "Gestão de Relatórios" },
        { href: "/dashboard/gestao-de-documentos/modelos", label: "Modelos de Documento" },
    ]
    return (
        <VereadoresProvider>
            <TiposProvider>
                <RelatoriosProvider>
                    <main className="flex h-screen w-screen">
                        <MenuLateral navItems={navItemsGED} />
                        <div className="flex flex-col w-full">
                            <Header nomePagina={'GESTÃO DE DOCUMENTOS'} navItems={navItemsGED} />
                            <DocumentosGEDProvider>
                                {children}
                            </DocumentosGEDProvider>
                        </div>
                    </main>
                </RelatoriosProvider>
            </TiposProvider>
        </VereadoresProvider>
    )


}