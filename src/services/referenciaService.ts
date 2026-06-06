import { supabase } from '@/lib/supabaseClient'
import {
  ReferenciaFonte,
  ReferenciaVersaoComContagem,
  ReferenciaItem,
} from '@/types/referencia'
import { LinhaReferencia } from '@/lib/parseReferencia'

export type VersaoMeta = {
  fonte: ReferenciaFonte
  ano: number
  mes: number
  uf?: string | null
  rotulo?: string | null
}

export async function getVersoes(): Promise<ReferenciaVersaoComContagem[]> {
  const { data, error } = await supabase
    .from('referencia_versoes')
    .select('*, referencia_itens(count)')
    .order('ano', { ascending: false })
    .order('mes', { ascending: false })

  if (error) {
    console.error('getVersoes error:', error)
    return []
  }

  return (data ?? []).map(v => ({
    ...v,
    total_itens: Array.isArray(v.referencia_itens) ? v.referencia_itens[0]?.count ?? 0 : 0,
  })) as ReferenciaVersaoComContagem[]
}

export async function getItens(versao_id: string): Promise<ReferenciaItem[]> {
  const { data, error } = await supabase
    .from('referencia_itens')
    .select('*')
    .eq('versao_id', versao_id)
    .order('codigo', { ascending: true })

  if (error) {
    console.error('getItens error:', error)
    return []
  }
  return data ?? []
}

export async function deleteVersao(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('referencia_versoes').delete().eq('id', id)
  if (error) return { error: error.message }
  return { error: null }
}

// Importa (ou re-importa) uma versão. Se já existir versão para a mesma
// fonte/ano/mês/uf/rótulo, SUBSTITUI seus itens. Inserção em lotes.
export async function importarVersao(
  meta: VersaoMeta,
  linhas: LinhaReferencia[]
): Promise<{ inseridos: number; error: string | null }> {
  const uf = meta.uf?.trim() || null
  const rotulo = meta.rotulo?.trim() || null

  // localiza versão existente (uf/rótulo podem ser nulos)
  let q = supabase
    .from('referencia_versoes')
    .select('id')
    .eq('fonte', meta.fonte)
    .eq('ano', meta.ano)
    .eq('mes', meta.mes)
  q = uf === null ? q.is('uf', null) : q.eq('uf', uf)
  q = rotulo === null ? q.is('rotulo', null) : q.eq('rotulo', rotulo)

  const { data: existente, error: findErr } = await q.maybeSingle()
  if (findErr) return { inseridos: 0, error: findErr.message }

  let versaoId = existente?.id as string | undefined

  if (!versaoId) {
    const { data: nova, error: insErr } = await supabase
      .from('referencia_versoes')
      .insert({ fonte: meta.fonte, ano: meta.ano, mes: meta.mes, uf, rotulo })
      .select('id')
      .single()
    if (insErr) return { inseridos: 0, error: insErr.message }
    versaoId = nova.id as string
  } else {
    const { error: delErr } = await supabase
      .from('referencia_itens')
      .delete()
      .eq('versao_id', versaoId)
    if (delErr) return { inseridos: 0, error: delErr.message }
  }

  // dedupe por código (último vence) — a tabela tem unique(versao_id, codigo)
  const unicos = Array.from(new Map(linhas.map(l => [l.codigo, l])).values())
  const rows = unicos.map(l => ({
    versao_id: versaoId,
    codigo: l.codigo,
    descricao: l.descricao,
    unidade: l.unidade,
    valor_unitario: l.valor_unitario,
  }))

  const LOTE = 500
  for (let i = 0; i < rows.length; i += LOTE) {
    const chunk = rows.slice(i, i + LOTE)
    const { error: chunkErr } = await supabase.from('referencia_itens').insert(chunk)
    if (chunkErr) return { inseridos: i, error: chunkErr.message }
  }

  return { inseridos: rows.length, error: null }
}
