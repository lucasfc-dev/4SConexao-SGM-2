import Header from "@/app/components/header"
import MenuLateral from "@/app/components/menuLateral"

export default function TransferenciasRecebidasConveniosLayout({ children }) {
    const navItems = [
        { href: "/dashboard/portal-da-transparencia/transferencias-recebidas-convenios", label: "Gerenciar Registros" },
    ]

    return (
        <main className="flex h-screen w-screen">
            <MenuLateral navItems={navItems} />
            <div className="flex flex-col w-full">
                <Header nomePagina={'TRANSFERÊNCIAS RECEBIDAS CONVÊNIOS'} navItems={navItems} />
                {children}
            </div>
        </main>
    )
}
