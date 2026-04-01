import { supabase } from '@/lib/supabaseClient'

export async function uploadArquivo(file: File, userId: string) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}/${Date.now()}.${fileExt}`

  const { data, error } = await supabase.storage
    .from('documentos')
    .upload(fileName, file)

  if (error) {
    console.error('Erro upload:', error)
    throw new Error(error.message)
  }

  const { data: publicUrl } = supabase.storage
    .from('documentos')
    .getPublicUrl(fileName)

  return publicUrl.publicUrl
}