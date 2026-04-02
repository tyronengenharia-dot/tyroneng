import { Licitacao, LicitacaoFormData, LicitacaoStatus, ChecklistItem } from '@/types/licitacao'

let licitacoes: Licitacao[] = [
  {
    id: 'demo-1',
    titulo: 'Reforma do Centro Cultural Municipal',
    orgao: 'Secretaria Municipal de Cultura — RJ',
    local: 'Sala de Licitações — Ed. Sede, Centro',
    valorEstimado: 2850000,
    dataEntrega: '2025-08-10',
    status: 'preparacao',
    modalidade: 'Concorrência',
    processo: '012/2025',
    lote: 'Lote 1',
    plataforma: '',
    dataDisputa: '2025-08-15',
    horaDisputa: '09:00',
    responsavel: 'Ana Ferreira',
    observacoes: 'Prioridade máxima. Verificar exigência de visita técnica obrigatória.',
    checklist: [
      { id: 'c1', nome: 'Certidão negativa de débitos federais', categoria: 'Jurídico', status: 'concluido' },
      { id: 'c2', nome: 'Balanço patrimonial último exercício', categoria: 'Financeiro', status: 'concluido' },
      { id: 'c3', nome: 'Atestado de capacidade técnica', categoria: 'Técnico', status: 'andamento' },
      { id: 'c4', nome: 'Proposta técnica detalhada', categoria: 'Proposta', status: 'andamento' },
      { id: 'c5', nome: 'ART do responsável técnico', categoria: 'Técnico', status: 'pendente' },
      { id: 'c6', nome: 'Certidão negativa FGTS', categoria: 'Jurídico', status: 'pendente' },
      { id: 'c7', nome: 'Planilha orçamentária detalhada', categoria: 'Financeiro', status: 'pendente' },
    ],
  },
  {
    id: 'demo-2',
    titulo: 'Pavimentação Av. Brasil — Trecho 4',
    orgao: 'DER-RJ',
    local: 'ComprasNet',
    valorEstimado: 7200000,
    dataEntrega: '2025-08-28',
    status: 'analise',
    modalidade: 'Pregão Eletrônico',
    processo: '034/2025',
    lote: 'Lote 4',
    plataforma: 'ComprasNet',
    dataDisputa: '2025-09-03',
    horaDisputa: '10:00',
    responsavel: 'Carlos Melo',
    observacoes: '',
    checklist: [
      { id: 'd1', nome: 'Ato constitutivo da empresa', categoria: 'Jurídico', status: 'concluido' },
      { id: 'd2', nome: 'Capacidade financeira mínima', categoria: 'Financeiro', status: 'pendente' },
    ],
  },
]

export function getLicitacoes(): Licitacao[] {
  return licitacoes
}

export function getLicitacaoById(id: string): Licitacao | undefined {
  return licitacoes.find(l => l.id === id)
}

export function createLicitacao(data: LicitacaoFormData): Licitacao {
  const nova: Licitacao = {
    ...data,
    id: crypto.randomUUID(),
    status: 'analise',
    checklist: [],
  }
  licitacoes.push(nova)
  return nova
}

export function updateLicitacao(id: string, data: LicitacaoFormData): void {
  const idx = licitacoes.findIndex(l => l.id === id)
  if (idx !== -1) {
    licitacoes[idx] = { ...licitacoes[idx], ...data }
  }
}

export function updateStatus(id: string, status: LicitacaoStatus): void {
  const lic = licitacoes.find(l => l.id === id)
  if (lic) lic.status = status
}

export function updateChecklist(licitacaoId: string, checklist: ChecklistItem[]): void {
  const lic = licitacoes.find(l => l.id === licitacaoId)
  if (lic) lic.checklist = checklist
}

export function addChecklistItem(licitacaoId: string, item: Omit<ChecklistItem, 'id'>): void {
  const lic = licitacoes.find(l => l.id === licitacaoId)
  if (lic) lic.checklist.push({ ...item, id: crypto.randomUUID() })
}

export function deleteChecklistItem(licitacaoId: string, itemId: string): void {
  const lic = licitacoes.find(l => l.id === licitacaoId)
  if (lic) lic.checklist = lic.checklist.filter(i => i.id !== itemId)
}

export function deleteLicitacao(id: string): void {
  licitacoes = licitacoes.filter(l => l.id !== id)
}
