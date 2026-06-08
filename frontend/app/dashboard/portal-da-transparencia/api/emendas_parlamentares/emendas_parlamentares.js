import Cookies from "js-cookie"

const token = Cookies.get('auth-token')
const transparenciaApiUrl = process.env.NEXT_PUBLIC_TRANSPARENCIA_ENDPOINT_URL

const ap = (fd, k, v) => { if (v != null && v !== '') fd.append(k, v) }

export async function criarEmendaParlamentar(params) {
    try {
        const formData = new FormData()
        ap(formData, 'data_publicacao', params.data_publicacao)
        ap(formData, 'ano_referencia', params.ano_referencia)
        ap(formData, 'beneficiario', params.beneficiario?.trim())
        ap(formData, 'forma_repasse', params.forma_repasse?.trim())
        ap(formData, 'tipo', params.tipo?.trim())
        ap(formData, 'numero', params.numero?.trim())
        ap(formData, 'autor', params.autor?.trim())
        ap(formData, 'valor_previsto', params.valor_previsto?.trim())
        ap(formData, 'valor_repassado', params.valor_repassado?.trim())
        ap(formData, 'funcao_governo', params.funcao_governo?.trim())
        ap(formData, 'objeto', params.objeto?.trim())
        ap(formData, 'origem', params.origem?.trim())
        if (params.file) formData.append('file', params.file)

        const response = await fetch(`${transparenciaApiUrl}/emenda_parlamentar/`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
        })
        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.detail || 'Erro ao criar emenda parlamentar')
        }
        return await response.json()
    } catch (error) {
        console.error('Erro na função criarEmendaParlamentar:', error)
        throw error
    }
}

export async function listarEmendasParlamentares(estabelecimentoId, offset = 0, limit = 10, filters = {}) {
    try {
        const queryParams = new URLSearchParams({
            offset: offset.toString(),
            limit: limit.toString()
        });

        if (filters.origem) queryParams.append('origem', filters.origem);
        if (filters.ano_referencia) queryParams.append('ano_referencia', filters.ano_referencia.toString());
        if (filters.beneficiario) queryParams.append('beneficiario', filters.beneficiario);
        if (filters.forma_repasse) queryParams.append('forma_repasse', filters.forma_repasse);
        if (filters.tipo) queryParams.append('tipo', filters.tipo);
        if (filters.numero) queryParams.append('numero', filters.numero);
        if (filters.autor) queryParams.append('autor', filters.autor);
        if (filters.data_publicacao__gte) queryParams.append('data_publicacao__gte', filters.data_publicacao__gte);
        if (filters.data_publicacao__lte) queryParams.append('data_publicacao__lte', filters.data_publicacao__lte);

        const response = await fetch(`${transparenciaApiUrl}/emenda_parlamentar/${estabelecimentoId}/?${queryParams.toString()}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
        })
        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.detail || 'Erro ao listar emendas parlamentares')
        }
        return await response.json()
    } catch (error) {
        console.error('Erro na função listarEmendasParlamentares:', error)
        throw error
    }
}

export async function deletarEmendaParlamentar(emendaId) {
    try {
        const response = await fetch(`${transparenciaApiUrl}/emenda_parlamentar/${emendaId}/`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        })
        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.detail || 'Erro ao deletar emenda parlamentar')
        }
        return true
    } catch (error) {
        console.error('Erro na função deletarEmendaParlamentar:', error)
        throw error
    }
}

export async function editarEmendaParlamentar(emendaId, params) {
    try {
        const formData = new FormData()
        ap(formData, 'data_publicacao', params.data_publicacao)
        ap(formData, 'ano_referencia', params.ano_referencia)
        ap(formData, 'beneficiario', params.beneficiario?.trim())
        ap(formData, 'forma_repasse', params.forma_repasse?.trim())
        ap(formData, 'tipo', params.tipo?.trim())
        ap(formData, 'numero', params.numero?.trim())
        ap(formData, 'autor', params.autor?.trim())
        ap(formData, 'valor_previsto', params.valor_previsto?.trim())
        ap(formData, 'valor_repassado', params.valor_repassado?.trim())
        ap(formData, 'funcao_governo', params.funcao_governo?.trim())
        ap(formData, 'objeto', params.objeto?.trim())
        ap(formData, 'origem', params.origem?.trim())
        if (params.file) formData.append('file', params.file)

        const response = await fetch(`${transparenciaApiUrl}/emenda_parlamentar/${emendaId}/`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData,
        })
        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.detail || 'Erro ao editar emenda parlamentar')
        }
        return await response.json()
    } catch (error) {
        console.error('Erro na função editarEmendaParlamentar:', error)
        throw error
    }
}

export async function obterArquivoEmendaParlamentar(emendaId) {
    try {
        const response = await fetch(`${transparenciaApiUrl}/emenda_parlamentar/${emendaId}/arquivo/`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
        })
        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.detail || 'Erro ao obter arquivo da emenda parlamentar')
        }
        return await response.blob()
    } catch (error) {
        console.error('Erro ao obter arquivo da emenda parlamentar:', error)
        throw error
    }
}
