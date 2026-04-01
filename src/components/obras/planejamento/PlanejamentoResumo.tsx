export function PlanejamentoResumo({ data }: any) {
  const planned = data.reduce(
    (acc: number, i: any) => acc + i.planned_value,
    0
  )

  const actual = data.reduce(
    (acc: number, i: any) => acc + i.actual_value,
    0
  )

  const diff = planned - actual
  const percent = (actual / planned) * 100

  return (
    <div className="grid grid-cols-4 gap-4">
      <Card title="Orçado" value={planned} />
      <Card title="Realizado" value={actual} />
      <Card title="Saldo" value={diff} />
      <Card title="Execução" value={`${percent.toFixed(1)}%`} />
    </div>
  )
}

function Card({ title, value }: any) {
  return (
    <div className="bg-[#111] p-5 rounded-2xl border border-white/10">
      <p className="text-gray-400 text-sm">{title}</p>
      <h2 className="text-white font-semibold">
        {typeof value === 'number'
          ? `R$ ${value.toLocaleString()}`
          : value}
      </h2>
    </div>
  )
}