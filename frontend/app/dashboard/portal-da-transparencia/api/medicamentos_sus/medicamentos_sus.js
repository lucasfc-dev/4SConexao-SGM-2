import Cookies from "js-cookie"

const transparenciaApiUrl = process.env.NEXT_PUBLIC_TRANSPARENCIA_ENDPOINT_URL
const token = Cookies.get("auth-token")

const ap = (fd, k, v) => { if (v != null && v !== '') fd.append(k, v) }

export async function listarMedicamentosSUS(estabelecimentoId, offset = 0, limit = 10, filters = {}) {
    try {
        const queryParams = new URLSearchParams({
            offset: offset.toString(),
            limit: limit.toString()
        });

        if (filters.nome_unidade) queryParams.append('nome_unidade', filters.nome_unidade);
        if (filters.endereco) queryParams.append('endereco', filters.endereco);

        const response = await fetch(`${transparenciaApiUrl}/medicamento_sus/${estabelecimentoId}/?${queryParams.toString()}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
        })
        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(`Erro ao listar medicamentos do SUS: ${errorData.detail || response.statusText}`)
        }
        return await response.json()
    } catch (error) {
        console.error('Erro ao listar medicamentos do SUS:', error)
        throw error
    }
}

export async function atualizarListaDeMedicamentosSUS(medicamentoId, data) {
    try {
        const formData = new FormData();
        ap(formData, 'nome_unidade', data.nome_unidade?.trim())
        ap(formData, 'endereco', data.endereco?.trim())
        ap(formData, 'telefone', data.telefone)
        if (data.file) formData.append('file', data.file)

        const response = await fetch(`${transparenciaApiUrl}/medicamento_sus/${medicamentoId}/`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        if (!response.ok) throw new Error('Erro ao atualizar medicamento do SUS');
        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function criarMedicamentoSUS(data) {
    try {
        const formData = new FormData()
        ap(formData, 'nome_unidade', data.nome_unidade?.trim())
        ap(formData, 'endereco', data.endereco?.trim())
        ap(formData, 'telefone', data.telefone)
        if (data.file) formData.append('file', data.file)

        const response = await fetch(`${transparenciaApiUrl}/medicamento_sus/`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
        })
        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.detail || 'Erro ao criar medicamento do SUS')
        }
        return await response.json()
    } catch (error) {
        console.error('Erro ao criar medicamento do SUS:', error)
        throw error
    }
}

export async function deletarMedicamentoSUS(medicamentoId) {
    try {
        const response = await fetch(`${transparenciaApiUrl}/medicamento_sus/${medicamentoId}/`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        })
        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.detail || 'Erro ao deletar medicamento do SUS')
        }
        return true
    } catch (error) {
        console.error('Erro ao deletar medicamento do SUS:', error)
        throw error
    }
}

export async function obterArquivoMedicamentoSUS(medicamentoId) {
    try {
        const response = await fetch(`${transparenciaApiUrl}/medicamento_sus/${medicamentoId}/arquivo/`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
        })
        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.detail || 'Erro ao obter arquivo do medicamento do SUS')
        }
        return await response.blob()
    } catch (error) {
        console.error('Erro ao obter arquivo do medicamento do SUS:', error)
        throw error
    }
}
