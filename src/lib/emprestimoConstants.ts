import {
  EmprestimoCategoria,
  EmprestimoRegime,
  EmprestimoStatus,
  FormaContemplacao,
  FormaPagamento,
  ParcelaStatus,
  DocumentoTipo,
  TipoTaxa,
  CredorTipo,
  IndiceCorrecao,
  GarantiaTipo,
  GarantiaSituacao,
} from '@/types/emprestimo'

// ─── Categoria ───────────────────────────────────────────────────────────────

export const categoriaLabels: Record<EmprestimoCategoria, string> = {
  emprestimo: 'Empréstimo',
  consorcio: 'Consórcio',
}

export const categoriaOptions = (
  Object.keys(categoriaLabels) as EmprestimoCategoria[]
).map(v => ({ value: v, label: categoriaLabels[v] }))

// ─── Regime de juros ─────────────────────────────────────────────────────────

export const regimeLabels: Record<EmprestimoRegime, string> = {
  juros_saldo: 'Juros sobre o saldo devedor',
  price: 'Parcelas fixas (Tabela Price)',
  sac: 'Amortização constante (SAC)',
  sem_juros: 'Sem juros (parcelado)',
}

export const regimeDescricao: Record<EmprestimoRegime, string> = {
  juros_saldo:
    'Juros do mês incidem sobre o saldo. Se a parcela não for paga e houver capitalização, o juros entra no saldo e rende no mês seguinte.',
  price: 'Parcela mensal fixa; os juros incidem sobre o saldo devedor a cada mês.',
  sac: 'Amortização constante; a parcela começa maior e vai diminuindo.',
  sem_juros: 'Valor dividido igualmente entre as parcelas, sem juros.',
}

export const regimeOptions = (
  Object.keys(regimeLabels) as EmprestimoRegime[]
).map(v => ({ value: v, label: regimeLabels[v] }))

// ─── Status do contrato ──────────────────────────────────────────────────────

export const statusLabels: Record<EmprestimoStatus, string> = {
  ativo: 'Ativo',
  quitado: 'Quitado',
  inadimplente: 'Inadimplente',
  cancelado: 'Cancelado',
  contemplado: 'Contemplado',
}

export const statusOptions = (
  Object.keys(statusLabels) as EmprestimoStatus[]
).map(v => ({ value: v, label: statusLabels[v] }))

export const statusClass: Record<EmprestimoStatus, string> = {
  ativo: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  quitado: 'bg-green-500/10 text-green-400 border-green-500/20',
  inadimplente: 'bg-red-500/10 text-red-400 border-red-500/20',
  cancelado: 'bg-white/5 text-white/40 border-white/10',
  contemplado: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
}

// ─── Status da parcela (derivado) ────────────────────────────────────────────

export const parcelaStatusLabels: Record<ParcelaStatus, string> = {
  paga: 'Paga',
  parcial: 'Parcial',
  atrasada: 'Atrasada',
  prevista: 'Prevista',
}

export const parcelaStatusClass: Record<ParcelaStatus, string> = {
  paga: 'bg-green-500/10 text-green-400 border-green-500/20',
  parcial: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  atrasada: 'bg-red-500/10 text-red-400 border-red-500/20',
  prevista: 'bg-white/5 text-white/40 border-white/10',
}

// ─── Forma de contemplação (consórcio) ───────────────────────────────────────

export const formaContemplacaoLabels: Record<FormaContemplacao, string> = {
  nao: 'Não contemplado',
  lance: 'Lance',
  sorteio: 'Sorteio',
}

export const formaContemplacaoOptions = (
  Object.keys(formaContemplacaoLabels) as FormaContemplacao[]
).map(v => ({ value: v, label: formaContemplacaoLabels[v] }))

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

// ─── Tipo de documento ───────────────────────────────────────────────────────

export const documentoTipoLabels: Record<DocumentoTipo, string> = {
  contrato: 'Contrato',
  comprovante: 'Comprovante',
  garantia: 'Garantia',
  aditivo: 'Aditivo',
  identidade: 'Identidade',
  outro: 'Outro',
}

export const documentoTipoOptions = (
  Object.keys(documentoTipoLabels) as DocumentoTipo[]
).map(v => ({ value: v, label: documentoTipoLabels[v] }))

// ─── Tipo de taxa (periodicidade informada) ──────────────────────────────────

export const tipoTaxaLabels: Record<TipoTaxa, string> = {
  mensal: '% ao mês',
  anual: '% ao ano',
}

export const tipoTaxaOptions = (Object.keys(tipoTaxaLabels) as TipoTaxa[]).map(v => ({
  value: v,
  label: tipoTaxaLabels[v],
}))

// ─── Tipo de credor ──────────────────────────────────────────────────────────

export const credorTipoLabels: Record<CredorTipo, string> = {
  pf: 'Pessoa física (CPF)',
  pj: 'Pessoa jurídica (CNPJ)',
}

export const credorTipoOptions = (Object.keys(credorTipoLabels) as CredorTipo[]).map(v => ({
  value: v,
  label: credorTipoLabels[v],
}))

// ─── Índice de correção ──────────────────────────────────────────────────────

export const indiceCorrecaoLabels: Record<IndiceCorrecao, string> = {
  nenhum: 'Nenhum (prefixado)',
  ipca: 'IPCA',
  igpm: 'IGP-M',
  inpc: 'INPC',
  cdi: 'CDI',
  tr: 'TR',
  selic: 'Selic',
  prefixado: 'Prefixado',
}

export const indiceCorrecaoOptions = (
  Object.keys(indiceCorrecaoLabels) as IndiceCorrecao[]
).map(v => ({ value: v, label: indiceCorrecaoLabels[v] }))

// ─── Garantias (alienação) ───────────────────────────────────────────────────

export const garantiaTipoLabels: Record<GarantiaTipo, string> = {
  imovel: 'Imóvel',
  veiculo: 'Veículo',
  aval: 'Aval',
  fianca: 'Fiança',
  nota_promissoria: 'Nota promissória',
  penhor: 'Penhor',
  aplicacao: 'Aplicação financeira',
  outro: 'Outro',
}

export const garantiaTipoOptions = (Object.keys(garantiaTipoLabels) as GarantiaTipo[]).map(
  v => ({ value: v, label: garantiaTipoLabels[v] })
)

export const garantiaSituacaoLabels: Record<GarantiaSituacao, string> = {
  alienado: 'Alienado',
  livre: 'Livre',
  quitado: 'Quitado',
  executado: 'Executado',
}

export const garantiaSituacaoOptions = (
  Object.keys(garantiaSituacaoLabels) as GarantiaSituacao[]
).map(v => ({ value: v, label: garantiaSituacaoLabels[v] }))

export const garantiaSituacaoClass: Record<GarantiaSituacao, string> = {
  alienado: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  livre: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  quitado: 'bg-green-500/10 text-green-400 border-green-500/20',
  executado: 'bg-red-500/10 text-red-400 border-red-500/20',
}

// ─── Paleta de cores ─────────────────────────────────────────────────────────

export const CORES = [
  '#8b5cf6', // roxo
  '#3b82f6', // azul
  '#22c55e', // verde
  '#f59e0b', // âmbar
  '#ef4444', // vermelho
  '#ec4899', // rosa
  '#14b8a6', // teal
  '#f97316', // laranja
  '#06b6d4', // ciano
  '#64748b', // cinza
]
