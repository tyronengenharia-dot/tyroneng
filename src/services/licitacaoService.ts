import { Licitacao } from '@/types/licitacao'

let licitacoes: Licitacao[] = []

export function getLicitacoes() {
  return licitacoes
}

export function createLicitacao(data: Licitacao) {
  licitacoes.push(data)
}

export function getLicitacaoById(id: string) {
  return licitacoes.find(l => l.id === id)
}

export function updateChecklist(
  licitacaoId: string,
  checklist: any
) {
  const lic = licitacoes.find(l => l.id === licitacaoId)
  if (lic) lic.checklist = checklist
}