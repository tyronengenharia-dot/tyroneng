'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export function ChartResumo({ data }: any) {
  const chartData = [
    { name: 'Vencidos', value: data.vencidos },
    { name: 'Críticos', value: data.criticos },
    { name: 'Risco', value: data.risco },
    { name: 'OK', value: data.ok },
  ]

  return (
    <div className="bg-[#111] p-6 rounded-2xl h-[300px]">
      <h2 className="mb-4">Distribuição dos documentos</h2>

      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            outerRadius={100}
            label
          >
            {chartData.map((_, index) => (
              <Cell key={index} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}