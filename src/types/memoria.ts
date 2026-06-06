// ─── MEMÓRIA DE CÁLCULO (por obra) ───────────────────────────────────────────
// Detalha os quantitativos e fórmulas que justificam o volume de cada item da
// planilha (vínculo opcional a planilha_item_id).

export type MemoriaCalculo = {
  id: string
  obra_id: string
  planilha_item_id?: string | null
  descricao: string
  formula?: string | null
  quantidade: number
  unidade?: string | null
  ordem: number
  created_at?: string
}
