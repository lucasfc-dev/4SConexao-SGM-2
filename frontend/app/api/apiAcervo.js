'use client'
import Cookies from 'js-cookie'

const acervoUrl = process.env.NEXT_PUBLIC_ACERVO_ENDPOINT_URL

function headers(extra = {}) {
    return {
        'Authorization': `Bearer ${Cookies.get('auth-token')}`,
        'Content-Type': 'application/json',
        ...extra,
    }
}

async function handle(res) {
    if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.detail || `Erro ${res.status}`)
    }
    return res.json()
}

export const apiAcervo = {
    pastas: {
        getRaiz: () =>
            fetch(`${acervoUrl}/pastas/raiz/`, { headers: headers() }).then(handle),

        getConteudo: (id) =>
            fetch(`${acervoUrl}/pastas/${id}/conteudo/`, { headers: headers() }).then(handle),

        criar: (nome, parentId) =>
            fetch(`${acervoUrl}/pastas/`, {
                method: 'POST',
                headers: headers(),
                body: JSON.stringify({ nome, parent_id: parentId }),
            }).then(handle),

        renomear: async (id, nome) =>
            fetch(`${acervoUrl}/pastas/${id}/`, {
                method: 'PATCH',
                headers: headers(),
                body: JSON.stringify({ nome }),
            }).then(handle),

        deletar: async (id) =>
            fetch(`${acervoUrl}/pastas/${id}/`, {
                method: 'DELETE',
                headers: headers(),
            }).then(handle),
    },

    permissoes: {
        conceder: (payload) =>
            fetch(`${acervoUrl}/permissoes/`, {
                method: 'POST',
                headers: headers(),
                body: JSON.stringify(payload),
            }).then(handle),

        listarPorPasta: (folderId) =>
            fetch(`${acervoUrl}/permissoes/folder/${folderId}/`, { headers: headers() }).then(handle),

        listarPorUsuario: async (userId, estabelecimentoId = null) => {
            const url = new URL(`${acervoUrl}/permissoes/user/${userId}/`)
            if (estabelecimentoId) url.searchParams.set('estabelecimento', estabelecimentoId)
            return fetch(url.toString(), { headers: headers() }).then(handle)
        },

        atualizar: (id, payload) =>
            fetch(`${acervoUrl}/permissoes/${id}/`, {
                method: 'PATCH',
                headers: headers(),
                body: JSON.stringify(payload),
            }).then(handle),

        revogar: (id) =>
            fetch(`${acervoUrl}/permissoes/${id}/`, {
                method: 'DELETE',
                headers: headers(),
            }).then(handle),
    },

    arquivos: {
        upload: async (folderId, file) => {
            const form = new FormData()
            form.append('folder_id', folderId)
            form.append('file', file)
            return fetch(`${acervoUrl}/arquivos/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${Cookies.get('auth-token')}` },
                body: form,
            }).then(handle)
        },

        getMetadata: (id) =>
            fetch(`${acervoUrl}/arquivos/${id}/`, { headers: headers() }).then(handle),

        download: async (id) => {
            const res = await fetch(`${acervoUrl}/arquivos/${id}/content/`, {
                headers: { 'Authorization': `Bearer ${Cookies.get('auth-token')}` },
            })
            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                throw new Error(body.detail || `Erro ${res.status}`)
            }
            return res.blob()
        },

        renomear: (id, nome) =>
            fetch(`${acervoUrl}/arquivos/${id}/`, {
                method: 'PATCH',
                headers: headers(),
                body: JSON.stringify({ nome }),
            }).then(handle),

        deletar: (id) =>
            fetch(`${acervoUrl}/arquivos/${id}/`, {
                method: 'DELETE',
                headers: headers(),
            }).then(res => { if (!res.ok) return handle(res) }),
    },
}
