'use client'

type Props = {
  page: number
  setPage: (fn: (prev: number) => number) => void
  totalPages: number
}

export function FinancePagination({ page, setPage, totalPages }: Props) {
  return (
    <div className="flex gap-2 justify-end">
      <button
        onClick={() => setPage(p => Math.max(1, p - 1))}
        className="px-3 py-1 border rounded"
      >
        Anterior
      </button>

      <span className="px-2">Página {page}</span>

      <button
        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
        className="px-3 py-1 border rounded"
      >
        Próximo
      </button>
    </div>
  )
}