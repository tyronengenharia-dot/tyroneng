export type Contrato = {
  id: string
  name: string
  client: string

  start_date: string
  end_date: string

  status: 'ativo' | 'finalizado' | 'pendente'

  file_url?: string
}