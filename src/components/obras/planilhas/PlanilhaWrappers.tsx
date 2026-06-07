'use client'

import { PlanilhaTab } from '@/components/obras/planilhas/PlanilhaTab'

// ─── Planilha de Venda ────────────────────────────────────────────────────────

export function VendaTab({ obra_id }: { obra_id: string }) {
  return (
    <PlanilhaTab
      obra_id={obra_id}
      tipo="venda"
      title="Planilha de Venda"
      subtitle="Valores contratuais acordados com o cliente / prefeitura"
      isVenda
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
// Componente próprio: a planilha de Custo Real ganha a coluna de pagamentos
// (parcelas) que alimentam as saídas do Financeiro.
export { CustoRealTab } from './CustoRealTab'
