import Header from "@/app/components/header"
import MenuLateral from "@/app/components/menuLateral"


export default function ListaDeAprovadosEmConcursosEProcessosSeletivosLayout({ children }) {
    const navItemsGED = [
        { href: "/dashboard/portal-da-transparencia/lista-de-aprovados-em-concursos-e-processos-seletivos", label: "Gerenciar Registros" },

    ]
    return (

        <main className="flex h-screen w-screen">
            <MenuLateral navItems={navItemsGED} />
            <div className="flex flex-col w-full">
                <Header nomePagina={'LISTA DE APROVADOS EM CONCURSOS E PROCESSOS SELETIVOS'} navItems={navItemsGED} />
                {children}
            </div>
        </main>

    )


}