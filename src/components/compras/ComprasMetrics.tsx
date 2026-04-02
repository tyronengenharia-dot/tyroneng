'use client'

import type { MetricasCompras } from '@/types/compras'

interface MetricCardProps {
  label: string
  value: string
  sub: string
  trend: 'up' | 'down' | 'neutral'
  trendValue: string
  accentClass: string
  icon: string
}

function MetricCard({ label, value, sub, trend, trendValue, accentClass, icon }: MetricCardProps) {
  const trendColor =
    trend === 'up' ? 'text-emerald-400' :
    trend === 'down' ? 'text-red-400' :
    'text-zinc-500'

  const trendArrow = trend === 'up' ? '▲' : trend === 'down' ? '▼' : '—'

  return (
    <div className={`relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 p-5 ${accentClass}`}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
          {label}
        </span>
        <span className="text-lg">{icon}</span>
      </div>
      <div className="text-2xl font-bold tracking-tight text-zinc-100">{value}</div>
      <div className={`mt-1.5 flex items-center gap-1 text-[11px] ${trendColor}`}>
        <span>{trendArrow} {trendValue}</span>
        <span className="text-zinc-600">{sub}</span>
      </div>
    </div>
  )
}

interface Props {
  metricas: MetricasCompras
}

export function ComprasMetrics({ metricas }: Props) {
  const fmt = (v: number) =>
    v >= 1000
      ? `R$ ${(v / 1000).toFixed(0)}k`
      : `R$ ${v.toLocaleString('pt-BR')}`

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <MetricCard
        label="Total Comprado"
        value={fmt(metricas.total_comprado)}
        sub="vs mês anterior"
        trend="up"
        trendValue={`${metricas.variacao_total_pct}%`}
        accentClass="before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-indigo-600 before:to-indigo-400"
        icon="💰"
      />
      <MetricCard
        label="Economia em Cotações"
        value={fmt(metricas.economia_cotacoes)}
        sub="do total comprado"
        trend="up"
        trendValue={`${metricas.variacao_economia_pct}%`}
        accentClass="before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-emerald-600 before:to-emerald-400"
        icon="📉"
      />
      <MetricCard
        label="Pendentes"
        value={String(metricas.solicitacoes_pendentes)}
        sub="esta semana"
        trend="down"
        trendValue={`+${metricas.solicitacoes_novas_semana} novas`}
        accentClass="before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-amber-600 before:to-amber-400"
        icon="⏳"
      />
      <MetricCard
        label="Entregas Atrasadas"
        value={String(metricas.entregas_atrasadas)}
        sub="vs semana passada"
        trend={metricas.entregas_atrasadas_variacao < 0 ? 'up' : 'down'}
        trendValue={`${metricas.entregas_atrasadas_variacao > 0 ? '+' : ''}${metricas.entregas_atrasadas_variacao}`}
        accentClass="before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-red-700 before:to-red-500"
        icon="🚚"
      />
    </div>
  )
}
