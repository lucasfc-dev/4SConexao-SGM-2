import Header from "@/app/components/header"
import MenuLateral from "@/app/components/menuLateral"

export default function ListaDeEstagiariosLayout({ children }) {
    const navItemsGED = [
        { href: "/dashboard/portal-da-transparencia/lista-de-estagiarios", label: "Gerenciar Registros" },
    ]
    
    return (
        <main className="flex h-screen w-screen">
            <MenuLateral navItems={navItemsGED} />
            <div className="flex flex-col w-full">
                <Header nomePagina={'LISTA DE ESTAGIÁRIOS'} navItems={navItemsGED} />
                {children}
            </div>
        </main>
    )
}