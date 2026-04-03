'use client'

import { useState } from 'react'
import { Building2, Users } from 'lucide-react'
import CompanyAcervoSection from '@/components/acervo/CompanyAcervoSection'
import ProfessionalsSection from '@/components/acervo/ProfessionalsSection'
import type { AcervoDocument, Professional } from '@/types/acervo'

interface AcervoTabsProps {
  companyDocuments: AcervoDocument[]
  professionals: Professional[]
}

type Tab = 'empresa' | 'profissionais'

export default function AcervoTabs({
  companyDocuments,
  professionals,
}: AcervoTabsProps) {
  const [tab, setTab] = useState<Tab>('empresa')

  return (
    <div>
      {/* Tab selector */}
      <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 w-fit mb-8">
        <button
          onClick={() => setTab('empresa')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            tab === 'empresa'
              ? 'bg-zinc-700 text-white shadow'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Building2 size={15} />
          Documentos da Empresa
        </button>
        <button
          onClick={() => setTab('profissionais')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            tab === 'profissionais'
              ? 'bg-zinc-700 text-white shadow'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Users size={15} />
          Profissionais
        </button>
      </div>

      {tab === 'empresa' && (
        <CompanyAcervoSection initialDocuments={companyDocuments} />
      )}
      {tab === 'profissionais' && (
        <ProfessionalsSection professionals={professionals} />
      )}
    </div>
  )
}
