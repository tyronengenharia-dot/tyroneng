'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { PontoEvolucao } from '@/lib/emprestimoCalc'
import { fmtCurrency } from '@/lib/utils'

function compact(v: number): string {
  if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(0)}k`
  return String(v)
}

interface TooltipPayloadItem {
  name?: string
  value?: number
  color?: string
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0a0a0a] border border-white/15 rounded-xl px-3 py-2 shadow-xl">
      <p className="text-[11px] text-white/50 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs font-medium tabular-nums" style={{ color: p.color }}>
          {p.name}: {fmtCurrency(p.value ?? 0)}
        </p>
      ))}
    </div>
  )
}

export function SaldoChart({ data }: { data: PontoEvolucao[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="gradSaldo" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradPago" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="mes"
            tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            minTickGap={16}
          />
          <YAxis
            tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={compact}
            width={44}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="saldo"
            name="Saldo devedor"
            stroke="#ef4444"
            strokeWidth={2}
            fill="url(#gradSaldo)"
          />
          <Area
            type="monotone"
            dataKey="pagoAcumulado"
            name="Pago acumulado"
            stroke="#22c55e"
            strokeWidth={2}
            fill="url(#gradPago)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
