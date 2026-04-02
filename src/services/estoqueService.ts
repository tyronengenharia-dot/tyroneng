import { supabase } from '@/lib/supabaseClient'

// ─── Materiais ───────────────────────────────────────────────────────────────

export async function getMateriais() {
  const { data, error } = await supabase
    .from('materiais')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createMaterial(payload: any) {
  const { error } = await supabase.from('materiais').insert(payload)
  if (error) throw error
}

export async function updateMaterial(id: string, payload: any) {
  const { error } = await supabase.from('materiais').update(payload).eq('id', id)
  if (error) throw error
}

export async function deleteMaterial(id: string) {
  const { error } = await supabase.from('materiais').delete().eq('id', id)
  if (error) throw error
}

// ─── Veículos ────────────────────────────────────────────────────────────────

export async function getVeiculos() {
  const { data, error } = await supabase
    .from('veiculos')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createVeiculo(payload: any) {
  const { error } = await supabase.from('veiculos').insert(payload)
  if (error) throw error
}

export async function updateVeiculo(id: string, payload: any) {
  const { error } = await supabase.from('veiculos').update(payload).eq('id', id)
  if (error) throw error
}

export async function deleteVeiculo(id: string) {
  const { error } = await supabase.from('veiculos').delete().eq('id', id)
  if (error) throw error
}

// ─── Equipamentos ────────────────────────────────────────────────────────────

export async function getEquipamentos() {
  const { data, error } = await supabase
    .from('equipamentos')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createEquipamento(payload: any) {
  const { error } = await supabase.from('equipamentos').insert(payload)
  if (error) throw error
}

export async function updateEquipamento(id: string, payload: any) {
  const { error } = await supabase.from('equipamentos').update(payload).eq('id', id)
  if (error) throw error
}

export async function deleteEquipamento(id: string) {
  const { error } = await supabase.from('equipamentos').delete().eq('id', id)
  if (error) throw error
}

// ─── Maquinários ─────────────────────────────────────────────────────────────

export async function getMaquinarios() {
  const { data, error } = await supabase
    .from('maquinarios')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createMaquinario(payload: any) {
  const { error } = await supabase.from('maquinarios').insert(payload)
  if (error) throw error
}

export async function updateMaquinario(id: string, payload: any) {
  const { error } = await supabase.from('maquinarios').update(payload).eq('id', id)
  if (error) throw error
}

export async function deleteMaquinario(id: string) {
  const { error } = await supabase.from('maquinarios').delete().eq('id', id)
  if (error) throw error
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export async function getEstoqueStats() {
  const [materiais, veiculos, equipamentos, maquinarios] = await Promise.all([
    supabase.from('materiais').select('id, valor_unitario, quantidade'),
    supabase.from('veiculos').select('id, status'),
    supabase.from('equipamentos').select('id, status, valor'),
    supabase.from('maquinarios').select('id, status, custo_hora'),
  ])

  const totalMateriais = materiais.data?.length ?? 0
  const valorMateriais = materiais.data?.reduce(
    (acc, m) => acc + (m.valor_unitario ?? 0) * (m.quantidade ?? 0), 0
  ) ?? 0

  const totalEquipamentos = equipamentos.data?.length ?? 0
  const valorEquipamentos = equipamentos.data?.reduce(
    (acc, e) => acc + (e.valor ?? 0), 0
  ) ?? 0

  const emManutencao = [
    ...(veiculos.data ?? []),
    ...(equipamentos.data ?? []),
    ...(maquinarios.data ?? []),
  ].filter(i => i.status === 'manutencao').length

  const totalAtivos =
    totalMateriais +
    (veiculos.data?.length ?? 0) +
    totalEquipamentos +
    (maquinarios.data?.length ?? 0)

  return {
    totalAtivos,
    valorTotal: valorMateriais + valorEquipamentos,
    emManutencao,
    totalVeiculos: veiculos.data?.length ?? 0,
  }
}