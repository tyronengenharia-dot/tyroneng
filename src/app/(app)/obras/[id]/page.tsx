'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { getObraById } from '@/services/obraService'
import { Obra } from '@/types'
import { supabase } from '@/lib/supabaseClient'

import { ObraHeader }       from '@/components/obras/ObraHeader'
import { ObraTabs, ObraTab } from '@/components/obras/ObraTabs'
import { DashboardTab }     from '@/components/obras/dashboard/DashboardTab'
import { FinanceiroTab }    from '@/components/obras/financeiro/FinanceiroTab'
import { PlanejamentoTab }  from '@/components/obras/planejamento/PlanejamentoTab'
import { MedicoesTab }      from '@/components/obras/medicao/MedicoesTab'
import { VendaTab, CustoPlanejadoTab, CustoRealTab } from '@/components/obras/planilhas/PlanilhaWrappers'
import { AditivosTab }      from '@/components/obras/planilhas/AditivosTab'
import { MemoriaCalculoTab } from '@/components/obras/memoria/MemoriaCalculoTab'
import { EquipeTab }        from '@/components/obras/equipe/EquipeTab'
import { DocumentosTab }    from '@/components/obras/documentos/DocumentosTab'
import { DiarioTab }        from '@/components/obras/diario/DiarioTab'
import { RiscosTab }        from '@/components/obras/riscos/RiscosTab'
import { LoadingSpinner }   from '@/components/ui'

async function fetchTotalPlanilha(obra_id: string, tipo: string): Promise<number> {
  const { data, error } = await supabase
    .from('planilha_itens')
    .select('quantidade, valor_unitario')
    .eq('obra_id', obra_id)
    .eq('tipo', tipo)

  if (error || !data) return 0
  return data.reduce((sum, item) => sum + item.quantidade * item.valor_unitario, 0)
}

export default function ObraPage() {
  const params   = useParams()
  const router   = useRouter()
  const id       = params?.id as string

  const [obra, setObra]           = useState<Obra | null>(null)
  const [tab, setTab]             = useState<ObraTab>('dashboard')
  const [loading, setLoading]     = useState(true)
  const [custoPlano, setCustoPlano] = useState(0)
  const [custoReal, setCustoReal]   = useState(0)

  useEffect(() => {
    if (id === 'nova') { router.replace('/obras/nova'); return }
    if (!id) return

    let active = true

    getObraById(id).then(data => {
      if (!active) return
      setObra(data)
      setLoading(false)
    })

    Promise.all([
      fetchTotalPlanilha(id, 'custo_planejado'),
      fetchTotalPlanilha(id, 'custo_real'),
    ]).then(([plano, real]) => {
      if (!active) return
      setCustoPlano(plano)
      setCustoReal(real)
    })

    return () => {
      active = false
    }
  }, [id, router])

  // Recarrega os totais sempre que o usuário sair das abas de planilha
  useEffect(() => {
    if (!id) return
    if (tab === 'custo-real' || tab === 'custo-planejado') return

    let active = true

    Promise.all([
      fetchTotalPlanilha(id, 'custo_planejado'),
      fetchTotalPlanilha(id, 'custo_real'),
    ]).then(([plano, real]) => {
      if (!active) return
      setCustoPlano(plano)
      setCustoReal(real)
    })

    return () => {
      active = false
    }
  }, [tab, id])

  if (loading || id === 'nova') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    )
  }

  if (!obra) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-white/40 text-sm">Obra não encontrada.</p>
        <Link
          href="/obras"
          className="px-4 py-2 text-sm font-medium bg-white/5 border border-white/10 text-white/50 rounded-xl hover:text-white hover:bg-white/10 transition-colors"
        >
          &larr; Voltar para obras
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-0">
      <ObraHeader
        obra={obra}
        custoPlano={custoPlano}
        custoReal={custoReal}
      />
      <ObraTabs tab={tab} setTab={setTab} />

      <div>
        {tab === 'dashboard'       && <DashboardTab     obra_id={id} budget={obra.budget} />}
        {tab === 'financeiro'      && <FinanceiroTab     obra_id={id} />}
        {tab === 'planejamento'    && <PlanejamentoTab   obra_id={id} />}
        {tab === 'medicoes'        && <MedicoesTab       obra_id={id} budget={obra.budget} />}
        {tab === 'venda'           && <VendaTab          obra_id={id} />}
        {tab === 'custo-planejado' && <CustoPlanejadoTab obra_id={id} />}
        {tab === 'custo-real'      && <CustoRealTab      obra_id={id} />}
        {tab === 'aditivos'        && <AditivosTab        obra_id={id} />}
        {tab === 'memoria'         && <MemoriaCalculoTab  obra_id={id} />}
        {tab === 'equipe'          && <EquipeTab          obra_id={id} />}
        {tab === 'documentos'      && <DocumentosTab      obra_id={id} />}
        {tab === 'diario'          && <DiarioTab          obra_id={id} obra_name={obra.name} />}
        {tab === 'riscos'          && <RiscosTab          obra_id={id} />}
      </div>
    </div>
  )
}