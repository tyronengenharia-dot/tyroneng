export type DocumentCategory =
  | 'ART'
  | 'Alvará'
  | 'Certificado'
  | 'Contrato'
  | 'Projeto'
  | 'Licença'
  | 'Habilitação'
  | 'Registro'
  | 'Outros'

export type DocumentStatus = 'valid' | 'expiring' | 'expired' | 'pending'

export type ProfessionalRole =
  | 'Engenheiro Civil'
  | 'Engenheiro Elétrico'
  | 'Engenheiro Mecânico'
  | 'Arquiteto'
  | 'Técnico em Edificações'
  | 'Mestre de Obras'
  | 'Gestor de Projetos'

export interface AcervoDocument {
  id: string
  name: string
  category: DocumentCategory
  fileUrl: string
  fileType: 'pdf' | 'image' | 'doc'
  sizeMb: number
  uploadedAt: string
  expiresAt?: string
  status: DocumentStatus
  description?: string
  tags?: string[]
  diasRenovar?: number
  orgao?: string
  numero?: string
  urlEmissao?: string
  // caminho interno no bucket — necessário para deletar do Storage
  arquivoPath?: string
}

export interface Professional {
  id: string
  name: string
  role: string
  registrationNumber: string
  avatar?: string
  email: string
  phone: string
  specialty: string[]
  documents: AcervoDocument[]
  documentStatus: DocumentStatus
  joinedAt: string
  active: boolean
}

export interface CompanyAcervo {
  documents: AcervoDocument[]
}

export interface AcervoStats {
  totalDocuments: number
  totalProfessionals: number
  expiringSoon: number
  expired: number
  pendingUpload: number
}

export interface DocumentFormData {
  nome: string
  orgao: string
  numero: string
  category: DocumentCategory
  dataEmissao: string
  temValidade: boolean
  dataValidade: string
  diasRenovar: string
  urlEmissao: string
  file: File | null
}
