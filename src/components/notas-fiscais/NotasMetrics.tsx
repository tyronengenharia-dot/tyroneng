'use client'

import { NotaFiscal } from '@/types/notaFiscal'

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

interface Props {
  data: NotaFiscal[]
}

export function NotasMetrics({ data }: Props) {
  const totalEmitidas = data.filter(n => n.type === 'emitida').reduce((s, n) => s + n.value, 0)
  const totalRecebidas = data.filter(n => n.type === 'recebida').reduce((s, n) => s + n.value, 0)
  const pendentes = data.filter(n => n.status === 'pendente').length
  const aprovadas = data.filter(n => n.status === 'aprovada').length

  const cards = [
    {
      label: 'Total Emitidas',
      value: `R$ ${fmt(totalEmitidas)}`,
      sub: `${data.filter(n => n.type === 'emitida').length} notas`,
      accent: 'from-emerald-500/20 to-emerald-500/0',
      dot: 'bg-emerald-400',
      textColor: 'text-emerald-400',
    },
    {
      label: 'Total Recebidas',
      value: `R$ ${fmt(totalRecebidas)}`,
      sub: `${data.filter(n => n.type === 'recebida').length} notas`,
      accent: 'from-blue-500/20 to-blue-500/0',
      dot: 'bg-blue-400',
      textColor: 'text-blue-400',
    },
    {
      label: 'Aprovadas',
      value: String(aprovadas),
      sub: 'notas aprovadas',
      accent: 'from-violet-500/20 to-violet-500/0',
      dot: 'bg-violet-400',
      textColor: 'text-violet-400',
    },
    {
      label: 'Pendentes',
      value: String(pendentes),
      sub: 'aguardando aprovação',
      accent: 'from-amber-500/20 to-amber-500/0',
      dot: 'bg-amber-400',
      textColor: 'text-amber-400',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map(card => (
        <div
          key={card.label}
          className="relative overflow-hidden bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 flex flex-col gap-2"
        >
          {/* gradient accent top */}
          <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${card.accent}`} />

          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${card.dot}`} />
            <p className="text-xs text-white/40 uppercase tracking-widest">{card.label}</p>
          </div>

          <p className={`text-2xl font-semibold tabular-nums ${card.textColor}`}>
            {card.value}
          </p>

          <p className="text-xs text-white/30">{card.sub}</p>
        </div>
      ))}
    </div>
  )
}