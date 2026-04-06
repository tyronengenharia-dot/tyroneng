import { supabase } from '@/lib/supabaseClient'
import { Licitacao, LicitacaoFormData, LicitacaoStatus, ChecklistItem, ChecklistStatus } from '@/types/licitacao'


// ─── helpers banco → app ──────────────────────────────────────────────────────

function rowToLicitacao(row: any, checklist: ChecklistItem[] = []): Licitacao {
  return {
    id:            row.id,
    titulo:        row.titulo,
    orgao:         row.orgao,
    local:         row.local,
    valorEstimado: Number(row.valor_estimado),
    dataEntrega:   row.data_entrega  ?? '',
    dataDisputa:   row.data_disputa  ?? '',
    horaDisputa:   row.hora_disputa  ?? '',
    status:        row.status as LicitacaoStatus,
    modalidade:    row.modalidade,
    processo:      row.processo,
    lote:          row.lote,
    plataforma:    row.plataforma,
    responsavel:   row.responsavel,
    observacoes:   row.observacoes,
    checklist,
  }
}

function rowToChecklistItem(row: any): ChecklistItem {
  return {
    id:          row.id,
    nome:        row.nome,
    categoria:   row.categoria,
    status:      row.status,
    responsavel: row.responsavel ?? '',
  }
}

function formToRow(data: LicitacaoFormData) {
  return {
    titulo:         data.titulo,
    orgao:          data.orgao,
    local:          data.local,
    valor_estimado: data.valorEstimado,
    data_entrega:   data.dataEntrega  || null,
    data_disputa:   data.dataDisputa  || null,
    hora_disputa:   data.horaDisputa  || '',
    modalidade:     data.modalidade,
    processo:       data.processo,
    lote:           data.lote,
    plataforma:     data.plataforma,
    responsavel:    data.responsavel,
    observacoes:    data.observacoes,
  }
}

// ─── licitações ───────────────────────────────────────────────────────────────

export async function getLicitacoes(): Promise<Licitacao[]> {
  const { data: lics, error } = await supabase
    .from('licitacoes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  if (!lics?.length) return []

  const ids = lics.map(l => l.id)

  const { data: clRows, error: clErr } = await supabase
    .from('licitacao_checklist')
    .select('*')
    .in('licitacao_id', ids)
    .order('ordem', { ascending: true })

  if (clErr) throw clErr

  return lics.map(row => {
    const checklist = (clRows ?? [])
      .filter(c => c.licitacao_id === row.id)
      .map(rowToChecklistItem)
    return rowToLicitacao(row, checklist)
  })
}

export async function getLicitacaoById(id: string): Promise<Licitacao | null> {
  const { data: row, error } = await supabase
    .from('licitacoes')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null

  const { data: clRows } = await supabase
    .from('licitacao_checklist')
    .select('*')
    .eq('licitacao_id', id)
    .order('ordem', { ascending: true })

  const checklist = (clRows ?? []).map(rowToChecklistItem)
  return rowToLicitacao(row, checklist)
}

export async function createLicitacao(
  data: LicitacaoFormData,
  userId: string
): Promise<Licitacao> {
  const { data: row, error } = await supabase
    .from('licitacoes')
    .insert({ ...formToRow(data), user_id: userId, status: 'analise' })
    .select()
    .single()

  if (error) throw error
  return rowToLicitacao(row)
}

export async function updateLicitacao(id: string, data: LicitacaoFormData, checklist: { id: string; descricao: any; status: ChecklistStatus; observacao: any }[]): Promise<void> {
  const { error } = await supabase
    .from('licitacoes')
    .update(formToRow(data))
    .eq('id', id)

  if (error) throw error
}

export async function updateStatus(id: string, status: LicitacaoStatus): Promise<void> {
  const { error } = await supabase
    .from('licitacoes')
    .update({ status })
    .eq('id', id)

  if (error) throw error
}

export async function deleteLicitacao(id: string): Promise<void> {
  const { error } = await supabase
    .from('licitacoes')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ─── checklist ────────────────────────────────────────────────────────────────

export async function addChecklistItem(
  licitacaoId: string,
  item: Omit<ChecklistItem, 'id'>
): Promise<ChecklistItem> {
  const { data: row, error } = await supabase
    .from('licitacao_checklist')
    .insert({
      licitacao_id: licitacaoId,
      nome:         item.nome,
      categoria:    item.categoria,
      status:       item.status,
      responsavel:  item.responsavel ?? '',
    })
    .select()
    .single()

  if (error) throw error
  return rowToChecklistItem(row)
}

export async function updateChecklistItem(
  itemId: string,
  fields: Partial<Pick<ChecklistItem, 'status' | 'nome' | 'categoria' | 'responsavel'>>
): Promise<void> {
  const { error } = await supabase
    .from('licitacao_checklist')
    .update(fields)
    .eq('id', itemId)

  if (error) throw error
}

export async function deleteChecklistItem(itemId: string): Promise<void> {
  const { error } = await supabase
    .from('licitacao_checklist')
    .delete()
    .eq('id', itemId)

  if (error) throw error
}

// Substitui todos os itens de uma vez (útil se quiser sync completo)
export async function replaceChecklist(
  licitacaoId: string,
  items: ChecklistItem[]
): Promise<void> {
  const { error: delErr } = await supabase
    .from('licitacao_checklist')
    .delete()
    .eq('licitacao_id', licitacaoId)

  if (delErr) throw delErr
  if (!items.length) return

  const rows = items.map((item, i) => ({
    id:           item.id,
    licitacao_id: licitacaoId,
    nome:         item.nome,
    categoria:    item.categoria,
    status:       item.status,
    responsavel:  item.responsavel ?? '',
    ordem:        i,
  }))

  const { error } = await supabase
    .from('licitacao_checklist')
    .upsert(rows)

  if (error) throw error
}
