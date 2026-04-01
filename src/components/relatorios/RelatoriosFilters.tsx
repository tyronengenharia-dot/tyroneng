'use client'

export function RelatoriosFilters({ period, setPeriod }: any) {
  return (
    <div className="flex gap-2">
      {['7d', '30d', '90d', '1y'].map(p => (
        <button
          key={p}
          onClick={() => setPeriod(p)}
          className={`px-3 py-1 rounded-lg text-sm ${
            period === p
              ? 'bg-white text-black'
              : 'bg-[#111] text-gray-400 border border-white/10'
          }`}
        >
          {p}
        </button>
      ))}
    </div>
  )
}