import { supabase } from '@/lib/supabaseClient'

export async function getPayroll(month: string) {
  const { data, error } = await supabase
    .from('folha_pagamento')
    .select(`
      *,
      funcionarios (
        nome
      )
    `)
    .eq('mes', month)

  if (error) {
    console.error(error)
    return []
  }

  return data || []
}

export async function createPayroll(item: any) {
  const { error } = await supabase
    .from('folha_pagamento')
    .insert([item])

  if (error) {
    console.error(error)
  }
}