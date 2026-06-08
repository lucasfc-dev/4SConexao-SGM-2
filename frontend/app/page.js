'use client'

import LoginForm from "./components/loginform";
import { useAuth } from "./context/AuthContext";
import { ToastContainer } from "react-toastify"
import { motion } from "framer-motion"
import 'react-toastify/dist/ReactToastify.css'

export default function Home() {
  const { login } = useAuth()
  
  const data = new Date()
  const objData = {
    dia: data.getDate(),
    mes: data.getMonth() + 1,
    ano: data.getFullYear()
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  }

  return (
    <motion.main 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col bg-azul_escuro w-screen h-screen"
    >
      <ToastContainer position="top-right" autoClose={5000} />

      {/* Conteúdo principal */}
      <section className="flex-grow flex items-center justify-center p-8 min-h-[calc(100vh-8rem)]">
        <div className="w-full max-w-md">
          <LoginForm onLogin={login} />
        </div>
      </section>
    </motion.main>
  );
}
