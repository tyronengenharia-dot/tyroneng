export function FinanceiroTab() {
  const receitas = 200000
  const despesas = 120000
  const saldo = receitas - despesas

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card title="Receitas" value={receitas} />
        <Card title="Despesas" value={despesas} />
        <Card title="Saldo" value={saldo} />
      </div>
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