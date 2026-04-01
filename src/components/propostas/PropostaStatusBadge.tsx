import { PropostaStatus } from '@/types/proposta'

export function PropostaStatusBadge({ status }: { status: PropostaStatus }) {
  const map = {
    rascunho: 'gray',
    enviada: 'blue',
    aprovada: 'green',
    rejeitada: 'red'
  }

  return (
    <span
      style={{
        background: map[status],
        padding: '4px 8px',
        borderRadius: 6,
        fontSize: 12
      }}
    >
      {status}
    </span>
  )
}