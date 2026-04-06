// ─────────────────────────────────────────────────────────────────
// types/proposta.ts
// Campos mapeados 1-a-1 com as posições do PDF da Tyron Engenharia
// ─────────────────────────────────────────────────────────────────

export type PropostaStatus = 'rascunho' | 'enviada' | 'aprovada' | 'rejeitada'

/** O que o escopo de materiais cobre */
export type EscopaMaterial = 'mao_de_obra' | 'mao_de_obra_e_materiais'

export interface Proposta {
  obra: unknown
  descricao: unknown
  id: string

  // ── CAPA ──────────────────────────────────────────────────────
  /** Ex: "345.970"  →  capa canto dir + rodapé de todas as páginas */
  numero: string
  /** Ex: "Condomínio Blu Sky"  →  capa título grande */
  cliente: string
  /** Ex: "BASE\nCAIXAS DE ÁGUA"  →  título grande da capa (suporta \n) */
  tituloCapa: string
  /** Ex: "11 de Abril de 2026"  →  capa abaixo do título */
  dataEmissao: string

  // ── PÁG 1 — VISÃO GERAL / OBJETIVOS ──────────────────────────
  /** Parágrafo de objetivos (coluna esquerda pág 1) */
  objetivo: string

  // ── PÁG 2 — DETALHAMENTO + OBRIGAÇÕES TYRON ──────────────────
  /** Lista de etapas do serviço (bullets pág 2) */
  etapas: string[]

  // ── PÁG 3 — OBRIGAÇÕES CONTRATANTE ───────────────────────────
  // (texto fixo — sem campo editável)

  // ── PÁG 4 — GARANTIA + CRONOGRAMA ────────────────────────────
  /** Prazo em dias → "30 dias corridos" + extenso */
  prazoExecucao: number

  // ── PÁG 5 — ENTREGÁVEIS + INVESTIMENTO ───────────────────────
  /** Lista de entregáveis (bullets pág 5) */
  entregaveis: string[]
  /** Valor numérico — ex: 49667.30 */
  valor: number
  /** Valor por extenso — ex: "quarenta e nove mil, seiscentos..." */
  valorExtenso: string
  /** O que o valor contempla */
  escopaMaterial: EscopaMaterial

  // ── PÁG 6 — FORMA DE PAGAMENTO ───────────────────────────────
  /** Texto livre do 4.2 — ex: "50% no início e 50% na entrega" */
  condicoesPagamento: string
  /** Validade em dias → "30 (trinta) dias" */
  validade: number
  /** Texto descritivo da NF (CAPS) */
  descricaoNF: string

  // ── RESPONSÁVEL TÉCNICO (todas as páginas onde aparece) ───────
  responsavel: string
  crea: string

  // ── METADADOS ─────────────────────────────────────────────────
  status: PropostaStatus
  createdAt: string
}
