import { PessoasProvider } from "@/app/context/pessoasContext"
import { LicitacoesProvider } from "../gestao-de-licitacoes/context/LicitacoesContext"
import { DispensasProvider } from "../gestao-de-licitacoes/context/DispensasContext"
import { ModalidadesProvider } from "../gestao-de-licitacoes/context/ModalidadesContext"
import { SecaoProvider } from "../gestao-de-licitacoes/context/SecaoContext"
import { ComissoesProvider } from "../gestao-de-licitacoes/context/ComissoesContext"
import { EditaisProvider } from "../gestao-de-licitacoes/context/EditaisContext"
import MenuLateral from "@/app/components/menuLateral"
import Header from "@/app/components/header"
import { ContratosProvider } from "./context/ContratosContext"
import { FiscaisProvider } from "./context/FiscaisContext"


export default function ContratosLayout({ children }) {
    const navItemsContrato = [
        { href: "/dashboard/gestao-de-contratos/contratos", label: "Contratos" },
        { href: "/dashboard/gestao-de-contratos/fiscal-contrato", label: "Fiscais de Contrato" },
        { href: "/dashboard/gestao-de-contratos/relatorios", label: "Relatórios" },
        { href: "/dashboard/gestao-de-contratos/gerenciar-pessoas", label: "Gerenciar Pessoas" },
        { href:'/dashboard/gestao-de-contratos/fiscalizacao-contrato', label: 'Fiscalização de Contrato' }
    ]

    return (
        <PessoasProvider>
            <ContratosProvider>
                <LicitacoesProvider>
                    <DispensasProvider>
                        <ModalidadesProvider>
                            <SecaoProvider>
                                <ComissoesProvider>
                                    <FiscaisProvider>
                                        <EditaisProvider>
                                            <main className="flex h-screen w-screen">
                                                <MenuLateral navItems={navItemsContrato} />
                                                <div className="flex flex-col w-full">
                                                    <Header nomePagina={'GESTÃO DE CONTRATOS'} navItems={navItemsContrato} />
                                                    {children}
                                                </div>
                                            </main>
                                        </EditaisProvider>
                                    </FiscaisProvider>
                                </ComissoesProvider>
                            </SecaoProvider>
                        </ModalidadesProvider>
                    </DispensasProvider>
                </LicitacoesProvider>
            </ContratosProvider>
        </PessoasProvider>
    )
}