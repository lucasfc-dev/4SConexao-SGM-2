import Header from "@/app/components/header"
import MenuLateral from "@/app/components/menuLateral"


export default function LeiPauloGustavoLayout({ children }) {
    const navItems = [
        { href: "/dashboard/portal-da-transparencia/lei-paulo-gustavo-lpg", label: "Gerenciar Registros" },
    ]
    
    return (
        <main className="flex h-screen w-screen">
            <MenuLateral navItems={navItems} />
            <div className="flex flex-col w-full">
                <Header nomePagina={'LEI PAULO GUSTAVO – LPG'} navItems={navItems} />
                {children}
            </div>
        </main>
    )
}
