import { supabase } from '@/lib/supabaseClient'
import { PlanilhaCategoria, PlanilhaItem, PlanilhaTipo } from '@/types'

// ── Categorias ──────────────────────────────────────────────────────────────

export async function getCategoriasByObra(
  obra_id: string,
  tipo: PlanilhaTipo,
  planilhaId?: string
): Promise<PlanilhaCategoria[]> {
  let query = supabase.from('planilha_categorias').select('*')
  // Aditivos: escopo por planilha_id (vários compartilham tipo='aditivo').
  query = planilhaId
    ? query.eq('planilha_id', planilhaId)
    : query.eq('obra_id', obra_id).eq('tipo', tipo)

  const { data, error } = await query.order('ordem', { ascending: true })

  if (error) {
    console.error('getCategoriasByObra error:', error)
    return []
  }
  return data ?? []
}

export async function createCategoria(
  payload: Omit<PlanilhaCategoria, 'id' | 'created_at'>
): Promise<PlanilhaCategoria | null> {
  const { data, error } = await supabase
    .from('planilha_categorias')
    .insert(payload)
    .select()
    .single()

  if (error) {
    console.error('createCategoria error:', error)
    return null
  }
  return data
}

export async function updateCategoria(
  id: string,
  payload: Partial<Omit<PlanilhaCategoria, 'id' | 'created_at'>>
): Promise<PlanilhaCategoria | null> {
  const { data, error } = await supabase
    .from('planilha_categorias')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('updateCategoria error:', error)
    return null
  }
  return data
}

export async function deleteCategoria(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('planilha_categorias')
    .delete()
    .eq('id', id)

  if (error) return false
  return true
}

// ── Itens ───────────────────────────────────────────────────────────────────

export async function getItensByCategoria(
  categoria_id: string
): Promise<PlanilhaItem[]> {
  const { data, error } = await supabase
    .from('planilha_itens')
    .select('*')
    .eq('categoria_id', categoria_id)
    .order('ordem', { ascending: true })

  if (error) {
    console.error('getItensByCategoria error:', error)
    return []
  }
  return data ?? []
}

export async function getItensByObra(
  obra_id: string,
  tipo: PlanilhaTipo,
  planilhaId?: string
): Promise<PlanilhaItem[]> {
  let query = supabase.from('planilha_itens').select('*')
  query = planilhaId
    ? query.eq('planilha_id', planilhaId)
    : query.eq('obra_id', obra_id).eq('tipo', tipo)

  const { data, error } = await query.order('ordem', { ascending: true })

  if (error) {
    console.error('getItensByObra error:', error)
    return []
  }
  return data ?? []
}

export async function createItem(
  payload: Omit<PlanilhaItem, 'id' | 'created_at'>
): Promise<PlanilhaItem | null> {
  const { data, error } = await supabase
    .from('planilha_itens')
    .insert(payload)
    .select()
    .single()

  if (error) {
    console.error('createItem error:', error)
    return null
  }
  return data
}

export async function updateItem(
  id: string,
  payload: Partial<Omit<PlanilhaItem, 'id' | 'created_at'>>
): Promise<PlanilhaItem | null> {
  const { data, error } = await supabase
    .from('planilha_itens')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('updateItem error:', error)
    return null
  }
  return data
}

export async function deleteItem(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('planilha_itens')
    .delete()
    .eq('id', id)

  if (error) return false
  return true
}

// ── Importar Custo Planejado → Venda (com BDI) ───────────────────────────────
// Copia todas as categorias e itens do Custo Planejado para a Venda, aplicando
// um fator de BDI sobre o valor unitário (Venda = Custo × (1 + BDI%)).
// A Venda permanece independente e editável após a importação.

export type ImportarResultado = {
  error: string | null
  categorias: number
  itens: number
}

export async function importarCustoParaVenda(
  obra_id: string,
  opts: { bdiPercent: number; substituir: boolean }
): Promise<ImportarResultado> {
  const fator = 1 + (opts.bdiPercent || 0) / 100
  const round4 = (v: number) => Math.round(v * 10000) / 10000

  // 1. Fonte: Custo Planejado
  const [cats, itens] = await Promise.all([
    getCategoriasByObra(obra_id, 'custo_planejado'),
    getItensByObra(obra_id, 'custo_planejado'),
  ])
  if (cats.length === 0) {
    return { error: 'A planilha de Custo Planejado está vazia — nada para importar.', categorias: 0, itens: 0 }
  }

  // 2. Substituir: limpa a Venda atual (cascade remove os itens)
  let ordemOffset = 0
  if (opts.substituir) {
    const vendaCats = await getCategoriasByObra(obra_id, 'venda')
    for (const c of vendaCats) {
      const ok = await deleteCategoria(c.id)
      if (!ok) {
        return { error: 'Não foi possível limpar a planilha de Venda (bloqueada?).', categorias: 0, itens: 0 }
      }
    }
  } else {
    // Append: novas categorias entram após as existentes
    const vendaCats = await getCategoriasByObra(obra_id, 'venda')
    ordemOffset = vendaCats.reduce((max, c) => Math.max(max, c.ordem), 0)
  }

  // 3. Copia categoria a categoria; itens em lote
  let nCats = 0
  let nItens = 0
  for (let idx = 0; idx < cats.length; idx++) {
    const cat = cats[idx]
    const novaCat = await createCategoria({
      obra_id,
      tipo: 'venda',
      nome: cat.nome,
      ordem: ordemOffset + idx + 1,
    })
    if (!novaCat) {
      return { error: 'Erro ao criar categoria na Venda (planilha bloqueada?).', categorias: nCats, itens: nItens }
    }
    nCats++

    const doCat = itens.filter(i => i.categoria_id === cat.id)
    if (doCat.length === 0) continue

    const payload = doCat.map((it, i) => ({
      categoria_id:       novaCat.id,
      obra_id,
      tipo:               'venda' as const,
      codigo:             it.codigo,
      descricao:          it.descricao,
      quantidade:         it.quantidade,
      unidade:            it.unidade,
      valor_unitario:     round4(it.valor_unitario * fator),
      ordem:              i + 1,
      origem:             it.origem ?? null,
      servico_id:         it.servico_id ?? null,
      referencia_item_id: it.referencia_item_id ?? null,
    }))

    const { data, error } = await supabase
      .from('planilha_itens')
      .insert(payload)
      .select('id')
    if (error) {
      console.error('importarCustoParaVenda (itens) error:', error)
      return { error: error.message, categorias: nCats, itens: nItens }
    }
    nItens += data?.length ?? 0
  }

  return { error: null, categorias: nCats, itens: nItens }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function calcTotalItens(itens: PlanilhaItem[]): number {
  return itens.reduce((sum, i) => sum + i.quantidade * i.valor_unitario, 0)
}
