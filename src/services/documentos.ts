import { supabase } from '@/lib/supabaseClient'

export async function getDocumentos(userId: string) {
  const { data, error } = await supabase
    .from('documentos')
    .select('*')
    .eq('user_id', userId)

  if (error) {
    console.error(error)
    throw new Error(error.message)
  }

  return data
}

export async function createDocumento(payload: any) {
  const { data, error } = await supabase
    .from('documentos')
    .insert(payload)
    .select()
    .single()

  if (error) {
    console.error(error)
    throw new Error(error.message)
  }

  return data
}

// 🔥 CORRIGIDO (SEM user_id no filtro)
export async function updateDocumento(id: string, payload: any) {
  const { data, error } = await supabase
    .from('documentos')
    .update(payload)
    .eq('id', id)
    .select()

  console.log('UPDATE RESULT:', data)

  if (error) {
    console.error(error)
    throw new Error(error.message)
  }

  return data
}

export async function deleteDocumento(id: string) {
  const { error } = await supabase
    .from('documentos')
    .delete()
    .eq('id', id)

  if (error) throw error
}