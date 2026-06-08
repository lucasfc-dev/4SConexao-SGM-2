import Header from "@/app/components/header"
import MenuLateral from "@/app/components/menuLateral"


export default function AcordosFirmadosLayout({ children }) {
    const navItemsGED = [
        { href: "/dashboard/portal-da-transparencia/acordos-firmados-sem-transferencias-de-recursos", label: "Gerenciar Registros" },

    ]
    return (

        <main className="flex h-screen w-screen">
            <MenuLateral navItems={navItemsGED} />
            <div className="flex flex-col w-full">
                <Header nomePagina={'ACORDOS FIRMADOS SEM TRANSFERÊNCIAS DE RECURSOS'} navItems={navItemsGED} />
                {children}
            </div>
        </main>

    )


}