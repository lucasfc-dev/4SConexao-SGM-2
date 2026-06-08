import Header from "@/app/components/header"
import MenuLateral from "@/app/components/menuLateral"

export default function EmendasParlamentaresLayout({ children }) {
    const navItemsGED = [
        { href: "/dashboard/portal-da-transparencia/emendas-parlamentares", label: "Gerenciar Registros" },
    ]
    
    return (
        <main className="flex h-screen w-screen">
            <MenuLateral navItems={navItemsGED} />
            <div className="flex flex-col w-full">
                <Header nomePagina={'EMENDAS PARLAMENTARES'} navItems={navItemsGED} />
                {children}
            </div>
        </main>
    )
}