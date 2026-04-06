import { supabase } from '@/lib/supabaseClient'
import { PlanilhaCategoria, PlanilhaItem, PlanilhaTipo } from '@/types'

// ── Categorias ──────────────────────────────────────────────────────────────

export async function getCategoriasByObra(
  obra_id: string,
  tipo: PlanilhaTipo
): Promise<PlanilhaCategoria[]> {
  const { data, error } = await supabase
    .from('planilha_categorias')
    .select('*')
    .eq('obra_id', obra_id)
    .eq('tipo', tipo)
    .order('ordem', { ascending: true })

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
  tipo: PlanilhaTipo
): Promise<PlanilhaItem[]> {
  const { data, error } = await supabase
    .from('planilha_itens')
    .select('*')
    .eq('obra_id', obra_id)
    .eq('tipo', tipo)
    .order('ordem', { ascending: true })

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

// ── Helpers ──────────────────────────────────────────────────────────────────

export function calcTotalItens(itens: PlanilhaItem[]): number {
  return itens.reduce((sum, i) => sum + i.quantidade * i.valor_unitario, 0)
}
