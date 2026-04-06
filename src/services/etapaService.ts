import { supabase } from '@/lib/supabaseClient'
import { Etapa } from '@/types'

export async function getEtapasByObra(obra_id: string): Promise<Etapa[]> {
  const { data, error } = await supabase
    .from('etapas')
    .select('*')
    .eq('obra_id', obra_id)
    .order('ordem', { ascending: true })

  if (error) {
    console.error('getEtapasByObra error:', error)
    return []
  }
  return data ?? []
}

export async function createEtapa(
  payload: Omit<Etapa, 'id' | 'created_at'>
): Promise<Etapa | null> {
  const { data, error } = await supabase
    .from('etapas')
    .insert(payload)
    .select()
    .single()

  if (error) {
    console.error('createEtapa error:', error)
    return null
  }
  return data
}

export async function updateEtapa(
  id: string,
  payload: Partial<Omit<Etapa, 'id' | 'created_at'>>
): Promise<Etapa | null> {
  const { data, error } = await supabase
    .from('etapas')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('updateEtapa error:', error)
    return null
  }
  return data
}

export async function deleteEtapa(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('etapas')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('deleteEtapa error:', error)
    return false
  }
  return true
}
