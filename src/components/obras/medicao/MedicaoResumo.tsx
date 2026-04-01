export function MedicaoResumo({ data }: any) {
  const total = data.reduce((acc: number, i: any) => acc + i.value, 0)

  const percentual = data.reduce(
    (acc: number, i: any) => acc + i.percentage,
    0
  )

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-[#111] p-5 rounded-2xl border border-white/10">
        <p className="text-gray-400 text-sm">Total medido</p>
        <h2 className="text-white font-semibold">
          R$ {total.toLocaleString()}
        </h2>
      </div>

      <div className="bg-[#111] p-5 rounded-2xl border border-white/10">
        <p className="text-gray-400 text-sm">Execução</p>
        <h2 className="text-white font-semibold">
          {percentual}%
        </h2>
      </div>
    </div>
  )
}