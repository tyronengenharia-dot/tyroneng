import { InsumoTipo } from '@/types/insumo'
import { Etapa } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// Lista de Compras da obra — núcleo de cálculo (funções puras, sem I/O).
//
// A base é o CUSTO PLANEJADO da obra (planeja-se primeiro o que comprar; o gasto
// efetivo alimenta o Custo Real depois). A planilha é composta por SERVIÇOS. Cada
// serviço é uma composição de insumos (material / mão de obra / equipamento) com um
// coeficiente de consumo por unidade do serviço (servico_insumos.coeficiente).
// A "lista de compras" nasce de explodir cada serviço nos seus insumos:
//
//     qtd do insumo = qtd do serviço (planilha) × coeficiente
//     custo         = qtd do insumo × valor_unitário do insumo
//
// Somando o mesmo insumo entre todos os serviços, temos a lista consolidada da
// obra. Agrupando os serviços por etapa do cronograma, temos a lista por data.
// ─────────────────────────────────────────────────────────────────────────────

export const TIPOS: InsumoTipo[] = ['material', 'mao_de_obra', 'equipamento']

export const TIPO_LABEL: Record<InsumoTipo, string> = {
  material: 'Materiais',
  mao_de_obra: 'Mão de obra',
  equipamento: 'Equipamentos',
}

/** Um insumo do catálogo com a quantidade a comprar já calculada. */
export type LinhaInsumo = {
  insumo_id: string
  codigo: string
  descricao: string
  tipo: InsumoTipo
  unidade: string
  valor_unitario: number
  quantidade: number
  total: number
}

/** Uma linha da composição de um serviço (coeficiente + insumo do catálogo). */
export type ComposicaoLinha = {
  coeficiente: number
  insumo: {
    id: string
    codigo: string
    descricao: string
    tipo: InsumoTipo
    unidade: string
    valor_unitario: number
  }
}

/** Um item de serviço da planilha (o mínimo que a explosão precisa). */
export type ItemServico = {
  id: string
  categoria_id: string
  codigo: string
  descricao: string
  unidade: string
  quantidade: number
  servico_id: string
  etapa_id: string | null
}

/** Um serviço da planilha já explodido nos seus insumos. */
export type ServicoExplodido = {
  item_id: string
  categoria_id: string
  codigo: string
  descricao: string
  unidade: string
  quantidade: number
  etapa_id: string | null
  insumos: LinhaInsumo[]
  total: number
}

/** Item da planilha que não é serviço (SINAPI / EMOP / texto livre) — não tem
 *  composição para explodir, então entra numa lista à parte. */
export type ItemSemComposicao = {
  item_id: string
  codigo: string
  descricao: string
  unidade: string
  quantidade: number
  valor_unitario: number
  total: number
  origem: string
}

/** Um grupo do cronograma: os serviços de uma etapa + insumos consolidados. */
export type GrupoEtapa = {
  etapa: Etapa | null // null = serviços sem etapa vinculada
  comprarAte: string | null // 'YYYY-MM-DD' — data_inicio − lead (null se sem etapa)
  servicos: ServicoExplodido[]
  insumos: LinhaInsumo[] // consolidado dos serviços do grupo
  total: number
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

// ── Explosão ─────────────────────────────────────────────────────────────────

/** Explode um único item de serviço nos seus insumos usando a composição. */
export function explodirServico(
  item: ItemServico,
  composicao: ComposicaoLinha[],
): ServicoExplodido {
  const insumos: LinhaInsumo[] = composicao.map(c => {
    const quantidade = round2((item.quantidade || 0) * (c.coeficiente || 0))
    const total = round2(quantidade * (c.insumo.valor_unitario || 0))
    return {
      insumo_id: c.insumo.id,
      codigo: c.insumo.codigo,
      descricao: c.insumo.descricao,
      tipo: c.insumo.tipo,
      unidade: c.insumo.unidade,
      valor_unitario: c.insumo.valor_unitario || 0,
      quantidade,
      total,
    }
  })
  return {
    item_id: item.id,
    categoria_id: item.categoria_id,
    codigo: item.codigo,
    descricao: item.descricao,
    unidade: item.unidade,
    quantidade: item.quantidade || 0,
    etapa_id: item.etapa_id ?? null,
    insumos,
    total: round2(insumos.reduce((s, i) => s + i.total, 0)),
  }
}

/** Explode todos os itens de serviço. `composicoes` é indexado por servico_id. */
export function explodirTodos(
  itens: ItemServico[],
  composicoes: Map<string, ComposicaoLinha[]>,
): ServicoExplodido[] {
  return itens.map(it => explodirServico(it, composicoes.get(it.servico_id) ?? []))
}

// ── Consolidação ─────────────────────────────────────────────────────────────

/** Soma o mesmo insumo entre vários serviços numa única linha de compra. */
export function consolidarInsumos(servicos: ServicoExplodido[]): LinhaInsumo[] {
  const mapa = new Map<string, LinhaInsumo>()
  for (const s of servicos) {
    for (const i of s.insumos) {
      const atual = mapa.get(i.insumo_id)
      if (atual) {
        atual.quantidade = round2(atual.quantidade + i.quantidade)
        atual.total = round2(atual.total + i.total)
      } else {
        mapa.set(i.insumo_id, { ...i })
      }
    }
  }
  return [...mapa.values()].sort(
    (a, b) => a.descricao.localeCompare(b.descricao, 'pt-BR'),
  )
}

/** Particiona insumos consolidados por tipo (material / MO / equipamento). */
export function agruparPorTipo(
  insumos: LinhaInsumo[],
): { tipo: InsumoTipo; insumos: LinhaInsumo[]; total: number }[] {
  return TIPOS.map(tipo => {
    const doTipo = insumos.filter(i => i.tipo === tipo)
    return { tipo, insumos: doTipo, total: round2(doTipo.reduce((s, i) => s + i.total, 0)) }
  }).filter(g => g.insumos.length > 0)
}

/** Total por tipo (para KPIs), sempre com as três chaves presentes. */
export function totaisPorTipo(insumos: LinhaInsumo[]): Record<InsumoTipo, number> {
  const base: Record<InsumoTipo, number> = { material: 0, mao_de_obra: 0, equipamento: 0 }
  for (const i of insumos) base[i.tipo] = round2(base[i.tipo] + i.total)
  return base
}

// ── Agrupamento por cronograma ───────────────────────────────────────────────

/** 'YYYY-MM-DD' − n dias → 'YYYY-MM-DD' (aritmética em data local, sem fuso). */
export function subtrairDias(dataISO: string, dias: number): string {
  if (!dataISO) return dataISO
  const [y, m, d] = dataISO.split('-').map(Number)
  if (!y || !m || !d) return dataISO
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() - (dias || 0))
  const yy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

/**
 * Agrupa os serviços por etapa do cronograma, ordenando pela data de início.
 * Cada grupo traz os insumos consolidados e a data "comprar até"
 * (= data_inicio da etapa − leadDias). Serviços sem etapa vão para um grupo
 * final (etapa = null), que aparece só se houver algum.
 */
export function agruparPorCronograma(
  servicos: ServicoExplodido[],
  etapas: Etapa[],
  leadDias: number,
): GrupoEtapa[] {
  const porEtapa = new Map<string, Etapa>(etapas.map(e => [e.id, e]))
  const buckets = new Map<string, ServicoExplodido[]>()
  const semEtapa: ServicoExplodido[] = []

  for (const s of servicos) {
    if (s.etapa_id && porEtapa.has(s.etapa_id)) {
      const arr = buckets.get(s.etapa_id) ?? []
      arr.push(s)
      buckets.set(s.etapa_id, arr)
    } else {
      semEtapa.push(s)
    }
  }

  const grupos: GrupoEtapa[] = [...buckets.entries()].map(([etapaId, servs]) => {
    const etapa = porEtapa.get(etapaId)!
    const insumos = consolidarInsumos(servs)
    return {
      etapa,
      comprarAte: etapa.data_inicio ? subtrairDias(etapa.data_inicio, leadDias) : null,
      servicos: servs,
      insumos,
      total: round2(insumos.reduce((s, i) => s + i.total, 0)),
    }
  })

  grupos.sort((a, b) => {
    const da = a.etapa?.data_inicio ?? ''
    const db = b.etapa?.data_inicio ?? ''
    if (da && db) return da.localeCompare(db)
    return (a.etapa?.ordem ?? 0) - (b.etapa?.ordem ?? 0)
  })

  if (semEtapa.length > 0) {
    const insumos = consolidarInsumos(semEtapa)
    grupos.push({
      etapa: null,
      comprarAte: null,
      servicos: semEtapa,
      insumos,
      total: round2(insumos.reduce((s, i) => s + i.total, 0)),
    })
  }

  return grupos
}
