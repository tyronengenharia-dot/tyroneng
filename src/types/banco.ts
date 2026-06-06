// ─── BANCOS (tesouraria: centrais de conta + movimentações) ──────────────────
// Cada "central de conta" é uma conta da empresa (banco, caixa, aplicação...).
// As movimentações registram entradas/saídas; transferências entre contas
// criam duas pernas ligadas por `transferencia_id` (ver RPC transferir_entre_contas).

export type ContaTipo =
  | 'corrente'
  | 'poupanca'
  | 'caixa'
  | 'aplicacao'
  | 'cartao'
  | 'investimento'

export type BancoConta = {
  id: string
  nome: string
  tipo: ContaTipo
  banco?: string | null
  agencia?: string | null
  numero_conta?: string | null
  titular?: string | null
  saldo_inicial: number
  cor: string
  ativo: boolean
  observacoes?: string | null
  created_at?: string
  updated_at?: string
}

// Linha da view `bancos_contas_saldo` (conta + saldos calculados).
export type ContaComSaldo = BancoConta & {
  saldo_atual: number
  saldo_previsto: number
  qtd_previstos: number
  qtd_realizados: number
}

export type MovTipo = 'entrada' | 'saida'

// previsto = agendado/futuro · pago = realizado · conciliado = batido com extrato
export type MovStatus = 'previsto' | 'pago' | 'conciliado'

export type FormaPagamento =
  | 'pix'
  | 'ted'
  | 'doc'
  | 'dinheiro'
  | 'boleto'
  | 'cartao'
  | 'cheque'
  | 'transferencia'
  | 'outro'

export type CategoriaTipo = 'entrada' | 'saida' | 'ambos'

export type BancoCategoria = {
  id: string
  nome: string
  tipo: CategoriaTipo
  cor: string
  created_at?: string
}

export type BancoMovimentacao = {
  id: string
  conta_id: string
  tipo: MovTipo
  data: string
  valor: number
  descricao: string
  categoria_id?: string | null
  obra_id?: string | null
  beneficiario?: string | null
  forma_pagamento?: FormaPagamento | null
  documento?: string | null
  status: MovStatus
  data_conciliacao?: string | null
  transferencia_id?: string | null
  anexo_url?: string | null
  observacoes?: string | null
  created_at?: string
  updated_at?: string
}

// Movimentação com os relacionamentos resolvidos (joins do PostgREST) para a tabela.
export type MovimentacaoComRelacoes = BancoMovimentacao & {
  conta?: { id: string; nome: string; cor: string } | null
  categoria?: { id: string; nome: string; cor: string } | null
  obra?: { id: string; name: string } | null
}
