// Avaliador de fórmula aritmética seguro (sem eval): + - * / ( ) e decimais.
// Aceita vírgula como separador decimal (BR). Retorna null se inválida.
// Gramática:
//   expr   := term (('+' | '-') term)*
//   term   := factor (('*' | '/') factor)*
//   factor := number | '(' expr ')' | ('-' | '+') factor

export function avaliarFormula(expr: string): number | null {
  const s = expr.replace(/,/g, '.')
  if (s.trim() === '') return null
  // Só caracteres aritméticos — impede qualquer coisa além de números/operadores.
  if (!/^[0-9.+\-*/()\s]+$/.test(s)) return null

  let i = 0
  const skip = () => {
    while (i < s.length && /\s/.test(s[i])) i++
  }

  function parseFactor(): number {
    skip()
    if (s[i] === '(') {
      i++
      const v = parseExpr()
      skip()
      if (s[i] !== ')') throw new Error('paren')
      i++
      return v
    }
    if (s[i] === '-') {
      i++
      return -parseFactor()
    }
    if (s[i] === '+') {
      i++
      return parseFactor()
    }
    const start = i
    while (i < s.length && /[0-9.]/.test(s[i])) i++
    if (i === start) throw new Error('num')
    const n = Number(s.slice(start, i))
    if (!Number.isFinite(n)) throw new Error('nan')
    return n
  }

  function parseTerm(): number {
    let v = parseFactor()
    skip()
    while (i < s.length && (s[i] === '*' || s[i] === '/')) {
      const op = s[i++]
      const r = parseFactor()
      v = op === '*' ? v * r : v / r
      skip()
    }
    return v
  }

  function parseExpr(): number {
    let v = parseTerm()
    skip()
    while (i < s.length && (s[i] === '+' || s[i] === '-')) {
      const op = s[i++]
      const r = parseTerm()
      v = op === '+' ? v + r : v - r
      skip()
    }
    return v
  }

  try {
    const v = parseExpr()
    skip()
    if (i !== s.length) return null
    return Number.isFinite(v) ? v : null
  } catch {
    return null
  }
}
