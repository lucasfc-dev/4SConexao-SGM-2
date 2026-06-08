import Header from "@/app/components/header"
import MenuLateral from "@/app/components/menuLateral"

export default function ConselhoMunicipalEducacaoLayout({ children }) {
    const navItems = [
        { href: "/dashboard/portal-da-transparencia/conselho-municipal-educacao", label: "Gerenciar Registros" },
    ]

    return (
        <main className="flex h-screen w-screen">
            <MenuLateral navItems={navItems} />
            <div className="flex flex-col w-full">
                <Header nomePagina={'CONSELHO MUNICIPAL DE EDUCAÇÃO'} navItems={navItems} />
                {children}
            </div>
        </main>
    )
}
