export type FinancialRecord = {
  id: string
  description: string
  type: 'entrada' | 'saida'
  value: number
  status: 'pago' | 'pendente'
  date: string
  obra_id?: string
  receipt_url?: string
}