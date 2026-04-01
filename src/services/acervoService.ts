import type {
  Professional,
  AcervoDocument,
  CompanyAcervo,
  AcervoStats,
  DocumentCategory,
} from '@/types/acervo'

// ─── Mock Data ────────────────────────────────────────────────────────────────

const mockCompanyDocs: AcervoDocument[] = [
  {
    id: 'cdoc-1',
    name: 'Alvará de Funcionamento 2024',
    category: 'Alvará',
    fileUrl: '/docs/alvara-2024.pdf',
    fileType: 'pdf',
    sizeMb: 1.2,
    uploadedAt: '2024-01-15',
    expiresAt: '2025-01-15',
    status: 'expiring',
    description: 'Alvará municipal de funcionamento vigente.',
    tags: ['municipal', 'obrigatório'],
  },
  {
    id: 'cdoc-2',
    name: 'Registro CNPJ',
    category: 'Registro',
    fileUrl: '/docs/cnpj.pdf',
    fileType: 'pdf',
    sizeMb: 0.4,
    uploadedAt: '2023-05-10',
    status: 'valid',
    tags: ['federal', 'receita'],
  },
  {
    id: 'cdoc-3',
    name: 'ISO 9001:2015 — Certificação',
    category: 'Certificado',
    fileUrl: '/docs/iso9001.pdf',
    fileType: 'pdf',
    sizeMb: 2.1,
    uploadedAt: '2023-08-20',
    expiresAt: '2026-08-20',
    status: 'valid',
    tags: ['qualidade', 'norma'],
  },
  {
    id: 'cdoc-4',
    name: 'Inscrição no CREA-RJ',
    category: 'Registro',
    fileUrl: '/docs/crea-empresa.pdf',
    fileType: 'pdf',
    sizeMb: 0.8,
    uploadedAt: '2022-03-01',
    expiresAt: '2024-12-31',
    status: 'expired',
    tags: ['CREA', 'engenharia'],
  },
  {
    id: 'cdoc-5',
    name: 'Contrato Social Consolidado',
    category: 'Contrato',
    fileUrl: '/docs/contrato-social.pdf',
    fileType: 'pdf',
    sizeMb: 3.5,
    uploadedAt: '2020-07-14',
    status: 'valid',
    tags: ['jurídico', 'constituição'],
  },
  {
    id: 'cdoc-6',
    name: 'Licença Ambiental — Projeto Macaé',
    category: 'Licença',
    fileUrl: '/docs/licenca-ambiental.pdf',
    fileType: 'pdf',
    sizeMb: 4.2,
    uploadedAt: '2024-02-28',
    expiresAt: '2025-02-28',
    status: 'expiring',
    tags: ['INEA', 'ambiental'],
  },
]

const mockProfessionals: Professional[] = [
  {
    id: 'prof-1',
    name: 'Carlos Eduardo Mendes',
    role: 'Engenheiro Civil',
    registrationNumber: 'CREA-RJ 120.456-D',
    email: 'carlos.mendes@tyron.eng.br',
    phone: '(21) 99872-3311',
    specialty: ['Estruturas', 'Fundações', 'Perícias'],
    documentStatus: 'valid',
    joinedAt: '2019-03-01',
    active: true,
    documents: [
      {
        id: 'pd-1',
        name: 'Carteira CREA 2025',
        category: 'Registro',
        fileUrl: '/docs/p1/crea.pdf',
        fileType: 'pdf',
        sizeMb: 0.3,
        uploadedAt: '2025-01-05',
        expiresAt: '2025-12-31',
        status: 'valid',
        tags: ['CREA', 'anuidade'],
      },
      {
        id: 'pd-2',
        name: 'ART — Residencial Jardim Azul',
        category: 'ART',
        fileUrl: '/docs/p1/art-jardim.pdf',
        fileType: 'pdf',
        sizeMb: 0.6,
        uploadedAt: '2024-09-12',
        status: 'valid',
        tags: ['obra', 'residencial'],
      },
      {
        id: 'pd-3',
        name: 'Diploma de Engenharia Civil',
        category: 'Habilitação',
        fileUrl: '/docs/p1/diploma.pdf',
        fileType: 'pdf',
        sizeMb: 1.1,
        uploadedAt: '2019-01-20',
        status: 'valid',
        tags: ['UFRJ', 'formação'],
      },
    ],
  },
  {
    id: 'prof-2',
    name: 'Fernanda Lima Costa',
    role: 'Arquiteta',
    registrationNumber: 'CAU-RJ A98.231-9',
    email: 'fernanda.lima@tyron.eng.br',
    phone: '(21) 97654-1122',
    specialty: ['Projetos Arquitetônicos', 'Interiores', 'Paisagismo'],
    documentStatus: 'expiring',
    joinedAt: '2021-06-15',
    active: true,
    documents: [
      {
        id: 'pd-4',
        name: 'Registro CAU 2025',
        category: 'Registro',
        fileUrl: '/docs/p2/cau.pdf',
        fileType: 'pdf',
        sizeMb: 0.4,
        uploadedAt: '2025-01-10',
        expiresAt: '2025-06-30',
        status: 'expiring',
        tags: ['CAU', 'anuidade'],
      },
      {
        id: 'pd-5',
        name: 'RRT — Projeto Comercial Porto',
        category: 'ART',
        fileUrl: '/docs/p2/rrt-porto.pdf',
        fileType: 'pdf',
        sizeMb: 0.5,
        uploadedAt: '2024-11-03',
        status: 'valid',
        tags: ['RRT', 'comercial'],
      },
    ],
  },
  {
    id: 'prof-3',
    name: 'Rafael Teixeira Souza',
    role: 'Engenheiro Elétrico',
    registrationNumber: 'CREA-RJ 98.234-E',
    email: 'rafael.teixeira@tyron.eng.br',
    phone: '(22) 99123-7788',
    specialty: ['Instalações Elétricas', 'Subestações', 'Laudos'],
    documentStatus: 'expired',
    joinedAt: '2020-09-01',
    active: true,
    documents: [
      {
        id: 'pd-6',
        name: 'Carteira CREA — Expirada',
        category: 'Registro',
        fileUrl: '/docs/p3/crea-expired.pdf',
        fileType: 'pdf',
        sizeMb: 0.3,
        uploadedAt: '2024-01-05',
        expiresAt: '2024-12-31',
        status: 'expired',
        tags: ['CREA', 'renovação pendente'],
      },
    ],
  },
  {
    id: 'prof-4',
    name: 'Mariana Rocha Alves',
    role: 'Gestora de Projetos',
    registrationNumber: 'PMP #3289114',
    email: 'mariana.rocha@tyron.eng.br',
    phone: '(21) 98877-5544',
    specialty: ['BIM', 'Gestão de Contratos', 'Planejamento'],
    documentStatus: 'valid',
    joinedAt: '2022-02-14',
    active: true,
    documents: [
      {
        id: 'pd-7',
        name: 'Certificação PMP 2024',
        category: 'Certificado',
        fileUrl: '/docs/p4/pmp.pdf',
        fileType: 'pdf',
        sizeMb: 0.9,
        uploadedAt: '2024-03-20',
        expiresAt: '2027-03-20',
        status: 'valid',
        tags: ['PMI', 'gestão'],
      },
      {
        id: 'pd-8',
        name: 'Certificado Autodesk Revit',
        category: 'Certificado',
        fileUrl: '/docs/p4/revit.pdf',
        fileType: 'pdf',
        sizeMb: 0.7,
        uploadedAt: '2023-07-11',
        status: 'valid',
        tags: ['BIM', 'Autodesk'],
      },
    ],
  },
]

// ─── Service Functions ────────────────────────────────────────────────────────

export async function getCompanyAcervo(): Promise<CompanyAcervo> {
  return { documents: mockCompanyDocs }
}

export async function getProfessionals(): Promise<Professional[]> {
  return mockProfessionals
}

export async function getProfessionalById(id: string): Promise<Professional | null> {
  return mockProfessionals.find(p => p.id === id) ?? null
}

export async function getAcervoStats(): Promise<AcervoStats> {
  const allDocs = [
    ...mockCompanyDocs,
    ...mockProfessionals.flatMap(p => p.documents),
  ]
  return {
    totalDocuments: allDocs.length,
    totalProfessionals: mockProfessionals.length,
    expiringSoon: allDocs.filter(d => d.status === 'expiring').length,
    expired: allDocs.filter(d => d.status === 'expired').length,
    pendingUpload: mockProfessionals.filter(p => p.documentStatus === 'pending').length,
  }
}

export async function uploadDocument(
  _file: File,
  _target: { type: 'company' } | { type: 'professional'; professionalId: string },
  _category: DocumentCategory
): Promise<AcervoDocument> {
  // In production: upload to storage, save to DB
  await new Promise(r => setTimeout(r, 1500))
  return {
    id: `new-${Date.now()}`,
    name: _file.name,
    category: _category,
    fileUrl: '#',
    fileType: 'pdf',
    sizeMb: _file.size / 1_000_000,
    uploadedAt: new Date().toISOString().split('T')[0],
    status: 'valid',
  }
}

export async function deleteDocument(_docId: string): Promise<void> {
  await new Promise(r => setTimeout(r, 500))
}
