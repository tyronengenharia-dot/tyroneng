import { supabase } from '@/lib/supabaseClient'
import { CustoRealPagamento } from '@/types'

// =============================================================================
// Pagamentos (parcelas) dos itens de Custo Real.
// É a ÚNICA porta de entrada das SAÍDAS da obra. A aba Financeiro apenas lê
// daqui. Requer a migration 0007 aplicada; sem ela, leituras voltam [] (modo
// degradado) e gravações falham com mensagem amigável.
// =============================================================================

export async function getPagamentosByItem(
  planilha_item_id: string,
): Promise<CustoRealPagamento[]> {
  const { data, error } = await supabase
    .from('custo_real_pagamentos')
    .select('*')
    .eq('planilha_item_id', planilha_item_id)
    .order('data', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })

  if (error) {
    console.warn('getPagamentosByItem (migration 0007 aplicada?):', error.message)
    return []
  }
  return (data ?? []) as CustoRealPagamento[]
}

export async function getPagamentosByObra(
  obra_id: string,
): Promise<CustoRealPagamento[]> {
  const { data, error } = await supabase
    .from('custo_real_pagamentos')
    .select('*')
    .eq('obra_id', obra_id)
    .order('data', { ascending: false, nullsFirst: false })

  if (error) {
    console.warn('getPagamentosByObra (migration 0007 aplicada?):', error.message)
    return []
  }
  return (data ?? []) as CustoRealPagamento[]
}

export async function createPagamento(
  payload: Omit<CustoRealPagamento, 'id' | 'created_at'>,
): Promise<CustoRealPagamento | null> {
  const { data, error } = await supabase
    .from('custo_real_pagamentos')
    .insert(payload)
    .select()
    .single()

  if (error) {
    console.error('createPagamento error:', error)
    return null
  }
  return data as CustoRealPagamento
}

export async function updatePagamento(
  id: string,
  payload: Partial<Omit<CustoRealPagamento, 'id' | 'created_at' | 'planilha_item_id' | 'obra_id'>>,
): Promise<CustoRealPagamento | null> {
  const { data, error } = await supabase
    .from('custo_real_pagamentos')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('updatePagamento error:', error)
    return null
  }
  return data as CustoRealPagamento
}

export async function deletePagamento(
  id: string,
  comprovantePath?: string | null,
): Promise<boolean> {
  // Remove a foto do comprovante do Storage primeiro (best-effort).
  if (comprovantePath) {
    await supabase.storage.from('comprovantes').remove([comprovantePath])
  }

  const { error } = await supabase
    .from('custo_real_pagamentos')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('deletePagamento error:', error)
    return false
  }
  return true
}

// ── Comprovante (foto) no bucket "comprovantes" ───────────────────────────────

export async function uploadComprovante(
  file: File,
  obraId: string,
): Promise<{ url: string; path: string }> {
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${obraId}/pag-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage
    .from('comprovantes')
    .upload(path, file, { cacheControl: '3600', upsert: false })

  if (error) throw new Error(`Erro no upload do comprovante: ${error.message}`)

  const { data } = supabase.storage.from('comprovantes').getPublicUrl(path)
  return { url: data.publicUrl, path }
}

export async function removeComprovante(path: string): Promise<void> {
  await supabase.storage.from('comprovantes').remove([path])
}

// ── Agregação (pago = realizado; pendente + atrasado = comprometido) ───────────

export type PagamentoResumo = {
  pago: number
  comprometido: number
  total: number
  count: number
}

export function resumoPagamentos(list: CustoRealPagamento[]): PagamentoResumo {
  let pago = 0
  let comprometido = 0
  for (const p of list) {
    const v = Number(p.valor) || 0
    if (p.status === 'pago') pago += v
    else comprometido += v // pendente + atrasado
  }
  return { pago, comprometido, total: pago + comprometido, count: list.length }
}

/** itemId → resumo (pago/comprometido/total). Útil pra coluna "Pago" do Custo Real. */
export function mapaPagamentosPorItem(
  list: CustoRealPagamento[],
): Record<string, PagamentoResumo> {
  const grupos: Record<string, CustoRealPagamento[]> = {}
  for (const p of list) (grupos[p.planilha_item_id] ??= []).push(p)

  const out: Record<string, PagamentoResumo> = {}
  for (const [itemId, arr] of Object.entries(grupos)) out[itemId] = resumoPagamentos(arr)
  return out
}
