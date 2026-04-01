'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export function ChartBar({ data }: any) {
  const chartData = [
    { name: 'Vencidos', valor: data.vencidos },
    { name: 'Críticos', valor: data.criticos },
    { name: 'Risco', valor: data.risco },
    { name: 'OK', valor: data.ok },
  ]

  return (
    <div className="bg-[#111] p-6 rounded-2xl h-[300px]">
      <h2 className="mb-4">Resumo geral</h2>

      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="valor" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}