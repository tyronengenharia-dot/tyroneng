export function FolhaSummary({ data }: any) {
  const totalSalarios = data.reduce(
    (acc: number, item: any) => acc + Number(item.salario || 0),
    0
  )

  const totalExtras = data.reduce(
    (acc: number, item: any) => acc + Number(item.extras || 0),
    0
  )

  const totalCusto = data.reduce(
    (acc: number, item: any) =>
      acc + Number(item.custo_total || (item.salario || 0) + (item.extras || 0)),
    0
  )

  const totalFuncionarios = data.length

  function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0)
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-[#111] border border-white/10 p-4 rounded-xl">
        <p className="text-gray-400 text-sm">Funcionários</p>
        <p className="text-white text-lg font-semibold">
          {totalFuncionarios}
        </p>
      </div>

      <div className="bg-[#111] border border-white/10 p-4 rounded-xl">
        <p className="text-gray-400 text-sm">Salários</p>
        <p className="text-white text-lg font-semibold">
          {formatCurrency(totalSalarios)}
        </p>
      </div>

      <div className="bg-[#111] border border-white/10 p-4 rounded-xl">
        <p className="text-gray-400 text-sm">Extras</p>
        <p className="text-yellow-400 text-lg font-semibold">
          {formatCurrency(totalExtras)}
        </p>
      </div>

      <div className="bg-[#111] border border-white/10 p-4 rounded-xl">
        <p className="text-gray-400 text-sm">Custo Total</p>
        <p className="text-green-400 text-lg font-semibold">
          {formatCurrency(totalCusto)}
        </p>
      </div>
    </div>
  )
}