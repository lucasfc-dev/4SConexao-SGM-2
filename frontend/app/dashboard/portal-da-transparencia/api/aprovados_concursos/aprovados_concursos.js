import Cookies from "js-cookie";

const transparenciaApiUrl = process.env.NEXT_PUBLIC_TRANSPARENCIA_ENDPOINT_URL;
const token = Cookies.get("auth-token");

const ap = (fd, k, v) => { if (v != null && v !== '') fd.append(k, v) }

export async function criarAprovadoConcurso(data) {
    try {
        const formData = new FormData();
        ap(formData, 'concurso_id', data.concursoId)
        ap(formData, 'data_publicacao', data.dataPublicacao)
        ap(formData, 'titulo', data.titulo?.trim())
        ap(formData, 'descricao', data.descricao?.trim())
        if (data.file) formData.append('file', data.file)

        const response = await fetch(`${transparenciaApiUrl}/aprovado_concurso/`, {
            method: 'POST',
            headers: { "Authorization": `Bearer ${token}` },
            body: formData
        });
        if (!response.ok) throw new Error(`Erro ao criar lista de aprovados: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error('Erro ao criar lista de aprovados em concurso:', error);
        throw error;
    }
}

export async function atualizarListaAprovadosConcurso(listaId, data) {
    try {
        const formData = new FormData();
        ap(formData, 'concurso_id', data.concursoId)
        ap(formData, 'data_publicacao', data.dataPublicacao)
        ap(formData, 'titulo', data.titulo?.trim())
        ap(formData, 'descricao', data.descricao?.trim())
        if (data.file) formData.append('file', data.file)

        const response = await fetch(`${transparenciaApiUrl}/aprovado_concurso/${listaId}/`, {
            method: 'PATCH',
            headers: { "Authorization": `Bearer ${token}` },
            body: formData
        });
        if (!response.ok) throw new Error(`Erro ao atualizar lista de aprovados: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error('Erro ao atualizar lista de aprovados em concurso:', error);
        throw error;
    }
}

export async function deletarListaAprovadosConcurso(listaId) {
    try {
        const response = await fetch(`${transparenciaApiUrl}/aprovado_concurso/${listaId}/`, {
            method: 'DELETE',
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!response.ok) throw new Error(`Erro ao deletar lista de aprovados: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error('Erro ao deletar lista de aprovados em concurso:', error);
        throw error;
    }
}

export async function obterArquivoAprovadosConcurso(listaId) {
    try {
        const response = await fetch(`${transparenciaApiUrl}/aprovado_concurso/${listaId}/arquivo/`, {
            method: 'GET',
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!response.ok) throw new Error(`Erro ao obter arquivo: ${response.statusText}`);
        return response.blob();
    } catch (error) {
        console.error('Erro ao obter arquivo da lista de aprovados em concurso:', error);
        throw error;
    }
}

export async function obterDetalhesAprovadosConcurso(listaId) {
    try {
        const response = await fetch(`${transparenciaApiUrl}/aprovado_concurso/${listaId}/detalhes/`, {
            method: 'GET',
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!response.ok) throw new Error(`Erro ao obter detalhes: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error('Erro ao obter detalhes da lista de aprovados em concurso:', error);
        throw error;
    }
}

export async function listarAprovadosConcursos(estabelecimentoId, concursoId = null, page = 1, limit = 10, filters = {}) {
    try {
        const offset = (page - 1) * limit;
        const queryParams = new URLSearchParams({
            offset: offset.toString(),
            limit: limit.toString()
        });

        if (concursoId) queryParams.append('concurso_id', concursoId);
        if (filters.concurso_id && !concursoId) queryParams.append('concurso_id', filters.concurso_id);
        if (filters.data_publicacao__gte) queryParams.append('data_publicacao__gte', filters.data_publicacao__gte);
        if (filters.data_publicacao__lte) queryParams.append('data_publicacao__lte', filters.data_publicacao__lte);
        if (filters.titulo) queryParams.append('titulo', filters.titulo);

        const response = await fetch(`${transparenciaApiUrl}/aprovado_concurso/${estabelecimentoId}/?${queryParams.toString()}`, {
            method: 'GET',
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!response.ok) throw new Error(`Erro ao listar aprovados: ${response.statusText}`);
        const result = await response.json()
        return { data: result.data, meta: result.meta };
    } catch (error) {
        console.error('Erro ao listar listas de aprovados em concursos:', error);
        throw error;
    }
}
