import Header from "@/app/components/header"
import MenuLateral from "@/app/components/menuLateral"


export default function AcordosFirmadosLayout({ children }) {
    const navItemsGED = [
        { href: "/dashboard/portal-da-transparencia/relatorio-de-gestao-ou-atividades", label: "Gerenciar Registros" },

    ]
    return (

        <main className="flex h-screen w-screen">
            <MenuLateral navItems={navItemsGED} />
            <div className="flex flex-col w-full">
                <Header nomePagina={'RELATÓRIO DE GESTÃO OU ATIVIDADES'} navItems={navItemsGED} />
                {children}
            </div>
        </main>

    )


}