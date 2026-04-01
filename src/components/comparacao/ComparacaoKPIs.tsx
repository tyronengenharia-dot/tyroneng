export function ComparacaoKPIs({ data }: any) {
  const totalReceitas = data.reduce((a: number, i: any) => a + i.receitas, 0)
  const totalDespesas = data.reduce((a: number, i: any) => a + i.despesas, 0)

  const lucro = totalReceitas - totalDespesas

  return (
    <div className="grid grid-cols-3 gap-4">
      <Card title="Receita total" value={totalReceitas} />
      <Card title="Despesas" value={totalDespesas} />
      <Card title="Lucro" value={lucro} />
    </div>
  )
}

function Card({ title, value }: any) {
  return (
    <div className="bg-[#111] p-5 rounded-2xl border border-white/10">
      <p className="text-gray-400 text-sm">{title}</p>
      <h2 className="text-white font-semibold">
        R$ {value.toLocaleString()}
      </h2>
    </div>
  )
}