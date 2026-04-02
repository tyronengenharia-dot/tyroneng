// ─── Dinheiro ───────────────────────────────────────────────────────────────

export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

export function formatarMoedaCompacto(valor: number): string {
  if (valor >= 1_000_000) return `R$ ${(valor / 1_000_000).toFixed(1)}M`
  if (valor >= 1_000) return `R$ ${Math.round(valor / 1_000)}k`
  return formatarMoeda(valor)
}

// ─── Datas ──────────────────────────────────────────────────────────────────

export function formatarData(data: string): string {
  if (!data) return '—'
  const [ano, mes, dia] = data.split('T')[0].split('-')
  return `${dia}/${mes}/${ano}`
}

export function formatarDataHora(data: string): string {
  if (!data) return '—'
  const d = new Date(data)
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ─── Atraso ─────────────────────────────────────────────────────────────────

export function calcularAtraso(dataPrevista: string, dataReal?: string): number {
  const prevista = new Date(dataPrevista + 'T12:00:00')
  const real = dataReal ? new Date(dataReal + 'T12:00:00') : new Date()
  const diff = Math.floor((real.getTime() - prevista.getTime()) / 86400000)
  return Math.max(0, diff)
}

// ─── Outros ─────────────────────────────────────────────────────────────────

export function truncar(texto: string, max = 40): string {
  if (texto.length <= max) return texto
  return texto.slice(0, max) + '…'
}

export function iniciais(nome: string): string {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('')
}
