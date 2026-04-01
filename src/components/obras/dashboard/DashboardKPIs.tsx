export function DashboardKPIs({ financeiro, planejamento, medicao }: any) {
  const receitas = financeiro
    .filter((i: any) => i.type === 'entrada')
    .reduce((acc: number, i: any) => acc + i.value, 0)

  const despesas = financeiro
    .filter((i: any) => i.type === 'saida')
    .reduce((acc: number, i: any) => acc + i.value, 0)

  const saldo = receitas - despesas

  const progresso = medicao.reduce(
    (acc: number, i: any) => acc + i.percentage,
    0
  )

  return (
    <div className="grid grid-cols-4 gap-4">
      <Card title="Receitas" value={receitas} />
      <Card title="Despesas" value={despesas} />
      <Card title="Saldo" value={saldo} />
      <Card title="Progresso" value={`${progresso}%`} />
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