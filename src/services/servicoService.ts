import { supabase } from '@/lib/supabaseClient'
import { Servico, ServicoComCusto, ComposicaoItem } from '@/types/servico'

export type ServicoBase = Pick<Servico, 'codigo' | 'descricao' | 'unidade' | 'ativo'>
export type ComposicaoInput = { insumo_id: string; coeficiente: number }

// Lista de serviços + custo unitário derivado (view servicos_custo).
export async function getServicos(): Promise<ServicoComCusto[]> {
  const [servicosRes, custosRes] = await Promise.all([
    supabase.from('servicos').select('*').order('codigo', { ascending: true }),
    supabase.from('servicos_custo').select('servico_id, custo_unitario'),
  ])

  if (servicosRes.error) {
    console.error('getServicos error:', servicosRes.error)
    return []
  }

  const custoMap = new Map<string, number>(
    (custosRes.data ?? []).map(c => [c.servico_id as string, Number(c.custo_unitario) || 0])
  )

  return (servicosRes.data ?? []).map(s => ({
    ...s,
    custo_unitario: custoMap.get(s.id) ?? 0,
  }))
}

// Composição de um serviço (com os insumos embutidos).
export async function getComposicao(servico_id: string): Promise<ComposicaoItem[]> {
  const { data, error } = await supabase
    .from('servico_insumos')
    .select('id, insumo_id, coeficiente, insumo:insumos(*)')
    .eq('servico_id', servico_id)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('getComposicao error:', error)
    return []
  }
  return (data ?? []) as unknown as ComposicaoItem[]
}

export async function createServico(
  base: ServicoBase,
  itens: ComposicaoInput[]
): Promise<{ error: string | null }> {
  const { data, error } = await supabase.from('servicos').insert(base).select('id').single()
  if (error) return { error: mapServicoError(error) }

  if (itens.length) {
    const rows = itens.map(i => ({
      servico_id: data.id,
      insumo_id: i.insumo_id,
      coeficiente: i.coeficiente,
    }))
    const { error: compErr } = await supabase.from('servico_insumos').insert(rows)
    if (compErr) return { error: mapServicoError(compErr) }
  }
  return { error: null }
}

export async function updateServico(
  id: string,
  base: ServicoBase,
  itens: ComposicaoInput[]
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('servicos').update(base).eq('id', id)
  if (error) return { error: mapServicoError(error) }

  // Re-sincroniza a composição (substitui as linhas atuais).
  const { error: delErr } = await supabase.from('servico_insumos').delete().eq('servico_id', id)
  if (delErr) return { error: mapServicoError(delErr) }

  if (itens.length) {
    const rows = itens.map(i => ({ servico_id: id, insumo_id: i.insumo_id, coeficiente: i.coeficiente }))
    const { error: insErr } = await supabase.from('servico_insumos').insert(rows)
    if (insErr) return { error: mapServicoError(insErr) }
  }
  return { error: null }
}

export async function deleteServico(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('servicos').delete().eq('id', id)
  if (error) return { error: mapServicoError(error) }
  return { error: null }
}

// 23505 unique_violation · 23503 foreign_key_violation
function mapServicoError(error: { code?: string; message?: string }): string {
  if (error.code === '23505') {
    if (error.message?.includes('servico_insumos')) return 'Esse insumo já está na composição.'
    return 'Já existe um serviço com esse código.'
  }
  if (error.code === '23503')
    return 'Este serviço está em uso em uma planilha e não pode ser excluído.'
  return error.message || 'Não foi possível salvar o serviço.'
}
