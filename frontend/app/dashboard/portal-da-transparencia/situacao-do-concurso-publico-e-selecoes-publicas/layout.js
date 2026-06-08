import Header from "@/app/components/header"
import MenuLateral from "@/app/components/menuLateral"

export default function ConcursosPublicosLayout({ children }) {
    const navItemsGED = [
        { href: "/dashboard/portal-da-transparencia/situacao-do-concurso-publico-e-selecoes-publicas", label: "Gerenciar Registros" },
    ]
    
    return (
        <main className="flex h-screen w-screen">
            <MenuLateral navItems={navItemsGED} />
            <div className="flex flex-col w-full">
                <Header nomePagina={'CONCURSOS E SELEÇÕES PÚBLICAS'} navItems={navItemsGED} />
                {children}
            </div>
        </main>
    )
}