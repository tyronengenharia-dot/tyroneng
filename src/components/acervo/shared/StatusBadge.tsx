import type { DocumentStatus } from '@/types/acervo'

const config: Record<
  DocumentStatus,
  { label: string; className: string; dot: string }
> = {
  valid: {
    label: 'Válido',
    className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    dot: 'bg-emerald-400',
  },
  expiring: {
    label: 'A vencer',
    className: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    dot: 'bg-amber-400',
  },
  expired: {
    label: 'Vencido',
    className: 'bg-red-500/10 text-red-400 border border-red-500/20',
    dot: 'bg-red-400',
  },
  pending: {
    label: 'Pendente',
    className: 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20',
    dot: 'bg-zinc-400',
  },
}

interface StatusBadgeProps {
  status: DocumentStatus
  size?: 'sm' | 'md'
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const c = config[status]
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs'
  const padding = size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${textSize} ${padding} ${c.className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  )
}
