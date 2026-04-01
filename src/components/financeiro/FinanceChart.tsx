'use client'

import {
  LineChart,
  Line,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export function FinanceChart({ data }: any) {
  const grouped = data.map((item: { date: any; type: string; value: number }) => ({
    date: item.date,
    value: item.type === 'entrada' ? item.value : -item.value,
  }))

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm h-80">
      <h3 className="mb-4 font-semibold">Fluxo financeiro</h3>

      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={grouped}>
          <XAxis dataKey="date" />
          <Tooltip />
          <Line dataKey="value" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}