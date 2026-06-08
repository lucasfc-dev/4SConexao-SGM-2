import Header from "@/app/components/header"
import MenuLateral from "@/app/components/menuLateral"


export default function RenunciasFiscaisLayout({ children }) {
    const navItemsGED = [
        { href: "/dashboard/portal-da-transparencia/renuncias-fiscais", label: "Gerenciar Registros" },

    ]
    return (

        <main className="flex h-screen w-screen">
            <MenuLateral navItems={navItemsGED} />
            <div className="flex flex-col w-full">
                <Header nomePagina={'RENÚNCIAS FISCAIS'} navItems={navItemsGED} />
                {children}
            </div>
        </main>

    )


}