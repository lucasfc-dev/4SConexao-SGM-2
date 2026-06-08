import Header from "@/app/components/header"
import MenuLateral from "@/app/components/menuLateral"

export default function HorariosDosProfissionaisDaSaudeLayout({ children }) {
    const navItemsGED = [
        { href: "/dashboard/portal-da-transparencia/horarios-dos-profissionais-da-saude", label: "Gerenciar Registros" },
    ]
    
    return (
        <main className="flex h-screen w-screen">
            <MenuLateral navItems={navItemsGED} />
            <div className="flex flex-col w-full">
                <Header nomePagina={'HORÁRIOS DOS PROFISSIONAIS DA SAÚDE'} navItems={navItemsGED} />
                {children}
            </div>
        </main>
    )
}