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
  return (
    <div className="flex gap-2">
      <input
        type="date"
        value={startDate}
        onChange={e => setStartDate(e.target.value)}
        className="border p-2 rounded-lg"
      />

      <input
        type="date"
        value={endDate}
        onChange={e => setEndDate(e.target.value)}
        className="border p-2 rounded-lg"
      />
    </div>
  )
}