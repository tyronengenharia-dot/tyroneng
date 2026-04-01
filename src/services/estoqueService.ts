import { supabase } from '@/lib/supabaseClient'

export async function getMateriais() {
  const { data, error } = await supabase.from('materiais').select('*')
  if (error) throw error
  return data
}

export async function createMaterial(payload: any) {
  const { error } = await supabase.from('materiais').insert(payload)
  if (error) throw error
}

export async function getVeiculos() {
  const { data, error } = await supabase.from('veiculos').select('*')
  if (error) throw error
  return data
}

export async function createVeiculo(payload: any) {
  const { error } = await supabase.from('veiculos').insert(payload)
  if (error) throw error
}

export async function deleteVeiculo(id: string) {
  const { error } = await supabase.from('veiculos').delete().eq('id', id)
  if (error) throw error
}

export async function getEquipamentos() {
  const { data, error } = await supabase
    .from('equipamentos')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function createEquipamento(payload: any) {
  const { error } = await supabase
    .from('equipamentos')
    .insert(payload)

  if (error) throw error
}

export async function deleteEquipamento(id: string) {
  const { error } = await supabase
    .from('equipamentos')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getMaquinarios() {
  const { data, error } = await supabase
    .from('maquinarios')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function createMaquinario(payload: any) {
  const { error } = await supabase
    .from('maquinarios')
    .insert(payload)

  if (error) throw error
}

export async function deleteMaquinario(id: string) {
  const { error } = await supabase
    .from('maquinarios')
    .delete()
    .eq('id', id)

  if (error) throw error
}