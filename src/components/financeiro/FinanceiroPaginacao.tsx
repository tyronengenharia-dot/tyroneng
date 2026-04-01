'use client'

type Props = {
  page: number
  setPage: (fn: (prev: number) => number) => void
  totalPages: number
}

export function FinancePagination({ page, setPage, totalPages }: Props) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-400">
        Página {page} de {totalPages}
      </span>

      <div className="flex gap-1.5">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ← Anterior
        </button>

        {pages.map(p => (
          <button
            key={p}
            onClick={() => setPage(() => p)}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              p === page
                ? 'bg-black text-white'
                : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {p}
          </button>
        ))}

        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Próximo →
        </button>
      </div>
    </div>
  )
}