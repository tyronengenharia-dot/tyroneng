import { ObraFinanceiro } from '@/types/obraFinanceiro'

export async function getFinanceiroByObra(
  obra_id: string
): Promise<ObraFinanceiro[]> {
  return [
    {
      id: '1',
      obra_id,
      description: 'Pagamento da prefeitura',
      category: 'Receita',
      type: 'entrada',
      value: 200000,
      status: 'pago',
      date: '2026-03-01',
    },
    {
      id: '2',
      obra_id,
      description: 'Compra de materiais',
      category: 'Material',
      type: 'saida',
      value: 50000,
      status: 'pendente',
      date: '2026-03-10',
    },
  ]
}