import Header from "@/app/components/header"
import MenuLateral from "@/app/components/menuLateral"


export default function CotasParlamentaresLayout({ children }) {
    const navItemsGED = [
        { href: "/dashboard/portal-da-transparencia/cotas-parlamentares", label: "Gerenciar Registros" },

    ]
    return (

        <main className="flex h-screen w-screen">
            <MenuLateral navItems={navItemsGED} />
            <div className="flex flex-col w-full">
                <Header nomePagina={'COTAS PARLAMENTARES'} navItems={navItemsGED} />
                {children}
            </div>
        </main>

    )


}
