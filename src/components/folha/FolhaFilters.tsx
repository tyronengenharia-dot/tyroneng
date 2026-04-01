'use client'

export function FolhaFilters({ month, setMonth }: any) {
  return (
    <input
      type="month"
      value={month}
      onChange={e => setMonth(e.target.value)}
      className="bg-[#111] border border-white/10 rounded-xl px-3 py-2"
    />
  )
}