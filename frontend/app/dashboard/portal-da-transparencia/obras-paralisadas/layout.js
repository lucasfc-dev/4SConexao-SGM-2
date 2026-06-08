import Header from "@/app/components/header"
import MenuLateral from "@/app/components/menuLateral"


export default function ObrasParalisadasLayout({ children }) {
    const navItems = [
        { href: "/dashboard/portal-da-transparencia/obras-paralisadas", label: "Gerenciar Registros" },
    ]
    
    return (
        <main className="flex h-screen w-screen">
            <MenuLateral navItems={navItems} />
            <div className="flex flex-col w-full">
                <Header nomePagina={'OBRAS PARALISADAS'} navItems={navItems} />
                {children}
            </div>
        </main>
    )
}
