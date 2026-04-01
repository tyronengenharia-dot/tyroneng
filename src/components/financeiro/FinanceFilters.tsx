'use client'

type Props = {
  status: string
  setStatus: (value: string) => void
}

export function FinanceFilters({ status, setStatus }: Props) {
  return (
    <div className="flex gap-2">
      {['todos', 'pago', 'pendente'].map(item => (
        <button
          key={item}
          onClick={() => setStatus(item)}
          className={`px-4 py-2 rounded-xl text-sm transition ${
            status === item
              ? 'bg-black text-white'
              : 'bg-white border hover:bg-gray-100'
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  )
}