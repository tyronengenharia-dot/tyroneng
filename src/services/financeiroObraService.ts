import { getBoletinsComTotais } from '@/services/medicaoService'
import { getPagamentosByObra } from '@/services/custoRealPagamentoService'
import { getItensByObra } from '@/services/planilhaService'
import { getRateiosByObra } from '@/services/emprestimoService'
import { CustoRealPagamento, MedicaoBoletim, PlanilhaItem } from '@/types'
import { EmprestimoRateio } from '@/types/emprestimo'

// =============================================================================
// Resumo financeiro de UMA obra — fonte única de verdade.
// O Financeiro da obra é apenas LEITURA e tudo se reconcilia por construção:
//   ENTRADAS  = Medições (boletim pago = realizado; aprovado = a receber)
//               + Empréstimos rateados à obra (recebido = realizado; previsto = a receber)
//   SAÍDAS    = parcelas do Custo Real (pago = realizado; pendente/atrasado = comprometido)
// A aba Financeiro e o Dashboard da obra consomem ESTE módulo, então os números
// sempre batem entre as telas.
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
  const [boletins, pagamentos, itens, rateios] = await Promise.all([
    getBoletinsComTotais(obra_id),
    getPagamentosByObra(obra_id),
    getItensByObra(obra_id, 'custo_real'),
    getRateiosByObra(obra_id),
  ])

  const movimentacoes = montarMovimentacoes(boletins, pagamentos, itens, rateios)

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
  rateios: EmprestimoRateio[],
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

  // Entradas de empréstimo (fatia rateada a esta obra).
  const emprestimos: Movimentacao[] = rateios.map(r => ({
    key: `rat-${r.id}`,
    tipo: 'entrada' as const,
    titulo: r.emprestimo?.descricao ? `Empréstimo — ${r.emprestimo.descricao}` : 'Empréstimo',
    origem: r.descricao?.trim() ? `Empréstimo · ${r.descricao.trim()}` : 'Empréstimo (rateio)',
    valor: Number(r.valor) || 0,
    statusKey: (r.status === 'recebido' ? 'pago' : 'a_receber') as MovStatusKey,
    data: r.data ?? null,
    comprovante_url: r.comprovante_url ?? null,
  }))

  // Mais recentes primeiro; datas nulas vão para o fim.
  return [...entradas, ...emprestimos, ...saidas].sort((a, b) => (b.data ?? '').localeCompare(a.data ?? ''))
}
