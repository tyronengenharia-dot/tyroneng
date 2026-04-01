import { NotaFiscal } from '@/types/notaFiscal'

export async function getNotas(): Promise<NotaFiscal[]> {
  return [
    {
      id: '1',
      number: 'NF-001',
      type: 'emitida',
      client: 'Prefeitura Municipal',
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
    {
      id: '3',
      number: 'NF-003',
      type: 'emitida',
      client: 'Construtora ABC',
      value: 320000,
      status: 'aprovada',
      date: '2026-03-15',
    },
    {
      id: '4',
      number: 'NF-004',
      type: 'recebida',
      client: 'Materiais Ltda',
      value: 18500,
      status: 'cancelada',
      date: '2026-03-20',
    },
  ]
}