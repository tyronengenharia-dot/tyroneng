import {
  ContaTipo,
  MovStatus,
  MovTipo,
  FormaPagamento,
  CategoriaTipo,
} from '@/types/banco'

// ─── Tipo de conta ───────────────────────────────────────────────────────────

export const contaTipoLabels: Record<ContaTipo, string> = {
  corrente: 'Conta corrente',
  poupanca: 'Poupança',
  caixa: 'Caixa / Dinheiro',
  aplicacao: 'Aplicação',
  cartao: 'Cartão',
  investimento: 'Investimento',
}

export const contaTipoOptions = (
  Object.keys(contaTipoLabels) as ContaTipo[]
).map(v => ({ value: v, label: contaTipoLabels[v] }))

// ─── Status da movimentação ──────────────────────────────────────────────────

export const movStatusLabels: Record<MovStatus, string> = {
  previsto: 'Previsto',
  pago: 'Pago',
  conciliado: 'Conciliado',
}

export const movStatusOptions = (
  Object.keys(movStatusLabels) as MovStatus[]
).map(v => ({ value: v, label: movStatusLabels[v] }))

// classe do "pill" de status na tabela
export const movStatusClass: Record<MovStatus, string> = {
  previsto: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  pago: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  conciliado: 'bg-green-500/10 text-green-400 border-green-500/20',
}

// ─── Tipo de movimentação (entrada/saída) ────────────────────────────────────

export const movTipoLabels: Record<MovTipo, string> = {
  entrada: 'Entrada',
  saida: 'Saída',
}

// ─── Forma de pagamento ──────────────────────────────────────────────────────

export const formaPagamentoLabels: Record<FormaPagamento, string> = {
  pix: 'Pix',
  ted: 'TED',
  doc: 'DOC',
  dinheiro: 'Dinheiro',
  boleto: 'Boleto',
  cartao: 'Cartão',
  cheque: 'Cheque',
  transferencia: 'Transferência',
  outro: 'Outro',
}

export const formaPagamentoOptions = (
  Object.keys(formaPagamentoLabels) as FormaPagamento[]
).map(v => ({ value: v, label: formaPagamentoLabels[v] }))

// ─── Tipo de categoria ───────────────────────────────────────────────────────

export const categoriaTipoLabels: Record<CategoriaTipo, string> = {
  entrada: 'Entrada',
  saida: 'Saída',
  ambos: 'Ambos',
}

export const categoriaTipoOptions = (
  Object.keys(categoriaTipoLabels) as CategoriaTipo[]
).map(v => ({ value: v, label: categoriaTipoLabels[v] }))

// ─── Paleta de cores para contas/categorias ──────────────────────────────────

export const CORES = [
  '#3b82f6', // azul
  '#22c55e', // verde
  '#f59e0b', // âmbar
  '#ef4444', // vermelho
  '#8b5cf6', // roxo
  '#ec4899', // rosa
  '#14b8a6', // teal
  '#f97316', // laranja
  '#06b6d4', // ciano
  '#64748b', // cinza
]
