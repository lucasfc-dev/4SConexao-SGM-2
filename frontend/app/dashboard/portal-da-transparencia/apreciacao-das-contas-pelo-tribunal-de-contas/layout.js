import Header from "@/app/components/header"
import MenuLateral from "@/app/components/menuLateral"


export default function ApreciacaoDasContasLayout({ children }) {
    const navItemsGED = [
        { href: "/dashboard/portal-da-transparencia/apreciacao-das-contas-pelo-tribunal-de-contas", label: "Gerenciar Registros" },

    ]
    return (

        <main className="flex h-screen w-screen">
            <MenuLateral navItems={navItemsGED} />
            <div className="flex flex-col w-full">
                <Header nomePagina={'APRECIAÇÃO DAS CONTAS PELO TRIBUNAL DE CONTAS'} navItems={navItemsGED} />
                {children}
            </div>
        </main>

    )


}