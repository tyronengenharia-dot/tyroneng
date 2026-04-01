import { NotaFiscal } from '@/types/notaFiscal'

export async function getNotas(): Promise<NotaFiscal[]> {
  return [
    {
      id: '1',
      number: 'NF-001',
      type: 'emitida',
      client: 'Prefeitura',
      value: 150000,
      status: 'aprovada',
      date: '2026-03-01',
    },
    {
      id: '2',
      number: 'NF-002',
      type: 'recebida',
      client: 'Fornecedor XYZ',
      value: 50000,
      status: 'pendente',
      date: '2026-03-10',
    },
  ]
}