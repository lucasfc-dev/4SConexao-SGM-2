import Header from "@/app/components/header"
import MenuLateral from "@/app/components/menuLateral"


export default function PlanoAnualDeContratacaoLayout({ children }) {
    const navItemsGED = [
        { href: "/dashboard/portal-da-transparencia/plano-anual-de-contratacao-pac", label: "Gerenciar Registros" },

    ]
    return (
        <main className="flex h-screen w-screen">
            <MenuLateral navItems={navItemsGED} />
            <div className="flex flex-col w-full">
                <Header nomePagina={'PLANO ANUAL DE CONTRATAÇÃO'} navItems={navItemsGED} />
                {children}
            </div>
        </main>

    )


}