import { Contrato } from '@/types/contrato'

export async function getContratos(): Promise<Contrato[]> {
  return [
    {
      id: '1',
      name: 'Contrato Escola Municipal',
      client: 'Prefeitura',
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      status: 'ativo',
    },
    {
      id: '2',
      name: 'Contrato Hospital',
      client: 'Estado',
      start_date: '2025-01-01',
      end_date: '2025-12-31',
      status: 'finalizado',
    },
  ]
}