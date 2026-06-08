import Header from "@/app/components/header"
import MenuLateral from "@/app/components/menuLateral"


export default function JulgamentoContasLayout({ children }) {
    const navItemsGED = [
        { href: "/dashboard/portal-da-transparencia/julgamento-das-contas-do-chefe-do-executivo-pelo-legislativo", label: "Gerenciar Registros" },

    ]
    return (

        <main className="flex h-screen w-screen">
            <MenuLateral navItems={navItemsGED} />
            <div className="flex flex-col w-full">
                <Header nomePagina={'JULGAMENTO DAS CONTAS DO CHEFE DO EXECUTIVO PELO LEGISLATIVO'} navItems={navItemsGED} />
                {children}
            </div>
        </main>

    )


}