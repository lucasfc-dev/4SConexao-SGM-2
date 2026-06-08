import Header from "@/app/components/header"
import MenuLateral from "@/app/components/menuLateral"

export default function ListaDeEsperaDasCrechesMunicipaisLayout({ children }) {
    const navItemsGED = [
        { href: "/dashboard/portal-da-transparencia/lista-de-espera-das-creches-municipais", label: "Gerenciar Registros" },
    ]
    
    return (
        <main className="flex h-screen w-screen">
            <MenuLateral navItems={navItemsGED} />
            <div className="flex flex-col w-full">
                <Header nomePagina={'LISTA DE ESPERA DAS CRECHES MUNICIPAIS'} navItems={navItemsGED} />
                {children}
            </div>
        </main>
    )
}