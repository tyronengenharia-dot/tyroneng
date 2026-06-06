import { Financeiro, Medicao, Etapa } from '@/types'

type Props = {
  financeiro: Financeiro[]
  planejamento: Etapa[]
  medicao: Medicao[]
}

export function DashboardKPIs({ financeiro, medicao }: Props) {
  const receitas = financeiro
    .filter(i => i.type === 'entrada')
    .reduce((acc, i) => acc + i.value, 0)

  const despesas = financeiro
    .filter(i => i.type === 'saida')
    .reduce((acc, i) => acc + i.value, 0)

  const saldo = receitas - despesas

  const progresso = medicao.reduce(
    (acc, i) => acc + i.percentage,
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

function Card({ title, value }: { title: string; value: number | string }) {
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