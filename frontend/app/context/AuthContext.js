'use client'
import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { useRouterAsync } from '../utils/useRouterAsync'
import { FiLoader } from 'react-icons/fi'
import { toast } from "react-toastify"

const AuthContext = createContext()
const authUrl = process.env.NEXT_PUBLIC_AUTH_ENDPOINT_URL

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const logoutTimer = useRef(null)
  const pathname = usePathname()
  const { handleRoute, isLoadingRouter } = useRouterAsync()

  const fetchUserData = async (token) => {
    try {
      const response = await fetch(`${authUrl}/user/me/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Falha ao buscar dados do usuário.')
      }
      const data = await response.json()
      setUser(data)
      Cookies.set('is_super', data.is_super)
      return data
    } catch (error) {
      toast.error('Erro ao buscar dados do usuário:', error)
      logout()
    }
  };

  const setLogoutTimer = (expirationTime) => {
    const currentTime = Date.now()
    const timeLeft = expirationTime - currentTime

    if (logoutTimer.current) {
      clearTimeout(logoutTimer.current)
    }

    if (timeLeft > 0) {
      logoutTimer.current = setTimeout(() => {
        logout()
      }, timeLeft)
    } else {
      logout()
    }
  };

  const login = async (username, password) => {
    setLoading(true)
    try {
      const response = await fetch(`${authUrl}/auth/token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username,
          password,
        }),
      });

      if (response.status === 401) {
        throw new Error('Senha incorreta. Verifique e tente novamente.')
      }
      if (response.status === 400) {
        throw new Error('Usuário incorreto. Verifique e tente novamente.')
      }
      if (!response.ok) {
        throw new Error('Ocorreu um erro inesperado. Tente novamente.')
      }

      const json = await response.json()
      const token = json.access_token.token
      const expString = json.access_token.exp

      const expirationDate = new Date(expString)
      const expirationTime = expirationDate.getTime()

      Cookies.set('auth-token', token)
      Cookies.set('token-expiration', expirationTime.toString())

      setLogoutTimer(expirationTime)

      const userData = await fetchUserData(token)

      if (userData?.is_super) {
        await handleRoute('/admin/gerenciar-estabelecimentos').then(() => {
          if (pathname !== '/admin') {
            router.push('/admin')
          }
        })
      }
      else {
        {
          await handleRoute('/dashboard').then(() => {
            if (pathname !== '/dashboard') {
              router.push('/dashboard')
            }
          })
        }
      }
    } catch (error) {
      toast.error(`Erro durante o login: ${error.message}`)
    }
    finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    ['auth-token', 'is_super', 'token-expiration'].forEach(Cookies.remove)

    if (logoutTimer.current) {
      clearTimeout(logoutTimer.current)
    }

    setUser(null)
    router.refresh()
    await handleRoute('/')
  }

  useEffect(() => {
    const initializeAuth = async () => {
      const token = Cookies.get('auth-token')
      const expirationTimeStr = Cookies.get('token-expiration')
      if (token && expirationTimeStr) {
        const expirationTime = parseInt(expirationTimeStr, 10)

        if (Date.now() > expirationTime) {
          logout()
        } else {
          setLogoutTimer(expirationTime)
          await fetchUserData(token)
        }
      }
      setLoading(false)
    };

    initializeAuth()
    return () => {
      if (logoutTimer.current) {
        clearTimeout(logoutTimer.current)
      }
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {isLoadingRouter ? (
        <div className='flex items-center justify-center h-screen bg-white'>
          <FiLoader size={50} className="animate-spin text-4xl text-azul_escuro" />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext)
}
