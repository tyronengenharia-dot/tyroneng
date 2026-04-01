'use client'

export function ContratosFilters({ status, setStatus }: any) {
  return (
    <div className="flex gap-2">
      {['todos', 'ativo', 'finalizado', 'pendente'].map(s => (
        <button
          key={s}
          onClick={() => setStatus(s)}
          className={`px-3 py-1 rounded-lg text-sm ${
            status === s
              ? 'bg-white text-black'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  )
}