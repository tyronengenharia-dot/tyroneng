import { supabase } from '@/lib/supabaseClient'
import { Insumo } from '@/types/insumo'

export type InsumoPayload = Omit<Insumo, 'id' | 'created_at' | 'updated_at'>

export async function getInsumos(): Promise<Insumo[]> {
  const { data, error } = await supabase
    .from('insumos')
    .select('*')
    .order('codigo', { ascending: true })

  if (error) {
    console.error('getInsumos error:', error)
    return []
  }
  return data ?? []
}

export async function createInsumo(
  payload: InsumoPayload
): Promise<{ data: Insumo | null; error: string | null }> {
  const { data, error } = await supabase
    .from('insumos')
    .insert(payload)
    .select()
    .single()

  if (error) return { data: null, error: mapInsumoError(error) }
  return { data, error: null }
}

export async function updateInsumo(
  id: string,
  payload: Partial<InsumoPayload>
): Promise<{ data: Insumo | null; error: string | null }> {
  const { data, error } = await supabase
    .from('insumos')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: mapInsumoError(error) }
  return { data, error: null }
}

export async function deleteInsumo(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('insumos').delete().eq('id', id)
  if (error) return { error: mapInsumoError(error) }
  return { error: null }
}

// Traduz os erros de constraint do schema para mensagens amigáveis.
//  23505 = unique_violation  -> código duplicado
//  23503 = foreign_key       -> insumo usado por um serviço (delete restrict)
function mapInsumoError(error: { code?: string; message?: string }): string {
  if (error.code === '23505') return 'Já existe um insumo com esse código.'
  if (error.code === '23503')
    return 'Este insumo está vinculado a um serviço e não pode ser excluído.'
  return error.message || 'Não foi possível salvar o insumo.'
}
