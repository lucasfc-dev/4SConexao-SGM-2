import { DESENVOLVEDOR } from "@/constants/dadosEmpresa";

export default function Footer({ cor }) {
    return (
        <footer className={`w-full sticky bottom-0 z-10 bg-laranja_escuro shadow-2xl px-4 py-2 flex justify-center items-center md:fixed`}>
            <p className="text-sm md:text-lg font-bold text-branco_cinza text-center">
                SGM - {DESENVOLVEDOR.prefixText} {DESENVOLVEDOR.companyName} &copy; {new Date().getFullYear()}
            </p>
        </footer>
    );
}
