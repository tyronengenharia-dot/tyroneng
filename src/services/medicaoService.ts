import { supabase } from '@/lib/supabaseClient'
import { Medicao, MedicaoBoletim, MedicaoItem, PlanilhaItem } from '@/types'
import { getCategoriasByObra, getItensByObra } from '@/services/planilhaService'
import { getPlanilhasStatus } from '@/services/planilhaEstadoService'

export async function getMedicoesByObra(obra_id: string): Promise<Medicao[]> {
  const { data, error } = await supabase
    .from('medicoes')
    .select('*')
    .eq('obra_id', obra_id)
    .order('date', { ascending: false })

  if (error) {
    console.error('getMedicoesByObra error:', error)
    return []
  }
  return data ?? []
}

export async function createMedicao(
  payload: Omit<Medicao, 'id' | 'created_at'>
): Promise<Medicao | null> {
  const { data, error } = await supabase
    .from('medicoes')
    .insert(payload)
    .select()
    .single()

  if (error) {
    console.error('createMedicao error:', error)
    return null
  }
  return data
}

export async function updateMedicao(
  id: string,
  payload: Partial<Omit<Medicao, 'id' | 'created_at'>>
): Promise<Medicao | null> {
  const { data, error } = await supabase
    .from('medicoes')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('updateMedicao error:', error)
    return null
  }
  return data
}

export async function deleteMedicao(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('medicoes')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('deleteMedicao error:', error)
    return false
  }
  return true
}

// =============================================================================
// MEDIÇÃO VINCULADA À VENDA — Boletins de Medição (tabelas medicao_boletins /
// medicao_itens). Mede o CONTRATO (Venda + aditivos fechados) item a item.
// Se a migration 0003 ainda não foi aplicada, as leituras retornam vazio
// (modo degradado) e a emissão devolve um erro amigável.
// =============================================================================

// ── Tipos derivados (visão de contrato + agregação) ──────────────────────────

export type ContratoCategoria = { id: string; nome: string; itens: PlanilhaItem[] }
export type ContratoBloco = {
  planilha_id: string
  tipo: 'venda' | 'aditivo'
  label: string
  categorias: ContratoCategoria[]
}
export type ContratoMedicao = { vendaFechada: boolean; blocos: ContratoBloco[] }
/** Acumulado medido por item: planilha_item_id → { qtd, valor } */
export type MedidoPorItem = Record<string, { qtd: number; valor: number }>

// ── Boletins (cabeçalho) ─────────────────────────────────────────────────────

export async function getBoletins(obra_id: string): Promise<MedicaoBoletim[]> {
  const { data, error } = await supabase
    .from('medicao_boletins')
    .select('*')
    .eq('obra_id', obra_id)
    .order('numero', { ascending: true })

  if (error) {
    console.warn('getBoletins (migration 0003 aplicada?):', error.message)
    return []
  }
  return (data ?? []) as MedicaoBoletim[]
}

/** Boletins da obra já com o valor total medido em cada um. */
export async function getBoletinsComTotais(
  obra_id: string
): Promise<(MedicaoBoletim & { valor: number })[]> {
  const boletins = await getBoletins(obra_id)
  if (boletins.length === 0) return []

  const ids = boletins.map(b => b.id)
  const { data, error } = await supabase
    .from('medicao_itens')
    .select('boletim_id, quantidade, valor_unitario')
    .in('boletim_id', ids)

  const totals: Record<string, number> = {}
  if (!error && data)
    for (const r of data)
      totals[r.boletim_id] = (totals[r.boletim_id] ?? 0) + Number(r.quantidade) * Number(r.valor_unitario)

  return boletins.map(b => ({ ...b, valor: totals[b.id] ?? 0 }))
}

/** Emite um boletim (RPC) — só funciona com a Venda 'fechada'. Devolve o id. */
export async function criarBoletim(
  obra_id: string,
  periodo: string | null,
  data_medicao: string
): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await supabase.rpc('criar_boletim_medicao', {
    p_obra_id: obra_id,
    p_periodo: periodo,
    p_data: data_medicao,
  })
  return { id: (data as string) ?? null, error: error?.message ?? null }
}

export async function updateBoletim(
  id: string,
  payload: Partial<Omit<MedicaoBoletim, 'id' | 'obra_id' | 'numero' | 'created_at'>>
): Promise<boolean> {
  const { error } = await supabase.from('medicao_boletins').update(payload).eq('id', id)
  if (error) { console.error('updateBoletim error:', error); return false }
  return true
}

export async function deleteBoletim(id: string): Promise<boolean> {
  const { error } = await supabase.from('medicao_boletins').delete().eq('id', id)
  if (error) { console.error('deleteBoletim error:', error); return false }
  return true
}

// ── Comprovante (foto) no bucket "comprovantes" ──────────────────────────────

export async function uploadComprovante(
  file: File,
  obraId: string,
): Promise<{ url: string; path: string }> {
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${obraId}/med-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

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

// ── Itens de um boletim ──────────────────────────────────────────────────────

export async function getMedicaoItens(boletim_id: string): Promise<MedicaoItem[]> {
  const { data, error } = await supabase
    .from('medicao_itens')
    .select('*')
    .eq('boletim_id', boletim_id)

  if (error) { console.error('getMedicaoItens error:', error); return [] }
  return (data ?? []) as MedicaoItem[]
}

/**
 * Substitui as linhas do boletim (delete + insert das quantidades > 0).
 * Não é atômico, mas é aceitável: um boletim é editado por um usuário de cada vez.
 */
export async function salvarMedicaoItens(
  boletim_id: string,
  linhas: { planilha_item_id: string; quantidade: number; valor_unitario: number }[]
): Promise<boolean> {
  const { error: delErr } = await supabase.from('medicao_itens').delete().eq('boletim_id', boletim_id)
  if (delErr) { console.error('salvarMedicaoItens delete error:', delErr); return false }

  const payload = linhas
    .filter(l => l.quantidade > 0)
    .map(l => ({ boletim_id, ...l }))
  if (payload.length === 0) return true

  const { error: insErr } = await supabase.from('medicao_itens').insert(payload)
  if (insErr) { console.error('salvarMedicaoItens insert error:', insErr); return false }
  return true
}

// ── Contrato (Venda + aditivos fechados) ─────────────────────────────────────

export async function getContratoMedicao(obra_id: string): Promise<ContratoMedicao> {
  const headers = await getPlanilhasStatus(obra_id)
  const venda = headers.find(h => h.tipo === 'venda')
  const aditivos = headers
    .filter(h => h.tipo === 'aditivo' && h.status === 'fechada')
    .sort((a, b) => (a.aditivo_numero ?? 0) - (b.aditivo_numero ?? 0))

  const blocos: ContratoBloco[] = []

  // Venda — sempre que houver itens/categorias (resiliente a header ausente).
  const [vCats, vItens] = await Promise.all([
    getCategoriasByObra(obra_id, 'venda'),
    getItensByObra(obra_id, 'venda'),
  ])
  if (venda || vCats.length > 0) {
    blocos.push({
      planilha_id: venda?.id ?? `venda-${obra_id}`,
      tipo: 'venda',
      label: 'Planilha de Venda',
      categorias: vCats.map(c => ({
        id: c.id, nome: c.nome, itens: vItens.filter(i => i.categoria_id === c.id),
      })),
    })
  }

  // Aditivos fechados
  for (const ad of aditivos) {
    const [cats, itens] = await Promise.all([
      getCategoriasByObra(obra_id, 'aditivo', ad.id),
      getItensByObra(obra_id, 'aditivo', ad.id),
    ])
    blocos.push({
      planilha_id: ad.id,
      tipo: 'aditivo',
      label: `Aditivo Nº ${ad.aditivo_numero}`,
      categorias: cats.map(c => ({
        id: c.id, nome: c.nome, itens: itens.filter(i => i.categoria_id === c.id),
      })),
    })
  }

  return { vendaFechada: venda?.status === 'fechada', blocos }
}

// ── Agregação medido por item ────────────────────────────────────────────────

/**
 * Soma o medido por item em todos os boletins da obra.
 * `excludeBoletimId` permite calcular o "acumulado anterior" ao editar um BM.
 */
export async function getMedidoPorItem(
  obra_id: string,
  excludeBoletimId?: string
): Promise<MedidoPorItem> {
  const boletins = await getBoletins(obra_id)
  const ids = boletins.map(b => b.id).filter(id => id !== excludeBoletimId)
  if (ids.length === 0) return {}

  const { data, error } = await supabase
    .from('medicao_itens')
    .select('planilha_item_id, quantidade, valor_unitario')
    .in('boletim_id', ids)

  if (error || !data) { if (error) console.error('getMedidoPorItem error:', error); return {} }

  const map: MedidoPorItem = {}
  for (const r of data) {
    const cur = map[r.planilha_item_id] ?? { qtd: 0, valor: 0 }
    cur.qtd += Number(r.quantidade)
    cur.valor += Number(r.quantidade) * Number(r.valor_unitario)
    map[r.planilha_item_id] = cur
  }
  return map
}

// ── Resumo (para Dashboard / cards) ──────────────────────────────────────────

export type MedicaoResumo = {
  totalContratado: number
  totalMedido: number
  saldo: number
  pct: number
  nBoletins: number
}

export async function getMedicaoResumo(obra_id: string): Promise<MedicaoResumo> {
  const [contrato, medido, boletins] = await Promise.all([
    getContratoMedicao(obra_id),
    getMedidoPorItem(obra_id),
    getBoletins(obra_id),
  ])

  let totalContratado = 0
  let totalMedido = 0
  for (const b of contrato.blocos)
    for (const c of b.categorias)
      for (const it of c.itens) {
        totalContratado += it.quantidade * it.valor_unitario
        totalMedido += medido[it.id]?.valor ?? 0
      }

  const saldo = totalContratado - totalMedido
  const pct = totalContratado > 0 ? (totalMedido / totalContratado) * 100 : 0
  return { totalContratado, totalMedido, saldo, pct, nBoletins: boletins.length }
}
