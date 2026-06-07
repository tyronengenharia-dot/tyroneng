import { supabase } from '@/lib/supabaseClient'
import { MovimentacaoConsolidada, MovimentacaoOrigem, ResumoCaixa } from '@/types/caixa'

// =============================================================================
// Caixa unificado — fonte única de verdade no nível EMPRESA.
// Lê a view `movimentacoes_consolidadas` (migration 0009), que reúne todas as
// origens (lançamentos gerais + Custo Real + Medições + Empréstimos). A página
// Financeiro e o Dashboard inicial consomem ESTE serviço, então os números
// batem com os Bancos e com o Financeiro de cada obra (mesmas tabelas-base).
// Sem a migration 0009, as leituras voltam [] (modo degradado).
// =============================================================================

export const ORIGEM_LABEL: Record<MovimentacaoOrigem, string> = {
  geral: 'Lançamento geral',
  custo_real: 'Custo Real',
  medicao: 'Medição',
  emprestimo_parcela: 'Empréstimo (parcela)',
  emprestimo_rateio: 'Empréstimo (desembolso)',
}

export type CaixaFiltros = {
  obraId?: string
  contaId?: string
  tipo?: 'entrada' | 'saida'
  origem?: MovimentacaoOrigem
  realizado?: boolean
  dataInicio?: string
  dataFim?: string
}

export async function getMovimentacoesConsolidadas(
  filtros: CaixaFiltros = {},
): Promise<MovimentacaoConsolidada[]> {
  let query = supabase
    .from('movimentacoes_consolidadas')
    .select('*')
    .order('data', { ascending: false, nullsFirst: false })

  if (filtros.obraId) query = query.eq('obra_id', filtros.obraId)
  if (filtros.contaId) query = query.eq('conta_id', filtros.contaId)
  if (filtros.tipo) query = query.eq('tipo', filtros.tipo)
  if (filtros.origem) query = query.eq('origem', filtros.origem)
  if (typeof filtros.realizado === 'boolean') query = query.eq('realizado', filtros.realizado)
  if (filtros.dataInicio) query = query.gte('data', filtros.dataInicio)
  if (filtros.dataFim) query = query.lte('data', filtros.dataFim)

  const { data, error } = await query
  if (error) {
    console.warn('getMovimentacoesConsolidadas (migration 0009 aplicada?):', error.message)
    return []
  }
  return resolverNomes((data ?? []) as MovimentacaoConsolidada[])
}

// A view não expõe FKs, então o PostgREST não embeda conta/obra. Resolvo os
// nomes em duas consultas leves e mapeio por id.
async function resolverNomes(
  rows: MovimentacaoConsolidada[],
): Promise<MovimentacaoConsolidada[]> {
  const contaIds = [...new Set(rows.map(r => r.conta_id).filter(Boolean))] as string[]
  const obraIds = [...new Set(rows.map(r => r.obra_id).filter(Boolean))] as string[]

  let contas: { id: string; nome: string; cor: string }[] = []
  let obras: { id: string; name: string }[] = []

  if (contaIds.length) {
    const { data } = await supabase
      .from('bancos_contas')
      .select('id,nome,cor')
      .in('id', contaIds)
    contas = data ?? []
  }
  if (obraIds.length) {
    const { data } = await supabase.from('obras').select('id,name').in('id', obraIds)
    obras = data ?? []
  }

  const contaMap = new Map(contas.map(c => [c.id, c]))
  const obraMap = new Map(obras.map(o => [o.id, o]))

  return rows.map(r => ({
    ...r,
    conta: r.conta_id ? contaMap.get(r.conta_id) ?? null : null,
    obra: r.obra_id ? obraMap.get(r.obra_id) ?? null : null,
  }))
}

export async function getResumoCaixa(filtros: CaixaFiltros = {}): Promise<ResumoCaixa> {
  const movs = await getMovimentacoesConsolidadas(filtros)

  const sum = (pred: (m: MovimentacaoConsolidada) => boolean) =>
    movs.filter(pred).reduce((acc, m) => acc + (Number(m.valor) || 0), 0)

  const receitaRealizada = sum(m => m.tipo === 'entrada' && m.realizado)
  const aReceber = sum(m => m.tipo === 'entrada' && !m.realizado)
  const despesaRealizada = sum(m => m.tipo === 'saida' && m.realizado)
  const aPagar = sum(m => m.tipo === 'saida' && !m.realizado)
  const saldo = receitaRealizada - despesaRealizada

  // Saldo consolidado das contas (saldo_inicial + realizados) — vem da mesma view
  // de saldos do módulo Bancos, então bate com a tela de Bancos.
  const { data } = await supabase.from('bancos_contas_saldo').select('saldo_atual')
  const saldoContas = (data ?? []).reduce(
    (acc, c: { saldo_atual: number }) => acc + (Number(c.saldo_atual) || 0),
    0,
  )

  return { receitaRealizada, aReceber, despesaRealizada, aPagar, saldo, saldoContas }
}
