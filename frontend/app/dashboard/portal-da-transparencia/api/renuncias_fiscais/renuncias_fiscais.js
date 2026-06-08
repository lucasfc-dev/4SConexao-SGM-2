import Cookies from "js-cookie";

const transparenciaApiUrl = process.env.NEXT_PUBLIC_TRANSPARENCIA_ENDPOINT_URL;
const token = Cookies.get("auth-token");

const ap = (fd, k, v) => { if (v != null && v !== '') fd.append(k, v) }

export async function listarRenunciasFiscais(estabelecimentoId, page = 1, limit = 10, filters = {}) {
    try {
        const offset = (page - 1) * limit;
        const queryParams = new URLSearchParams({
            offset: offset.toString(),
            limit: limit.toString()
        });

        if (filters.data_publicacao__gte) queryParams.append('data_publicacao__gte', filters.data_publicacao__gte);
        if (filters.data_publicacao__lte) queryParams.append('data_publicacao__lte', filters.data_publicacao__lte);
        if (filters.tipo_receita) queryParams.append('tipo_receita', filters.tipo_receita);
        if (filters.tipo_renuncia) queryParams.append('tipo_renuncia', filters.tipo_renuncia);

        const response = await fetch(`${transparenciaApiUrl}/renuncia_fiscal/${estabelecimentoId}/?${queryParams.toString()}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Erro ao listar renúncias fiscais');
        const result = await response.json();
        return { data: result.data, meta: result.meta };
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function criarRenunciaFiscal(data) {
    try {
        const formData = new FormData();
        ap(formData, 'data_publicacao', data.dataPublicacao)
        ap(formData, 'tipo_receita', data.tipoReceita?.trim())
        ap(formData, 'tipo_renuncia', data.tipoRenuncia?.trim())
        if (data.file) formData.append('file', data.file)

        const response = await fetch(`${transparenciaApiUrl}/renuncia_fiscal/`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        if (!response.ok) throw new Error('Erro ao criar renúncia fiscal');
        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function atualizarRenunciaFiscal(renunciaId, data) {
    try {
        const formData = new FormData();
        ap(formData, 'data_publicacao', data.dataPublicacao)
        ap(formData, 'tipo_receita', data.tipoReceita?.trim())
        ap(formData, 'tipo_renuncia', data.tipoRenuncia?.trim())
        if (data.file != null) formData.append("file", data.file)

        const response = await fetch(`${transparenciaApiUrl}/renuncia_fiscal/${renunciaId}/`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        if (!response.ok) throw new Error('Erro ao atualizar renúncia fiscal');
        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function deletarRenunciaFiscal(renunciaId) {
    try {
        const response = await fetch(`${transparenciaApiUrl}/renuncia_fiscal/${renunciaId}/`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Erro ao deletar renúncia fiscal');
        return await response.json();
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function getArquivoRenunciaFiscal(renunciaId) {
    try {
        const response = await fetch(`${transparenciaApiUrl}/renuncia_fiscal/${renunciaId}/arquivo/`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Erro ao obter arquivo da renúncia fiscal');
        return await response.blob();
    } catch (error) {
        console.error(error);
        throw error;
    }
}
