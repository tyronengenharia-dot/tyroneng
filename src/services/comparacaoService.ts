import { ComparacaoObra } from '@/types/comparacao'

export async function getComparacao(): Promise<ComparacaoObra[]> {
  return [
    {
      id: '1',
      name: 'Escola Municipal',
      receitas: 500000,
      despesas: 350000,
      progresso: 60,
    },
    {
      id: '2',
      name: 'Hospital',
      receitas: 800000,
      despesas: 700000,
      progresso: 80,
    },
    {
      id: '3',
      name: 'Rodovia',
      receitas: 1000000,
      despesas: 600000,
      progresso: 50,
    },
  ]
}