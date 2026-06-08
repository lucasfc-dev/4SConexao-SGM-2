import Cookies from "js-cookie";

const transparenciaApiUrl = process.env.NEXT_PUBLIC_TRANSPARENCIA_ENDPOINT_URL
const token = Cookies.get("auth-token");

const ap = (fd, k, v) => { if (v != null && v !== '') fd.append(k, v) }

export async function cadastrarObraParalisada(data) {
    try {
        const formData = new FormData()
        ap(formData, "titulo", data.titulo?.trim())
        ap(formData, "objeto_obra", data.objetoObra?.trim())
        ap(formData, "data_paralisacao", data.dataParalisacao)
        ap(formData, "responsavel", data.responsavel?.trim())
        ap(formData, "justificativa", data.justificativa?.trim())
        ap(formData, "data_previsao_retorno", data.dataPrevisaoRetorno)
        if (data.arquivo) formData.append("file", data.arquivo)

        const response = await fetch(`${transparenciaApiUrl}/obras_paralisadas/`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` },
            body: formData,
        });

        if (!response.ok) throw new Error("Erro ao cadastrar obra paralisada");
        return await response.json();
    } catch (error) {
        console.error("Erro ao cadastrar obra paralisada:", error);
        throw error;
    }
}

export async function obterObraParalisada(id) {
    try {
        const response = await fetch(`${transparenciaApiUrl}/obras_paralisadas/${id}/arquivo/`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Erro ao obter arquivo da obra paralisada");
        return await response.blob();
    } catch (error) {
        console.error("Erro ao obter arquivo da obra paralisada:", error);
        throw error;
    }
}

export async function obterDetalhesObraParalisada(id) {
    try {
        const response = await fetch(`${transparenciaApiUrl}/obras_paralisadas/${id}/detalhes/`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Erro ao obter detalhes da obra paralisada");
        return await response.json();
    } catch (error) {
        console.error("Erro ao obter detalhes da obra paralisada:", error);
        throw error;
    }
}

export async function editarObraParalisada(id, data) {
    try {
        const formData = new FormData()
        ap(formData, "titulo", data.titulo?.trim())
        ap(formData, "objeto_obra", data.objetoObra?.trim())
        ap(formData, "data_paralisacao", data.dataParalisacao)
        ap(formData, "responsavel", data.responsavel?.trim())
        ap(formData, "justificativa", data.justificativa?.trim())
        ap(formData, "data_previsao_retorno", data.dataPrevisaoRetorno)
        if (data.arquivo != null) formData.append("file", data.arquivo)

        const response = await fetch(`${transparenciaApiUrl}/obras_paralisadas/${id}/`, {
            method: "PATCH",
            headers: { "Authorization": `Bearer ${token}` },
            body: formData,
        })
        if (!response.ok) throw new Error("Erro ao editar obra paralisada");
        return await response.json();
    } catch (error) {
        console.error("Erro ao editar obra paralisada:", error);
        throw error;
    }
}

export async function excluirObraParalisada(id) {
    try {
        const response = await fetch(`${transparenciaApiUrl}/obras_paralisadas/${id}/`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` },
        })
        if (!response.ok) throw new Error("Erro ao excluir obra paralisada");
        return true;
    } catch (error) {
        console.error("Erro ao excluir obra paralisada:", error);
        throw error;
    }
}

export async function listarObrasParalisadas(estId, page = 1, limit = 10, filters = {}) {
    try {
        const offset = (page - 1) * limit;
        const queryParams = new URLSearchParams({
            offset: offset.toString(),
            limit: limit.toString()
        });

        if (filters.titulo) queryParams.append('titulo', filters.titulo);
        if (filters.responsavel) queryParams.append('responsavel', filters.responsavel);
        if (filters.data_paralisacao__gte) queryParams.append('data_paralisacao__gte', filters.data_paralisacao__gte);
        if (filters.data_paralisacao__lte) queryParams.append('data_paralisacao__lte', filters.data_paralisacao__lte);
        if (filters.data_previsao_retorno__gte) queryParams.append('data_previsao_retorno__gte', filters.data_previsao_retorno__gte);
        if (filters.data_previsao_retorno__lte) queryParams.append('data_previsao_retorno__lte', filters.data_previsao_retorno__lte);

        const response = await fetch(`${transparenciaApiUrl}/obras_paralisadas/${estId}/?${queryParams.toString()}`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` },
        })
        if (!response.ok) throw new Error("Erro ao listar obras paralisadas");
        const result = await response.json();
        return { data: result.data, total: result.meta.total };
    } catch (error) {
        console.error("Erro ao listar obras paralisadas:", error);
        throw error;
    }
}
