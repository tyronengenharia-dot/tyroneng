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
      <span className="text-white/30">
        Página {page} de {totalPages}
      </span>

      <div className="flex gap-1.5">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-3 py-1.5 bg-white/5 border border-white/10 text-white/50 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ← Anterior
        </button>

        {pages.map(p => (
          <button
            key={p}
            onClick={() => setPage(() => p)}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              p === page
                ? 'bg-white text-black font-medium'
                : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10'
            }`}
          >
            {p}
          </button>
        ))}

        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="px-3 py-1.5 bg-white/5 border border-white/10 text-white/50 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Próximo →
        </button>
      </div>
    </div>
  )
}