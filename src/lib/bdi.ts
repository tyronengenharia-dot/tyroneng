// ─── BDI (Benefícios e Despesas Indiretas) ───────────────────────────────────
// Só a planilha de Venda usa BDI. Componentes em PERCENTUAL (ex.: 10 = 10%).
//
// Fórmula oficial (TCU — Acórdão 2622/2013):
//   fator = (1 + AC + R + SG + DF + P) × (1 + L) / (1 − I)
//   BDI%  = (fator − 1) × 100
// onde AC=administração, R=risco, SG=seguro/garantia, DF=desp. financeiras,
//      P=perdas, L=lucro, I=impostos (incide sobre o preço de venda → divisor).

export type BdiConfig = {
  administracao: number
  lucro: number
  impostos: number
  risco: number
  perdas: number
  seguro_garantia: number
  despesas_financeiras: number
}

export const BDI_ZERO: BdiConfig = {
  administracao: 0,
  lucro: 0,
  impostos: 0,
  risco: 0,
  perdas: 0,
  seguro_garantia: 0,
  despesas_financeiras: 0,
}

/** Fator multiplicador (Custo × fator = Venda). Retorna NaN se imposto ≥ 100%. */
export function bdiFator(c: BdiConfig): number {
  const AC = (c.administracao || 0) / 100
  const R  = (c.risco || 0) / 100
  const SG = (c.seguro_garantia || 0) / 100
  const DF = (c.despesas_financeiras || 0) / 100
  const P  = (c.perdas || 0) / 100
  const L  = (c.lucro || 0) / 100
  const I  = (c.impostos || 0) / 100
  if (I >= 1) return NaN
  return ((1 + AC + R + SG + DF + P) * (1 + L)) / (1 - I)
}

/** BDI em percentual (ex.: 25.4). */
export function bdiPct(c: BdiConfig): number {
  const f = bdiFator(c)
  return Number.isNaN(f) ? NaN : (f - 1) * 100
}

export function bdiValido(c: BdiConfig): boolean {
  const f = bdiFator(c)
  return Number.isFinite(f) && f > 0
}
