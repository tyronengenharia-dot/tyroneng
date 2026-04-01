import { supabase } from '@/lib/supabaseClient'
import { SolicitacaoCompra } from '@/types/compras'

export async function getSolicitacoes() {
  const { data, error } = await supabase
    .from('solicitacoes_compra')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function createSolicitacao(payload: Partial<SolicitacaoCompra>) {
  const { data, error } = await supabase
    .from('solicitacoes_compra')
    .insert([payload])
    .select()

  if (error) throw error
  return data[0]
}