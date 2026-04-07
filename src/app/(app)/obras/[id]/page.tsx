'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getObraById } from '@/services/obraService'
import { Obra } from '@/types'

import { ObraHeader } from '@/components/obras/ObraHeader'
import { ObraTabs, ObraTab } from '@/components/obras/ObraTabs'
import { DashboardTab }     from '@/components/obras/dashboard/DashboardTab'
import { FinanceiroTab }    from '@/components/obras/financeiro/FinanceiroTab'
import { PlanejamentoTab }  from '@/components/obras/planejamento/PlanejamentoTab'
import { MedicoesTab }      from '@/components/obras/medicao/MedicoesTab'
import { VendaTab, CustoPlanejadoTab, CustoRealTab } from '@/components/obras/planilhas/PlanilhaWrappers'
import { EquipeTab }        from '@/components/obras/equipe/EquipeTab'
import { DocumentosTab }    from '@/components/obras/documentos/DocumentosTab'
import { DiarioTab }        from '@/components/obras/diario/DiarioTab'
import { RiscosTab }        from '@/components/obras/riscos/RiscosTab'
import { LoadingSpinner }   from '@/components/ui'

export default function ObraPage() {
  const params   = useParams()
  const router   = useRouter()
  const id       = params?.id as string
  const [obra, setObra]   = useState<Obra | null>(null)
  const [tab, setTab]     = useState<ObraTab>('dashboard')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Se por algum motivo cair aqui com id='nova', redireciona
    if (id === 'nova') {
      router.replace('/obras/nova')
      return
    }
    if (!id) return
    getObraById(id).then(data => {
      setObra(data)
      setLoading(false)
    })
  }, [id, router])

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
        <a
          href="/obras"
          className="px-4 py-2 text-sm font-medium bg-white/5 border border-white/10 text-white/50 rounded-xl hover:text-white hover:bg-white/10 transition-colors"
        >
          ← Voltar para obras
        </a>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-0">
      <ObraHeader obra={obra} />
      <ObraTabs tab={tab} setTab={setTab} />

      <div>
        {tab === 'dashboard'       && <DashboardTab    obra_id={id} budget={obra.budget} />}
        {tab === 'financeiro'      && <FinanceiroTab    obra_id={id} />}
        {tab === 'planejamento'    && <PlanejamentoTab  obra_id={id} />}
        {tab === 'medicoes'        && <MedicoesTab      obra_id={id} budget={obra.budget} />}
        {tab === 'venda'           && <VendaTab         obra_id={id} />}
        {tab === 'custo-planejado' && <CustoPlanejadoTab obra_id={id} />}
        {tab === 'custo-real'      && <CustoRealTab     obra_id={id} />}
        {tab === 'equipe'          && <EquipeTab         obra_id={id} />}
        {tab === 'documentos'      && <DocumentosTab     obra_id={id} />}
        {tab === 'diario'          && <DiarioTab         obra_id={id} obra_name={obra.name} />}
        {tab === 'riscos'          && <RiscosTab         obra_id={id} />}
      </div>
    </div>
  )
}
