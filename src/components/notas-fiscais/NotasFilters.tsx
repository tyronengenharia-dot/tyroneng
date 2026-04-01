'use client'

interface Props {
  search: string
  setSearch: (v: string) => void
  type: string
  setType: (v: string) => void
  status: string
  setStatus: (v: string) => void
}

const inputClass =
  'bg-white/5 border border-white/10 text-white placeholder:text-white/30 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-white/30 transition-colors'

export function NotasFilters({ search, setSearch, type, setType, status, setStatus }: Props) {
  return (
    <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
          width="13" height="13" viewBox="0 0 16 16" fill="none"
        >
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          placeholder="Buscar nota..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={`${inputClass} pl-9 w-56`}
        />
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        {/* Tipo */}
        <div className="flex gap-1">
          {[
            { label: 'Todos', value: 'todos' },
            { label: 'Emitidas', value: 'emitida' },
            { label: 'Recebidas', value: 'recebida' },
          ].map(item => (
            <button
              key={item.value}
              onClick={() => setType(item.value)}
              className={`px-3.5 py-2 rounded-xl text-sm transition-colors ${
                type === item.value
                  ? 'bg-white text-black font-medium'
                  : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-white/10" />

        {/* Status */}
        <div className="flex gap-1">
          {[
            { label: 'Todos', value: 'todos' },
            { label: 'Aprovadas', value: 'aprovada' },
            { label: 'Pendentes', value: 'pendente' },
            { label: 'Canceladas', value: 'cancelada' },
          ].map(item => (
            <button
              key={item.value}
              onClick={() => setStatus(item.value)}
              className={`px-3.5 py-2 rounded-xl text-sm transition-colors ${
                status === item.value
                  ? 'bg-white text-black font-medium'
                  : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}