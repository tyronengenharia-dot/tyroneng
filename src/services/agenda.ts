import { supabase } from '@/lib/supabaseClient'

// 🔍 LISTAR
export async function getAgenda(userId: string) {
  const { data, error } = await supabase
    .from('agenda')
    .select('*')
    .eq('user_id', userId)
    .order('data', { ascending: true })

  if (error) {
    console.error(error)
    throw new Error(error.message)
  }

  return data
}

// ➕ CRIAR
export async function createEvento(payload: any) {
  const { data, error } = await supabase
    .from('agenda')
    .insert(payload)
    .select()
    .single()

  if (error) {
    console.error(error)
    throw new Error(error.message)
  }

  return data
}

// ✏️ EDITAR
export async function updateEvento(id: string, payload: any) {
  const { data, error } = await supabase
    .from('agenda')
    .update(payload)
    .eq('id', id)
    .select()

  if (error) {
    console.error(error)
    throw new Error(error.message)
  }

  return data
}

// 🗑️ EXCLUIR
export async function deleteEvento(id: string) {
  const { error } = await supabase
    .from('agenda')
    .delete()
    .eq('id', id)

  if (error) throw error
}