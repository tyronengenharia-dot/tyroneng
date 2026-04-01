export type ChecklistItem = {
  id: string
  text: string
  done: boolean
}

export type Compromisso = {
  id: string

  titulo: string
  title: string        // alias mapeado no frontend (= titulo)

  tipo: string
  status: 'pendente' | 'confirmado' | 'concluido' | 'cancelado'
  prioridade: 'baixa' | 'media' | 'alta'

  data: string         // ISO string raw do Supabase
  date: string         // mapeado: YYYY-MM-DD
  time: string         // mapeado: HH:MM (hora início)
  hora_fim?: string    // HH:MM

  local?: string
  endereco?: string
  responsavel?: string

  equipe?: string | null
  cliente_nome?: string | null
  cliente_contato?: string | null

  checklist?: ChecklistItem[]
  observacoes?: string
}