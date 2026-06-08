import Cookies from "js-cookie"

const token = Cookies.get('auth-token')
const transparenciaApiUrl = process.env.NEXT_PUBLIC_TRANSPARENCIA_ENDPOINT_URL

const ap = (fd, k, v) => { if (v != null && v !== '') fd.append(k, v) }

export async function cadastrarApreciacaoContas(dadosFormulario) {
    try {
        const formData = new FormData()
        ap(formData, 'data_registro', dadosFormulario.dataRegistro)
        ap(formData, 'modalidade', dadosFormulario.modalidade?.trim())
        ap(formData, 'status', dadosFormulario.status)
        ap(formData, 'nome', dadosFormulario.nome?.trim())
        ap(formData, 'descricao', dadosFormulario.descricao?.trim())
        ap(formData, 'data_resultado', dadosFormulario.dataResultado)
        if (dadosFormulario.arquivo) formData.append('file', dadosFormulario.arquivo)

        const response = await fetch(`${transparenciaApiUrl}/apreciacao_contas/`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
        })
        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.detail || 'Erro ao cadastrar apreciação de contas')
        }
        return await response.json()
    } catch (error) {
        console.error("Erro ao cadastrar apreciação de contas:", error)
        throw error
    }
}

export async function editarApreciacaoContas(id, dadosFormulario) {
    try {
        const formData = new FormData()
        ap(formData, 'data_registro', dadosFormulario.dataRegistro)
        ap(formData, 'modalidade', dadosFormulario.modalidade?.trim())
        ap(formData, 'status', dadosFormulario.status)
        ap(formData, 'nome', dadosFormulario.nome?.trim())
        ap(formData, 'descricao', dadosFormulario.descricao?.trim())
        ap(formData, 'data_resultado', dadosFormulario.dataResultado)
        if (dadosFormulario.arquivo) formData.append('file', dadosFormulario.arquivo)

        const response = await fetch(`${transparenciaApiUrl}/apreciacao_contas/${id}/`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
        })
        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.detail || 'Erro ao editar apreciação de contas')
        }
        return await response.json()
    } catch (error) {
        console.error("Erro ao editar apreciação de contas:", error)
        throw error
    }
}

export async function excluirApreciacaoContas(id) {
    try {
        const response = await fetch(`${transparenciaApiUrl}/apreciacao_contas/${id}/`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        })
        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.detail || 'Erro ao excluir apreciação de contas')
        }
        return await response.json()
    } catch (error) {
        console.error("Erro ao excluir apreciação de contas:", error)
        throw error
    }
}

export async function listarApreciacaoContas(id, page = 1, limit = 10, filters = {}) {
    try {
        const offset = (page - 1) * limit;
        const queryParams = new URLSearchParams({
            offset: offset.toString(),
            limit: limit.toString()
        });

        if (filters.nome) queryParams.append('nome', filters.nome);
        if (filters.data_registro__gte) queryParams.append('data_registro__gte', filters.data_registro__gte);
        if (filters.data_registro__lte) queryParams.append('data_registro__lte', filters.data_registro__lte);
        if (filters.data_resultado__gte) queryParams.append('data_resultado__gte', filters.data_resultado__gte);
        if (filters.data_resultado__lte) queryParams.append('data_resultado__lte', filters.data_resultado__lte);
        if (filters.modalidade) queryParams.append('modalidade', filters.modalidade);
        if (filters.status) queryParams.append('status', filters.status);

        const response = await fetch(`${transparenciaApiUrl}/apreciacao_contas/${id}/?${queryParams.toString()}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
        })
        if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`)
        const result = await response.json()
        return { data: result.data, meta: result.meta };
    } catch (error) {
        console.error("Erro ao listar apreciação de contas:", error)
        throw error
    }
}
