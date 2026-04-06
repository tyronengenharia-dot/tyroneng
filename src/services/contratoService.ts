import { supabase } from '@/lib/supabaseClient'
import { Contrato, ContratoStatus } from '@/types/contrato'

// ── Row do banco (snake_case) ─────────────────────────────────────────────────
interface ContratoRow {
  id:           string
  name:         string
  client:       string
  client_email: string | null
  client_cnpj:  string | null
  value:        number | null
  start_date:   string
  end_date:     string
  status:       string
  file_url:     string | null
  description:  string | null
  tags:         string[] | null
  created_at:   string
  updated_at:   string
}

// ── Conversões ────────────────────────────────────────────────────────────────
function rowToContrato(row: ContratoRow): Contrato {
  return {
    id:           row.id,
    name:         row.name,
    client:       row.client,
    client_email: row.client_email ?? undefined,
    client_cnpj:  row.client_cnpj  ?? undefined,
    value:        row.value        ?? undefined,
    start_date:   row.start_date,
    end_date:     row.end_date,
    status:       row.status as ContratoStatus,
    file_url:     row.file_url    ?? undefined,
    description:  row.description ?? undefined,
    tags:         row.tags        ?? undefined,
    created_at:   row.created_at,
  }
}

function contratoToInsert(c: Omit<Contrato, 'id'>): Omit<ContratoRow, 'id' | 'updated_at'> {
  return {
    name:         c.name,
    client:       c.client,
    client_email: c.client_email ?? null,
    client_cnpj:  c.client_cnpj  ?? null,
    value:        c.value        ?? null,
    start_date:   c.start_date,
    end_date:     c.end_date,
    status:       c.status,
    file_url:     c.file_url     ?? null,
    description:  c.description  ?? null,
    tags:         c.tags         ?? null,
    created_at:   c.created_at   ?? new Date().toISOString(),
  }
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

/** Lista todos os contratos, mais recente primeiro */
export async function getContratos(): Promise<Contrato[]> {
  const { data, error } = await supabase
    .from('contratos')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Erro ao listar contratos: ${error.message}`)
  return (data as ContratoRow[]).map(rowToContrato)
}

/** Busca um contrato pelo ID */
export async function getContrato(id: string): Promise<Contrato | null> {
  const { data, error } = await supabase
    .from('contratos')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw new Error(`Erro ao buscar contrato: ${error.message}`)
  }
  return rowToContrato(data as ContratoRow)
}

/** Cria um novo contrato */
export async function criarContrato(c: Omit<Contrato, 'id'>): Promise<Contrato> {
  const { data, error } = await supabase
    .from('contratos')
    .insert(contratoToInsert(c))
    .select()
    .single()

  if (error) throw new Error(`Erro ao criar contrato: ${error.message}`)
  return rowToContrato(data as ContratoRow)
}

/** Atualiza campos de um contrato */
export async function atualizarContrato(
  id: string,
  updates: Partial<Omit<Contrato, 'id'>>
): Promise<Contrato> {
  const row: Partial<ContratoRow> = {}
  if (updates.name         !== undefined) row.name         = updates.name
  if (updates.client       !== undefined) row.client       = updates.client
  if (updates.client_email !== undefined) row.client_email = updates.client_email ?? null
  if (updates.client_cnpj  !== undefined) row.client_cnpj  = updates.client_cnpj  ?? null
  if (updates.value        !== undefined) row.value        = updates.value        ?? null
  if (updates.start_date   !== undefined) row.start_date   = updates.start_date
  if (updates.end_date     !== undefined) row.end_date     = updates.end_date
  if (updates.status       !== undefined) row.status       = updates.status
  if (updates.file_url     !== undefined) row.file_url     = updates.file_url     ?? null
  if (updates.description  !== undefined) row.description  = updates.description  ?? null
  if (updates.tags         !== undefined) row.tags         = updates.tags         ?? null

  const { data, error } = await supabase
    .from('contratos')
    .update(row)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`Erro ao atualizar contrato: ${error.message}`)
  return rowToContrato(data as ContratoRow)
}

/** Exclui um contrato permanentemente */
export async function excluirContrato(id: string): Promise<void> {
  const { error } = await supabase
    .from('contratos')
    .delete()
    .eq('id', id)

  if (error) throw new Error(`Erro ao excluir contrato: ${error.message}`)
}

// ── Helpers de formatação (mantidos para uso nos componentes) ──────────────────
export function formatCurrency(value?: number): string {
  if (value == null) return '—'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatDate(date?: string): string {
  if (!date) return '—'
  const [year, month, day] = date.split('-')
  return `${day}/${month}/${year}`
}

export function getDaysUntilEnd(end_date: string): number {
  const today = new Date()
  const end = new Date(end_date)
  return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}