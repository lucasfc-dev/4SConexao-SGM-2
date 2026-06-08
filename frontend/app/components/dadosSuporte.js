import { motion } from "framer-motion";

export default function DadosSuporte({variant}) {
    return (
        <motion.div
            key="nenhuma"
            variants={variant}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full max-w-5xl text-azul_escuro bg-white shadow-xl rounded-xl p-8 space-y-6"
        >
            <div className="flex items-center justify-between border-b pb-4">
                <h1 className="text-2xl font-bold">4S Conexão e Tecnologia</h1>
                <img src="/logo-4s.png" alt="Logo 4S" className="w-16 h-16 object-contain" />
            </div>

            <div className="flex flex-wrap md:grid-cols-2 md:grid gap-6 p-2">
                <div className="">
                    <span className="text-azul_escuro font-bold">CNPJ</span>
                    <p> 39.860.504/0001-17</p>
                </div>
                <div>
                    <span className="text-azul_escuro font-bold">ENDEREÇO</span>
                    <p> 104 Sul, Rua SE 03, Lote 32 — Sala 103, 1º Andar</p>
                </div>
                <div className="flex flex-col truncate">
                    <span className="text-azul_escuro font-bold">E-MAIL</span>
                    <p>contato@4sconexaoetecnologia.com.br</p>
                </div>
                <div>
                    <span className="text-azul_escuro font-bold">TELEFONE</span>
                    <p>(63) 3214-9269</p>
                </div>
                <div>
                    <span className="text-azul_escuro font-bold">WHATSAPP</span>
                    <p>(63) 99299-2778</p>
                </div>
                <div className="truncate">
                    <span className="text-azul_escuro font-bold">SITE</span>
                    <p>
                        <a href="https://4sconexaoetecnologia.com.br" target="_blank" className="text-blue-600 hover:underline">
                            4sconexaoetecnologia.com.br
                        </a>
                    </p>
                </div>

            </div>
        </motion.div>
    )
}