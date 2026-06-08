import Cookies from "js-cookie"

const token = Cookies.get('auth-token')
const transparenciaApiUrl = process.env.NEXT_PUBLIC_TRANSPARENCIA_ENDPOINT_URL

const ap = (fd, k, v) => { if (v != null && v !== '') fd.append(k, v) }

export async function criarDocumentoNumerado(categoria, dadosFormulario) {
    try {
        const formData = new FormData()
        ap(formData, 'categoria', categoria)
        ap(formData, 'data_publicacao', dadosFormulario.dataPublicacao)
        ap(formData, 'titulo', dadosFormulario.titulo?.trim())
        ap(formData, 'descricao', dadosFormulario.descricao?.trim())
        ap(formData, 'num_doc', dadosFormulario.numDoc?.trim())
        if (dadosFormulario.arquivo) formData.append('file', dadosFormulario.arquivo)

        const response = await fetch(`${transparenciaApiUrl}/doc_numerado/${categoria}/`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
        })
        if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`)
        return await response.json()
    } catch (error) {
        console.error("Erro ao criar documento numerado:", error)
        throw error
    }
}

export async function obterDocumentoNumerado(id) {
    try {
        const response = await fetch(`${transparenciaApiUrl}/doc_numerado/${id}/arquivo/`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
        })
        if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`)
        return await response.blob()
    } catch (error) {
        console.error("Erro ao obter documento numerado:", error)
        throw error
    }
}

export async function editarDocumentoNumerado(id, dadosFormulario) {
    try {
        const formData = new FormData()
        ap(formData, 'data_publicacao', dadosFormulario.dataPublicacao)
        ap(formData, 'titulo', dadosFormulario.titulo?.trim())
        ap(formData, 'descricao', dadosFormulario.descricao?.trim())
        ap(formData, 'num_doc', dadosFormulario.numDoc?.trim())
        if (dadosFormulario.arquivo) formData.append('file', dadosFormulario.arquivo)

        const response = await fetch(`${transparenciaApiUrl}/doc_numerado/${id}/`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
        })
        if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`)
        return await response.json()
    } catch (error) {
        console.error("Erro ao editar documento numerado:", error)
        throw error
    }
}

export async function excluirDocumentoNumerado(id) {
    try {
        const response = await fetch(`${transparenciaApiUrl}/doc_numerado/${id}/`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        })
        if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`)
        return true
    } catch (error) {
        console.error("Erro ao excluir documento numerado:", error)
        throw error
    }
}

export async function listarDocumentosNumerados(categoria, estId, opcoes = {}) {
    try {
        const { offset = 0, limit = 10, filters = {} } = opcoes
        const queryParams = new URLSearchParams({
            offset: offset.toString(),
            limit: limit.toString()
        });

        if (filters.numero) queryParams.append('numero', filters.numero);
        if (filters.titulo) queryParams.append('titulo', filters.titulo);
        if (filters.data_publicacao__gte) queryParams.append('data_publicacao__gte', filters.data_publicacao__gte);
        if (filters.data_publicacao__lte) queryParams.append('data_publicacao__lte', filters.data_publicacao__lte);

        const response = await fetch(`${transparenciaApiUrl}/doc_numerado/${estId}/${categoria}/?${queryParams.toString()}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
        })
        if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`)
        const result = await response.json()
        return { data: result.data, total: result.meta?.total }
    } catch (error) {
        console.error("Erro ao listar documentos numerados:", error)
        throw error
    }
}
