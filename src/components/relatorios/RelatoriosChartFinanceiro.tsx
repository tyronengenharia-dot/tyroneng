'use client'

import {
  LineChart,
  Line,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export function RelatoriosChartFinanceiro({ data }: any) {
  return (
    <div className="bg-[#111] p-5 rounded-2xl border border-white/10 h-80">
      <h3 className="text-white mb-4">Fluxo financeiro</h3>

      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="date" />
          <Tooltip />
          <Line dataKey="receitas" />
          <Line dataKey="despesas" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}