"use client";

import { useAuth } from "@/app/context/AuthContext";
import Header from "../../components/header";
import MenuLateral from "../../components/menuLateral";
import { useFunc } from "@/app/context/funcContext";

export default function GerenciarSistema({ children }) {
    const { user } = useAuth();
    const { pacote } = useFunc()
    if (!user) return <p>Carregando...</p>

    const funcionalidades = new Set(pacote.map(f => f.nome));

    const navItemsGerenciarSistema = [
        { href: "/dashboard/gerenciar-sistema/configuracoes", label: "Configurações do estabelecimento" },
        { href: "/dashboard/gerenciar-sistema/gerenciar-usuarios", label: "Gerenciar Usuários" },
        { href: "/dashboard/gerenciar-sistema/gerenciar-orgaos", label: "Gerenciar Órgãos" },
    ];


    if (funcionalidades.has("Gestão de Documentos")) {
        navItemsGerenciarSistema.push({
            href: "/dashboard/gerenciar-sistema/cadastro-docs",
            label: "Cadastro de Documentos",
        });
        navItemsGerenciarSistema.push({
            href: "/dashboard/gerenciar-sistema/gerenciar-tipos",
            label: "Gerenciar Tipos de Documento",
        });
    }
    if (funcionalidades.has("Diário Oficial Eletrônico")) {
        navItemsGerenciarSistema.push({
            href: "/dashboard/gerenciar-sistema/cadastro-doem",
            label: "Cadastro de DOEM",
        });
    }
    if (funcionalidades.has("Atos Contratatórios")) {
        navItemsGerenciarSistema.push({
            href: "/dashboard/gerenciar-sistema/cadastro-contratos",
            label: "Cadastro de Contratos",
        });
    }

    if (user.estabelecimento.config.tipo == 'DA CÂMARA MUNICIPAL' && funcionalidades.has('Gestão de Documentos')) { navItemsGerenciarSistema.push({ href: "/dashboard/gerenciar-sistema/gerenciar-vereadores", label: "Gerenciar Vereadores" }) }

    return (
        <main className="flex h-screen w-screen">
            <MenuLateral nomePagina="Gerenciamento do Estabelecimento" navItems={navItemsGerenciarSistema} />
            <div className="flex flex-col w-full">
                <Header nomePagina="Gerenciamento de estabelecimento" navItems={navItemsGerenciarSistema} />
                {children}
            </div>
        </main>
    );
}
