import { supabase } from '@/lib/supabaseClient'
import {
  Emprestimo,
  EmprestimoResumo,
  EmprestimoParcela,
  EmprestimoDocumento,
  EmprestimoGarantia,
  EmprestimoRateio,
  ParcelaCalculada,
  FormaPagamento,
} from '@/types/emprestimo'
import { gerarParcelas, recalcularParcelas } from '@/lib/emprestimoCalc'

export type EmprestimoPayload = Omit<
  Emprestimo,
  'id' | 'created_at' | 'updated_at'
>

type DbError = { code?: string; message?: string }

// ─── CONTRATOS ───────────────────────────────────────────────────────────────

export async function getEmprestimos(): Promise<EmprestimoResumo[]> {
  const { data, error } = await supabase
    .from('emprestimos_resumo')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getEmprestimos error:', error)
    return []
  }
  return (data as EmprestimoResumo[]) ?? []
}

export async function getEmprestimo(
  id: string
): Promise<EmprestimoResumo | null> {
  const { data, error } = await supabase
    .from('emprestimos_resumo')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('getEmprestimo error:', error)
    return null
  }
  return data as EmprestimoResumo
}

export async function createEmprestimo(
  payload: EmprestimoPayload
): Promise<{ data: Emprestimo | null; error: string | null }> {
  const { data, error } = await supabase
    .from('emprestimos')
    .insert(payload)
    .select()
    .single()

  if (error) return { data: null, error: mapError(error) }
  return { data, error: null }
}

export async function updateEmprestimo(
  id: string,
  payload: Partial<EmprestimoPayload>
): Promise<{ data: Emprestimo | null; error: string | null }> {
  const { data, error } = await supabase
    .from('emprestimos')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) return { data: null, error: mapError(error) }
  return { data, error: null }
}

export async function deleteEmprestimo(
  id: string
): Promise<{ error: string | null }> {
  // remove anexos do storage (best-effort) antes de apagar o contrato
  const paths: string[] = []
  const [{ data: docs }, { data: parcelas }] = await Promise.all([
    supabase.from('emprestimo_documentos').select('path').eq('emprestimo_id', id),
    supabase
      .from('emprestimo_parcelas')
      .select('comprovante_path')
      .eq('emprestimo_id', id),
  ])
  ;(docs ?? []).forEach(d => d.path && paths.push(d.path))
  ;(parcelas ?? []).forEach(
    p => p.comprovante_path && paths.push(p.comprovante_path)
  )
  if (paths.length) await supabase.storage.from('comprovantes').remove(paths)

  const { error } = await supabase.from('emprestimos').delete().eq('id', id)
  if (error) return { error: mapError(error) }
  return { error: null }
}

// ─── PARCELAS (faturas) ──────────────────────────────────────────────────────

export async function getParcelas(
  emprestimoId: string
): Promise<EmprestimoParcela[]> {
  const { data, error } = await supabase
    .from('emprestimo_parcelas')
    .select('*')
    .eq('emprestimo_id', emprestimoId)
    .order('numero', { ascending: true })

  if (error) {
    console.error('getParcelas error:', error)
    return []
  }
  return (data as EmprestimoParcela[]) ?? []
}

// Colunas persistíveis de uma parcela (sem metadados gerenciados pelo banco).
function parcelaRow(p: EmprestimoParcela) {
  return {
    id: p.id,
    emprestimo_id: p.emprestimo_id,
    numero: p.numero,
    competencia: p.competencia ?? null,
    vencimento: p.vencimento,
    saldo_inicial: p.saldo_inicial,
    valor_juros: p.valor_juros,
    valor_amortizacao: p.valor_amortizacao,
    valor_total: p.valor_total,
    saldo_final: p.saldo_final,
    valor_pago: p.valor_pago,
    valor_encargos: p.valor_encargos ?? 0,
    data_pagamento: p.data_pagamento ?? null,
    forma_pagamento: p.forma_pagamento ?? null,
    comprovante_url: p.comprovante_url ?? null,
    comprovante_path: p.comprovante_path ?? null,
    observacoes: p.observacoes ?? null,
  }
}

// Gera o cronograma a partir do contrato e substitui as parcelas existentes.
// Usado na criação e ao "regenerar" (apaga pagamentos — confirme antes).
export async function regenerarParcelas(
  contrato: Emprestimo
): Promise<{ error: string | null }> {
  const projetadas: ParcelaCalculada[] = gerarParcelas(contrato)

  const del = await supabase
    .from('emprestimo_parcelas')
    .delete()
    .eq('emprestimo_id', contrato.id)
  if (del.error) return { error: mapError(del.error) }

  if (projetadas.length === 0) return { error: null }

  const rows = projetadas.map(p => ({
    emprestimo_id: contrato.id,
    numero: p.numero,
    competencia: p.competencia,
    vencimento: p.vencimento,
    saldo_inicial: p.saldo_inicial,
    valor_juros: p.valor_juros,
    valor_amortizacao: p.valor_amortizacao,
    valor_total: p.valor_total,
    saldo_final: p.saldo_final,
    valor_pago: 0,
  }))

  const ins = await supabase.from('emprestimo_parcelas').insert(rows)
  if (ins.error) return { error: mapError(ins.error) }
  return { error: null }
}

export async function updateParcela(
  id: string,
  payload: Partial<EmprestimoParcela>
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('emprestimo_parcelas')
    .update(payload)
    .eq('id', id)
  if (error) return { error: mapError(error) }
  return { error: null }
}

// Recompõe o ledger (saldo devedor) de todo o contrato a partir dos pagamentos
// reais e persiste os campos financeiros recalculados. É o que faz a
// capitalização do "caso do tio" funcionar após um pagamento parcial/ausente.
export async function recalcularContrato(
  contrato: Emprestimo
): Promise<{ error: string | null }> {
  const parcelas = await getParcelas(contrato.id)
  if (parcelas.length === 0) return { error: null }

  const recalc = recalcularParcelas(contrato, parcelas)
  const rows = recalc.map(parcelaRow)

  const { error } = await supabase
    .from('emprestimo_parcelas')
    .upsert(rows, { onConflict: 'id' })
  if (error) return { error: mapError(error) }
  return { error: null }
}

// Registra (ou edita) o pagamento de uma parcela e recalcula o contrato.
export async function registrarPagamento(
  contrato: Emprestimo,
  parcelaId: string,
  dados: {
    valor_pago: number
    valor_encargos?: number
    data_pagamento: string | null
    forma_pagamento: FormaPagamento | null
    comprovante_url?: string | null
    comprovante_path?: string | null
    observacoes?: string | null
  }
): Promise<{ error: string | null }> {
  const upd = await updateParcela(parcelaId, dados)
  if (upd.error) return upd
  return recalcularContrato(contrato)
}

// ─── DOCUMENTOS ──────────────────────────────────────────────────────────────

export async function getDocumentos(
  emprestimoId: string
): Promise<EmprestimoDocumento[]> {
  const { data, error } = await supabase
    .from('emprestimo_documentos')
    .select('*')
    .eq('emprestimo_id', emprestimoId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getDocumentos error:', error)
    return []
  }
  return (data as EmprestimoDocumento[]) ?? []
}

export async function createDocumento(
  payload: Omit<EmprestimoDocumento, 'id' | 'created_at'>
): Promise<{ data: EmprestimoDocumento | null; error: string | null }> {
  const { data, error } = await supabase
    .from('emprestimo_documentos')
    .insert(payload)
    .select()
    .single()
  if (error) return { data: null, error: mapError(error) }
  return { data, error: null }
}

export async function deleteDocumento(
  id: string,
  path?: string | null
): Promise<{ error: string | null }> {
  if (path) await supabase.storage.from('comprovantes').remove([path])
  const { error } = await supabase
    .from('emprestimo_documentos')
    .delete()
    .eq('id', id)
  if (error) return { error: mapError(error) }
  return { error: null }
}

// ─── GARANTIAS (alienação / bens em garantia) ────────────────────────────────

export async function getGarantias(
  emprestimoId: string
): Promise<EmprestimoGarantia[]> {
  const { data, error } = await supabase
    .from('emprestimo_garantias')
    .select('*')
    .eq('emprestimo_id', emprestimoId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('getGarantias error:', error)
    return []
  }
  return (data as EmprestimoGarantia[]) ?? []
}

export async function createGarantia(
  payload: Omit<EmprestimoGarantia, 'id' | 'created_at' | 'updated_at'>
): Promise<{ data: EmprestimoGarantia | null; error: string | null }> {
  const { data, error } = await supabase
    .from('emprestimo_garantias')
    .insert(payload)
    .select()
    .single()
  if (error) return { data: null, error: mapError(error) }
  return { data, error: null }
}

export async function updateGarantia(
  id: string,
  payload: Partial<Omit<EmprestimoGarantia, 'id' | 'emprestimo_id' | 'created_at' | 'updated_at'>>
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('emprestimo_garantias')
    .update(payload)
    .eq('id', id)
  if (error) return { error: mapError(error) }
  return { error: null }
}

export async function deleteGarantia(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('emprestimo_garantias').delete().eq('id', id)
  if (error) return { error: mapError(error) }
  return { error: null }
}

// ─── RATEIO ENTRE OBRAS (destinos do empréstimo) ─────────────────────────────
// Requer a migration 0008. Sem ela, leituras voltam [] e gravações dão erro
// amigável. A fatia de cada obra vira entrada no Financeiro dela.

export async function getRateios(emprestimoId: string): Promise<EmprestimoRateio[]> {
  const { data, error } = await supabase
    .from('emprestimo_rateios')
    .select('*, obra:obras(id, name)')
    .eq('emprestimo_id', emprestimoId)
    .order('created_at', { ascending: true })
  if (error) {
    console.warn('getRateios (migration 0008 aplicada?):', error.message)
    return []
  }
  return (data as EmprestimoRateio[]) ?? []
}

// Rateios destinados a UMA obra (com o nome do empréstimo) — usado pelo Financeiro.
export async function getRateiosByObra(obra_id: string): Promise<EmprestimoRateio[]> {
  const { data, error } = await supabase
    .from('emprestimo_rateios')
    .select('*, emprestimo:emprestimos(descricao, categoria)')
    .eq('obra_id', obra_id)
    .order('data', { ascending: false, nullsFirst: false })
  if (error) {
    console.warn('getRateiosByObra (migration 0008 aplicada?):', error.message)
    return []
  }
  return (data as EmprestimoRateio[]) ?? []
}

export async function createRateio(
  payload: Omit<EmprestimoRateio, 'id' | 'created_at' | 'emprestimo' | 'obra'>
): Promise<{ data: EmprestimoRateio | null; error: string | null }> {
  const { data, error } = await supabase
    .from('emprestimo_rateios')
    .insert(payload)
    .select()
    .single()
  if (error) return { data: null, error: mapError(error) }
  return { data: data as EmprestimoRateio, error: null }
}

export async function updateRateio(
  id: string,
  payload: Partial<Omit<EmprestimoRateio, 'id' | 'created_at' | 'emprestimo_id' | 'emprestimo' | 'obra'>>
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('emprestimo_rateios').update(payload).eq('id', id)
  if (error) return { error: mapError(error) }
  return { error: null }
}

export async function deleteRateio(
  id: string,
  comprovantePath?: string | null
): Promise<{ error: string | null }> {
  if (comprovantePath) await supabase.storage.from('comprovantes').remove([comprovantePath])
  const { error } = await supabase.from('emprestimo_rateios').delete().eq('id', id)
  if (error) return { error: mapError(error) }
  return { error: null }
}

// ─── STORAGE (bucket "comprovantes", reaproveitado) ──────────────────────────

export async function uploadAnexo(
  file: File,
  emprestimoId: string
): Promise<{ url: string; path: string }> {
  const ext = file.name.split('.').pop() || 'pdf'
  const path = `emprestimos/${emprestimoId}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${ext}`

  const { error } = await supabase.storage
    .from('comprovantes')
    .upload(path, file, { cacheControl: '3600', upsert: false })

  if (error) throw new Error(`Erro no upload do anexo: ${error.message}`)

  const { data } = supabase.storage.from('comprovantes').getPublicUrl(path)
  return { url: data.publicUrl, path }
}

export async function removeAnexo(path: string): Promise<void> {
  await supabase.storage.from('comprovantes').remove([path])
}

// ─── erros ───────────────────────────────────────────────────────────────────
//  23505 = unique · 23503 = foreign_key · 23514 = check · P0001 = raise do RPC
function mapError(error: DbError): string {
  if (error.code === '23505') return 'Já existe um registro com esses dados.'
  if (error.code === '23503')
    return 'Registro vinculado a outro item e não pode ser excluído.'
  if (error.code === '23514')
    return 'Algum valor informado é inválido (verifique taxas, prazos ou valores).'
  if (error.code === 'P0001' && error.message) return error.message
  if (
    error.message?.includes('emprestimos_resumo') ||
    error.message?.includes('emprestimo') ||
    error.message?.includes('relation') ||
    error.code === '42P01'
  )
    return 'Tabelas do módulo Empréstimos não encontradas. Aplique a migration 0006_emprestimos.sql no Supabase.'
  return error.message || 'Não foi possível concluir a operação.'
}
