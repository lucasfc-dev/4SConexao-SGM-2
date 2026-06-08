import Cookies from "js-cookie";

const transparenciaApiUrl = process.env.NEXT_PUBLIC_TRANSPARENCIA_ENDPOINT_URL
const token = Cookies.get("auth-token");

const ap = (fd, k, v) => { if (v != null && v !== '') fd.append(k, v) }

export async function cadastrarObra(data) {
    try {
        const formData = new FormData()
        ap(formData, "objeto", data.objeto?.trim())
        ap(formData, "situacao", data.situacao)
        ap(formData, "data_inicio", data.dataInicio)
        ap(formData, "empresa_contratada", data.empresaContratada?.trim())
        ap(formData, "percentual_concluido", data.percentualConcluido)
        ap(formData, "data_conclusao", data.dataConclusao)
        if (data.arquivo) formData.append("file", data.arquivo)

        const response = await fetch(`${transparenciaApiUrl}/obra/`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` },
            body: formData,
        });

        if (!response.ok) throw new Error("Erro ao cadastrar obra");
        return await response.json();
    } catch (error) {
        console.error("Erro ao cadastrar obra:", error);
        throw error;
    }
}

export async function obterArquivoObra(id) {
    try {
        const response = await fetch(`${transparenciaApiUrl}/obra/${id}/arquivo/`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Erro ao obter arquivo da obra");
        return await response.blob();
    } catch (error) {
        console.error("Erro ao obter arquivo da obra:", error);
        throw error;
    }
}

export async function editarObra(id, data) {
    try {
        const formData = new FormData()
        ap(formData, "objeto", data.objeto?.trim())
        ap(formData, "situacao", data.situacao)
        ap(formData, "data_inicio", data.dataInicio)
        ap(formData, "empresa_contratada", data.empresaContratada?.trim())
        ap(formData, "percentual_concluido", data.percentualConcluido)
        ap(formData, "data_conclusao", data.dataConclusao)
        if (data.arquivo != null) formData.append("file", data.arquivo)

        const response = await fetch(`${transparenciaApiUrl}/obra/${id}/`, {
            method: "PATCH",
            headers: { "Authorization": `Bearer ${token}` },
            body: formData,
        });

        if (!response.ok) throw new Error("Erro ao editar obra");
        return await response.json();
    } catch (error) {
        console.error("Erro ao editar obra:", error);
        throw error;
    }
}

export async function excluirObra(id) {
    try {
        const response = await fetch(`${transparenciaApiUrl}/obra/${id}/`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Erro ao excluir obra");
        return true;
    } catch (error) {
        console.error("Erro ao excluir obra:", error);
        throw error;
    }
}

export async function listarObras(estId, page = 1, limit = 10, filters = {}) {
    try {
        const offset = (page - 1) * limit;
        const queryParams = new URLSearchParams({
            offset: offset.toString(),
            limit: limit.toString()
        });

        if (filters.empresa_contratada) queryParams.append('empresa_contratada', filters.empresa_contratada);
        if (filters.situacao) queryParams.append('situacao', filters.situacao);
        if (filters.data_inicio__gte) queryParams.append('data_inicio__gte', filters.data_inicio__gte);
        if (filters.data_inicio__lte) queryParams.append('data_inicio__lte', filters.data_inicio__lte);
        if (filters.data_conclusao__gte) queryParams.append('data_conclusao__gte', filters.data_conclusao__gte);
        if (filters.data_conclusao__lte) queryParams.append('data_conclusao__lte', filters.data_conclusao__lte);

        const response = await fetch(`${transparenciaApiUrl}/obra/${estId}/?${queryParams.toString()}`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Erro ao listar obras");
        const result = await response.json();
        return { data: result.data, total: result.meta.total };
    } catch (error) {
        console.error("Erro ao listar obras:", error);
        throw error;
    }
}
