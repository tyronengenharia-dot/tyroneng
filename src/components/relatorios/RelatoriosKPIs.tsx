export function RelatoriosKPIs({ data }: any) {
  const receitas = data.reduce((acc: number, i: any) => acc + i.receitas, 0)
  const despesas = data.reduce((acc: number, i: any) => acc + i.despesas, 0)
  const lucro = receitas - despesas

  return (
    <div className="grid grid-cols-3 gap-4">
      <Card title="Receitas" value={receitas} />
      <Card title="Despesas" value={despesas} />
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