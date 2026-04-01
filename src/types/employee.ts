export type Employee = {
  id: string
  nome: string
  cargo: string
  salario: number
  status: 'ativo' | 'inativo'
  created_at: string
}

export type Payment = {
  id: string
  employee_id: string
  amount: number
  date: string
}