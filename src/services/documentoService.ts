import { Documento } from '@/types/documento'

export async function getDocumentos(): Promise<Documento[]> {
  return [
    {
      id: '1',
      name: 'Alvará de construção',
      category: 'Licença',
      expiration_date: '2026-12-01',
      status: 'valido',
    },
    {
      id: '2',
      name: 'ART Engenheiro',
      category: 'Responsabilidade técnica',
      expiration_date: '2026-03-20',
      status: 'vencendo',
    },
    {
      id: '3',
      name: 'Certidão negativa',
      category: 'Fiscal',
      expiration_date: '2025-12-01',
      status: 'vencido',
    },
  ]
}