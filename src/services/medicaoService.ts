import { supabase } from '@/lib/supabaseClient'
import { Medicao } from '@/types'

export async function getMedicoesByObra(obra_id: string): Promise<Medicao[]> {
  const { data, error } = await supabase
    .from('medicoes')
    .select('*')
    .eq('obra_id', obra_id)
    .order('date', { ascending: false })

  if (error) {
    console.error('getMedicoesByObra error:', error)
    return []
  }
  return data ?? []
}

export async function createMedicao(
  payload: Omit<Medicao, 'id' | 'created_at'>
): Promise<Medicao | null> {
  const { data, error } = await supabase
    .from('medicoes')
    .insert(payload)
    .select()
    .single()

  if (error) {
    console.error('createMedicao error:', error)
    return null
  }
  return data
}

export async function updateMedicao(
  id: string,
  payload: Partial<Omit<Medicao, 'id' | 'created_at'>>
): Promise<Medicao | null> {
  const { data, error } = await supabase
    .from('medicoes')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('updateMedicao error:', error)
    return null
  }
  return data
}

export async function deleteMedicao(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('medicoes')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('deleteMedicao error:', error)
    return false
  }
  return true
}
