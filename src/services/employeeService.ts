import { Employee, Payment } from '@/types/employee'

export async function getEmployees(): Promise<Employee[]> {
  return [
    {
      id: '1',
      nome: 'João Silva',
      cargo: 'Engenheiro',
      salario: 8000,
      status: 'ativo',
      created_at: '2026-03-01',
    },
    {
      id: '2',
      nome: 'Maria Souza',
      cargo: 'Arquiteta',
      salario: 7000,
      status: 'inativo',
      created_at: '2026-02-10',
    },
  ]
}

export async function getPayments(): Promise<Payment[]> {
  return [
    {
      id: '1',
      employee_id: '1',
      amount: 8000,
      date: '2026-03-05',
    },
  ]
}