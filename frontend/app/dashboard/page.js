'use client'

import React, { useEffect, useState } from "react"
import { useAuth } from "../context/AuthContext"
import Cookies from "js-cookie"
import { BiHomeAlt, BiSupport } from "react-icons/bi";
import { FaCog } from 'react-icons/fa'
import { MdDisplaySettings, MdFeedback } from "react-icons/md";
import { GrDocument, GrDocumentPdf } from "react-icons/gr";
import { FiLoader } from "react-icons/fi"
import Logout from "../components/logout"
import Footer from "../components/footer"
import { useFunc } from "../context/funcContext"
import { AnimatePresence, motion } from "framer-motion";
import { FaFileContract, FaFolder } from "react-icons/fa";
import { LiaFileContractSolid } from "react-icons/lia";
import DadosSuporte from "../components/dadosSuporte";
import Header from "../components/header";
import { RiGovernmentFill } from "react-icons/ri";


const iconMap = {
    'Diário Oficial Eletrônico': <GrDocumentPdf className="text-2xl sm:text-3xl mb-2 sm:mb-3 text-azul_escuro" />,
    'Portal da Transparência': <RiGovernmentFill className="text-2xl sm:text-3xl mb-2 sm:mb-3 text-azul_escuro" />,
    'Gestão de Documentos': <GrDocument className="text-2xl sm:text-3xl mb-2 sm:mb-3 text-azul_escuro" />,
    'Atos Contratatórios': <LiaFileContractSolid className="text-2xl sm:text-3xl mb-2 sm:mb-3 text-azul_escuro" />,
    'Gestão de Licitações': <FaFileContract className="text-2xl sm:text-3xl mb-2 sm:mb-3 text-azul_escuro" />,
    'Chamados Ouvidoria': <MdFeedback className="text-2xl sm:text-3xl mb-2 sm:mb-3 text-azul_escuro" />,
    'Acervo Digital': <FaFolder className="text-2xl sm:text-3xl mb-2 sm:mb-3 text-azul_escuro" />
}

export default function Dashboard() {
    const token = Cookies.get('auth-token')
    const [loading, setLoading] = useState()
    const [viewSuporte, setViewSuporte] = useState(false)
    const [admin, setAdmin] = useState(null)
    const { user } = useAuth()

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        },
        exit: {
            opacity: 0,
            transition: {
                staggerChildren: 0.05,
                staggerDirection: -1
            }
        }
    }

    const cardVariants = {
        hidden: { opacity: 0, y: 40, scale: 0.9 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                duration: 0.4,
                ease: [0.16, 1, 0.3, 1]
            }
        },
        exit: {
            opacity: 0,
            y: -20,
            scale: 0.95,
            transition: {
                duration: 0.3,
                ease: 'easeInOut'
            }
        }
    }

    async function isAdmin() {
        if (user.is_admin) {
            setAdmin(true)
        }
    }

    useEffect(() => {
        if (user) {
            isAdmin()
        }
    }, [user, token])

    const handleView = () => {
        setViewSuporte(!viewSuporte)
    }
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-branco_cinza">
                <FiLoader size={50} className="animate-spin text-4xl text-azul_escuro" />
            </div>
        )
    }

    return (
        <main className="flex flex-col bg-gradient-to-br from-gray-200 to-gray-300 w-screen h-screen">
            <Header nomePagina={"SGM - Menu de Funcionalidades"} corFonte={"text-branco_cinza"} ocultarNav={true} opacidade={"bg-opacity-100"} navItems={[]}></Header>            <div className="overflow-auto">
                <section className="flex-grow overflow-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-[calc(100vh-8rem)]">
                    <AnimatePresence mode="wait">
                        {!viewSuporte && (
                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="flex flex-wrap justify-center gap-4 sm:gap-6 w-full max-w-7xl [&>*]:w-full [&>*]:sm:w-[calc(50%-12px)] [&>*]:lg:w-[calc(33.333%-16px)] [&>*]:xl:w-[calc(25%-18px)]"
                            >
                                {user?.funcionalidades.map(funcionalidade => {
                                    const icon = iconMap[funcionalidade.nome] || <FaCog className="text-2xl sm:text-3xl mb-2 sm:mb-3 text-azul_escuro" />
                                    if (funcionalidade.nome === 'Atos Contratatórios') {
                                        return (
                                            <React.Fragment key={`atos-contratatarios-${funcionalidade.id}`}>
                                                <motion.a
                                                    key={`${funcionalidade.id}-licitacoes`}
                                                    variants={cardVariants}
                                                    href="dashboard/gestao-de-licitacoes/"
                                                    whileHover={{
                                                        scale: 1.02,
                                                        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.12)'
                                                    }}
                                                    whileTap={{ scale: 0.98 }}
                                                    className="flex flex-col items-center text-center justify-center bg-white p-4 sm:p-5 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 min-h-[140px] sm:min-h-[160px]"
                                                >
                                                    {iconMap['Atos Contratatórios']}
                                                    <h2 className="text-sm sm:text-base font-semibold text-azul_escuro leading-tight">Gestão de Licitações</h2>
                                                    <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2 line-clamp-2">{funcionalidade.descricao || 'Acesse esta funcionalidade'}</p>
                                                </motion.a>
                                                <motion.a
                                                    key={`${funcionalidade.id}-contratos`}
                                                    variants={cardVariants}
                                                    href="dashboard/gestao-de-contratos/"
                                                    whileHover={{
                                                        scale: 1.02,
                                                        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.12)'
                                                    }}
                                                    whileTap={{ scale: 0.98 }}
                                                    className="flex flex-col items-center text-center justify-center bg-white p-4 sm:p-5 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 min-h-[140px] sm:min-h-[160px]"
                                                >
                                                    {iconMap['Gestão de Licitações']}
                                                    <h2 className="text-sm sm:text-base font-semibold text-azul_escuro leading-tight">Gestão de Contratos</h2>
                                                    <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2 line-clamp-2">{funcionalidade.descricao || 'Acesse esta funcionalidade'}</p>
                                                </motion.a>
                                            </React.Fragment>

                                        )
                                    }
                                    return (
                                        <motion.a
                                            key={funcionalidade.id}
                                            variants={cardVariants}
                                            href={`dashboard/${funcionalidade.nome
                                                .normalize("NFD")
                                                .replace(/[\u0300-\u036f]/g, "")
                                                .toLowerCase()
                                                .replace(/\s+/g, '-')}`}
                                            whileHover={{
                                                scale: 1.02,
                                                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.12)'
                                            }}
                                            whileTap={{ scale: 0.98 }}
                                            className="flex flex-col items-center text-center justify-center bg-white p-4 sm:p-5 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 min-h-[140px] sm:min-h-[160px]"
                                        >
                                            {icon}
                                            <h2 className="text-sm sm:text-base font-semibold text-azul_escuro leading-tight">{funcionalidade.nome}</h2>
                                            <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2 line-clamp-2">{funcionalidade.descricao || 'Acesse esta funcionalidade'}</p>
                                        </motion.a>
                                    )
                                })}
                                {admin && (
                                    <motion.a
                                        variants={cardVariants}
                                        whileHover={{
                                            scale: 1.02,
                                            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.12)'
                                        }}
                                        whileTap={{ scale: 0.98 }}
                                        href="dashboard/gerenciar-sistema"
                                        className="flex flex-col items-center text-center justify-center bg-white p-4 sm:p-5 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 min-h-[140px] sm:min-h-[160px]"
                                    >
                                        <MdDisplaySettings className="text-2xl sm:text-3xl mb-2 sm:mb-3 text-azul_escuro" />
                                        <h2 className="text-sm sm:text-base font-semibold text-azul_escuro leading-tight">Gerenciar Sistema</h2>
                                        <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2 line-clamp-2">Acesse esta funcionalidade</p>
                                    </motion.a>
                                )}
                            </motion.div>
                        )}

                        {viewSuporte && (
                            <DadosSuporte variant={cardVariants}></DadosSuporte>
                        )}
                    </AnimatePresence>

                    <button onClick={handleView} className="group bg-branco_cinza fixed bottom-20 right-4 shadow-xl rounded-full p-3 sm:p-4 flex items-center justify-center transition-all duration-300 hover:pl-5 hover:pr-5 sm:hover:pl-6 sm:hover:pr-6">
                        {viewSuporte ? <BiHomeAlt className="text-azul_escuro" size={32} /> : <BiSupport className="text-azul_escuro" size={32} />}
                        <span className="text-azul_escuro text-sm sm:text-base max-w-0 opacity-0 overflow-hidden group-hover:max-w-[80px] sm:group-hover:max-w-[100px] group-hover:opacity-100 transition-all duration-300 ease-in-out whitespace-nowrap">
                            {viewSuporte ? 'Início' : 'Suporte'}
                        </span>
                    </button>




                </section>
            </div>
            <Footer></Footer>

        </main>
    )
}
