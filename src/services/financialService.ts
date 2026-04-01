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

  return { data, count }
}

async function handleFile(e: any) {
  const file = e.target.files[0]

  if (!file) return

  const url = await uploadReceipt(file)

  setForm({ ...form, receipt_url: url })
}

export async function createFinancialRecord(record: any) {
  return supabase.from('financial_records').insert([record])
}

export async function updateFinancialRecord(id: string, record: any) {
  return supabase
    .from('financial_records')
    .update(record)
    .eq('id', id)
}

export async function deleteFinancialRecord(id: string) {
  return supabase
    .from('financial_records')
    .delete()
    .eq('id', id)
}

export async function uploadReceipt(file: File) {
  const filePath = `receipts/${Date.now()}-${file.name}`

  const { data, error } = await supabase.storage
    .from('receipts')
    .upload(filePath, file)

  if (error) throw error

  const { data: publicUrl } = supabase.storage
    .from('receipts')
    .getPublicUrl(filePath)

  return publicUrl.publicUrl
}

function setForm(arg0: any) {
  throw new Error('Function not implemented.')
}
