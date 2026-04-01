import { supabase } from '@/lib/supabaseClient'
import { FinancialRecord } from '@/types/financial'

export async function getFinancialRecords(page = 1, limit = 10) {
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error, count } = await supabase
    .from('financial_records')
    .select('*', { count: 'exact' })
    .range(from, to)
    .order('date', { ascending: false })

  if (error) throw error

  return { data: data as FinancialRecord[], count }
}

export async function createFinancialRecord(record: Omit<FinancialRecord, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('financial_records')
    .insert([record])
    .select()
    .single()

  if (error) throw error
  return data as FinancialRecord
}

export async function updateFinancialRecord(
  id: string,
  record: Partial<Omit<FinancialRecord, 'id' | 'created_at'>>
) {
  const { data, error } = await supabase
    .from('financial_records')
    .update(record)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as FinancialRecord
}

export async function deleteFinancialRecord(id: string) {
  const { error } = await supabase
    .from('financial_records')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function uploadReceipt(file: File): Promise<string> {
  const ext = file.name.split('.').pop()
  const filePath = `receipts/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('receipts')
    .upload(filePath, file, { upsert: false })

  if (uploadError) throw uploadError

  const { data } = supabase.storage
    .from('receipts')
    .getPublicUrl(filePath)

  return data.publicUrl
}