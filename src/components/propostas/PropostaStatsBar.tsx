import { Proposta } from '@/types/proposta'
import { calcPropostaStats, formatCurrency } from '@/lib/proposta-utils'

interface Props {
  propostas: Proposta[]
}

export function PropostaStatsBar({ propostas }: Props) {
  const { total, aprovadas, enviadas, volume, taxaAprovacao } =
    calcPropostaStats(propostas)

  const cards = [
    { label: 'Total', value: String(total), suffix: 'propostas' },
    {
      label: 'Aprovadas',
      value: String(aprovadas),
      suffix: undefined,
      accent: 'text-emerald-400',
    },
    {
      label: 'Enviadas',
      value: String(enviadas),
      suffix: undefined,
      accent: 'text-blue-400',
    },
    {
      label: 'Volume Total',
      value: formatCurrency(volume),
      suffix: undefined,
      mono: true,
    },
    {
      label: 'Taxa de Aprovação',
      value: `${taxaAprovacao}%`,
      suffix: undefined,
      mono: true,
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
      {cards.map((c) => (
        <div
          key={c.label}
          className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3.5"
        >
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">
            {c.label}
          </p>
          <p
            className={`text-xl font-light tracking-tight leading-none ${
              c.accent ?? 'text-zinc-100'
            } ${c.mono ? 'font-mono text-base' : ''}`}
          >
            {c.value}
          </p>
          {c.suffix && (
            <p className="text-[11px] text-zinc-600 mt-1">{c.suffix}</p>
          )}
        </div>
      ))}
    </div>
  )
}
