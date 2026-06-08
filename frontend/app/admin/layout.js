import MenuLateral from "../components/menuLateral"
import Header from "../components/header"

export default function AdminLayout({ children }) {
    const menuItemsAdmin = [
        {href:'/admin/gerenciar-estabelecimentos', label:'Gerenciamento de Estabelecimentos'},
        {href:'/admin/gerenciar-usuarios', label:'Gerenciamento de usuários'},
    ]
    return (
            <main className="flex h-screen w-screen">
                <MenuLateral navItems={menuItemsAdmin}></MenuLateral>
                <div className="flex flex-col w-full">
                    <Header nomePagina={'Gerenciamento de sistema'} navItems={menuItemsAdmin}/>
                    {children}
                </div>
            </main>
    )
}