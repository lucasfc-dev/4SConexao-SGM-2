import Cookies from "js-cookie";

const transparenciaApiUrl = process.env.NEXT_PUBLIC_TRANSPARENCIA_ENDPOINT_URL
const token = Cookies.get("auth-token");

const ap = (fd, k, v) => { if (v != null && v !== '') fd.append(k, v) }

export async function cadastrarTransferenciaRecebidaConvenio(data) {
    try {
        const formData = new FormData()
        ap(formData, "orgao_repassador", data.orgaoRepassador?.trim())
        ap(formData, "numero_convenio", data.numeroConvenio?.trim())
        ap(formData, "ano_convenio", data.anoConvenio)
        ap(formData, "objeto", data.objeto?.trim())
        ap(formData, "valor_total", data.valorTotal)
        ap(formData, "valor_repassado", data.valorRepassado)
        ap(formData, "data_inicio_vigencia", data.dataInicioVigencia)
        ap(formData, "data_fim_vigencia", data.dataFimVigencia)
        if (data.arquivo) formData.append("file", data.arquivo)

        const response = await fetch(`${transparenciaApiUrl}/transferencia_recebida_convenio/`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` },
            body: formData,
        });

        if (!response.ok) throw new Error("Erro ao cadastrar transferência recebida");
        return await response.json();
    } catch (error) {
        console.error("Erro ao cadastrar transferência recebida:", error);
        throw error;
    }
}

export async function obterArquivoTransferenciaRecebida(id) {
    try {
        const response = await fetch(`${transparenciaApiUrl}/transferencia_recebida_convenio/${id}/arquivo/`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Erro ao obter arquivo");
        return await response.blob();
    } catch (error) {
        console.error("Erro ao obter arquivo:", error);
        throw error;
    }
}

export async function editarTransferenciaRecebidaConvenio(id, data) {
    try {
        const formData = new FormData()
        ap(formData, "orgao_repassador", data.orgaoRepassador?.trim())
        ap(formData, "numero_convenio", data.numeroConvenio?.trim())
        ap(formData, "ano_convenio", data.anoConvenio)
        ap(formData, "objeto", data.objeto?.trim())
        ap(formData, "valor_total", data.valorTotal)
        ap(formData, "valor_repassado", data.valorRepassado)
        ap(formData, "data_inicio_vigencia", data.dataInicioVigencia)
        ap(formData, "data_fim_vigencia", data.dataFimVigencia)
        if (data.arquivo != null) formData.append("file", data.arquivo)

        const response = await fetch(`${transparenciaApiUrl}/transferencia_recebida_convenio/${id}/`, {
            method: "PATCH",
            headers: { "Authorization": `Bearer ${token}` },
            body: formData,
        });

        if (!response.ok) throw new Error("Erro ao editar transferência recebida");
        return await response.json();
    } catch (error) {
        console.error("Erro ao editar transferência recebida:", error);
        throw error;
    }
}

export async function excluirTransferenciaRecebidaConvenio(id) {
    try {
        const response = await fetch(`${transparenciaApiUrl}/transferencia_recebida_convenio/${id}/`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Erro ao excluir transferência recebida");
        return true;
    } catch (error) {
        console.error("Erro ao excluir transferência recebida:", error);
        throw error;
    }
}

export async function listarTransferenciasRecebidasConvenios(estId, page = 1, limit = 10, filters = {}) {
    try {
        const offset = (page - 1) * limit;
        const queryParams = new URLSearchParams({
            offset: offset.toString(),
            limit: limit.toString()
        });

        if (filters.orgao_repassador) queryParams.append('orgao_repassador', filters.orgao_repassador);
        if (filters.numero_convenio) queryParams.append('numero_convenio', filters.numero_convenio);
        if (filters.ano_convenio) queryParams.append('ano_convenio', filters.ano_convenio);
        if (filters.data_inicio_vigencia__gte) queryParams.append('data_inicio_vigencia__gte', filters.data_inicio_vigencia__gte);
        if (filters.data_inicio_vigencia__lte) queryParams.append('data_inicio_vigencia__lte', filters.data_inicio_vigencia__lte);
        if (filters.data_fim_vigencia__gte) queryParams.append('data_fim_vigencia__gte', filters.data_fim_vigencia__gte);
        if (filters.data_fim_vigencia__lte) queryParams.append('data_fim_vigencia__lte', filters.data_fim_vigencia__lte);

        const response = await fetch(`${transparenciaApiUrl}/transferencia_recebida_convenio/${estId}/?${queryParams.toString()}`, {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Erro ao listar transferências recebidas");
        const result = await response.json();
        return { data: result.data, total: result.meta.total };
    } catch (error) {
        console.error("Erro ao listar transferências recebidas:", error);
        throw error;
    }
}
