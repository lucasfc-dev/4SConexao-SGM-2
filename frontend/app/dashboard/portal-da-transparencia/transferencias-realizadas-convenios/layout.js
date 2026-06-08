import Header from "@/app/components/header"
import MenuLateral from "@/app/components/menuLateral"

export default function TransferenciasRealizadasConveniosLayout({ children }) {
    const navItems = [
        { href: "/dashboard/portal-da-transparencia/transferencias-realizadas-convenios", label: "Gerenciar Registros" },
    ]

    return (
        <main className="flex h-screen w-screen">
            <MenuLateral navItems={navItems} />
            <div className="flex flex-col w-full">
                <Header nomePagina={'TRANSFERÊNCIAS REALIZADAS CONVÊNIOS'} navItems={navItems} />
                {children}
            </div>
        </main>
    )
}
