import { supabase } from '@/lib/supabaseClient'
import { DiarioObra, Risco } from '@/types/diario-riscos'

// ─── DIÁRIO DE OBRA ──────────────────────────────────────────────────────────

export async function getDiariosByObra(obra_id: string): Promise<DiarioObra[]> {
  const { data, error } = await supabase
    .from('diarios_obra')
    .select('*')
    .eq('obra_id', obra_id)
    .order('data', { ascending: false })

  if (error) { console.error(error); return [] }
  return data ?? []
}

export async function getDiarioById(id: string): Promise<DiarioObra | null> {
  const { data, error } = await supabase
    .from('diarios_obra')
    .select('*')
    .eq('id', id)
    .single()

  if (error) { console.error(error); return null }
  return data
}

export async function createDiario(
  payload: Omit<DiarioObra, 'id' | 'created_at' | 'updated_at'>
): Promise<DiarioObra | null> {
  const { data, error } = await supabase
    .from('diarios_obra')
    .insert(payload)
    .select()
    .single()

  if (error) { console.error(error); return null }
  return data
}

export async function updateDiario(
  id: string,
  payload: Partial<Omit<DiarioObra, 'id' | 'created_at'>>
): Promise<DiarioObra | null> {
  const { data, error } = await supabase
    .from('diarios_obra')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) { console.error(error); return null }
  return data
}

export async function deleteDiario(id: string): Promise<boolean> {
  const { error } = await supabase.from('diarios_obra').delete().eq('id', id)
  return !error
}

// ─── RISCOS ───────────────────────────────────────────────────────────────────

export async function getRiscosByObra(obra_id: string): Promise<Risco[]> {
  const { data, error } = await supabase
    .from('riscos')
    .select('*')
    .eq('obra_id', obra_id)
    .order('nivel_risco', { ascending: false })

  if (error) { console.error(error); return [] }
  return data ?? []
}

export async function createRisco(
  payload: Omit<Risco, 'id' | 'created_at'>
): Promise<Risco | null> {
  const { data, error } = await supabase
    .from('riscos')
    .insert(payload)
    .select()
    .single()

  if (error) { console.error(error); return null }
  return data
}

export async function updateRisco(
  id: string,
  payload: Partial<Omit<Risco, 'id' | 'created_at'>>
): Promise<Risco | null> {
  const { data, error } = await supabase
    .from('riscos')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) { console.error(error); return null }
  return data
}

export async function deleteRisco(id: string): Promise<boolean> {
  const { error } = await supabase.from('riscos').delete().eq('id', id)
  return !error
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PROB_SCORE: Record<string, number> = {
  muito_baixa: 1, baixa: 2, media: 3, alta: 4, muito_alta: 5,
}
const IMPACTO_SCORE: Record<string, number> = {
  muito_baixo: 1, baixo: 2, medio: 3, alto: 4, muito_alto: 5,
}

export function calcNivelRisco(probabilidade: string, impacto: string): number {
  return (PROB_SCORE[probabilidade] ?? 1) * (IMPACTO_SCORE[impacto] ?? 1)
}

export function nivelRiscoLabel(nivel: number): { label: string; color: string } {
  if (nivel >= 15) return { label: 'Crítico',  color: 'red' }
  if (nivel >= 9)  return { label: 'Alto',     color: 'orange' }
  if (nivel >= 4)  return { label: 'Médio',    color: 'amber' }
  return              { label: 'Baixo',     color: 'green' }
}
