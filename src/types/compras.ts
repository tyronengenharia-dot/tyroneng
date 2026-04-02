// ─── Status ────────────────────────────────────────────────────────────────

export type StatusSolicitacao =
  | 'pendente'
  | 'em_cotacao'
  | 'aprovada'
  | 'recusada'

export type UrgenciaSolicitacao = 'baixa' | 'media' | 'alta' | 'critica'

export type StatusEntrega = 'aguardando' | 'transporte' | 'entregue' | 'atrasado'

export type FormaPagamento =
  | 'a_vista'
  | '7_dias'
  | '14_dias'
  | '30_dias'
  | '60_dias'

// ─── Entidades principais ───────────────────────────────────────────────────

export interface SolicitacaoCompra {
  id: string
  obra_id: string
  obra_nome?: string
  solicitante: string
  categoria: string
  descricao: string
  unidade: string
  quantidade: number
  urgencia: UrgenciaSolicitacao
  data_necessaria: string
  status: StatusSolicitacao
  observacoes?: string
  created_at: string
  updated_at?: string
}

export interface CotacaoFornecedor {
  id: string
  solicitacao_id: string
  fornecedor_id?: string
  fornecedor: string
  cnpj: string
  contato?: string
  email?: string
  telefone?: string
  valor: number
  prazo_dias: number
  validade_dias?: number
  condicoes: string
  forma_pagamento?: FormaPagamento
  frete_incluso?: boolean
  anexo_url?: string
  selecionada?: boolean
  created_at?: string
}

export interface PedidoCompra {
  id: string
  solicitacao_id: string
  cotacao_id?: string
  fornecedor: string
  descricao_item: string
  quantidade: number
  unidade: string
  valor_unitario: number
  valor_final: number
  forma_pagamento: FormaPagamento
  aprovado_por: string
  data_aprovacao?: string
  observacoes?: string
  status: 'rascunho' | 'aprovado' | 'cancelado'
  created_at: string
}

export interface Entrega {
  id: string
  pedido_id: string
  pedido?: PedidoCompra
  fornecedor?: string
  descricao_item?: string
  data_prevista: string
  data_real?: string
  status: StatusEntrega
  responsavel_recebimento?: string
  nf_numero?: string
  nf_url?: string
  observacoes?: string
}

export interface Fornecedor {
  id: string
  nome: string               // Nome fantasia
  razao_social?: string      // Razão social completa
  cnpj?: string
  categoria?: string
  status?: string            // campo texto: 'Ativo', 'Inativo'...
  contato?: string           // Nome do responsável
  telefone?: string
  email?: string
  avaliacao?: number         // 1-5, null = não avaliado
  cidade?: string
  estado?: string
  observacoes?: string
  total_pedidos?: number
  percentual_pontualidade?: number
  ativo?: boolean
  created_at?: string
}

export interface AuditoriaLog {
  id: string
  acao: string
  descricao?: string
  usuario: string
  usuario_id?: string
  data: string
  referencia_id: string
  referencia_tipo?: 'solicitacao' | 'cotacao' | 'pedido' | 'entrega'
  metadata?: Record<string, unknown>
}

// ─── Métricas do dashboard ──────────────────────────────────────────────────

export interface MetricasCompras {
  total_comprado: number
  economia_cotacoes: number
  solicitacoes_pendentes: number
  entregas_atrasadas: number
  variacao_total_pct: number
  variacao_economia_pct: number
  solicitacoes_novas_semana: number
  entregas_atrasadas_variacao: number
}

export interface GastoMensal {
  mes: string
  valor: number
  orcamento: number
}

export interface GastoCategoria {
  categoria: string
  valor: number
  percentual: number
  cor: string
}

// ─── Filtros e queries ──────────────────────────────────────────────────────

export interface FiltroSolicitacoes {
  status?: StatusSolicitacao | 'todas'
  urgencia?: UrgenciaSolicitacao | 'todas'
  busca?: string
  obra_id?: string
  data_inicio?: string
  data_fim?: string
}

export interface FiltroCotacoes {
  solicitacao_id?: string
  busca?: string
}

export interface FiltroEntregas {
  status?: StatusEntrega | 'todas'
  busca?: string
}
