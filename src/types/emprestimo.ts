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

export type TipoTaxa = 'mensal' | 'anual'

export type CredorTipo = 'pf' | 'pj'

export type IndiceCorrecao =
  | 'nenhum'
  | 'ipca'
  | 'igpm'
  | 'inpc'
  | 'cdi'
  | 'tr'
  | 'selic'
  | 'prefixado'

export type GarantiaTipo =
  | 'imovel'
  | 'veiculo'
  | 'aval'
  | 'fianca'
  | 'nota_promissoria'
  | 'penhor'
  | 'aplicacao'
  | 'outro'

export type GarantiaSituacao = 'alienado' | 'livre' | 'quitado' | 'executado'

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
  numero_contrato?: string | null
  credor?: string | null
  credor_tipo: CredorTipo
  credor_documento?: string | null
  proposito?: string | null
  valor_principal: number
  data_inicio: string
  data_assinatura?: string | null
  data_limite?: string | null
  dia_vencimento?: number | null
  status: EmprestimoStatus
  obra_id?: string | null
  conta_id?: string | null

  // empréstimo
  regime: EmprestimoRegime
  tipo_taxa: TipoTaxa
  taxa_juros_mensal: number
  taxa_juros_anual: number
  capitaliza: boolean
  carencia_meses: number
  indice_correcao: IndiceCorrecao
  num_parcelas?: number | null

  // encargos sobre o crédito
  iof: number
  tac: number
  seguro: number

  // encargos de atraso
  multa_atraso_pct: number
  juros_mora_mensal: number

  // consórcio
  taxa_admin_pct?: number | null
  fundo_reserva_pct?: number | null
  grupo?: string | null
  cota?: string | null
  bem_objeto?: string | null
  prazo_grupo_meses?: number | null
  lance_embutido: boolean
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
  total_encargos_pagos: number
  saldo_devedor: number
  valor_em_atraso: number
  encargos_atraso: number
  qtd_atrasadas: number
  proxima_parcela: string | null
  qtd_garantias: number
  garantias_valor: number
  garantias_alienadas: number
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
  valor_encargos: number
  data_pagamento?: string | null
  forma_pagamento?: FormaPagamento | null
  // Conta bancária de onde a parcela foi paga (obrigatória ao quitar).
  conta_id?: string | null
  comprovante_url?: string | null
  comprovante_path?: string | null
  observacoes?: string | null
  created_at?: string
  updated_at?: string
}

export type EmprestimoGarantia = {
  id: string
  emprestimo_id: string
  tipo: GarantiaTipo
  descricao: string
  valor_estimado?: number | null
  situacao: GarantiaSituacao
  matricula?: string | null
  cartorio?: string | null
  placa?: string | null
  renavam?: string | null
  garantidor?: string | null
  documento?: string | null
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

// ─── RATEIO ENTRE OBRAS (destinos do empréstimo) ─────────────────────────────
// O valor principal pode ser dividido entre vários destinos: cada destino é uma
// obra (obra_id) ou "outros/uso geral" (obra_id null). A fatia de uma obra vira
// entrada no Financeiro dela — 'recebido' = realizado, 'previsto' = a receber.

export type EmprestimoRateioStatus = 'recebido' | 'previsto'

export type EmprestimoRateio = {
  id: string
  emprestimo_id: string
  obra_id?: string | null
  descricao?: string | null
  valor: number
  data?: string | null
  status: EmprestimoRateioStatus
  // Conta bancária onde o desembolso entrou (obrigatória quando 'recebido').
  conta_id?: string | null
  comprovante_url?: string | null
  comprovante_path?: string | null
  created_at?: string
  // joins opcionais (preenchidos em algumas queries)
  emprestimo?: { descricao: string; categoria: EmprestimoCategoria } | null
  obra?: { id: string; name: string } | null
}
