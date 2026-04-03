import type { DocumentCategory } from '@/types/acervo'

export const CATEGORY_COLORS: Record<DocumentCategory, string> = {
  ART: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  Alvará: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  Certificado: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  Contrato: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  Projeto: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  Licença: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  Habilitação: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  Registro: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  Outros: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
}

export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  'ART',
  'Alvará',
  'Certificado',
  'Contrato',
  'Projeto',
  'Licença',
  'Habilitação',
  'Registro',
  'Outros',
]

export const STATUS_FILTERS = [
  { label: 'Todos', value: 'all' },
  { label: 'Válidos', value: 'valid' },
  { label: 'A Vencer', value: 'expiring' },
  { label: 'Vencidos', value: 'expired' },
] as const

export const PROFESSIONAL_STATUS_FILTERS = [
  { label: 'Todos', value: 'all' },
  { label: 'Regular', value: 'valid' },
  { label: 'A Vencer', value: 'expiring' },
  { label: 'Vencido', value: 'expired' },
] as const
