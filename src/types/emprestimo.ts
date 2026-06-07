// ─── EMPRÉSTIMOS & CONSÓRCIOS ────────────────────────────────────────────────
// Um "emprestimo" é o contrato. Pode ser um empréstimo (com regime de juros) ou
// um consórcio (carta de crédito + taxa de administração). As "parcelas" são as
// faturas mensais; os "documentos" são contrato/garantias/comprovantes anexados.

export type EmprestimoCategoria = 'emprestimo' | 'consorcio'

// Como os juros/parcelas são calculados:
//  juros_saldo = juros sobre o saldo devedor (o "empréstimo do tio"); se capitaliza,
//                o juros não pago entra no saldo e rende no mês seguinte.
//  price       = parcelas fixas (sistema francês / Tabela Price)
//  sac         = amortização constante (parcela decrescente)
//  sem_juros   = parcela = principal / nº (e base do consórcio)
export type EmprestimoRegime = 'juros_saldo' | 'price' | 'sac' | 'sem_juros'

export type EmprestimoStatus =
  | 'ativo'
  | 'quitado'
  | 'inadimplente'
  | 'cancelado'
  | 'contemplado'

export type FormaContemplacao = 'nao' | 'lance' | 'sorteio'

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

// Status derivado da parcela (NUNCA persistido — calculado de valor_pago/vencimento/hoje)
export type ParcelaStatus = 'paga' | 'parcial' | 'atrasada' | 'prevista'

export type Emprestimo = {
  id: string
  categoria: EmprestimoCategoria
  descricao: string
  credor?: string | null
  proposito?: string | null
  valor_principal: number
  data_inicio: string
  data_limite?: string | null
  dia_vencimento?: number | null
  status: EmprestimoStatus
  obra_id?: string | null

  // empréstimo
  regime: EmprestimoRegime
  taxa_juros_mensal: number
  capitaliza: boolean
  num_parcelas?: number | null

  // consórcio
  taxa_admin_pct?: number | null
  fundo_reserva_pct?: number | null
  contemplado: boolean
  data_contemplacao?: string | null
  forma_contemplacao: FormaContemplacao
  valor_lance?: number | null

  cor: string
  observacoes?: string | null
  created_at?: string
  updated_at?: string
}

// Linha da view `emprestimos_resumo` (contrato + agregados calculados).
export type EmprestimoResumo = Emprestimo & {
  qtd_parcelas: number
  qtd_pagas: number
  total_contratado: number
  total_pago: number
  total_juros: number
  saldo_devedor: number
  valor_em_atraso: number
  qtd_atrasadas: number
  proxima_parcela: string | null
  // join opcional com obra
  obra?: { id: string; name: string } | null
}

export type EmprestimoParcela = {
  id: string
  emprestimo_id: string
  numero: number
  competencia?: string | null
  vencimento: string
  saldo_inicial: number
  valor_juros: number
  valor_amortizacao: number
  valor_total: number
  saldo_final: number
  valor_pago: number
  data_pagamento?: string | null
  forma_pagamento?: FormaPagamento | null
  comprovante_url?: string | null
  comprovante_path?: string | null
  observacoes?: string | null
  created_at?: string
  updated_at?: string
}

export type DocumentoTipo =
  | 'contrato'
  | 'comprovante'
  | 'garantia'
  | 'aditivo'
  | 'identidade'
  | 'outro'

export type EmprestimoDocumento = {
  id: string
  emprestimo_id: string
  nome: string
  tipo: DocumentoTipo
  url: string
  path?: string | null
  created_at?: string
}

// Linha projetada pelo motor de cálculo (antes de virar parcela persistida).
export type ParcelaCalculada = {
  numero: number
  competencia: string
  vencimento: string
  saldo_inicial: number
  valor_juros: number
  valor_amortizacao: number
  valor_total: number
  saldo_final: number
}
