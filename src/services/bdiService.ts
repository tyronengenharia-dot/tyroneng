import { supabase } from '@/lib/supabaseClient'
import { BdiConfig, BDI_ZERO, bdiFator } from '@/lib/bdi'
import {
  getCategoriasByObra,
  getItensByObra,
  createCategoria,
  createItem,
  updateItem,
} from '@/services/planilhaService'
import { PlanilhaCategoria, PlanilhaItem } from '@/types'

// ── Config persistida por obra (tabela venda_bdi) ─────────────────────────────

export async function getBdiConfig(obra_id: string): Promise<BdiConfig> {
  const { data, error } = await supabase
    .from('venda_bdi')
    .select('administracao,lucro,impostos,risco,perdas,seguro_garantia,despesas_financeiras')
    .eq('obra_id', obra_id)
    .maybeSingle()

  if (error) {
    console.warn('getBdiConfig (migration aplicada?):', error.message)
    return { ...BDI_ZERO }
  }
  return data ? (data as BdiConfig) : { ...BDI_ZERO }
}

export async function upsertBdiConfig(
  obra_id: string,
  c: BdiConfig
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('venda_bdi')
    .upsert({ obra_id, ...c }, { onConflict: 'obra_id' })
  return { error: error?.message ?? null }
}

// ── Aplicar BDI na Venda (Custo × fator) — preservando ajustes manuais ─────────
// Itens da Venda vinculados ao Custo (origem_custo_item_id) têm só o valor
// unitário recalculado; itens novos do custo são criados; itens manuais da
// Venda (sem vínculo) NÃO são tocados.

export type AplicarBdiResultado = {
  error: string | null
  criados: number
  atualizados: number
  categorias: number
}

export async function aplicarBdiNaVenda(
  obra_id: string,
  config: BdiConfig
): Promise<AplicarBdiResultado> {
  const fator = bdiFator(config)
  if (!Number.isFinite(fator) || fator <= 0) {
    return { error: 'BDI inválido — verifique se os impostos são menores que 100%.', criados: 0, atualizados: 0, categorias: 0 }
  }
  const round4 = (v: number) => Math.round(v * 10000) / 10000

  const [custoCats, custoItens, vendaCats, vendaItens] = await Promise.all([
    getCategoriasByObra(obra_id, 'custo_planejado'),
    getItensByObra(obra_id, 'custo_planejado'),
    getCategoriasByObra(obra_id, 'venda'),
    getItensByObra(obra_id, 'venda'),
  ])

  if (custoCats.length === 0 && custoItens.length === 0) {
    return { error: 'Custo Planejado vazio — preencha o custo antes de aplicar o BDI.', criados: 0, atualizados: 0, categorias: 0 }
  }

  // Mapas de vínculo já existentes na Venda
  const vendaCatByCusto = new Map<string, PlanilhaCategoria>()
  for (const vc of vendaCats) {
    if (vc.origem_custo_cat_id) vendaCatByCusto.set(vc.origem_custo_cat_id, vc)
  }
  const vendaItemByCusto = new Map<string, PlanilhaItem>()
  for (const vi of vendaItens) {
    if (vi.origem_custo_item_id) vendaItemByCusto.set(vi.origem_custo_item_id, vi)
  }

  let maxOrdemCat = vendaCats.reduce((m, c) => Math.max(m, c.ordem), 0)
  let criados = 0
  let atualizados = 0
  let categorias = 0

  for (const cCat of custoCats) {
    // Resolve / cria a categoria de venda correspondente
    let vCat = vendaCatByCusto.get(cCat.id)
    if (!vCat) {
      const nova = await createCategoria({
        obra_id,
        tipo: 'venda',
        nome: cCat.nome,
        ordem: ++maxOrdemCat,
        origem_custo_cat_id: cCat.id,
      })
      if (!nova) {
        return { error: 'Erro ao criar categoria na Venda (planilha bloqueada?).', criados, atualizados, categorias }
      }
      vCat = nova
      vendaCatByCusto.set(cCat.id, vCat)
      categorias++
    }

    const itensDaCat = custoItens.filter(i => i.categoria_id === cCat.id)
    // ordem de partida p/ itens novos = quantos já existem nessa categoria de venda
    let ordemBase = vendaItens.filter(vi => vi.categoria_id === vCat!.id).length

    for (const cIt of itensDaCat) {
      const preco = round4(cIt.valor_unitario * fator)
      const existente = vendaItemByCusto.get(cIt.id)

      if (existente) {
        // Re-precifica só o valor unitário; mantém a quantidade ajustada na venda
        const upd = await updateItem(existente.id, { valor_unitario: preco })
        if (upd) atualizados++
      } else {
        const novo = await createItem({
          categoria_id:         vCat!.id,
          obra_id,
          tipo:                 'venda',
          codigo:               cIt.codigo,
          descricao:            cIt.descricao,
          quantidade:           cIt.quantidade,
          unidade:              cIt.unidade,
          valor_unitario:       preco,
          ordem:                ++ordemBase,
          origem:               cIt.origem ?? null,
          servico_id:           cIt.servico_id ?? null,
          referencia_item_id:   cIt.referencia_item_id ?? null,
          origem_custo_item_id: cIt.id,
        })
        if (novo) criados++
      }
    }
  }

  return { error: null, criados, atualizados, categorias }
}
