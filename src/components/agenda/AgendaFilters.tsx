'use client'

export function AgendaFilters({ status, setStatus }: any) {
  return (
    <div className="flex gap-2">
      {['todos', 'pendente', 'concluido'].map(s => (
        <button
          key={s}
          onClick={() => setStatus(s)}
          className={`px-3 py-1 rounded-lg text-sm ${
            status === s
              ? 'bg-white text-black'
              : 'bg-[#111] text-gray-400 border border-white/10'
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  )
}