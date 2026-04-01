export type StatusSolicitacao =
  | 'pendente'
  | 'em_cotacao'
  | 'aprovada'
  | 'recusada'

export interface SolicitacaoCompra {
  id: string
  obra_id: string
  solicitante: string
  categoria: string
  descricao: string
  quantidade: number
  urgencia: 'baixa' | 'media' | 'alta' | 'critica'
  data_necessaria: string
  status: StatusSolicitacao
  created_at: string
}

export interface CotacaoFornecedor {
  id: string
  solicitacao_id: string
  fornecedor: string
  cnpj: string
  valor: number
  prazo_dias: number
  condicoes: string
  anexo_url?: string
}

export interface PedidoCompra {
  id: string
  solicitacao_id: string
  fornecedor: string
  valor_final: number
  forma_pagamento: string
  aprovado_por: string
  created_at: string
}

export interface Entrega {
  id: string
  pedido_id: string
  data_prevista: string
  data_real?: string
  status: 'aguardando' | 'transporte' | 'entregue' | 'atrasado'
}

export interface AuditoriaLog {
  id: string
  acao: string
  usuario: string
  data: string
  referencia_id: string
}