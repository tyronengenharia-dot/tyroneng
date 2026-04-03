import { PropostaStatus } from '@/types/proposta'
import { STATUS_COLORS, STATUS_LABEL } from '@/lib/proposta-utils'

interface Props {
  status: PropostaStatus
  size?: 'sm' | 'md'
}

export function PropostaStatusBadge({ status, size = 'sm' }: Props) {
  const c = STATUS_COLORS[status]
  const padding = size === 'md' ? 'px-3 py-1.5 text-xs' : 'px-2.5 py-1 text-[11px]'

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-medium border
        ${padding} ${c.bg} ${c.text} ${c.border}
      `}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {STATUS_LABEL[status]}
    </span>
  )
}
