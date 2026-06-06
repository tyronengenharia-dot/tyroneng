import { Insumo } from './insumo'

// ─── SERVIÇOS (catálogo global da empresa) ───────────────────────────────────
// Composições. Código único. O preço NÃO é digitado: é derivado dos insumos
// que compõem o serviço (Regra 3 + view servicos_custo).

export type Servico = {
  id: string
  codigo: string
  descricao: string
  unidade: string
  ativo: boolean
  created_at?: string
  updated_at?: string
}

// Serviço + custo unitário derivado (vindo da view servicos_custo).
export type ServicoComCusto = Servico & {
  custo_unitario: number
}

// Linha da composição (servico_insumos), com o insumo embutido para exibição.
export type ComposicaoItem = {
  id?: string
  insumo_id: string
  coeficiente: number
  insumo?: Insumo
}
