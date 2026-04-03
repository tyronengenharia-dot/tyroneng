import { Proposta, PropostaStatus } from '@/types/proposta'

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso))
}

export const STATUS_LABEL: Record<PropostaStatus, string> = {
  rascunho: 'Rascunho',
  enviada: 'Enviada',
  aprovada: 'Aprovada',
  rejeitada: 'Rejeitada',
}

export const STATUS_COLORS: Record<
  PropostaStatus,
  { bg: string; text: string; dot: string; border: string }
> = {
  rascunho: {
    bg: 'bg-zinc-800/60',
    text: 'text-zinc-400',
    dot: 'bg-zinc-400',
    border: 'border-zinc-700',
  },
  enviada: {
    bg: 'bg-blue-950/60',
    text: 'text-blue-400',
    dot: 'bg-blue-400',
    border: 'border-blue-800',
  },
  aprovada: {
    bg: 'bg-emerald-950/60',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
    border: 'border-emerald-800',
  },
  rejeitada: {
    bg: 'bg-red-950/60',
    text: 'text-red-400',
    dot: 'bg-red-400',
    border: 'border-red-800',
  },
}

export function calcPropostaStats(propostas: Proposta[]) {
  const total = propostas.length
  const aprovadas = propostas.filter((p) => p.status === 'aprovada').length
  const enviadas = propostas.filter((p) => p.status === 'enviada').length
  const volume = propostas.reduce((acc, p) => acc + p.valor, 0)
  const taxaAprovacao = total > 0 ? Math.round((aprovadas / total) * 100) : 0
  return { total, aprovadas, enviadas, volume, taxaAprovacao }
}

// Mock data — substituir por chamadas reais à API/banco
export const MOCK_PROPOSTAS: Proposta[] = [
  {
    id: '1',
    numero: '345.970',
    cliente: 'Cond. Blu Sky',
    obra: 'Base de Concreto — 6 Caixas d\'Água',
    descricao:
      'Execução da construção de base em concreto armado para apoio de 6 caixas d\'água, incluindo preparação do terreno, armação, concretagem e nivelamento.',
    etapas: [
      'Mobilização da equipe e demarcação da área',
      'Limpeza e preparo do terreno com escavação',
      'Montagem da armação em aço com espaçadores',
      'Execução das fôrmas em madeira ou metálicas',
      'Concretagem com adensamento adequado',
      'Cura do concreto pelo período técnico recomendado',
      'Limpeza final e liberação das bases',
    ],
    valor: 49667.3,
    prazoExecucao: 30,
    validade: 30,
    responsavel: 'Rodrigo Antunes Ramos',
    crea: 'CREA/RJ 2019103029',
    condicoesPagamento: '50% início + 50% conclusão',
    status: 'aprovada',
    createdAt: '2026-03-11T10:00:00.000Z',
  },
  {
    id: '2',
    numero: '346.010',
    cliente: 'Prefeitura RJ',
    obra: 'Reforma Escola Municipal',
    descricao: 'Reforma completa da ala norte da escola municipal, incluindo estrutura, elétrica e acabamento.',
    etapas: [],
    valor: 120000,
    prazoExecucao: 90,
    validade: 30,
    responsavel: 'Rodrigo Antunes Ramos',
    crea: 'CREA/RJ 2019103029',
    condicoesPagamento: '30/60/90 dias',
    status: 'enviada',
    createdAt: '2026-04-01T09:00:00.000Z',
  },
  {
    id: '3',
    numero: '346.022',
    cliente: 'Empresa XYZ Ltda',
    obra: 'Pavimentação Interna',
    descricao: 'Pavimentação do pátio interno com paralelepípedo e drenagem.',
    etapas: [],
    valor: 50000,
    prazoExecucao: 45,
    validade: 30,
    responsavel: 'Rodrigo Antunes Ramos',
    crea: 'CREA/RJ 2019103029',
    condicoesPagamento: '50% início + 50% conclusão',
    status: 'rascunho',
    createdAt: '2026-04-02T14:00:00.000Z',
  },
]
