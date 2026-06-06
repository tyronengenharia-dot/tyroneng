// Parser dependency-free para importar tabelas EMOP/SINAPI.
// Aceita dados colados do Excel (separados por TAB) ou CSV (";" ou ",").
// Ordem de colunas esperada: Código | Descrição | Unidade | Valor unitário.
// Linhas cujo último campo não é número (cabeçalhos, lixo) são ignoradas.

export type LinhaReferencia = {
  codigo: string
  descricao: string
  unidade: string
  valor_unitario: number
}

export type ResultadoParse = {
  linhas: LinhaReferencia[]
  ignoradas: number
  total: number
}

// "1.234,56" | "1234,56" | "1234.56" | "R$ 12,30" -> number | null
export function parseValorBR(bruto: string): number | null {
  if (!bruto) return null
  let s = bruto.replace(/[^\d.,-]/g, '').trim()
  if (s === '' || s === '-') return null

  const temVirgula = s.includes(',')
  const temPonto = s.includes('.')

  if (temVirgula && temPonto) {
    // ponto = separador de milhar, vírgula = decimal
    s = s.replace(/\./g, '').replace(',', '.')
  } else if (temVirgula) {
    s = s.replace(',', '.')
  }

  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

function detectarDelimitador(linha: string): string {
  if (linha.includes('\t')) return '\t'
  if (linha.includes(';')) return ';'
  return ','
}

export function parseReferencia(texto: string): ResultadoParse {
  const cruas = texto
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l !== '')

  if (cruas.length === 0) return { linhas: [], ignoradas: 0, total: 0 }

  const delim = detectarDelimitador(cruas[0])
  const linhas: LinhaReferencia[] = []
  let ignoradas = 0

  for (const crua of cruas) {
    const cols = crua.split(delim).map(c => c.trim())
    if (cols.length < 2) {
      ignoradas++
      continue
    }

    const codigo = cols[0]
    const valor = parseValorBR(cols[cols.length - 1])

    // Sem código ou sem valor numérico => cabeçalho ou linha inválida.
    if (!codigo || valor === null) {
      ignoradas++
      continue
    }

    let descricao = ''
    let unidade = ''
    if (cols.length >= 4) {
      unidade = cols[cols.length - 2]
      // junta o miolo caso a descrição contenha o delimitador
      descricao = cols.slice(1, cols.length - 2).join(' ')
    } else if (cols.length === 3) {
      descricao = cols[1]
    }

    linhas.push({ codigo, descricao, unidade, valor_unitario: valor })
  }

  return { linhas, ignoradas, total: cruas.length }
}
