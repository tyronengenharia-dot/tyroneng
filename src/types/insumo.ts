// ─── INSUMOS (catálogo global da empresa) ────────────────────────────────────
// Banco de dados de materiais, mão de obra e equipamentos. Código único.
// Abastecido pelo setor de compras (valor unitário de referência).

export type InsumoTipo = 'material' | 'mao_de_obra' | 'equipamento'

export type Insumo = {
  id: string
  codigo: string
  tipo: InsumoTipo
  descricao: string
  unidade: string
  valor_unitario: number
  ativo: boolean
  created_at?: string
  updated_at?: string
}
