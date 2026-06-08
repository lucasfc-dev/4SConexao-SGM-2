import Header from "@/app/components/header"
import MenuLateral from "@/app/components/menuLateral"


export default function DocumentosEPublicacoesMeioAmbienteLayout({ children }) {
    const navItemsGED = [
        { href: "/dashboard/portal-da-transparencia/documentos-e-publicacoes-meio-ambiente", label: "Gerenciar Registros" },

    ]
    return (

        <main className="flex h-screen w-screen">
            <MenuLateral navItems={navItemsGED} />
            <div className="flex flex-col w-full">
                <Header nomePagina={'DOCUMENTOS E PUBLICAÇÕES MEIO AMBIENTE'} navItems={navItemsGED} />
                {children}
            </div>
        </main>

    )


}