import Cookies from "js-cookie"

const token = Cookies.get('auth-token')
const transparenciaApiUrl = process.env.NEXT_PUBLIC_TRANSPARENCIA_ENDPOINT_URL

const ap = (fd, k, v) => { if (v != null && v !== '') fd.append(k, v) }

export async function cadastrarJulgamentoContas(dadosFormulario) {
    try {
        const formData = new FormData()
        ap(formData, 'data_publicacao', dadosFormulario.dataPublicacao)
        ap(formData, 'numero', dadosFormulario.numero)
        ap(formData, 'status', dadosFormulario.status)
        ap(formData, 'ano_processo', dadosFormulario.anoProcesso)
        ap(formData, 'data_resultado', dadosFormulario.dataResultado)
        if (dadosFormulario.arquivo) formData.append('file', dadosFormulario.arquivo)

        const response = await fetch(`${transparenciaApiUrl}/julgamento_contas_executivo/`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
        })
        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.detail || 'Erro ao cadastrar julgamento de contas')
        }
        return await response.json()
    } catch (error) {
        console.error("Erro ao cadastrar julgamento de contas:", error)
        throw error
    }
}

export async function editarJulgamentoContas(id, dadosFormulario) {
    try {
        const formData = new FormData()
        ap(formData, 'data_publicacao', dadosFormulario.dataPublicacao)
        ap(formData, 'numero', dadosFormulario.numero)
        ap(formData, 'status', dadosFormulario.status)
        ap(formData, 'ano_processo', dadosFormulario.anoProcesso)
        ap(formData, 'data_resultado', dadosFormulario.dataResultado)
        if (dadosFormulario.arquivo instanceof File) formData.append('file', dadosFormulario.arquivo)

        const response = await fetch(`${transparenciaApiUrl}/julgamento_contas_executivo/${id}/`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
        })
        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(`Erro ao editar julgamento de contas: ${errorData.detail || response.statusText}`)
        }
        return await response.json()
    } catch (error) {
        console.error("Erro ao editar julgamento de contas:", error)
        throw error
    }
}

export async function excluirJulgamentoContas(id) {
    try {
        const response = await fetch(`${transparenciaApiUrl}/julgamento_contas_executivo/${id}/`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        })
        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(`Erro ao excluir julgamento de contas: ${errorData.detail || response.statusText}`)
        }
        return true
    } catch (error) {
        console.error("Erro ao excluir julgamento de contas:", error)
        throw error
    }
}

export async function obterArquivoJulgamentoContas(id) {
    try {
        const response = await fetch(`${transparenciaApiUrl}/julgamento_contas_executivo/${id}/arquivo/`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
        })
        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(`Erro ao obter arquivo: ${errorData.detail || response.statusText}`)
        }
        return await response.blob()
    } catch (error) {
        console.error("Erro ao obter arquivo do julgamento de contas:", error)
        throw error
    }
}

export async function listarJulgamentoContas(estId, filters = {}) {
    try {
        const queryParams = new URLSearchParams();

        if (filters.numero) queryParams.append('numero', filters.numero);
        if (filters.ano_processo) queryParams.append('ano_processo', filters.ano_processo.toString());
        if (filters.status) queryParams.append('status', filters.status);
        if (filters.data_publicacao__gte) queryParams.append('data_publicacao__gte', filters.data_publicacao__gte);
        if (filters.data_publicacao__lte) queryParams.append('data_publicacao__lte', filters.data_publicacao__lte);
        if (filters.data_resultado__gte) queryParams.append('data_resultado__gte', filters.data_resultado__gte);
        if (filters.data_resultado__lte) queryParams.append('data_resultado__lte', filters.data_resultado__lte);
        if (filters.offset !== undefined) queryParams.append('offset', filters.offset.toString());
        if (filters.limit !== undefined) queryParams.append('limit', filters.limit.toString());

        const response = await fetch(`${transparenciaApiUrl}/julgamento_contas_executivo/${estId}/?${queryParams.toString()}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
        })
        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(`Erro ao listar julgamentos de contas: ${errorData.detail || response.statusText}`)
        }
        const result = await response.json()
        return { registros: result.data, total: result.meta.total }
    } catch (error) {
        console.error("Erro ao listar julgamentos de contas:", error)
        throw error
    }
}
