import { supabase } from '@/lib/supabaseClient'
import { Obra } from '@/types'

export async function getObras(): Promise<Obra[]> {
  const { data, error } = await supabase
    .from('obras')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getObras error:', error)
    return []
  }
  return data ?? []
}

export async function getObraById(id: string): Promise<Obra | null> {
  const { data, error } = await supabase
    .from('obras')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('getObraById error:', error)
    return null
  }
  return data
}

export async function createObra(
  payload: Omit<Obra, 'id' | 'created_at'>
): Promise<Obra | null> {
  const { data, error } = await supabase
    .from('obras')
    .insert(payload)
    .select()
    .single()

  if (error) {
    console.error('createObra error:', error)
    return null
  }
  return data
}

export async function updateObra(
  id: string,
  payload: Partial<Omit<Obra, 'id' | 'created_at'>>
): Promise<Obra | null> {
  const { data, error } = await supabase
    .from('obras')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('updateObra error:', error)
    return null
  }
  return data
}

export async function deleteObra(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('obras')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('deleteObra error:', error)
    return false
  }
  return true
}
