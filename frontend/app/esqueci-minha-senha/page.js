'use client'
import { useState } from "react"
import { toast, ToastContainer } from "react-toastify"
import 'react-toastify/dist/ReactToastify.css'

const authUrl = process.env.NEXT_PUBLIC_AUTH_ENDPOINT_URL

export default function FormEmail() {
  async function sendEmail(e) {
    try {
      e.preventDefault()
      const email = new FormData(e.target).get('email')
      await fetch(`${authUrl}/user/password_reset/`, {
        method: 'POST',
        headers: {
          'Content-type': 'application/json'
        },
        body: JSON.stringify({
          email_address: email
        })
      })
    }
    catch(error){
      toast.error('Erro ao enviar o email de reset de senha, tente novamente!')
    }
    finally{
      toast.success('Email com instruções enviado com sucesso! Verifique sua caixa de mensagens')
    }

  }
  return (
    <main className="flex items-center justify-center min-h-screen min-w-screen bg-azul_escuro">
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />

      <form
        className="bg-branco_cinza p-6 rounded-lg shadow-lg w-96 flex flex-col gap-4"
        onSubmit={sendEmail}
      >
        <h1 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
          Informe o email associado a conta
        </h1>
        <div className="flex flex-col">
          <label className="text-gray-600 mb-2">Email</label>
          <input
            required
            name="email"
            placeholder="Email"
            className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>
        <button
          type="submit"
          className="mt-4 p-2 bg-laranja_escuro text-white rounded-lg hover:bg-azul_escuro transition-all"
        >
          Enviar email
        </button>
      </form>
    </main>

  )
}