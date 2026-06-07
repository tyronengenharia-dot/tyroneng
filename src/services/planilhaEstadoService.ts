import { supabase } from '@/lib/supabaseClient'
import { PlanilhaHeader, PlanilhaStatus, PlanilhaTipo } from '@/types'

// Estado/bloqueio das planilhas de uma obra (tabela `planilhas`).
// Se a migration ainda não foi aplicada, retorna [] (modo legado, sem bloqueio).
export async function getPlanilhasStatus(obra_id: string): Promise<PlanilhaHeader[]> {
  const { data, error } = await supabase
    .from('planilhas')
    .select('id, obra_id, tipo, aditivo_numero, status')
    .eq('obra_id', obra_id)
    .order('tipo', { ascending: true })

  if (error) {
    console.warn('getPlanilhasStatus (modo legado?):', error.message)
    return []
  }
  return (data ?? []) as PlanilhaHeader[]
}

// Espelha a função SQL planilha_editavel(tipo, status).
export function planilhaEditavel(tipo: PlanilhaTipo, status: PlanilhaStatus): boolean {
  switch (tipo) {
    case 'venda':
    case 'custo_planejado':
    case 'aditivo':
      return status === 'rascunho'
    case 'custo_real':
      return status === 'liberada'
    default:
      return false
  }
}

// ── Transições (RPCs atômicas no Postgres) ───────────────────────────────────

export async function fecharVenda(obra_id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('fechar_venda', { p_obra_id: obra_id })
  return { error: error?.message ?? null }
}

export async function aprovarCustoPlanejado(obra_id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('aprovar_custo_planejado', { p_obra_id: obra_id })
  return { error: error?.message ?? null }
}

// Quantos itens o Custo Real já tem — decide o fluxo de reabertura:
// 0 => reabre direto; >0 => exige confirmação destrutiva (apaga o Custo Real).
export async function custoRealTemItens(obra_id: string): Promise<number> {
  const { count, error } = await supabase
    .from('planilha_itens')
    .select('*', { count: 'exact', head: true })
    .eq('obra_id', obra_id)
    .eq('tipo', 'custo_real')
  if (error) {
    console.warn('custoRealTemItens:', error.message)
    return 0
  }
  return count ?? 0
}

// Reabre o Custo Planejado aprovado. Se o Custo Real tiver dados, exige
// apagarCustoReal = true (a UI obtém a dupla confirmação do usuário antes).
export async function reabrirCustoPlanejado(
  obra_id: string,
  apagarCustoReal: boolean
): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('reabrir_custo_planejado', {
    p_obra_id: obra_id,
    p_apagar_custo_real: apagarCustoReal,
  })
  return { error: error?.message ?? null }
}

export async function criarAditivo(obra_id: string): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await supabase.rpc('criar_aditivo', { p_obra_id: obra_id })
  return { id: (data as string) ?? null, error: error?.message ?? null }
}

export async function fecharAditivo(planilha_id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('fechar_aditivo', { p_planilha_id: planilha_id })
  return { error: error?.message ?? null }
}
