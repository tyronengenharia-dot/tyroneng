import { supabase } from '@/lib/supabaseClient'
import type {
  AcervoDocument,
  AcervoStats,
  CompanyAcervo,
  DocumentCategory,
  DocumentFormData,
  DocumentStatus,
  Professional,
} from '@/types/acervo'

// ─── Mappers: DB (snake_case) → App (camelCase) ───────────────────────────────

function mapDocumento(row: any): AcervoDocument {
  return {
    id: row.id,
    name: row.nome,
    category: row.categoria as DocumentCategory,
    fileUrl: row.arquivo_url ?? '',
    fileType: (row.arquivo_tipo ?? 'pdf') as AcervoDocument['fileType'],
    sizeMb: row.arquivo_tamanho_mb ?? 0,
    uploadedAt: row.created_at?.split('T')[0] ?? '',
    expiresAt: row.data_validade ?? undefined,
    status: (row.status ?? 'valid') as DocumentStatus,
    description: row.descricao ?? undefined,
    tags: row.tags ?? [],
    diasRenovar: row.dias_renovar ?? 0,
    orgao: row.orgao ?? undefined,
    numero: row.numero ?? undefined,
    urlEmissao: row.url_emissao ?? undefined,
    arquivoPath: row.arquivo_path ?? undefined,
  }
}

function mapProfissional(row: any): Professional {
  const docs: AcervoDocument[] = (row.acervo_documentos ?? []).map(mapDocumento)

  let documentStatus: DocumentStatus = 'valid'
  if (docs.some((d) => d.status === 'expired')) documentStatus = 'expired'
  else if (docs.some((d) => d.status === 'expiring')) documentStatus = 'expiring'

  return {
    id: row.id,
    name: row.nome,
    role: row.cargo,
    registrationNumber: row.registro_numero,
    email: row.email ?? '',
    phone: row.telefone ?? '',
    specialty: row.especialidades ?? [],
    avatar: row.avatar_url ?? undefined,
    active: row.ativo ?? true,
    joinedAt: row.entrou_em ?? '',
    documents: docs,
    documentStatus,
  }
}

// ─── Documentos da empresa ────────────────────────────────────────────────────

export async function getCompanyAcervo(): Promise<CompanyAcervo> {
  const { data, error } = await supabase
    .from('acervo_documentos')
    .select('*')
    .eq('tipo_dono', 'empresa')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return { documents: (data ?? []).map(mapDocumento) }
}

// ─── Profissionais + seus documentos ─────────────────────────────────────────

export async function getProfessionals(): Promise<Professional[]> {
  const { data, error } = await supabase
    .from('profissionais')
    .select(`
      *,
      acervo_documentos (*)
    `)
    .order('nome', { ascending: true })

  if (error) throw new Error(error.message)

  return (data ?? []).map(mapProfissional)
}

// ─── Estatísticas do topo ─────────────────────────────────────────────────────

export async function getAcervoStats(): Promise<AcervoStats> {
  const [docsRes, profsRes] = await Promise.all([
    supabase.from('acervo_documentos').select('status'),
    supabase.from('profissionais').select('id', { count: 'exact', head: true }),
  ])

  if (docsRes.error) throw new Error(docsRes.error.message)
  if (profsRes.error) throw new Error(profsRes.error.message)

  const docs = docsRes.data ?? []

  return {
    totalDocuments: docs.length,
    totalProfessionals: profsRes.count ?? 0,
    expiringSoon: docs.filter((d) => d.status === 'expiring').length,
    expired: docs.filter((d) => d.status === 'expired').length,
    pendingUpload: 0,
  }
}

// ─── Upload de arquivo no Storage ─────────────────────────────────────────────

async function uploadArquivo(
  file: File,
  userId: string
): Promise<{ url: string; path: string }> {
  const ext = file.name.split('.').pop()
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage
    .from('acervo')
    .upload(path, file, { cacheControl: '3600', upsert: false })

  if (error) throw new Error(`Erro no upload: ${error.message}`)

  const { data } = supabase.storage.from('acervo').getPublicUrl(path)

  return { url: data.publicUrl, path }
}

// ─── Criar documento ──────────────────────────────────────────────────────────

export async function createDocument(
  formData: DocumentFormData,
  target: { type: 'company' } | { type: 'professional'; professionalId: string }
): Promise<AcervoDocument> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Usuário não autenticado')

  let arquivo_url: string | null = null
  let arquivo_path: string | null = null
  let arquivo_tipo: string | null = null
  let arquivo_tamanho_mb: number | null = null

  if (formData.file) {
    const uploaded = await uploadArquivo(formData.file, user.id)
    arquivo_url = uploaded.url
    arquivo_path = uploaded.path
    arquivo_tipo = formData.file.type.includes('pdf')
      ? 'pdf'
      : formData.file.type.includes('image')
      ? 'image'
      : 'doc'
    arquivo_tamanho_mb = parseFloat((formData.file.size / 1_000_000).toFixed(2))
  }

  const payload = {
    user_id: user.id,
    tipo_dono: target.type === 'company' ? 'empresa' : 'profissional',
    profissional_id: target.type === 'professional' ? target.professionalId : null,
    nome: formData.nome.trim(),
    categoria: formData.category,
    orgao: formData.orgao || null,
    numero: formData.numero || null,
    tags: [],
    arquivo_url,
    arquivo_path,
    arquivo_tipo,
    arquivo_tamanho_mb,
    data_emissao: formData.dataEmissao || null,
    tem_validade: formData.temValidade,
    data_validade: formData.temValidade && formData.dataValidade
      ? formData.dataValidade
      : null,
    dias_renovar: formData.temValidade ? parseInt(formData.diasRenovar) || 0 : 0,
    url_emissao: formData.urlEmissao || null,
    // 'status' é calculado automaticamente pelo trigger no banco
  }

  const { data, error } = await supabase
    .from('acervo_documentos')
    .insert(payload)
    .select()
    .single()

  if (error) throw new Error(error.message)

  return mapDocumento(data)
}

// ─── Deletar documento ────────────────────────────────────────────────────────

export async function deleteDocument(
  docId: string,
  arquivoPath?: string
): Promise<void> {
  // Remove arquivo do Storage primeiro (sem erro se não existir)
  if (arquivoPath) {
    await supabase.storage.from('acervo').remove([arquivoPath])
  }

  const { error } = await supabase
    .from('acervo_documentos')
    .delete()
    .eq('id', docId)

  if (error) throw new Error(error.message)
}
