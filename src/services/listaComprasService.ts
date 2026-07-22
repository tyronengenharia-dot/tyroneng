import { supabase } from '@/lib/supabaseClient'
import { PlanilhaTipo, Etapa } from '@/types'
import { getEtapasByObra } from '@/services/etapaService'
import { getPlanilhasStatus, planilhaEditavel } from '@/services/planilhaEstadoService'
import {
  ComposicaoLinha,
  ItemServico,
  ItemSemComposicao,
  LinhaInsumo,
  ServicoExplodido,
  explodirTodos,
  consolidarInsumos,
} from '@/lib/listaCompras'

// ─────────────────────────────────────────────────────────────────────────────
// Fonte de dados da Lista de Compras. Nasce do CUSTO PLANEJADO da obra: primeiro
// se planeja o que comprar (o plano), depois o gasto efetivo alimenta o Custo
// Real. Busca os itens da planilha, a composição dos serviços envolvidos e as
// etapas do cronograma, e devolve tudo já explodido/consolidado pela lib pura
// `@/lib/listaCompras`.
//
// A coluna planilha_itens.etapa_id e obras.compra_lead_dias chegam na migração
// 0015. Enquanto ela não é aplicada, degradamos com elegância: a visão por
// serviço e a consolidada funcionam normalmente; só a visão por cronograma
// (vínculo com etapa) fica indisponível — sinalizado por `etapaLinkDisponivel`.
// ─────────────────────────────────────────────────────────────────────────────

export type ListaComprasData = {
  servicos: ServicoExplodido[]
  consolidado: LinhaInsumo[]
  semComposicao: ItemSemComposicao[]
  etapas: Etapa[]
  leadDias: number
  /** false = migração 0015 ainda não aplicada (sem coluna etapa_id) */
  etapaLinkDisponivel: boolean
  /** planilha-fonte editável? (Custo Planejado em rascunho). false = aprovado/travado */
  sourceEditavel: boolean
}

type ItemRow = {
  id: string
  categoria_id: string
  codigo: string
  descricao: string
  unidade: string
  quantidade: number
  valor_unitario: number
  origem: string | null
  servico_id: string | null
  etapa_id?: string | null
}

const ITEM_COLS_BASE =
  'id, categoria_id, codigo, descricao, unidade, quantidade, valor_unitario, origem, servico_id'

function isMissingColumn(
  error: { code?: string; message?: string } | null,
  coluna: string,
): boolean {
  if (!error) return false
  const msg = (error.message || '').toLowerCase()
  return (
    error.code === '42703' || // Postgres: undefined_column (no SELECT)
    error.code === 'PGRST204' || // PostgREST: coluna não encontrada (no UPDATE)
    (msg.includes(coluna) && msg.includes('column'))
  )
}

export async function getListaCompras(
  obra_id: string,
  tipo: PlanilhaTipo = 'custo_planejado',
): Promise<ListaComprasData> {
  // 1. Itens da planilha (tenta com etapa_id; cai p/ sem etapa_id pré-0015).
  let etapaLinkDisponivel = true
  let itemRows: ItemRow[] = []

  const q = (cols: string) =>
    supabase
      .from('planilha_itens')
      .select(cols)
      .eq('obra_id', obra_id)
      .eq('tipo', tipo)
      .order('ordem', { ascending: true })

  let res = await q(`${ITEM_COLS_BASE}, etapa_id`)
  if (res.error && isMissingColumn(res.error, 'etapa_id')) {
    etapaLinkDisponivel = false
    res = await q(ITEM_COLS_BASE)
  }
  if (res.error) {
    console.error('getListaCompras itens error:', res.error)
    return {
      servicos: [], consolidado: [], semComposicao: [],
      etapas: [], leadDias: 0, etapaLinkDisponivel, sourceEditavel: true,
    }
  }
  itemRows = (res.data ?? []) as unknown as ItemRow[]

  // 2. Separa serviços (têm composição) dos demais (SINAPI/EMOP/legado).
  const itensServico: ItemServico[] = []
  const semComposicao: ItemSemComposicao[] = []
  for (const r of itemRows) {
    if (r.origem === 'servico' && r.servico_id) {
      itensServico.push({
        id: r.id,
        categoria_id: r.categoria_id,
        codigo: r.codigo,
        descricao: r.descricao,
        unidade: r.unidade,
        quantidade: Number(r.quantidade) || 0,
        servico_id: r.servico_id,
        etapa_id: r.etapa_id ?? null,
      })
    } else {
      const quantidade = Number(r.quantidade) || 0
      const valor_unitario = Number(r.valor_unitario) || 0
      semComposicao.push({
        item_id: r.id,
        codigo: r.codigo,
        descricao: r.descricao,
        unidade: r.unidade,
        quantidade,
        valor_unitario,
        total: Math.round(quantidade * valor_unitario * 100) / 100,
        origem: r.origem ?? 'livre',
      })
    }
  }

  // 3. Composição dos serviços envolvidos (uma consulta, insumo embutido).
  const servicoIds = [...new Set(itensServico.map(i => i.servico_id))]
  const composicoes = new Map<string, ComposicaoLinha[]>()
  if (servicoIds.length > 0) {
    const { data, error } = await supabase
      .from('servico_insumos')
      .select('servico_id, coeficiente, insumo:insumos(id, codigo, descricao, tipo, unidade, valor_unitario)')
      .in('servico_id', servicoIds)

    if (error) {
      console.error('getListaCompras composicao error:', error)
    } else {
      for (const row of (data ?? []) as unknown as {
        servico_id: string
        coeficiente: number
        insumo: ComposicaoLinha['insumo'] | null
      }[]) {
        if (!row.insumo) continue
        const arr = composicoes.get(row.servico_id) ?? []
        arr.push({ coeficiente: Number(row.coeficiente) || 0, insumo: row.insumo })
        composicoes.set(row.servico_id, arr)
      }
    }
  }

  // 4. Etapas + lead time da obra + estado da planilha-fonte.
  const [etapas, leadDias, headers] = await Promise.all([
    getEtapasByObra(obra_id),
    getLeadDias(obra_id),
    getPlanilhasStatus(obra_id),
  ])
  const header = headers.find(h => h.tipo === tipo)
  // Sem status (migração de estado não aplicada) => modo legado, editável.
  const sourceEditavel = header ? planilhaEditavel(tipo, header.status) : true

  // 5. Explode e consolida.
  const servicos = explodirTodos(itensServico, composicoes)
  const consolidado = consolidarInsumos(servicos)

  return { servicos, consolidado, semComposicao, etapas, leadDias, etapaLinkDisponivel, sourceEditavel }
}

// ── Persistência: vínculo item → etapa e lead time da obra ───────────────────

/** Lê a antecedência de compra (dias) da obra. 0 se a coluna ainda não existe. */
export async function getLeadDias(obra_id: string): Promise<number> {
  const { data, error } = await supabase
    .from('obras')
    .select('compra_lead_dias')
    .eq('id', obra_id)
    .single()

  if (error || !data) return 0
  return Number((data as { compra_lead_dias?: number }).compra_lead_dias) || 0
}

/** Salva a antecedência de compra (dias) na obra. */
export async function setLeadDias(
  obra_id: string,
  dias: number,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('obras')
    .update({ compra_lead_dias: Math.max(0, Math.round(dias) || 0) })
    .eq('id', obra_id)

  if (error) {
    if (isMissingColumn(error, 'compra_lead_dias')) {
      return { error: 'Aplique a migração 0015 para salvar a antecedência de compra.' }
    }
    console.error('setLeadDias error:', error)
    return { error: 'Não foi possível salvar a antecedência.' }
  }
  return { error: null }
}

/** Vincula (ou desvincula, com etapa_id=null) um serviço a uma etapa. */
export async function setItemEtapa(
  item_id: string,
  etapa_id: string | null,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('planilha_itens')
    .update({ etapa_id })
    .eq('id', item_id)

  if (error) {
    if (isMissingColumn(error, 'etapa_id')) {
      return { error: 'Aplique a migração 0015 para vincular serviços ao cronograma.' }
    }
    // Trava de edição (Regra 1): Custo Planejado aprovado fica somente-leitura.
    if (error.code === '23514' || /bloqueada/i.test(error.message || '')) {
      return { error: 'Custo Planejado aprovado (travado). Reabra o Custo Planejado para reprogramar as compras.' }
    }
    console.error('setItemEtapa error:', error)
    return { error: 'Não foi possível vincular o serviço à etapa.' }
  }
  return { error: null }
}
