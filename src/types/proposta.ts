export type PropostaStatus =
  | 'rascunho'
  | 'enviada'
  | 'aprovada'
  | 'rejeitada'

export interface Proposta {
  id: string
  numero: string
  cliente: string
  obra: string
  descricao: string
  etapas?: string[]
  valor: number
  prazoExecucao: number
  validade: number
  responsavel: string
  crea?: string
  condicoesPagamento?: string
  status: PropostaStatus
  createdAt: string
}
