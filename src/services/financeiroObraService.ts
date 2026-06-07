import { getBoletinsComTotais } from '@/services/medicaoService'
import { getPagamentosByObra } from '@/services/custoRealPagamentoService'
import { getItensByObra } from '@/services/planilhaService'
import { CustoRealPagamento, MedicaoBoletim, PlanilhaItem } from '@/types'

// =============================================================================
// Resumo financeiro de UMA obra — fonte única de verdade.
// O Financeiro da obra é apenas LEITURA e tudo se reconcilia por construção:
//   ENTRADAS  = Medições (boletim pago = realizado; aprovado = a receber)
//   SAÍDAS    = parcelas do Custo Real (pago = realizado; pendente/atrasado = comprometido)
// A aba Financeiro e o Dashboard da obra consomem ESTE módulo, então os números
// sempre batem entre as telas. (Empréstimos entram aqui na Fase 2.)
// =============================================================================

export type MovStatusKey = 'pago' | 'a_receber' | 'pendente' | 'atrasado'

export type Movimentacao = {
  key: string
  tipo: 'entrada' | 'saida'
  titulo: string
  origem: string
  valor: number
  statusKey: MovStatusKey
  data: string | null
  comprovante_url?: string | null
}

export type ResumoFinanceiroObra = {
  receitaRealizada: number
  aReceber: number
  despesaRealizada: number
  aPagar: number
  saldo: number
  /** movimentações unificadas, mais recentes primeiro */
  movimentacoes: Movimentacao[]
}

export async function getResumoFinanceiroObra(obra_id: string): Promise<ResumoFinanceiroObra> {
  const [boletins, pagamentos, itens] = await Promise.all([
    getBoletinsComTotais(obra_id),
    getPagamentosByObra(obra_id),
    getItensByObra(obra_id, 'custo_real'),
  ])

  const movimentacoes = montarMovimentacoes(boletins, pagamentos, itens)

  const sum = (pred: (m: Movimentacao) => boolean) =>
    movimentacoes.filter(pred).reduce((acc, m) => acc + m.valor, 0)

  const receitaRealizada = sum(m => m.tipo === 'entrada' && m.statusKey === 'pago')
  const aReceber         = sum(m => m.tipo === 'entrada' && m.statusKey === 'a_receber')
  const despesaRealizada = sum(m => m.tipo === 'saida' && m.statusKey === 'pago')
  const aPagar           = sum(m => m.tipo === 'saida' && (m.statusKey === 'pendente' || m.statusKey === 'atrasado'))
  const saldo            = receitaRealizada - despesaRealizada

  return { receitaRealizada, aReceber, despesaRealizada, aPagar, saldo, movimentacoes }
}

// Entradas = boletins de medição (rascunho ignorado). Saídas = parcelas do Custo Real.
function montarMovimentacoes(
  boletins: (MedicaoBoletim & { valor: number })[],
  pagamentos: CustoRealPagamento[],
  itens: PlanilhaItem[],
): Movimentacao[] {
  const itemById = new Map(itens.map(i => [i.id, i]))

  const entradas: Movimentacao[] = boletins
    .filter(b => b.status !== 'rascunho')
    .map(b => ({
      key: `med-${b.id}`,
      tipo: 'entrada' as const,
      titulo: `Medição — Boletim Nº ${b.numero}`,
      origem: b.periodo ? `Medição · ${b.periodo}` : 'Medição',
      valor: Number(b.valor) || 0,
      statusKey: (b.status === 'pago' ? 'pago' : 'a_receber') as MovStatusKey,
      data: b.data_medicao ?? null,
      comprovante_url: null,
    }))

  const saidas: Movimentacao[] = pagamentos.map(p => {
    const it = itemById.get(p.planilha_item_id)
    const itemLabel = it
      ? `${it.codigo ? it.codigo + ' — ' : ''}${it.descricao || 'Item Custo Real'}`
      : 'Item Custo Real'
    return {
      key: `pag-${p.id}`,
      tipo: 'saida' as const,
      titulo: p.descricao?.trim() ? p.descricao.trim() : itemLabel,
      origem: p.descricao?.trim() ? `Custo Real · ${itemLabel}` : 'Custo Real',
      valor: Number(p.valor) || 0,
      statusKey: p.status as MovStatusKey,
      data: p.data ?? null,
      comprovante_url: p.comprovante_url ?? null,
    }
  })

  return [...entradas, ...saidas].sort((a, b) => (b.data ?? '').localeCompare(a.data ?? ''))
}
