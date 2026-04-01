export type Payroll = {
  id: string
  employee_name: string
  salario: number
  bonus: number

  inss: number
  fgts: number

  net_salario: number
  company_cost: number

  status: 'pago' | 'pendente'
  date: string
}