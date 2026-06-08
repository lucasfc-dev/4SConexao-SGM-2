'use client'

import Link from "next/link"
import { useAuth } from "../context/AuthContext"
import { toast, ToastContainer } from "react-toastify"
import { motion } from "framer-motion"
import { FaUser, FaLock, FaSignInAlt } from "react-icons/fa"
import "react-toastify/dist/ReactToastify.css"

export default function LoginForm() {
  const { login } = useAuth()

  async function handleSubmit(e) {
    try {
      e.preventDefault()
      const dadosLogin = new FormData(e.target)
      const username = dadosLogin.get('username')
      const password = dadosLogin.get('password')
      await login(username, password)
    }
    catch (error) {
      toast.error(error)
    }
  }

  const formVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  }

  const inputVariants = {
    focus: {
      scale: 1.02,
      transition: { duration: 0.2 }
    }
  }

  return (
    <motion.form
      variants={formVariants}
      initial="hidden"
      animate="visible"
      className="bg-white p-8 rounded-2xl text-azul_escuro shadow-2xl w-full max-w-md flex flex-col gap-6 border border-gray-100"
      onSubmit={handleSubmit}
    >
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
      
      {/* Header do formulário */}
      <div className="text-center mb-2">
        <div className="flex justify-center mb-4">
          <div className="bg-azul_escuro p-4 rounded-full">
            <FaSignInAlt className="text-white text-2xl" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-2 text-azul_escuro">
          SGM
        </h1>
        <p className="text-gray-600">Sistema de Gestão Municipal</p>
      </div>

      {/* Campo Usuário */}
      <div className="flex flex-col space-y-2">
        <label className="text-azul_escuro font-semibold text-sm flex items-center gap-2">
          <FaUser className="text-azul_escuro" />
          Usuário
        </label>
        <motion.input
          variants={inputVariants}
          whileFocus="focus"
          name="username"
          placeholder="Digite seu usuário"
          className="p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-azul_escuro focus:ring-2 focus:ring-azul_escuro focus:ring-opacity-20 transition-all duration-300 bg-gray-50 focus:bg-white"
          required
        />
      </div>

      {/* Campo Senha */}
      <div className="flex flex-col space-y-2">
        <label className="text-azul_escuro font-semibold text-sm flex items-center gap-2">
          <FaLock className="text-azul_escuro" />
          Senha
        </label>
        <motion.input
          variants={inputVariants}
          whileFocus="focus"
          name="password"
          placeholder="Digite sua senha"
          type="password"
          className="p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-azul_escuro focus:ring-2 focus:ring-azul_escuro focus:ring-opacity-20 transition-all duration-300 bg-gray-50 focus:bg-white"
          required
        />
      </div>

      {/* Botão de Login */}
      <motion.button
        type="submit"
        whileHover={{
          scale: 1.02,
          boxShadow: '0 8px 25px rgba(1, 4, 64, 0.25)'
        }}
        whileTap={{ scale: 0.98 }}
        className="mt-6 p-4 bg-azul_escuro text-white rounded-xl font-semibold text-lg hover:bg-laranja_escuro transition-all duration-300 flex items-center justify-center gap-2 shadow-lg"
      >
        <FaSignInAlt />
        Entrar
      </motion.button>

      {/* Link Esqueci Senha */}
      <Link 
        href="/esqueci-minha-senha" 
        className="text-azul_escuro hover:text-laranja_escuro mt-4 text-center font-medium transition-colors duration-300 hover:underline"
      >
        Esqueci minha senha
      </Link>
    </motion.form>
  )
}
