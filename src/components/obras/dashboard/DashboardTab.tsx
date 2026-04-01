'use client'

import { useEffect, useState } from 'react'

import { getFinanceiroByObra } from '@/services/obraFinanceiroService'
import { getPlanejamento } from '@/services/planejamentoService'
import { getMedicoes } from '@/services/medicaoService'

import { DashboardKPIs } from './DashboardKPIs'
import { DashboardChartFinanceiro } from './DashboardChartFinanceiro'
import { DashboardChartPlanejamento } from './DashboardChartPlanejamento'

type Props = {
  obra_id: string
}

export function DashboardTab({ obra_id }: Props) {
  const [financeiro, setFinanceiro] = useState<any[]>([])
  const [planejamento, setPlanejamento] = useState<any[]>([])
  const [medicao, setMedicao] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [f, p, m] = await Promise.all([
          getFinanceiroByObra(obra_id),
          getPlanejamento(obra_id),
          getMedicoes(obra_id),
        ])

        setFinanceiro(f || [])
        setPlanejamento(p || [])
        setMedicao(m || [])
      } catch (error) {
        console.error('Erro ao carregar dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    if (obra_id) {
      fetchData()
    }
  }, [obra_id])

  // 🧠 LOADING STATE (UX melhor)
  if (loading) {
    return (
      <div className="text-gray-400">
        Carregando dashboard...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <DashboardKPIs
        financeiro={financeiro}
        planejamento={planejamento}
        medicao={medicao}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DashboardChartPlanejamento data={planejamento} />
        <DashboardChartFinanceiro data={financeiro} />
      </div>
    </div>
  )
}