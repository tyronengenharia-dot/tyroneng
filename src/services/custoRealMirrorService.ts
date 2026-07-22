import { supabase } from '@/lib/supabaseClient'
import {
  getCategoriasByObra,
  getItensByObra,
  createCategoria,
  createItem,
} from '@/services/planilhaService'
import { PlanilhaCategoria, PlanilhaItem } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// Espelha o CUSTO PLANEJADO no CUSTO REAL: copia categorias e serviços do plano
// para a planilha de Custo Real, vinculando cada item à sua origem
// (origem_custo_cat_id / origem_custo_item_id) — o MESMO padrão que o BDI usa
// para gerar a Venda a partir do Custo (ver bdiService.aplicarBdiNaVenda).
//
// Com isso, cada serviço do plano ganha um item correspondente no Custo Real, e
// a compra de um serviço (rota "obra" da mig 0012) pode pousar como pagamento
// naquele item. Só CRIA o que falta e NUNCA sobrescreve valores já lançados.
//
// Respeita exclusões: `obras.custo_real_espelho` (mig 0016) registra os itens do
// plano já espelhados; reexecutar NÃO ressuscita o que você apagou de propósito
// no Custo Real — só traz serviços realmente novos do plano.
//
// Exige o Custo Real liberado (Custo Planejado aprovado).
// ─────────────────────────────────────────────────────────────────────────────

export type EspelharResultado = {
  error: string | null
  categorias: number
  itens: number
  jaExistiam: number
  /** itens do plano pulados porque já foram espelhados e você os apagou depois */
  puladosApagados: number
}

// Ids do plano já espelhados (persistidos em obras.custo_real_espelho). Se a
// coluna ainda não existe (0016 não aplicada), `disponivel=false` e o registro
// é ignorado (comportamento antigo: sem proteção contra ressurreição).
async function getEspelhoRegistro(
  obra_id: string,
): Promise<{ set: Set<string>; disponivel: boolean }> {
  const { data, error } = await supabase
    .from('obras')
    .select('custo_real_espelho')
    .eq('id', obra_id)
    .single()

  if (error) return { set: new Set(), disponivel: false }
  const raw = (data as { custo_real_espelho?: unknown } | null)?.custo_real_espelho
  const list = Array.isArray(raw) ? raw.filter((x): x is string => typeof x === 'string') : []
  return { set: new Set(list), disponivel: true }
}

export async function espelharPlanejadoNoCustoReal(
  obra_id: string,
): Promise<EspelharResultado> {
  const [planCats, planItens, realCats, realItens, registro] = await Promise.all([
    getCategoriasByObra(obra_id, 'custo_planejado'),
    getItensByObra(obra_id, 'custo_planejado'),
    getCategoriasByObra(obra_id, 'custo_real'),
    getItensByObra(obra_id, 'custo_real'),
    getEspelhoRegistro(obra_id),
  ])

  if (planCats.length === 0 && planItens.length === 0) {
    return { error: 'Custo Planejado vazio — monte o plano antes de espelhar.', categorias: 0, itens: 0, jaExistiam: 0, puladosApagados: 0 }
  }

  // Vínculos já presentes no Custo Real (por origem) + registro de espelhados.
  const realCatByPlan = new Map<string, PlanilhaCategoria>()
  for (const rc of realCats) if (rc.origem_custo_cat_id) realCatByPlan.set(rc.origem_custo_cat_id, rc)
  const realItemByPlan = new Map<string, PlanilhaItem>()
  for (const ri of realItens) if (ri.origem_custo_item_id) realItemByPlan.set(ri.origem_custo_item_id, ri)
  const jaEspelhado = registro.set

  // Contagem (independente da criação).
  let jaExistiam = 0
  let puladosApagados = 0
  for (const pIt of planItens) {
    if (realItemByPlan.has(pIt.id)) jaExistiam++
    else if (jaEspelhado.has(pIt.id)) puladosApagados++
  }

  let maxOrdemCat = realCats.reduce((m, c) => Math.max(m, c.ordem), 0)
  let categorias = 0
  let itens = 0
  const novosEspelhados: string[] = []

  for (const pCat of planCats) {
    // Só cria de verdade: itens do plano ainda sem item real E nunca espelhados.
    const aCriar = planItens.filter(
      i => i.categoria_id === pCat.id && !realItemByPlan.has(i.id) && !jaEspelhado.has(i.id),
    )
    if (aCriar.length === 0) continue

    let rCat = realCatByPlan.get(pCat.id)
    if (!rCat) {
      const nova = await createCategoria({
        obra_id, tipo: 'custo_real', nome: pCat.nome, ordem: ++maxOrdemCat, origem_custo_cat_id: pCat.id,
      })
      if (!nova) {
        return { error: 'Não foi possível escrever no Custo Real. Aprove o Custo Planejado para liberá-lo.', categorias, itens, jaExistiam, puladosApagados }
      }
      rCat = nova
      realCatByPlan.set(pCat.id, rCat)
      categorias++
    }

    let ordemBase = realItens.filter(ri => ri.categoria_id === rCat!.id).length
    for (const pIt of aCriar) {
      const novo = await createItem({
        categoria_id:         rCat!.id,
        obra_id,
        tipo:                 'custo_real',
        codigo:               pIt.codigo,
        descricao:            pIt.descricao,
        // Baseline = valores do plano; os pagamentos registram o gasto real.
        quantidade:           pIt.quantidade,
        unidade:              pIt.unidade,
        valor_unitario:       pIt.valor_unitario,
        ordem:                ++ordemBase,
        origem:               pIt.origem ?? null,
        servico_id:           pIt.servico_id ?? null,
        referencia_item_id:   pIt.referencia_item_id ?? null,
        origem_custo_item_id: pIt.id,
      })
      if (!novo) {
        return { error: 'Não foi possível escrever no Custo Real. Aprove o Custo Planejado para liberá-lo.', categorias, itens, jaExistiam, puladosApagados }
      }
      novosEspelhados.push(pIt.id)
      itens++
    }
  }

  // Atualiza o registro: tudo que tem item real hoje + os recém-criados + o que
  // já constava. (Absorve espelhamentos feitos antes da mig 0016.)
  if (registro.disponivel) {
    const setFinal = new Set<string>(jaEspelhado)
    for (const pIt of planItens) if (realItemByPlan.has(pIt.id)) setFinal.add(pIt.id)
    for (const id of novosEspelhados) setFinal.add(id)
    await supabase.from('obras').update({ custo_real_espelho: [...setFinal] }).eq('id', obra_id)
  }

  return { error: null, categorias, itens, jaExistiam, puladosApagados }
}
