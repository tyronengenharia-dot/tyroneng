import { supabase } from '@/lib/supabaseClient'
import { registrarLog } from '@/services/comprasService'
import { TIPO_LABEL } from '@/lib/listaCompras'
import { InsumoTipo } from '@/types/insumo'
import { UrgenciaSolicitacao } from '@/types/compras'

// ─────────────────────────────────────────────────────────────────────────────
// Ponte Lista de Compras → módulo de Compras. Transforma linhas de insumo
// (consolidadas ou de uma etapa) em solicitações de compra (uma por insumo).
//
// Destino = DEPÓSITO (estoque central): uma linha consolidada cobre vários
// serviços, então não pode ser lançada num único item de Custo Real sem duplicar
// custo. Ao confirmar a entrega, o trigger (mig 0011/0012) atualiza o preço do
// insumo e dá entrada no estoque físico via `insumo_id`. O custo de cada serviço
// segue no Custo Real, sem dupla contagem.
//
// Degrada com elegância: se as colunas de vínculo (insumo_id / entrega_tipo,
// mig 0011/0012) ainda não existem, cria a solicitação só com os campos base.
// ─────────────────────────────────────────────────────────────────────────────

export type SolicitacaoInsumoInput = {
  insumo_id: string
  tipo: InsumoTipo
  descricao: string
  unidade: string
  quantidade: number
}

function isMissingColumn(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  const msg = (error.message || '').toLowerCase()
  return (
    error.code === '42703' ||
    error.code === 'PGRST204' ||
    (msg.includes('column') &&
      (msg.includes('insumo_id') || msg.includes('entrega_tipo') || msg.includes('entrega_obra_id')))
  )
}

/** Estoque físico central (materiais) por insumo. Vazio se a integração de
 *  compras (mig 0011) ainda não estiver aplicada. */
export async function getEstoquePorInsumo(insumoIds: string[]): Promise<Map<string, number>> {
  const mapa = new Map<string, number>()
  const ids = [...new Set(insumoIds)].filter(Boolean)
  if (ids.length === 0) return mapa

  const { data, error } = await supabase
    .from('materiais')
    .select('insumo_id, quantidade')
    .in('insumo_id', ids)

  if (error) {
    // materiais/insumo_id podem não existir ainda — apenas não desconta estoque.
    return mapa
  }
  for (const r of (data ?? []) as { insumo_id: string | null; quantidade: number | null }[]) {
    if (!r.insumo_id) continue
    mapa.set(r.insumo_id, (mapa.get(r.insumo_id) ?? 0) + (Number(r.quantidade) || 0))
  }
  return mapa
}

export async function createSolicitacoesFromInsumos(opts: {
  obra_id: string
  obra_nome?: string
  solicitante: string
  urgencia: UrgenciaSolicitacao
  data_necessaria: string
  observacoes?: string
  insumos: SolicitacaoInsumoInput[]
}): Promise<{ criadas: number; degradado: boolean; error: string | null }> {
  if (opts.insumos.length === 0) return { criadas: 0, degradado: false, error: 'Nenhum insumo selecionado.' }

  const baseRows = opts.insumos.map(i => ({
    obra_id: opts.obra_id || null,
    obra_nome: opts.obra_nome ?? null,
    solicitante: opts.solicitante,
    categoria: TIPO_LABEL[i.tipo],
    descricao: i.descricao,
    unidade: i.unidade,
    quantidade: i.quantidade,
    urgencia: opts.urgencia,
    data_necessaria: opts.data_necessaria,
    status: 'pendente' as const,
    observacoes: opts.observacoes || null,
  }))

  // Camada completa: vínculo com o catálogo + destino depósito (fecha o ciclo
  // preço/estoque na entrega).
  const fullRows = baseRows.map((r, idx) => ({
    ...r,
    insumo_id: opts.insumos[idx].insumo_id,
    entrega_tipo: 'deposito' as const,
  }))

  let degradado = false
  let res = await supabase.from('solicitacoes_compra').insert(fullRows).select('id')
  if (res.error && isMissingColumn(res.error)) {
    degradado = true
    res = await supabase.from('solicitacoes_compra').insert(baseRows).select('id')
  }
  if (res.error) {
    console.error('createSolicitacoesFromInsumos error:', res.error)
    return { criadas: 0, degradado, error: 'Não foi possível criar as solicitações de compra.' }
  }

  const criadas = res.data?.length ?? opts.insumos.length
  // Log agregado (best-effort — não bloqueia o sucesso da geração).
  await registrarLog({
    acao: 'Solicitações geradas da Lista de Compras',
    descricao: `${criadas} item(ns) solicitado(s)${opts.obra_nome ? ` — ${opts.obra_nome}` : ''}`,
    usuario: opts.solicitante,
    referencia_id: opts.obra_id,
    referencia_tipo: 'solicitacao',
    data: '',
  })

  return { criadas, degradado, error: null }
}
