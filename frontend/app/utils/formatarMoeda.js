function montarStringMoeda(centavos) {
    const inteiroParte = Math.floor(centavos / 100)
    const centavosParte = String(centavos % 100).padStart(2, '0')
    const inteiroStr = String(inteiroParte)
    let comMilhares = ''
    for (let i = 0; i < inteiroStr.length; i++) {
        if (i > 0 && (inteiroStr.length - i) % 3 === 0) comMilhares += '.'
        comMilhares += inteiroStr[i]
    }
    return `${comMilhares},${centavosParte}`
}

export function formatarMoeda(valor) {
    if (valor === null || valor === undefined || valor === '') return 'R$ 0,00'
    const numero = typeof valor === 'number' ? valor : parseFloat(String(valor).replace(',', '.'))
    if (isNaN(numero)) return 'R$ 0,00'
    const centavos = Math.round(numero * 100)
    return 'R$ ' + montarStringMoeda(centavos)
}

export function formatarMoedaInput(valor) {
    if (valor === null || valor === undefined || valor === '') return ''
    const digitos = String(valor).replace(/\D/g, '')
    if (!digitos) return ''
    const centavos = parseInt(digitos, 10)
    return montarStringMoeda(centavos)
}

export function desformatarMoeda(valorFormatado) {
    if (valorFormatado === null || valorFormatado === undefined || valorFormatado === '') return ''
    const digitos = String(valorFormatado).replace(/\D/g, '')
    if (!digitos) return ''
    const centavos = parseInt(digitos, 10)
    const inteiro = Math.floor(centavos / 100)
    const resto = String(centavos % 100).padStart(2, '0')
    return `${inteiro}.${resto}`
}

export function numeroParaInput(valor) {
    if (valor === null || valor === undefined || valor === '') return ''
    const numero = typeof valor === 'number' ? valor : parseFloat(String(valor).replace(',', '.'))
    if (isNaN(numero)) return ''
    const centavos = Math.round(numero * 100)
    return montarStringMoeda(centavos)
}
