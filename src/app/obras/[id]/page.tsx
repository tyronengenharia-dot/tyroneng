'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation' // 👈 IMPORTANTE

import { getObraById } from '@/services/obraService'

import { ObraHeader } from '@/components/obras/ObraHeader'
import { ObraTabs } from '@/components/obras/ObraTabs'

import { OverviewTab } from '@/components/obras/tabs/OverviewTab'
import { PlanejamentoTab } from '@/components/obras/tabs/PlanejamentoTab'
import { EquipeTab } from '@/components/obras/tabs/EquipeTab'
import { ObraFinanceiroTab } from '@/components/obras/financeiro/ObraFinanceiroTab'
import { MedicaoTab } from '@/components/obras/medicao/MedicaoTab'
import { DashboardTab } from '@/components/obras/dashboard/DashboardTab'
import { VendaTab } from '@/components/obras/tabs/VendaTab'
import { CustoPlanTab, CustosTab } from '@/components/obras/tabs/CustosPlanTab'
import { CustoRealTab } from '@/components/obras/tabs/CustoRealTab'

export default function ObraPage() {
  const params = useParams() // 👈 NOVO JEITO
  const id = params?.id as string

  const [obra, setObra] = useState<any>(null)
  const [tab, setTab] = useState('dashboard')

useEffect(() => {
  if (!id) return

  async function fetch() {
    const data = await getObraById(id)
    setObra(data)
  }

  fetch()
}, [id])

  if (!obra) {
    return <div className="text-gray-400">Carregando...</div>
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <ObraHeader obra={obra} />

      <ObraTabs tab={tab} setTab={setTab} />

      {tab === 'dashboard' && <DashboardTab obra_id={id} />}
      {tab === 'financeiro' && <ObraFinanceiroTab obra_id={id} />}
      {tab === 'Planejamento' && <PlanejamentoTab obra_id={id} />}
      {tab === 'equipe' && <EquipeTab />}
      {tab === 'medicoes' && <MedicaoTab obra_id={id} />}
      {tab === 'contratos' && <div>Contratos</div>}
      {tab === 'documentos' && <div>Documentos</div>}
      {tab === 'Plan. Venda' && <VendaTab obra_id={id} />}
      {tab === 'Custo Planejado' && <CustoPlanTab obra_id={id} />}
      {tab === 'Custo Real' && <CustoRealTab obra_id={id} />}
      

    </div>
  )
}