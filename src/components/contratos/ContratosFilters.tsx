'use client'

import { ContratoStatus } from '@/types/contrato'

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'ativo', label: 'Ativos' },
  { value: 'pendente', label: 'Pendentes' },
  { value: 'finalizado', label: 'Finalizados' },
  { value: 'cancelado', label: 'Cancelados' },
]

interface ContratosFiltersProps {
  status: string
  setStatus: (s: string) => void
  search: string
  setSearch: (s: string) => void
  counts: Record<string, number>
}

export function ContratosFilters({
  status,
  setStatus,
  search,
  setSearch,
  counts,
}: ContratosFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
      {/* Status tabs */}
      <div className="flex gap-1 bg-white/5 p-1 rounded-xl">
        {STATUS_OPTIONS.map(opt => {
          const count = opt.value === 'todos'
            ? Object.values(counts).reduce((a, b) => a + b, 0)
            : (counts[opt.value] ?? 0)

          return (
            <button
              key={opt.value}
              onClick={() => setStatus(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                status === opt.value
                  ? 'bg-white text-black shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {opt.label}
              {count > 0 && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-md font-mono ${
                    status === opt.value
                      ? 'bg-black/10 text-black'
                      : 'bg-white/10 text-gray-400'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome ou cliente..."
          className="bg-white/5 border border-white/10 text-white text-sm pl-9 pr-4 py-2 rounded-xl w-72 placeholder:text-gray-500 focus:outline-none focus:border-white/30 transition-colors"
        />
      </div>
    </div>
  )
}
