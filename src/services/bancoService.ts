import { supabase } from '@/lib/supabaseClient'
import {
  BancoConta,
  ContaComSaldo,
  BancoCategoria,
  BancoMovimentacao,
  MovimentacaoComRelacoes,
  MovStatus,
  MovTipo,
} from '@/types/banco'

export type ContaPayload = Omit<BancoConta, 'id' | 'created_at' | 'updated_at'>
export type CategoriaPayload = Omit<BancoCategoria, 'id' | 'created_at'>
export type MovimentacaoPayload = Omit<
  BancoMovimentacao,
  'id' | 'created_at' | 'updated_at'
>

export type MovimentacaoFiltros = {
  contaId?: string
  tipo?: MovTipo
  status?: MovStatus
  categoriaId?: string
  obraId?: string
  dataInicio?: string
  dataFim?: string
}

// ─── CONTAS ────────────────────────────────────────────────────────────────

// Lê da view de saldos para já trazer saldo_atual / saldo_previsto.
export async function getContas(): Promise<ContaComSaldo[]> {
  const { data, error } = await supabase
    .from('bancos_contas_saldo')
    .select('*')
    .order('nome', { ascending: true })

  if (error) {
    console.error('getContas error:', error)
    return []
  }
  return (data as ContaComSaldo[]) ?? []
}

export async function createConta(
  payload: ContaPayload
): Promise<{ data: BancoConta | null; error: string | null }> {
  const { data, error } = await supabase
    .from('bancos_contas')
    .insert(payload)
    .select()
    .single()

  if (error) return { data: null, error: mapBancoError(error) }
  return { data, error: null }
}

export async function updateConta(
  id: string,
  payload: Partial<ContaPayload>
): Promise<{ data: BancoConta | null; error: string | null }> {
  const { data, error } = await supabase
    .from('bancos_contas')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: mapBancoError(error) }
  return { data, error: null }
}

// Exclui a conta. As movimentações são removidas em cascata (on delete cascade).
export async function deleteConta(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('bancos_contas').delete().eq('id', id)
  if (error) return { error: mapBancoError(error) }
  return { error: null }
}

// ─── CATEGORIAS ──────────────────────────────────────────────────────────────

export async function getCategorias(): Promise<BancoCategoria[]> {
  const { data, error } = await supabase
    .from('bancos_categorias')
    .select('*')
    .order('nome', { ascending: true })

  if (error) {
    console.error('getCategorias error:', error)
    return []
  }
  return data ?? []
}

export async function createCategoria(
  payload: CategoriaPayload
): Promise<{ data: BancoCategoria | null; error: string | null }> {
  const { data, error } = await supabase
    .from('bancos_categorias')
    .insert(payload)
    .select()
    .single()

  if (error) return { data: null, error: mapBancoError(error) }
  return { data, error: null }
}

export async function updateCategoria(
  id: string,
  payload: Partial<CategoriaPayload>
): Promise<{ data: BancoCategoria | null; error: string | null }> {
  const { data, error } = await supabase
    .from('bancos_categorias')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: mapBancoError(error) }
  return { data, error: null }
}

export async function deleteCategoria(
  id: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('bancos_categorias').delete().eq('id', id)
  if (error) return { error: mapBancoError(error) }
  return { error: null }
}

// ─── MOVIMENTAÇÕES ───────────────────────────────────────────────────────────

const MOV_SELECT =
  '*, conta:bancos_contas(id,nome,cor), categoria:bancos_categorias(id,nome,cor), obra:obras(id,name)'

export async function getMovimentacoes(
  filtros: MovimentacaoFiltros = {}
): Promise<MovimentacaoComRelacoes[]> {
  let query = supabase
    .from('bancos_movimentacoes')
    .select(MOV_SELECT)
    .order('data', { ascending: false })
    .order('created_at', { ascending: false })

  if (filtros.contaId) query = query.eq('conta_id', filtros.contaId)
  if (filtros.tipo) query = query.eq('tipo', filtros.tipo)
  if (filtros.status) query = query.eq('status', filtros.status)
  if (filtros.categoriaId) query = query.eq('categoria_id', filtros.categoriaId)
  if (filtros.obraId) query = query.eq('obra_id', filtros.obraId)
  if (filtros.dataInicio) query = query.gte('data', filtros.dataInicio)
  if (filtros.dataFim) query = query.lte('data', filtros.dataFim)

  const { data, error } = await query
  if (error) {
    console.error('getMovimentacoes error:', error)
    return []
  }
  return (data as unknown as MovimentacaoComRelacoes[]) ?? []
}

export async function createMovimentacao(
  payload: MovimentacaoPayload
): Promise<{ data: BancoMovimentacao | null; error: string | null }> {
  const { data, error } = await supabase
    .from('bancos_movimentacoes')
    .insert(payload)
    .select()
    .single()

  if (error) return { data: null, error: mapBancoError(error) }
  return { data, error: null }
}

export async function updateMovimentacao(
  id: string,
  payload: Partial<MovimentacaoPayload>
): Promise<{ data: BancoMovimentacao | null; error: string | null }> {
  const { data, error } = await supabase
    .from('bancos_movimentacoes')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: mapBancoError(error) }
  return { data, error: null }
}

export async function deleteMovimentacao(
  id: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('bancos_movimentacoes')
    .delete()
    .eq('id', id)
  if (error) return { error: mapBancoError(error) }
  return { error: null }
}

// Marca como conciliada (batida com o extrato) com a data informada.
export async function conciliarMovimentacao(
  id: string,
  dataConciliacao: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('bancos_movimentacoes')
    .update({ status: 'conciliado', data_conciliacao: dataConciliacao })
    .eq('id', id)
  if (error) return { error: mapBancoError(error) }
  return { error: null }
}

// ─── TRANSFERÊNCIAS ──────────────────────────────────────────────────────────

export async function transferir(params: {
  origem: string
  destino: string
  valor: number
  data: string
  descricao?: string
  status?: MovStatus
}): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await supabase.rpc('transferir_entre_contas', {
    p_origem: params.origem,
    p_destino: params.destino,
    p_valor: params.valor,
    p_data: params.data,
    p_descricao: params.descricao ?? null,
    p_status: params.status ?? 'pago',
  })

  if (error) return { id: null, error: mapBancoError(error) }
  return { id: (data as string) ?? null, error: null }
}

// Exclui as duas pernas de uma transferência (pelo transferencia_id).
export async function excluirTransferencia(
  transferenciaId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('bancos_movimentacoes')
    .delete()
    .eq('transferencia_id', transferenciaId)
  if (error) return { error: mapBancoError(error) }
  return { error: null }
}

// ─── COMPROVANTE (bucket "comprovantes", reaproveitado) ──────────────────────
// Usado pela página Financeiro ao lançar uma movimentação geral (não-obra).

export async function uploadComprovante(
  file: File,
): Promise<{ url: string; path: string }> {
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `geral/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage
    .from('comprovantes')
    .upload(path, file, { cacheControl: '3600', upsert: false })

  if (error) throw new Error(`Erro no upload do comprovante: ${error.message}`)

  const { data } = supabase.storage.from('comprovantes').getPublicUrl(path)
  return { url: data.publicUrl, path }
}

export async function removeComprovante(path: string): Promise<void> {
  await supabase.storage.from('comprovantes').remove([path])
}

// ─── erros ───────────────────────────────────────────────────────────────────
//  23505 = unique_violation · 23503 = foreign_key · P0001 = raise do RPC
function mapBancoError(error: { code?: string; message?: string }): string {
  if (error.code === '23505') return 'Já existe um registro com esse nome.'
  if (error.code === '23503')
    return 'Registro vinculado a outro item e não pode ser excluído.'
  if (error.code === '23514')
    return 'Algum valor informado é inválido (verifique tipo, status ou valor).'
  if (error.code === 'P0001' && error.message) return error.message
  if (error.message?.includes('bancos_contas_saldo') || error.message?.includes('bancos_'))
    return 'Tabelas do módulo Bancos não encontradas. Aplique a migration 0004_bancos.sql no Supabase.'
  return error.message || 'Não foi possível concluir a operação.'
}
