'use client'

import { useState } from 'react'
import { Users, Search, UserPlus } from 'lucide-react'
import ProfessionalCard from '@/components/acervo/ProfessionalCard'
import ProfessionalModal from '@/components/acervo/modals/ProfessionalModal'
import type { Professional, DocumentStatus } from '@/types/acervo'
import { PROFESSIONAL_STATUS_FILTERS } from '@/lib/constants'

interface ProfessionalsSectionProps {
  professionals: Professional[]
}

export default function ProfessionalsSection({
  professionals: initial,
}: ProfessionalsSectionProps) {
  const [professionals, setProfessionals] = useState<Professional[]>(initial)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'all'>('all')
  const [showNewProfModal, setShowNewProfModal] = useState(false)

  function handleNewProf(prof: Professional) {
    setProfessionals((prev) => [prof, ...prev])
  }

  const filtered = professionals.filter((p) => {
    const matchStatus = statusFilter === 'all' || p.documentStatus === statusFilter
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.role.toLowerCase().includes(search.toLowerCase()) ||
      p.registrationNumber.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  return (
    <section className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Users size={18} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Acervo de Profissionais</h2>
            <p className="text-xs text-zinc-500">
              {professionals.length} profissionais cadastrados
            </p>
          </div>
        </div>

        {/* ✅ BOTÃO NOVO PROFISSIONAL */}
        <button
          onClick={() => setShowNewProfModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/25 text-sm font-medium rounded-xl transition shrink-0"
        >
          <UserPlus size={15} />
          Novo Profissional
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por nome, registro, cargo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-sm rounded-xl pl-9 pr-4 py-2 outline-none focus:border-zinc-500 w-full sm:w-72 placeholder-zinc-600"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {PROFESSIONAL_STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value as DocumentStatus | 'all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                statusFilter === f.value
                  ? 'bg-white text-black'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Resumo */}
      <div className="flex gap-4 text-xs text-zinc-500 flex-wrap">
        <span className="text-zinc-400 font-medium">{filtered.length} exibidos</span>
        <span>·</span>
        <span className="text-emerald-400">
          {professionals.filter((p) => p.documentStatus === 'valid').length} regulares
        </span>
        <span>·</span>
        <span className="text-amber-400">
          {professionals.filter((p) => p.documentStatus === 'expiring').length} a vencer
        </span>
        <span>·</span>
        <span className="text-red-400">
          {professionals.filter((p) => p.documentStatus === 'expired').length} vencidos
        </span>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-zinc-600">
          <Users size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm mb-4">
            {professionals.length === 0
              ? 'Nenhum profissional cadastrado ainda'
              : 'Nenhum profissional encontrado'}
          </p>
          {professionals.length === 0 && (
            <button
              onClick={() => setShowNewProfModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/25 text-sm font-medium rounded-xl transition"
            >
              <UserPlus size={15} />
              Cadastrar primeiro profissional
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((prof) => (
            <ProfessionalCard key={prof.id} professional={prof} />
          ))}
        </div>
      )}

      {showNewProfModal && (
        <ProfessionalModal
          onClose={() => setShowNewProfModal(false)}
          onSave={handleNewProf}
        />
      )}
    </section>
  )
}
