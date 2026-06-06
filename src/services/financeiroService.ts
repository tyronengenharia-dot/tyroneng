import { supabase } from '@/lib/supabaseClient'
import { Financeiro } from '@/types'

export async function getFinanceiroByObra(obra_id: string): Promise<Financeiro[]> {
  const { data, error } = await supabase
    .from('financeiro')
    .select('*')
    .eq('obra_id', obra_id)
    .order('date', { ascending: false })

  if (error) {
    console.error('getFinanceiroByObra error:', error)
    return []
  }
  return data ?? []
}

export async function createFinanceiro(
  payload: Omit<Financeiro, 'id' | 'created_at'>
): Promise<Financeiro | null> {
  const { data, error } = await supabase
    .from('financeiro')
    .insert(payload)
    .select()
    .single()

  if (error) {
    console.error('createFinanceiro error:', error)
    return null
  }
  return data
}

export async function updateFinanceiro(
  id: string,
  payload: Partial<Omit<Financeiro, 'id' | 'created_at'>>
): Promise<Financeiro | null> {
  const { data, error } = await supabase
    .from('financeiro')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('updateFinanceiro error:', error)
    return null
  }
  return data
}

export async function deleteFinanceiro(
  id: string,
  comprovantePath?: string | null,
): Promise<boolean> {
  // Remove a foto do comprovante do Storage primeiro (best-effort).
  if (comprovantePath) {
    await supabase.storage.from('comprovantes').remove([comprovantePath])
  }

  const { error } = await supabase
    .from('financeiro')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('deleteFinanceiro error:', error)
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
  const path = `${obraId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

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

export function calcSaldo(items: Financeiro[]) {
  return items.reduce(
    (acc, i) => acc + (i.type === 'entrada' ? i.value : -i.value),
    0
  )
}

export function calcReceitas(items: Financeiro[]) {
  return items
    .filter(i => i.type === 'entrada')
    .reduce((acc, i) => acc + i.value, 0)
}

export function calcDespesas(items: Financeiro[]) {
  return items
    .filter(i => i.type === 'saida')
    .reduce((acc, i) => acc + i.value, 0)
}
