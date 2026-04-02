export type ContratoStatus = 'ativo' | 'finalizado' | 'pendente' | 'cancelado'

export type Contrato = {
  id: string
  name: string
  client: string
  client_email?: string
  client_cnpj?: string
  value?: number
  start_date: string
  end_date: string
  status: ContratoStatus
  file_url?: string
  description?: string
  created_at?: string
  tags?: string[]
}
