export type NotaFiscal = {
  id: string
  number: string
  type: 'emitida' | 'recebida'
  client: string
  value: number
  status: 'aprovada' | 'pendente' | 'cancelada'
  date: string
  file_url?: string
  xml_url?: string
}