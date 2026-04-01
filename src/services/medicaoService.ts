import { Medicao } from '@/types/medicao'

export async function getMedicoes(
  obra_id: string
): Promise<Medicao[]> {
  return [
    {
      id: '1',
      obra_id,
      description: 'Fundação',
      percentage: 20,
      value: 100000,
      date: '2026-03-01',
    },
    {
      id: '2',
      obra_id,
      description: 'Estrutura',
      percentage: 30,
      value: 150000,
      date: '2026-03-10',
    },
  ]
}