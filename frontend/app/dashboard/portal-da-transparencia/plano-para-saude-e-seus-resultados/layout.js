import Header from "@/app/components/header"
import MenuLateral from "@/app/components/menuLateral"


export default function AcordosFirmadosLayout({ children }) {
    const navItemsGED = [
        { href: "/dashboard/portal-da-transparencia/plano-para-saude-e-seus-resultados", label: "Gerenciar Registros" },

    ]
    return (

        <main className="flex h-screen w-screen">
            <MenuLateral navItems={navItemsGED} />
            <div className="flex flex-col w-full">
                <Header nomePagina={'PLANO PARA SAÚDE E SEUS RESULTADOS'} navItems={navItemsGED} />
                {children}
            </div>
        </main>

    )


}