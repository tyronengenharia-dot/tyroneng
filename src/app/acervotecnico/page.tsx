import { Archive } from 'lucide-react'
import { getCompanyAcervo, getProfessionals, getAcervoStats } from '@/services/acervoService'
import { StatsGrid } from '@/components/acervo'
import AcervoTabs from '@/components/acervo/AcervoTabs'

export const metadata = {
  title: 'Acervo Técnico',
}

export default async function AcervoTecnicoPage() {
  const [companyAcervo, professionals, stats] = await Promise.all([
    getCompanyAcervo(),
    getProfessionals(),
    getAcervoStats(),
  ])

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#c8f65d]/10 border border-[#c8f65d]/20 flex items-center justify-center">
              <Archive size={20} className="text-[#c8f65d]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                DOCUMENTOS GERAIS
              </h1>
              <p className="text-sm text-zinc-500">
                Gestão de documentos da empresa e dos profissionais
              </p>
            </div>
          </div>
          <div className="text-xs text-zinc-600 sm:text-right">
            <p>Última atualização</p>
            <p className="text-zinc-400 font-medium">
              {new Date().toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Stats */}
        <StatsGrid stats={stats} />

        <div className="border-t border-zinc-800/60" />

        {/* Tabs: Empresa / Profissionais */}
        <AcervoTabs
          companyDocuments={companyAcervo.documents}
          professionals={professionals}
        />

      </div>
    </div>
  )
}
