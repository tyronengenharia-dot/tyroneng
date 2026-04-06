// ─── DIÁRIO DE OBRA ──────────────────────────────────────────────────────────

export type ClimaCondicao = 'ensolarado' | 'parcialmente_nublado' | 'nublado' | 'chuvoso' | 'tempestade'

export type DiarioFuncionario = {
  nome: string
  cargo: string
  quantidade: number
}

export type DiarioServico = {
  descricao: string
  percentual_executado: number
  observacao?: string
}

export type DiarioFoto = {
  url: string
  legenda?: string
}

export type DiarioObra = {
  id: string
  obra_id: string
  data: string
  numero: number

  // Clima
  clima_manha: ClimaCondicao
  clima_tarde: ClimaCondicao
  temperatura_max?: number
  temperatura_min?: number
  chuva_mm?: number
  horas_improdutivas?: number

  // Equipe
  funcionarios: DiarioFuncionario[]
  total_funcionarios: number

  // Serviços
  servicos: DiarioServico[]

  // Ocorrências
  ocorrencias?: string
  observacoes?: string

  // Fotos
  fotos: DiarioFoto[]

  // Responsável
  responsavel_nome: string
  responsavel_cargo: string

  created_at?: string
  updated_at?: string
}

// ─── RISCOS ───────────────────────────────────────────────────────────────────

export type RiscoCategoria =
  | 'seguranca'
  | 'financeiro'
  | 'prazo'
  | 'qualidade'
  | 'ambiental'
  | 'juridico'
  | 'outro'

export type RiscoProbabilidade = 'muito_baixa' | 'baixa' | 'media' | 'alta' | 'muito_alta'
export type RiscoImpacto       = 'muito_baixo' | 'baixo' | 'medio' | 'alto' | 'muito_alto'
export type RiscoStatus        = 'identificado' | 'em_monitoramento' | 'mitigado' | 'ocorreu' | 'encerrado'

export type Risco = {
  id: string
  obra_id: string
  titulo: string
  descricao: string
  categoria: RiscoCategoria
  probabilidade: RiscoProbabilidade
  impacto: RiscoImpacto
  nivel_risco?: number          // calculado: prob × impacto (1–25)
  status: RiscoStatus
  plano_mitigacao: string
  responsavel?: string
  prazo_resposta?: string
  custo_estimado?: number
  data_identificacao: string
  data_revisao?: string
  created_at?: string
}
