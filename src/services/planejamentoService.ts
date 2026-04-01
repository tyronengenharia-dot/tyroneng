import { Planejamento } from '@/types/planejamento'

export async function getPlanejamento(
  obra_id: string
): Promise<Planejamento[]> {
  return [
    {
      id: '1',
      obra_id,
      category: 'Material',
      planned_value: 200000,
      actual_value: 150000,
    },
    {
      id: '2',
      obra_id,
      category: 'Mão de obra',
      planned_value: 100000,
      actual_value: 120000,
    },
  ]
}