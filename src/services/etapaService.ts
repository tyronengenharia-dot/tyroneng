import { supabase } from '@/lib/supabaseClient'
import { Etapa } from '@/types'

// A coluna `etapas.valor` chega na migração 0013. Enquanto ela não for aplicada,
// degradamos com elegância: se o insert/update falhar por causa da coluna
// ausente, removemos `valor` e tentamos de novo (o cadastro de etapa nunca quebra).
function isMissingValorColumn(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  const msg = (error.message || '').toLowerCase()
  return error.code === 'PGRST204' || (msg.includes('valor') && msg.includes('column'))
}

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
  let res = await supabase.from('etapas').insert(payload).select().single()
  if (res.error && isMissingValorColumn(res.error) && 'valor' in payload) {
    const { valor: _drop, ...rest } = payload
    void _drop
    res = await supabase.from('etapas').insert(rest).select().single()
  }
  if (res.error) {
    console.error('createEtapa error:', res.error)
    return null
  }
  return res.data
}

export async function updateEtapa(
  id: string,
  payload: Partial<Omit<Etapa, 'id' | 'created_at'>>
): Promise<Etapa | null> {
  let res = await supabase.from('etapas').update(payload).eq('id', id).select().single()
  if (res.error && isMissingValorColumn(res.error) && 'valor' in payload) {
    const { valor: _drop, ...rest } = payload
    void _drop
    res = await supabase.from('etapas').update(rest).eq('id', id).select().single()
  }
  if (res.error) {
    console.error('updateEtapa error:', res.error)
    return null
  }
  return res.data
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
