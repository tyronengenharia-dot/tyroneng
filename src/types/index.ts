// ─── OBRA ────────────────────────────────────────────────────────────────────

export type ObraStatus = 'andamento' | 'concluida' | 'atrasada'

export type Obra = {
  id: string
  name: string
  client: string
  location: string
  budget: number
  status: ObraStatus
  start_date: string
  end_date?: string
  description?: string
  created_at?: string
}

// ─── FINANCEIRO ──────────────────────────────────────────────────────────────

export type FinanceiroType = 'entrada' | 'saida'
export type FinanceiroStatus = 'pago' | 'pendente' | 'atrasado'

export type Financeiro = {
  id: string
  obra_id: string
  description: string
  category: string
  type: FinanceiroType
  value: number
  status: FinanceiroStatus
  date: string
  created_at?: string
}

// ─── MEDIÇÃO ─────────────────────────────────────────────────────────────────

export type MedicaoStatus = 'aprovado' | 'em_analise' | 'pendente' | 'rejeitado'

export type Medicao = {
  id: string
  obra_id: string
  numero: string
  description: string
  percentage: number
  value: number
  date: string
  periodo?: string
  status: MedicaoStatus
  created_at?: string
}

// ─── PLANEJAMENTO / CRONOGRAMA ────────────────────────────────────────────────

export type EtapaStatus = 'concluida' | 'em_andamento' | 'planejada' | 'atrasada'

export type Etapa = {
  id: string
  obra_id: string
  nome: string
  ordem: number
  data_inicio: string
  data_fim: string
  duracao_dias: number
  percentual_fisico: number
  percentual_financeiro: number
  predecessora_id?: string
  status: EtapaStatus
  created_at?: string
}

// ─── PLANILHAS (VENDA / CUSTO PLAN / CUSTO REAL) ──────────────────────────────

export type PlanilhaTipo = 'venda' | 'custo_planejado' | 'custo_real'

export type PlanilhaCategoria = {
  id: string
  obra_id: string
  tipo: PlanilhaTipo
  nome: string
  ordem: number
  collapsed?: boolean
  created_at?: string
}

export type PlanilhaItem = {
  id: string
  categoria_id: string
  obra_id: string
  tipo: PlanilhaTipo
  codigo: string
  descricao: string
  quantidade: number
  unidade: string
  valor_unitario: number
  ordem: number
  created_at?: string
}

// ─── EQUIPE ───────────────────────────────────────────────────────────────────

export type MembroRole = 'engenheiro' | 'arquiteto' | 'mestre' | 'tecnico' | 'outro'

export type Membro = {
  id: string
  obra_id: string
  nome: string
  cargo: string
  registro?: string
  especialidade?: string
  telefone?: string
  email?: string
  created_at?: string
}

// ─── DOCUMENTOS / CONTRATOS ───────────────────────────────────────────────────

export type DocumentoTipo = 'contrato' | 'projeto' | 'art' | 'foto' | 'planilha' | 'outro'

export type Documento = {
  id: string
  obra_id: string
  nome: string
  tipo: DocumentoTipo
  tamanho_kb?: number
  url?: string
  descricao?: string
  data_upload: string
  created_at?: string
}
