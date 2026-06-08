import Header from "@/app/components/header"
import MenuLateral from "@/app/components/menuLateral"


export default function AcordosFirmadosLayout({ children }) {
    const navItemsGED = [
        { href: "/dashboard/portal-da-transparencia/relacao-de-licitantes-e-ou-contratados-sancionados", label: "Gerenciar Registros" },

    ]
    return (

        <main className="flex h-screen w-screen">
            <MenuLateral navItems={navItemsGED} />
            <div className="flex flex-col w-full">
                <Header nomePagina={'RELAÇÃO DE LICITANTES E/OU CONTRATADOS SANCIONADOS'} navItems={navItemsGED} />
                {children}
            </div>
        </main>

    )


}