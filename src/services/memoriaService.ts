import { supabase } from '@/lib/supabaseClient'
import { MemoriaCalculo } from '@/types/memoria'

export type MemoriaPayload = Omit<MemoriaCalculo, 'id' | 'created_at'>

export async function getMemoriaByObra(obra_id: string): Promise<MemoriaCalculo[]> {
  const { data, error } = await supabase
    .from('memoria_calculo')
    .select('*')
    .eq('obra_id', obra_id)
    .order('ordem', { ascending: true })

  if (error) {
    console.warn('getMemoriaByObra (migration aplicada?):', error.message)
    return []
  }
  return data ?? []
}

export async function createMemoria(
  payload: MemoriaPayload
): Promise<{ data: MemoriaCalculo | null; error: string | null }> {
  const { data, error } = await supabase
    .from('memoria_calculo')
    .insert(payload)
    .select()
    .single()
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function updateMemoria(
  id: string,
  payload: Partial<MemoriaPayload>
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('memoria_calculo').update(payload).eq('id', id)
  return { error: error?.message ?? null }
}

export async function deleteMemoria(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('memoria_calculo').delete().eq('id', id)
  return { error: error?.message ?? null }
}
