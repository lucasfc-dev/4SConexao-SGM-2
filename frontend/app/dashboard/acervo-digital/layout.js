import MenuLateral from "@/app/components/menuLateral"
import Header from "@/app/components/header"
import 'react-toastify/dist/ReactToastify.css'

export default function AcervoDigitalLayout({ children }) {
    const navItems = [
        { href: "/dashboard/acervo-digital", label: "Meu Acervo" },
        { href: "/dashboard/acervo-digital/recentes", label: "Recentes" },
        { href: "/dashboard/acervo-digital/permissoes", label: "Permissões" },
    ]

    return (
        <main className="flex h-screen w-screen overflow-hidden">
            <MenuLateral navItems={navItems} />
            <div className="flex flex-col w-full min-w-0">
                <Header nomePagina="ACERVO DIGITAL" navItems={navItems} />
                {children}
            </div>
        </main>
    )
}
