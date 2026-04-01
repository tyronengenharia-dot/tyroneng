'use client'

import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export function DashboardChartPlanejamento({ data }: any) {
  return (
    <div className="bg-[#111] p-5 rounded-2xl border border-white/10 h-80">
      <h3 className="text-white mb-4">Orçado vs Realizado</h3>

      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="category" />
          <Tooltip />
          <Bar dataKey="planned_value" />
          <Bar dataKey="actual_value" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}