import { supabase } from '@/lib/supabaseClient'
import { EmpresaConfig } from '@/types'

// Configuração única da empresa (linha singleton em empresa_config — mig 0014).
// Guarda identidade da empresa + responsável técnico, compartilhados por todas
// as obras (nuvem, sem localStorage).

export async function getEmpresaConfig(): Promise<EmpresaConfig | null> {
  const { data, error } = await supabase
    .from('empresa_config')
    .select('*')
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('getEmpresaConfig error:', error)
    return null
  }
  return data
}

export async function upsertEmpresaConfig(
  payload: Partial<EmpresaConfig>
): Promise<EmpresaConfig | null> {
  const { data, error } = await supabase
    .from('empresa_config')
    .upsert({ singleton: true, ...payload }, { onConflict: 'singleton' })
    .select()
    .single()

  if (error) {
    console.error('upsertEmpresaConfig error:', error)
    return null
  }
  return data
}
