import Header from "../../components/header"
import MenuLateral from "../../components/menuLateral"

export const metadata = {
    title: "SGM - Chamados Ouvidoria",
    description: "Desenvolvido por 4s Conexão e Tecnologia",
}

export default function OuvidoriaLayout({ children }) {
    const navItemsOuvidoria = [
        { href: "/dashboard/chamados-ouvidoria/visao-geral", label: "Visão Geral" },
        { href: "/dashboard/chamados-ouvidoria/gerenciar", label: "Gerenciar Chamados" },
        { href: "/dashboard/chamados-ouvidoria/relatorios", label: "Relatórios" }
    ]
    
    return (
        <main className="flex h-screen w-screen">
            <MenuLateral navItems={navItemsOuvidoria} />
            <div className="flex flex-col w-full">
                <Header nomePagina={'OUVIDORIA'} navItems={navItemsOuvidoria} />
                {children}
            </div>
        </main>
    )
}