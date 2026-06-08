import Header from "@/app/components/header"
import MenuLateral from "@/app/components/menuLateral"


export default function TabelaDeValoresDiariasLayout({ children }) {
    const navItemsGED = [
        { href: "/dashboard/portal-da-transparencia/tabela-de-valores-de-diarias", label: "Gerenciar Registros" },

    ]
    return (

        <main className="flex h-screen w-screen">
            <MenuLateral navItems={navItemsGED} />
            <div className="flex flex-col w-full">
                <Header nomePagina={'TABELA DE VALORES DE DIÁRIAS'} navItems={navItemsGED} />
                {children}
            </div>
        </main>

    )


}
