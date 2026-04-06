import { Proposta, PropostaStatus } from '@/types/proposta'

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso))
}

export const STATUS_LABEL: Record<PropostaStatus, string> = {
  rascunho: 'Rascunho',
  enviada: 'Enviada',
  aprovada: 'Aprovada',
  rejeitada: 'Rejeitada',
}

export const STATUS_COLORS: Record<
  PropostaStatus,
  { bg: string; text: string; dot: string; border: string }
> = {
  rascunho: {
    bg: 'bg-zinc-800/60',
    text: 'text-zinc-400',
    dot: 'bg-zinc-400',
    border: 'border-zinc-700',
  },
  enviada: {
    bg: 'bg-blue-950/60',
    text: 'text-blue-400',
    dot: 'bg-blue-400',
    border: 'border-blue-800',
  },
  aprovada: {
    bg: 'bg-emerald-950/60',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
    border: 'border-emerald-800',
  },
  rejeitada: {
    bg: 'bg-red-950/60',
    text: 'text-red-400',
    dot: 'bg-red-400',
    border: 'border-red-800',
  },
}

export function calcPropostaStats(propostas: Proposta[]) {
  const total = propostas.length
  const aprovadas = propostas.filter((p) => p.status === 'aprovada').length
  const enviadas = propostas.filter((p) => p.status === 'enviada').length
  const volume = propostas.reduce((acc, p) => acc + p.valor, 0)
  const taxaAprovacao = total > 0 ? Math.round((aprovadas / total) * 100) : 0
  return { total, aprovadas, enviadas, volume, taxaAprovacao }
}

