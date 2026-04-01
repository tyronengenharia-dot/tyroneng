export type FinancialRecord = {
  id: string
  description: string
  type: 'entrada' | 'saida'
  value: number
  status: 'pago' | 'pendente' | 'atrasado' | 'cancelado' | 'parcialmente_pago'
  date: string
  created_at?: string

  // Identificação
  category?: string
  cost_center?: string
  account?: string

  // Valores
  discount?: number
  due_date?: string
  payment_date?: string

  // Fiscal
  doc_type?: string
  doc_number?: string
  supplier_doc?: string
  supplier_name?: string

  // Pagamento
  payment_method?: string
  installment?: boolean
  installment_qty?: number

  // Extras
  notes?: string
  tags?: string[]
  receipt_url?: string
}