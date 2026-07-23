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

// Serviço embutido como componente (subserviço) de outro serviço.
export type SubservicoRef = {
  id: string
  codigo: string
  descricao: string
  unidade: string
}

// Linha da composição (servico_insumos). Cada linha é UM insumo OU UM subserviço
// (mig 0017), com o objeto embutido para exibição.
export type ComposicaoItem = {
  id?: string
  coeficiente: number
  insumo_id?: string | null
  insumo?: Insumo | null
  subservico_id?: string | null
  subservico?: SubservicoRef | null
}
