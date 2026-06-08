import Cookies from "js-cookie";

const transparenciaApiUrl = process.env.NEXT_PUBLIC_TRANSPARENCIA_ENDPOINT_URL
const token = Cookies.get("auth-token");

const ap = (fd, k, v) => { if (v != null && v !== '') fd.append(k, v) }

export async function cadastrarDocPublicacao(data, categoria) {
    try {
        const formData = new FormData()
        ap(formData, "categoria", data.categoria)
        ap(formData, "data_publicacao", data.dataPublicacao)
        ap(formData, "titulo", data.titulo?.trim())
        ap(formData, "descricao", data.descricao?.trim())
        if (data.arquivo) formData.append("file", data.arquivo)

        const response = await fetch(`${transparenciaApiUrl}/publicacao_simples/${categoria}/`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` },
            body: formData,
        });

        if (!response.ok) throw new Error("Erro ao cadastrar documento de publicação");
        return await response.json();
    } catch (error) {
        console.error("Erro ao cadastrar documento de publicação:", error);
        throw error;
    }
}

export async function obterDocPublicacao(id) {
    try {
        const response = await fetch(`${transparenciaApiUrl}/publicacao_simples/${id}/arquivo/`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Erro ao obter documento de publicação");
        return await response.blob();
    } catch (error) {
        console.error("Erro ao obter documento de publicação:", error);
        throw error;
    }
}

export async function editarDocPublicacao(id, data) {
    try {
        const formData = new FormData()
        ap(formData, "categoria", data.categoria)
        ap(formData, "data_publicacao", data.dataPublicacao)
        ap(formData, "titulo", data.titulo?.trim())
        ap(formData, "descricao", data.descricao?.trim())
        if (data.arquivo != null) formData.append("file", data.arquivo)

        const response = await fetch(`${transparenciaApiUrl}/publicacao_simples/${id}/`, {
            method: "PATCH",
            headers: { "Authorization": `Bearer ${token}` },
            body: formData,
        })
        if (!response.ok) throw new Error("Erro ao editar documento de publicação");
        return await response.json();
    } catch (error) {
        console.error("Erro ao editar documento de publicação:", error);
        throw error;
    }
}

export async function excluirDocPublicacao(id) {
    try {
        const response = await fetch(`${transparenciaApiUrl}/publicacao_simples/${id}/`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` },
        })
        if (!response.ok) throw new Error("Erro ao excluir documento de publicação");
        return true;
    } catch (error) {
        console.error("Erro ao excluir documento de publicação:", error);
        throw error;
    }
}

export async function listarDocsPublicacao(categoria, estId, page = 1, limit = 10, filters = {}) {
    try {
        const offset = (page - 1) * limit;
        const queryParams = new URLSearchParams({
            offset: offset.toString(),
            limit: limit.toString()
        });

        if (filters.titulo) queryParams.append('titulo', filters.titulo);
        if (filters.descricao) queryParams.append('descricao', filters.descricao);
        if (filters.data_publicacao__gte) queryParams.append('data_publicacao__gte', filters.data_publicacao__gte);
        if (filters.data_publicacao__lte) queryParams.append('data_publicacao__lte', filters.data_publicacao__lte);

        const response = await fetch(`${transparenciaApiUrl}/publicacao_simples/${estId}/${categoria}/?${queryParams.toString()}`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` },
        })
        if (!response.ok) throw new Error("Erro ao listar documentos de publicação");
        const result = await response.json();
        return { data: result.data, total: result.meta.total };
    } catch (error) {
        console.error("Erro ao listar documentos de publicação:", error);
        throw error;
    }
}
