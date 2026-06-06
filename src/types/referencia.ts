// ─── REFERÊNCIA EXTERNA — EMOP / SINAPI ──────────────────────────────────────
// Estrutura unificada (campo `fonte`), versionada por mês/ano.
// Alimenta as planilhas operacionais junto com a Tabela de Serviços.

export type ReferenciaFonte = 'emop' | 'sinapi'

export type ReferenciaVersao = {
  id: string
  fonte: ReferenciaFonte
  ano: number
  mes: number
  uf?: string | null
  rotulo?: string | null
  importado_em?: string
}

export type ReferenciaVersaoComContagem = ReferenciaVersao & {
  total_itens: number
}

export type ReferenciaItem = {
  id: string
  versao_id: string
  codigo: string
  descricao: string
  unidade: string
  valor_unitario: number
  created_at?: string
}
