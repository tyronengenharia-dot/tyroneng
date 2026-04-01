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
}

export interface Professional {
  id: string
  name: string
  role: ProfessionalRole
  registrationNumber: string // CREA/CAU
  avatar?: string
  email: string
  phone: string
  specialty: string[]
  documents: AcervoDocument[]
  documentStatus: DocumentStatus // overall status
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
