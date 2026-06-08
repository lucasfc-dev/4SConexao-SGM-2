import Header from "@/app/components/header"
import MenuLateral from "@/app/components/menuLateral"


export default function IncentivosCulturaisLayout({ children }) {
    const navItemsGED = [
        { href: "/dashboard/portal-da-transparencia/incentivos-a-projetos-culturais", label: "Gerenciar Registros" },

    ]
    return (

        <main className="flex h-screen w-screen">
            <MenuLateral navItems={navItemsGED} />
            <div className="flex flex-col w-full">
                <Header nomePagina={'INCENTIVOS A PROJETOS CULTURAIS'} navItems={navItemsGED} />
                {children}
            </div>
        </main>

    )


}