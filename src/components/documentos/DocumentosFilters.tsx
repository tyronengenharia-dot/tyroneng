'use client'

export function DocumentosFilters({ status, setStatus }: any) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-gray-500">Status</p>

      <div className="flex gap-2">
        {[
          { label: 'Todos', value: 'todos' },
          { label: 'Válidos', value: 'valido' },
          { label: 'Vencendo', value: 'vencendo' },
          { label: 'Vencidos', value: 'vencido' },
        ].map(item => (
          <button
            key={item.value}
            onClick={() => setStatus(item.value)}
            className={`px-3 py-1 rounded-lg text-sm ${
              status === item.value
                ? 'bg-white text-black'
                : 'bg-[#111] text-gray-400 border border-white/10'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}