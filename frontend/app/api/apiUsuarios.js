'use client'
import Cookies from "js-cookie";
import { toast } from "react-toastify";
const authUrl = process.env.NEXT_PUBLIC_AUTH_ENDPOINT_URL

const getToken = () => Cookies.get('auth-token')


export const apiUsuarios = {
    getAll: async () => {
        const response = await fetch(`${authUrl}/user/all/estabelecimento/`, {
            headers: {
                'method': 'GET',
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json',
            }
        });
        if (!response.ok) throw new Error('Erro ao obter usuários')
        return response.json()
    },
    add: async (usuario, estabelecimento_id) => {
        const response = await fetch(`${authUrl}/user/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({
                username: usuario.username,
                email: usuario.email,
                password: usuario.password,
                estabelecimento: estabelecimento_id,
                cpf: usuario.cpf,
                nome: usuario.nome,
                cargo: usuario.cargo || null,
                is_admin: false
            })
        })
        if (response.status === 400) {
            const erro = await response.json()
            toast.error(erro.detail)
            throw new Error(erro.detail)
        } else if (response.status === 422) {
            toast.error('Formato de senha inválido')
            throw new Error('Formato de senha inválido')
        } else if (response.status === 500) {
            toast.error('CPF inválido')
            throw new Error('CPF inválido')
        }
        const usuarioCadastrado = await response.json()
        await fetch(`${authUrl}/user/password_reset/`, {
            method: 'POST',
            headers: {
                'Content-type': 'application/json'
            },
            body: JSON.stringify({
                email_address: usuarioCadastrado.email
            })
        })
        return usuarioCadastrado
    },
    delete: async (idUsuario) => {
        try {
            const resposta = await fetch(`${authUrl}/user/${idUsuario}/`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!resposta.ok) {
                throw new Error('Erro ao deletar o usuário.')
            }
        }
        catch (error) {
            return error
        }
    },
    update: async (usuario, id) => {
        const response = await fetch(`${authUrl}/user/${id}/`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body:JSON.stringify({ ...usuario })
        })
        if (response.status === 400) {
            const erro = await response.json()
            toast.error(erro.detail)
            throw new Error(erro.detail)
        }
        else if (response.status === 500) {
            toast.error('CPF inválido')
            throw new Error('CPF inválido')
        }
        return await response.json()
    },
};
