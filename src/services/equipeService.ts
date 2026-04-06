import { supabase } from '@/lib/supabaseClient'
import { Membro, Documento } from '@/types'

// ── Equipe ───────────────────────────────────────────────────────────────────

export async function getMembrosByObra(obra_id: string): Promise<Membro[]> {
  const { data, error } = await supabase
    .from('membros')
    .select('*')
    .eq('obra_id', obra_id)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('getMembrosByObra error:', error)
    return []
  }
  return data ?? []
}

export async function createMembro(
  payload: Omit<Membro, 'id' | 'created_at'>
): Promise<Membro | null> {
  const { data, error } = await supabase
    .from('membros')
    .insert(payload)
    .select()
    .single()

  if (error) {
    console.error('createMembro error:', error)
    return null
  }
  return data
}

export async function updateMembro(
  id: string,
  payload: Partial<Omit<Membro, 'id' | 'created_at'>>
): Promise<Membro | null> {
  const { data, error } = await supabase
    .from('membros')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('updateMembro error:', error)
    return null
  }
  return data
}

export async function deleteMembro(id: string): Promise<boolean> {
  const { error } = await supabase.from('membros').delete().eq('id', id)
  if (error) return false
  return true
}

// ── Documentos ───────────────────────────────────────────────────────────────

export async function getDocumentosByObra(obra_id: string): Promise<Documento[]> {
  const { data, error } = await supabase
    .from('documentos')
    .select('*')
    .eq('obra_id', obra_id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getDocumentosByObra error:', error)
    return []
  }
  return data ?? []
}

export async function createDocumento(
  payload: Omit<Documento, 'id' | 'created_at'>
): Promise<Documento | null> {
  const { data, error } = await supabase
    .from('documentos')
    .insert(payload)
    .select()
    .single()

  if (error) {
    console.error('createDocumento error:', error)
    return null
  }
  return data
}

export async function deleteDocumento(id: string): Promise<boolean> {
  const { error } = await supabase.from('documentos').delete().eq('id', id)
  if (error) return false
  return true
}
