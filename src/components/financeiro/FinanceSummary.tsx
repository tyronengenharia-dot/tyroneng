import { FinancialRecord } from '@/types/financial'

export function FinanceSummary({ data }: { data: FinancialRecord[] }) {
  const entradas = data
    .filter(i => i.type === 'entrada')
    .reduce((acc, i) => acc + i.value, 0)

  const saidas = data
    .filter(i => i.type === 'saida')
    .reduce((acc, i) => acc + i.value, 0)

  const saldo = entradas - saidas

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card title="Entradas" value={entradas} />
      <Card title="Saídas" value={saidas} />
      <Card title="Saldo" value={saldo} />
    </div>
  )
}

function Card({ title, value }: any) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm">
      <p className="text-gray-500 text-sm">{title}</p>
      <h2 className="text-xl font-semibold">
        R$ {value.toLocaleString()}
      </h2>
    </div>
  )
}