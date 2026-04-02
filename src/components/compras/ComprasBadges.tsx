'use client'

import type { StatusSolicitacao, UrgenciaSolicitacao } from '@/types/compras'

// ─── Badge de Status ────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pendente:    { label: 'Pendente',    className: 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20' },
  em_cotacao:  { label: 'Em Cotação', className: 'bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20' },
  aprovada:    { label: 'Aprovada',   className: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20' },
  recusada:    { label: 'Recusada',   className: 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20' },
  aguardando:  { label: 'Aguardando', className: 'bg-zinc-500/10 text-zinc-400 ring-1 ring-zinc-500/20' },
  transporte:  { label: 'Transporte', className: 'bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20' },
  entregue:    { label: 'Entregue',   className: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20' },
  atrasado:    { label: 'Atrasado',   className: 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20' },
  rascunho:    { label: 'Rascunho',   className: 'bg-zinc-500/10 text-zinc-400 ring-1 ring-zinc-500/20' },
  cancelado:   { label: 'Cancelado',  className: 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20' },
}

export function BadgeStatus({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, className: 'bg-zinc-500/10 text-zinc-400' }
  return (
    <span className={`inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}

// ─── Badge de Urgência ──────────────────────────────────────────────────────

const URGENCIA_CONFIG: Record<UrgenciaSolicitacao, { label: string; dot: string; badge: string }> = {
  baixa:   { label: 'Baixa',   dot: 'bg-zinc-500',                    badge: 'bg-zinc-500/10 text-zinc-400' },
  media:   { label: 'Média',   dot: 'bg-teal-500',                    badge: 'bg-teal-500/10 text-teal-400' },
  alta:    { label: 'Alta',    dot: 'bg-amber-500',                   badge: 'bg-amber-500/10 text-amber-400' },
  critica: { label: 'Crítica', dot: 'bg-red-500 shadow-[0_0_6px_2px_rgba(239,68,68,0.4)]', badge: 'bg-red-500/10 text-red-400' },
}

interface BadgeUrgenciaProps {
  urgencia: UrgenciaSolicitacao
  somente_dot?: boolean
}

export function BadgeUrgencia({ urgencia, somente_dot }: BadgeUrgenciaProps) {
  const cfg = URGENCIA_CONFIG[urgencia]

  if (somente_dot) {
    return (
      <span
        className={`inline-block h-2 w-2 shrink-0 rounded-full ${cfg.dot}`}
        title={cfg.label}
      />
    )
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cfg.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

// ─── Label de forma de pagamento ────────────────────────────────────────────

const PAGAMENTO_LABEL: Record<string, string> = {
  a_vista:  'À vista',
  '7_dias': '7 dias',
  '14_dias': '14 dias',
  '30_dias': '30 dias',
  '60_dias': '60 dias',
}

export function LabelPagamento({ forma }: { forma: string }) {
  return <span className="text-zinc-300">{PAGAMENTO_LABEL[forma] ?? forma}</span>
}
