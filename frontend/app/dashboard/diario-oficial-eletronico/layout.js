import Header from "../../components/header"
import MenuLateral from "../../components/menuLateral"
import { DOProvider } from "./context/DOContext"
import { DocumentosProvider } from "./context/documentosContext"

export const metadata = {
    title: "SGM - Diário Oficial Eletrônico",
    description: "Desenvolvido por 4s Conexão e Tecnologia",
}

export default function DiarioLayout({ children }) {
    const navItemsDO = [
        { href: "/dashboard/diario-oficial-eletronico/publicados", label: "Publicados" },
        { href: "/dashboard/diario-oficial-eletronico/pendentes", label: "Pendentes" },
        { href: "/dashboard/diario-oficial-eletronico/novo-diario", label: "Gerar diário" },
        { href: "/dashboard/diario-oficial-eletronico/documentos", label: "Documentos" }
    ]
    return (
        <DOProvider>
            <DocumentosProvider>
                <main className="flex h-screen w-screen">
                    <MenuLateral navItems={navItemsDO} />
                    <div className="flex flex-col w-full">
                        <Header nomePagina={'Diário Oficial Eletrônico'} navItems={navItemsDO}></Header>
                        {children}
                    </div>
                </main>
            </DocumentosProvider>
        </DOProvider>

    )
}
