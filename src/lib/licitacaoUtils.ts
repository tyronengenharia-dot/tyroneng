import { LicitacaoStatus, ChecklistStatus } from '@/types/licitacao'

export const STATUS_CONFIG: Record<LicitacaoStatus, {
  label: string
  color: string
  bg: string
  border: string
  dot: string
}> = {
  analise: {
    label: 'Em Análise',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    dot: 'bg-purple-400',
  },
  preparacao: {
    label: 'Preparação',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    dot: 'bg-amber-400',
  },
  enviada: {
    label: 'Enviada',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    dot: 'bg-blue-400',
  },
  ganhou: {
    label: 'Ganhou',
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    dot: 'bg-green-400',
  },
  perdeu: {
    label: 'Perdeu',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    dot: 'bg-red-400',
  },
}

export const CHECKLIST_STATUS_CONFIG: Record<ChecklistStatus, {
  label: string
  color: string
  bg: string
}> = {
  pendente: {
    label: 'Pendente',
    color: 'text-zinc-400',
    bg: 'bg-zinc-700',
  },
  andamento: {
    label: 'Em andamento',
    color: 'text-amber-400',
    bg: 'bg-amber-500/20',
  },
  concluido: {
    label: 'Concluído',
    color: 'text-green-400',
    bg: 'bg-green-500/20',
  },
}

export const CHECKLIST_CATEGORIAS = [
  'Documentação',
  'Técnico',
  'Jurídico',
  'Financeiro',
  'Habilitação',
  'Proposta',
  'Outro',
] as const

export const MODALIDADES = [
  'Concorrência',
  'Tomada de Preços',
  'Convite',
  'Pregão Eletrônico',
  'Pregão Presencial',
  'RDC',
  'Dispensa',
  'Inexigibilidade',
] as const

export function calcProgress(checklist: { status: string }[]): number {
  if (!checklist.length) return 0
  return Math.round(
    (checklist.filter(i => i.status === 'concluido').length / checklist.length) * 100
  )
}

export function fmtMoney(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

export function fmtDate(date: string): string {
  if (!date) return '—'
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}`
}

export function daysUntil(date: string): number | null {
  if (!date) return null
  const diff = new Date(date + 'T00:00').getTime() - new Date().getTime()
  return Math.ceil(diff / 86400000)
}
