'use client'

type Props = {
  startDate: string
  endDate: string
  setStartDate: (v: string) => void
  setEndDate: (v: string) => void
}

export function FinanceDateFilter({
  startDate,
  endDate,
  setStartDate,
  setEndDate,
}: Props) {
  const inputClass =
    'bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-white/30 transition-colors'

  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={startDate}
        onChange={e => setStartDate(e.target.value)}
        className={inputClass}
      />
      <span className="text-white/20 text-sm">→</span>
      <input
        type="date"
        value={endDate}
        onChange={e => setEndDate(e.target.value)}
        className={inputClass}
      />
    </div>
  )
}