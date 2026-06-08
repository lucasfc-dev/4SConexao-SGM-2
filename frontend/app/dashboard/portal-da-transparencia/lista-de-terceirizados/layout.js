import Header from "@/app/components/header"
import MenuLateral from "@/app/components/menuLateral"


export default function ListaDeTerceirizadosLayout({ children }) {
    const navItemsGED = [
        { href: "/dashboard/portal-da-transparencia/lista-de-terceirizados", label: "Gerenciar Registros" },

    ]
    return (

        <main className="flex h-screen w-screen">
            <MenuLateral navItems={navItemsGED} />
            <div className="flex flex-col w-full">
                <Header nomePagina={'LISTA DE TERCEIRIZADOS'} navItems={navItemsGED} />
                {children}
            </div>
        </main>

    )


}