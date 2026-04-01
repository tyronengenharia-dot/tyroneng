export type Obra = {
  id: string
  name: string
  client: string
  location: string
  budget: number
  status: 'andamento' | 'concluida'
  start_date: string
}