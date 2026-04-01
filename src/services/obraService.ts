import { Obra } from '@/types/obra'

// 🔹 LISTA DE OBRAS
export async function getObras(): Promise<Obra[]> {
  return [
    {
      id: '1',
      name: 'Construção Escola Municipal',
      client: 'Prefeitura',
      location: 'RJ',
      budget: 500000,
      status: 'andamento',
      start_date: '2026-01-10',
    },
    {
      id: '2',
      name: 'Reforma Hospital',
      client: 'Estado',
      location: 'RJ',
      budget: 800000,
      status: 'concluida',
      start_date: '2025-09-01',
    },
  ]
}

// 🔹 OBRA POR ID
export async function getObraById(id: string): Promise<Obra | null> {
  const obras = await getObras()
  return obras.find(o => o.id === id) || null
}