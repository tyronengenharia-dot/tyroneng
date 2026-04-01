export type LicitacaoStatus =
  | 'analise'
  | 'preparacao'
  | 'enviada'
  | 'ganhou'
  | 'perdeu'

export type ChecklistStatus =
  | 'pendente'
  | 'andamento'
  | 'concluido'

export interface ChecklistItem {
  id: string
  categoria: string
  nome: string
  status: ChecklistStatus
  responsavel?: string
}

export interface Licitacao {
  id: string
  titulo: string
  orgao: string
  local: string
  valorEstimado: number
  dataEntrega: string
  status: LicitacaoStatus
  checklist: ChecklistItem[]
}