export type Documento = {
  id: string

  name: string
  category: string

  expiration_date: string

  status: 'valido' | 'vencendo' | 'vencido'

  file_url?: string
}