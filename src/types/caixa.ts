// ─── CAIXA UNIFICADO ─────────────────────────────────────────────────────────
// Espelha a view SQL `movimentacoes_consolidadas` (migration 0009): o fluxo de
// caixa único da empresa, reunindo todas as origens — lançamentos gerais,
// parcelas do Custo Real, Medições, parcelas e desembolsos de Empréstimo.
// Cada linha nasce da sua origem real (sem cópia/posting): editar a movimentação
// = editar a origem dela.

export type MovimentacaoOrigem =
  | 'geral'
  | 'custo_real'
  | 'medicao'
  | 'emprestimo_parcela'
  | 'emprestimo_rateio'

export type MovimentacaoConsolidada = {
  id: string                // id sintético prefixado pela origem (ex.: "crp-<uuid>")
  origem: MovimentacaoOrigem
  origem_id: string         // id da linha real na tabela de origem
  data: string | null
  tipo: 'entrada' | 'saida'
  valor: number
  realizado: boolean        // true = caixa já movimentou; false = previsto/comprometido
  conta_id: string | null
  obra_id: string | null
  categoria_id: string | null
  descricao: string | null
  comprovante_url: string | null
  forma_pagamento: string | null
  beneficiario: string | null
  transferencia_id: string | null
  // Nomes resolvidos no serviço (não são embeds do PostgREST — a view não expõe FKs).
  conta?: { id: string; nome: string; cor: string } | null
  obra?: { id: string; name: string } | null
}

export type ResumoCaixa = {
  receitaRealizada: number
  aReceber: number
  despesaRealizada: number
  aPagar: number
  saldo: number             // receitaRealizada − despesaRealizada
  saldoContas: number       // Σ saldo_atual das contas (deve bater com `saldo` + saldos iniciais)
}
