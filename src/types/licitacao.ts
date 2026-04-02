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

export type ChecklistCategoria =
  | 'Documentação'
  | 'Técnico'
  | 'Jurídico'
  | 'Financeiro'
  | 'Habilitação'
  | 'Proposta'
  | 'Outro'

export interface ChecklistItem {
  id: string
  categoria: ChecklistCategoria
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
  modalidade: string
  processo: string
  lote: string
  plataforma: string
  dataDisputa: string
  horaDisputa: string
  responsavel: string
  observacoes: string
  checklist: ChecklistItem[]
}

export interface LicitacaoFormData {
  titulo: string
  orgao: string
  local: string
  valorEstimado: number
  dataEntrega: string
  modalidade: string
  processo: string
  lote: string
  plataforma: string
  dataDisputa: string
  horaDisputa: string
  responsavel: string
  observacoes: string
}
