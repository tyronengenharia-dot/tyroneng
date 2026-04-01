'use client'

import { useState } from 'react'
import { Users, Search } from 'lucide-react'
import ProfessionalCard from './ProfessionalCard'
import type { Professional, DocumentStatus } from '@/types/acervo'

interface ProfessionalsSectionProps {
  professionals: Professional[]
}

const STATUS_FILTERS: { label: string; value: DocumentStatus | 'all' }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Regular', value: 'valid' },
  { label: 'A Vencer', value: 'expiring' },
  { label: 'Vencido', value: 'expired' },
]

export default function ProfessionalsSection({ professionals }: ProfessionalsSectionProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'all'>('all')

  const filtered = professionals.filter(p => {
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
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
          <Users size={18} className="text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Acervo de Profissionais</h2>
          <p className="text-xs text-zinc-500">{professionals.length} profissionais cadastrados</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar profissional, CREA, cargo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-sm rounded-xl pl-9 pr-4 py-2 outline-none focus:border-zinc-500 w-full sm:w-72 placeholder-zinc-600"
          />
        </div>
        <div className="flex gap-2">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition
                ${statusFilter === f.value
                  ? 'bg-white text-black'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary bar */}
      <div className="flex gap-4 text-xs text-zinc-500">
        <span className="text-zinc-400 font-medium">{filtered.length} exibidos</span>
        <span>·</span>
        <span className="text-emerald-400">{professionals.filter(p => p.documentStatus === 'valid').length} regulares</span>
        <span>·</span>
        <span className="text-amber-400">{professionals.filter(p => p.documentStatus === 'expiring').length} a vencer</span>
        <span>·</span>
        <span className="text-red-400">{professionals.filter(p => p.documentStatus === 'expired').length} vencidos</span>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-zinc-600">
          <Users size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum profissional encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(prof => (
            <ProfessionalCard key={prof.id} professional={prof} />
          ))}
        </div>
      )}
    </section>
  )
}
