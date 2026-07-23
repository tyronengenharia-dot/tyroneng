import { supabase } from '@/lib/supabaseClient'
import { Servico, ServicoComCusto, ComposicaoItem } from '@/types/servico'

export type ServicoBase = Pick<Servico, 'codigo' | 'descricao' | 'unidade' | 'ativo'>
// Cada linha é UM insumo OU UM subserviço (exatamente um dos dois).
export type ComposicaoInput = {
  insumo_id?: string
  subservico_id?: string
  coeficiente: number
}

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

// Composição de um serviço (insumos e subserviços embutidos p/ exibição).
// Degrada p/ só-insumos se a mig 0017 (coluna/relação subservico_id) não existe.
export async function getComposicao(servico_id: string): Promise<ComposicaoItem[]> {
  const FULL =
    'id, coeficiente, insumo_id, subservico_id, insumo:insumos(*), subservico:servicos!servico_insumos_subservico_id_fkey(id, codigo, descricao, unidade)'
  const BASE = 'id, coeficiente, insumo_id, insumo:insumos(*)'

  const run = (cols: string) =>
    supabase.from('servico_insumos').select(cols).eq('servico_id', servico_id).order('created_at', { ascending: true })

  let res = await run(FULL)
  if (res.error) res = await run(BASE)
  if (res.error) {
    console.error('getComposicao error:', res.error)
    return []
  }
  return (res.data ?? []) as unknown as ComposicaoItem[]
}

export async function createServico(
  base: ServicoBase,
  itens: ComposicaoInput[]
): Promise<{ error: string | null }> {
  const { data, error } = await supabase.from('servicos').insert(base).select('id').single()
  if (error) return { error: mapServicoError(error) }

  if (itens.length) {
    const rows = itens.map(i => componenteRow(data.id, i))
    const { error: compErr } = await supabase.from('servico_insumos').insert(rows)
    if (compErr) return { error: mapServicoError(compErr) }
  }
  return { error: null }
}

// Uma linha da composição: insumo OU subserviço (exatamente um).
function componenteRow(servico_id: string, i: ComposicaoInput) {
  return i.subservico_id
    ? { servico_id, subservico_id: i.subservico_id, coeficiente: i.coeficiente }
    : { servico_id, insumo_id: i.insumo_id, coeficiente: i.coeficiente }
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
    const rows = itens.map(i => componenteRow(id, i))
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

// 23505 unique_violation · 23503 foreign_key_violation · 23514 check/trigger
function mapServicoError(error: { code?: string; message?: string }): string {
  const msg = error.message || ''
  if (/ciclo/i.test(msg)) return 'Essa composição criaria um ciclo entre serviços (um serviço acabaria contendo a si mesmo).'
  if (/ele mesmo/i.test(msg)) return 'Um serviço não pode conter ele mesmo.'
  if (error.code === '23505') {
    if (msg.includes('subservico')) return 'Esse serviço já está na composição.'
    if (msg.includes('servico_insumos')) return 'Esse insumo já está na composição.'
    return 'Já existe um serviço com esse código.'
  }
  if (error.code === '23503')
    return 'Este serviço está em uso (em uma planilha ou dentro de outro serviço) e não pode ser excluído.'
  return msg || 'Não foi possível salvar o serviço.'
}
