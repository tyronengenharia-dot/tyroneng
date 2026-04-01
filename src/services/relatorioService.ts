import { Relatorio } from '@/types/relatorio'

export async function getRelatorio(): Promise<Relatorio[]> {
  return [
    { date: 'Jan', receitas: 200000, despesas: 150000 },
    { date: 'Fev', receitas: 180000, despesas: 120000 },
    { date: 'Mar', receitas: 220000, despesas: 170000 },
  ]
}