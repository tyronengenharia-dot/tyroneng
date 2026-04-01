export type PropostaStatus =
  | 'rascunho'
  | 'enviada'
  | 'aprovada'
  | 'rejeitada'

export interface Proposta {
  id: string
  cliente: string
  obra: string
  descricao: string
  valor: number
  prazoExecucao: number
  validade: number
  responsavel: string
  condicoesPagamento?: string
  status: PropostaStatus
  createdAt: string
}