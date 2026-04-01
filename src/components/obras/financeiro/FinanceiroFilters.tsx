'use client'

export function FinanceiroFilters({
  type,
  setType,
  status,
  setStatus,
}: any) {
  return (
    <div className="flex gap-2">
      {['todos', 'entrada', 'saida'].map(t => (
        <button
          key={t}
          onClick={() => setType(t)}
          className={`px-3 py-1 rounded-lg ${
            type === t
              ? 'bg-white text-black'
              : 'text-gray-400'
          }`}
        >
          {t}
        </button>
      ))}

      {['todos', 'pago', 'pendente'].map(s => (
        <button
          key={s}
          onClick={() => setStatus(s)}
          className={`px-3 py-1 rounded-lg ${
            status === s
              ? 'bg-white text-black'
              : 'text-gray-400'
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  )
}