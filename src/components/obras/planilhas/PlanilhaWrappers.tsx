'use client'

import { PlanilhaTab } from '@/components/obras/planilhas/PlanilhaTab'
import { PlanilhaItem } from '@/types'
import { fmtCurrency } from '@/lib/utils'

// ─── Planilha de Venda ────────────────────────────────────────────────────────

export function VendaTab({ obra_id }: { obra_id: string }) {
  return (
    <PlanilhaTab
      obra_id={obra_id}
      tipo="venda"
      title="Planilha de Venda"
      subtitle="Valores contratuais acordados com o cliente / prefeitura"
    />
  )
}

// ─── Custo Planejado ──────────────────────────────────────────────────────────

export function CustoPlanejadoTab({ obra_id }: { obra_id: string }) {
  return (
    <PlanilhaTab
      obra_id={obra_id}
      tipo="custo_planejado"
      title="Custo Planejado"
      subtitle="Orçamento interno — estimativa de custos para execução da obra"
    />
  )
}

// ─── Custo Real ───────────────────────────────────────────────────────────────
// Custo real crosses with custo planejado to show variance.
// For simplicity we keep it self-contained; for a full comparison you'd
// query both tables and join by descricao/codigo in the parent page.

export function CustoRealTab({ obra_id }: { obra_id: string }) {
  return (
    <PlanilhaTab
      obra_id={obra_id}
      tipo="custo_real"
      title="Custo Real"
      subtitle="Valores efetivamente gastos em cada etapa da obra"
    />
  )
}
