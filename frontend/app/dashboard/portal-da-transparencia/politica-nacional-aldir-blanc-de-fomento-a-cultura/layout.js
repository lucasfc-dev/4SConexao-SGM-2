import Header from "@/app/components/header"
import MenuLateral from "@/app/components/menuLateral"


export default function PoliticaNacionalAldirBlancLayout({ children }) {
    const navItemsGED = [
        { href: "/dashboard/portal-da-transparencia/politica-nacional-aldir-blanc-de-fomento-a-cultura", label: "Gerenciar Registros" },

    ]
    return (

        <main className="flex h-screen w-screen">
            <MenuLateral navItems={navItemsGED} />
            <div className="flex flex-col w-full">
                <Header nomePagina={'POLÍTICA NACIONAL ALDIR BLANC DE FOMENTO À CULTURA'} navItems={navItemsGED} />
                {children}
            </div>
        </main>

    )


}