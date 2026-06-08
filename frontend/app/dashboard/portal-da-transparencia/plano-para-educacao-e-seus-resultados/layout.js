import Header from "@/app/components/header"
import MenuLateral from "@/app/components/menuLateral"


export default function PlanoParaEducacaoLayout({ children }) {
    const navItemsGED = [
        { href: "/dashboard/portal-da-transparencia/plano-para-educacao-e-seus-resultados", label: "Gerenciar Registros" },

    ]
    return (

        <main className="flex h-screen w-screen">
            <MenuLateral navItems={navItemsGED} />
            <div className="flex flex-col w-full">
                <Header nomePagina={'PLANO PARA EDUCAÇÃO E SEUS RESULTADOS'} navItems={navItemsGED} />
                {children}
            </div>
        </main>

    )


}