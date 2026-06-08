'use client'
import { useEffect, useState, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { toast, ToastContainer } from "react-toastify"
import 'react-toastify/dist/ReactToastify.css'

const authUrl = process.env.NEXT_PUBLIC_AUTH_ENDPOINT_URL

export default function ResetPassword() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const token = useMemo(() => searchParams.get('token'), [searchParams])

  const [isValidToken, setIsValidToken] = useState(null)
  const [accessToken, setAccessToken] = useState('')

  useEffect(() => {
    let isMounted = true
    const validateToken = async () => {
      if (token) {
        try {
          const res = await fetch(`${authUrl}/user/check_reset_token/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              token_id: token,
            }),
          })

          if (res.ok) {
            const data = await res.json()
            if (isMounted) {
              setAccessToken(data.access_token)
              setIsValidToken(true)
            }
          } else {
            if (isMounted) {
              setIsValidToken(false)
            }
          }
        } catch (error) {
          console.error('Erro ao validar o token:', error)
          if (isMounted) {
            setIsValidToken(false)
          }
        }
      } else {
        if (isMounted) {
          setIsValidToken(false)
        }
      }
    };

    validateToken()

    return () => {
      isMounted = false
    }
  }, [token])

  const salvarDados = async (e) => {
    e.preventDefault();
    const dados = new FormData(e.target);
    const definePassword = dados.get('definePassword')
    const confirmPassword = dados.get('confirmPassword')

    if (definePassword !== confirmPassword) {
      alert('As novas senhas não coincidem.')
      return
    }
    try {
      const res = await fetch(`${authUrl}/user/change_password/ok/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken.token}`,
        },
        body: JSON.stringify({
          password: confirmPassword,
        }),
      })

      if (res.status === 422) {
        const erro = await res.json()
        toast.error(`Erro ao alterar a senha. Formato de senha inválido. ${erro.detail[0].msg}`)
        throw new Error('Formato de senha inválido')
        
      } 
      else if (res.ok) {
        toast.success('Senha alterada com sucesso!')
      }
    } catch (error) {
      console.error('Erro ao salvar os dados:', error);
    }
  };

  if (isValidToken === false) {
    return (
      <section className="flex items-center justify-center min-h-screen min-w-screen bg-azul_escuro">
        <p className="bg-branco_cinza p-6 rounded-lg shadow-lg">Token inválido ou expirado.</p>
      </section>
    );
  }

  if (isValidToken === null) {
    return (
      <section className="flex items-center justify-center min-h-screen min-w-screen bg-azul_escuro">
        <p className="bg-branco_cinza p-6 rounded-lg shadow-lg">Validando token...</p>
      </section>
    )
  }

  return (
    <section className="flex items-center justify-center min-h-screen min-w-screen bg-azul_escuro">
      <ToastContainer position="top-right" autoClose={10000} hideProgressBar={false} />
      <form
        className="bg-branco_cinza p-6 rounded-lg shadow-lg w-96 flex flex-col gap-4"
        onSubmit={salvarDados}
      >
        <h1 className="text-2xl font-semibold text-gray-800 mb-4 text-center">Altere sua senha</h1>
        <div className="flex flex-col">
          <label className="text-gray-600 mb-2" htmlFor="definePassword">
            Nova senha
          </label>
          <input
            id="definePassword"
            name="definePassword"
            type="password"
            required
            placeholder="Defina a nova senha"
            className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-gray-600 mb-2" htmlFor="confirmPassword">
            Confirme a nova senha
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            placeholder="Confirme a nova senha"
            className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>
        <button
          className="mt-4 p-2 bg-laranja_escuro text-white rounded-lg hover:bg-azul_escuro transition-all"
          type="submit"
        >
          Alterar senha
        </button>
      </form>
    </section>
  )
}
