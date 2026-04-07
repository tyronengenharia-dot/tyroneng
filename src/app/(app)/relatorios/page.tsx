'use client'

import { useEffect, useState } from 'react'
import { getRelatorio } from '@/services/relatorioService'
import { Relatorio } from '@/types/relatorio'

import { RelatoriosKPIs } from '@/components/relatorios/RelatoriosKPIs'
import { RelatoriosFilters } from '@/components/relatorios/RelatoriosFilters'
import { RelatoriosChartFinanceiro } from '@/components/relatorios/RelatoriosChartFinanceiro'

export default function RelatoriosPage() {
  const [data, setData] = useState<Relatorio[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30d')

  useEffect(() => {
    async function fetch() {
      const result = await getRelatorio()
      setData(result)
      setLoading(false)
    }

    fetch()
  }, [period])

  return (
    <div className="max-w-7xl mx-auto space-y-8">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Relatórios
          </h1>
          <p className="text-gray-400 text-sm">
            Indicadores financeiros e desempenho
          </p>
        </div>
      </div>

      {/* FILTROS */}
      <RelatoriosFilters period={period} setPeriod={setPeriod} />

      {/* CONTENT */}
      {loading ? (
        <div className="text-gray-400">Carregando...</div>
      ) : data.length === 0 ? (
        <div className="bg-[#111] p-10 rounded-2xl text-center border border-white/10">
          <p className="text-gray-400">Sem dados</p>
        </div>
      ) : (
        <>
          <RelatoriosKPIs data={data} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RelatoriosChartFinanceiro data={data} />
          </div>
        </>
      )}
    </div>
  )
}