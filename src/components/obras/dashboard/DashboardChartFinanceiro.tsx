'use client'

import {
  LineChart,
  Line,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export function DashboardChartFinanceiro({ data }: any) {
  const formatted = data.map((i: any) => ({
    date: i.date,
    value: i.type === 'entrada' ? i.value : -i.value,
  }))

  return (
    <div className="bg-[#111] p-5 rounded-2xl border border-white/10 h-80">
      <h3 className="text-white mb-4">Fluxo de caixa</h3>

      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formatted}>
          <XAxis dataKey="date" />
          <Tooltip />
          <Line dataKey="value" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}