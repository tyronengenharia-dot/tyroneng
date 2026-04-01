export function ObraFinanceiro() {
  const data = [
    { type: 'entrada', value: 20000 },
    { type: 'saida', value: 8000 },
  ]

  const saldo =
    data.reduce((acc, i) => acc + (i.type === 'entrada' ? i.value : -i.value), 0)

  return (
    <div className="space-y-4">
      <div className="bg-[#111] p-5 rounded-2xl border border-white/10">
        <p className="text-gray-400">Saldo da obra</p>
        <h2 className="text-white text-xl font-semibold">
          R$ {saldo}
        </h2>
      </div>

      <div className="bg-[#111] p-5 rounded-2xl border border-white/10">
        <p className="text-gray-400 text-sm">Movimentações</p>

        {data.map((item, i) => (
          <div key={i} className="flex justify-between text-sm mt-2">
            <span>{item.type}</span>
            <span>R$ {item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}