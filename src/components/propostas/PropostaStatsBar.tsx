import { Proposta } from '@/types/proposta'

interface Props { propostas: Proposta[] }

const brl = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 }).format(v)

export function PropostaStatsBar({ propostas }: Props) {
  const total     = propostas.length
  const aprovadas = propostas.filter(p => p.status === 'aprovada').length
  const enviadas  = propostas.filter(p => p.status === 'enviada').length
  const volume    = propostas.reduce((acc, p) => acc + p.valor, 0)
  const taxa      = total > 0 ? Math.round((aprovadas / total) * 100) : 0

  const cards = [
    { label: 'Total',          value: String(total),       accent: '' },
    { label: 'Aprovadas',      value: String(aprovadas),   accent: 'text-emerald-400' },
    { label: 'Enviadas',       value: String(enviadas),    accent: 'text-blue-400' },
    { label: 'Volume Total',   value: brl(volume),         accent: '', mono: true },
    { label: 'Taxa Aprovação', value: `${taxa}%`,          accent: '', mono: true },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
      {cards.map(c => (
        <div key={c.label} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3.5">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">{c.label}</p>
          <p className={`text-xl font-light tracking-tight leading-none ${c.accent || 'text-zinc-100'} ${c.mono ? 'font-mono text-base' : ''}`}>
            {c.value}
          </p>
        </div>
      ))}
    </div>
  )
}
