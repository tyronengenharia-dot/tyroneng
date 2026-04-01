export type ObraFinanceiro = {
  id: string
  obra_id: string

  description: string
  category: string

  type: 'entrada' | 'saida'
  value: number

  status: 'pago' | 'pendente'
  date: string
}