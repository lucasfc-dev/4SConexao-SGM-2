'use client'
import Cookies from "js-cookie";
import { toast } from 'react-toastify';
const authUrl = process.env.NEXT_PUBLIC_AUTH_ENDPOINT_URL

const getToken = () => Cookies.get('auth-token')


export const apiOrgaos = {
    getAll: async () => {
        const response = await fetch(`${authUrl}/orgao/all/estabelecimento/`, {
            headers: {
                'method': 'GET',
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json',
            }
        });
        if (!response.ok) throw new Error('Erro ao obter órgãos')
        return response.json()
    },
    add: async (orgao, idEstabelecimento) => {
        const response = await fetch(`${authUrl}/orgao/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({
                nome: orgao.nome,
                cnpj: orgao.cnpj,
                endereco: orgao.endereco,
                poder: orgao.poder,
                estabelecimento_id: idEstabelecimento,
                is_estabelecimento: orgao.is_estabelecimento || false,
            })
        })
        if (!response.ok) { throw new Error('Erro ao adicionar órgão') }
        else {
            return await response.json()
        }
    },
    uploadIcone: async (file, idOrgao) => {
        const formData = new FormData();
        formData.append('icone', file);

        const response = await fetch(`${authUrl}/orgao/${idOrgao}/icone/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error('Erro ao fazer upload do logo');
        }

        return await response.json();
    },
    delete: async (idOrgao) => {
        try {
            const resposta = await fetch(`${authUrl}/orgao/${idOrgao}/`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!resposta.ok) {
                throw new Error('Erro ao deletar o órgão.');
            }
        }
        catch (error) {
            return error
        }
    },
    update: async (orgao, id) => {
        const response = await fetch(`${authUrl}/orgao/${id}/`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ ...orgao })
        });
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
