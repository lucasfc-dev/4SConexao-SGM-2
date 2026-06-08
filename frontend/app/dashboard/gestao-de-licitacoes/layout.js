import MenuLateral from "@/app/components/menuLateral"
import { LicitacoesProvider } from "./context/LicitacoesContext"
import Header from "@/app/components/header"
import { ModalidadesProvider } from "./context/ModalidadesContext"
import { SecaoProvider } from "./context/SecaoContext"
import { PessoasProvider } from "@/app/context/pessoasContext"
import { ComissoesProvider } from "./context/ComissoesContext"
import { EditaisProvider } from "./context/EditaisContext"
import { DispensasProvider } from "./context/DispensasContext"
import 'react-toastify/dist/ReactToastify.css'

export default function LicitacoesLayout({ children }) {
    const navItemsLicitacao = [
        { href: "/dashboard/gestao-de-licitacoes/licitacoes", label: "Licitações" },
        { href: '/dashboard/gestao-de-licitacoes/dispensas', label: 'Dispensas' },
        { href: "/dashboard/gestao-de-licitacoes/modalidades", label: "Gerenciar Modalidades" },
        { href: "/dashboard/gestao-de-licitacoes/secoes", label: "Gerenciar Seções" },
        { href: '/dashboard/gestao-de-licitacoes/comissoes', label: 'Gerenciar Comissões' },
        { href: '/dashboard/gestao-de-licitacoes/editais', label: 'Gerenciar Editais' },
        { href: '/dashboard/gestao-de-licitacoes/relatorios', label: 'Relatórios' },
        { href: "/dashboard/gestao-de-licitacoes/gerenciar-pessoas", label: "Gerenciar Pessoas" },
    ]

    return (
        <PessoasProvider>
            <LicitacoesProvider>
                <DispensasProvider>
                    <ModalidadesProvider>
                        <SecaoProvider>
                            <ComissoesProvider>
                                <EditaisProvider>                
                                    <main className="flex h-screen w-screen">
                                        <MenuLateral navItems={navItemsLicitacao} />
                                        <div className="flex flex-col w-full">
                                            <Header nomePagina={'GESTÃO DE LICITAÇÕES'} navItems={navItemsLicitacao} />
                                            {children}
                                        </div>
                                    </main>
                                </EditaisProvider>
                            </ComissoesProvider>
                        </SecaoProvider>
                    </ModalidadesProvider>
                </DispensasProvider>
            </LicitacoesProvider>
        </PessoasProvider>

    )
}