import Cookies from "js-cookie";

const transparenciaApiUrl = process.env.NEXT_PUBLIC_TRANSPARENCIA_ENDPOINT_URL
const token = Cookies.get("auth-token");

const ap = (fd, k, v) => { if (v != null && v !== '') fd.append(k, v) }

export async function cadastrarConcursoPublico(data) {
    try {
        const formData = new FormData()
        ap(formData, "tipo_processo", data.tipoProcesso?.trim())
        ap(formData, "numero_edital", data.numeroEdital?.trim())
        ap(formData, "data_publicacao", data.dataPublicacao)
        ap(formData, "situacao", data.situacao?.trim())
        ap(formData, "data_inicio_inscricoes", data.dataInicioInscricoes)
        ap(formData, "data_homologacao", data.dataHomologacao)
        ap(formData, "data_validade", data.dataValidade)
        ap(formData, "veiculo_publicacao", data.veiculoPublicacao)
        if (data.arquivo) formData.append("file", data.arquivo)

        const response = await fetch(`${transparenciaApiUrl}/concurso_publico/`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` },
            body: formData,
        });

        if (!response.ok) throw new Error("Erro ao cadastrar concurso público");
        return await response.json();
    } catch (error) {
        console.error("Erro ao cadastrar concurso público:", error);
        throw error;
    }
}

export async function editarConcursoPublico(id, data) {
    try {
        const formData = new FormData()
        ap(formData, "tipo_processo", data.tipoProcesso?.trim())
        ap(formData, "numero_edital", data.numeroEdital?.trim())
        ap(formData, "data_publicacao", data.dataPublicacao)
        ap(formData, "situacao", data.situacao?.trim())
        ap(formData, "data_inicio_inscricoes", data.dataInicioInscricoes)
        ap(formData, "data_homologacao", data.dataHomologacao)
        ap(formData, "data_validade", data.dataValidade)
        ap(formData, "veiculo_publicacao", data.veiculoPublicacao)
        if (data.arquivo) formData.append("file", data.arquivo)

        const response = await fetch(`${transparenciaApiUrl}/concurso_publico/${id}/`, {
            method: "PATCH",
            headers: { "Authorization": `Bearer ${token}` },
            body: formData,
        })
        if (!response.ok) throw new Error("Erro ao editar concurso público");
        return await response.json();
    } catch (error) {
        console.error("Erro ao editar concurso público:", error);
        throw error;
    }
}

export async function excluirConcursoPublico(id) {
    try {
        const response = await fetch(`${transparenciaApiUrl}/concurso_publico/${id}/`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` },
        })
        if (!response.ok) throw new Error("Erro ao excluir concurso público");
        return true;
    } catch (error) {
        console.error("Erro ao excluir concurso público:", error);
        throw error;
    }
}

export async function listarConcursosPublicos(estId, page = 1, limit = 10, filters = {}) {
    try {
        const offset = (page - 1) * limit;
        const queryParams = new URLSearchParams({
            offset: offset.toString(),
            limit: limit.toString()
        });

        if (filters.tipo_processo) queryParams.append('tipo_processo', filters.tipo_processo);
        if (filters.situacao) queryParams.append('situacao', filters.situacao);
        if (filters.data_publicacao__gte) queryParams.append('data_publicacao__gte', filters.data_publicacao__gte);
        if (filters.data_publicacao__lte) queryParams.append('data_publicacao__lte', filters.data_publicacao__lte);
        if (filters.data_inicio_inscricoes__gte) queryParams.append('data_inicio_inscricoes__gte', filters.data_inicio_inscricoes__gte);
        if (filters.data_inicio_inscricoes__lte) queryParams.append('data_inicio_inscricoes__lte', filters.data_inicio_inscricoes__lte);
        if (filters.data_homologacao__gte) queryParams.append('data_homologacao__gte', filters.data_homologacao__gte);
        if (filters.data_homologacao__lte) queryParams.append('data_homologacao__lte', filters.data_homologacao__lte);
        if (filters.data_validade__gte) queryParams.append('data_validade__gte', filters.data_validade__gte);
        if (filters.data_validade__lte) queryParams.append('data_validade__lte', filters.data_validade__lte);
        if (filters.veiculo_publicacao) queryParams.append('veiculo_publicacao', filters.veiculo_publicacao);

        const response = await fetch(`${transparenciaApiUrl}/concurso_publico/${estId}/?${queryParams.toString()}`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` },
        })
        if (!response.ok) throw new Error("Erro ao listar concursos públicos");
        const result = await response.json();
        return { data: result.data, meta: result.meta };
    } catch (error) {
        console.error("Erro ao listar concursos públicos:", error);
        throw error;
    }
}
