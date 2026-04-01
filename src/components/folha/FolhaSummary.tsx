function fmtCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0)
}

export function FolhaSummary({ data }: { data: any[] }) {
  const totalSalarios = data.reduce((acc, i) => acc + Number(i.salario_base || 0), 0)
  const totalExtras = data.reduce((acc, i) => acc + Number(i.extras || 0), 0)
  const totalAdicionais = data.reduce((acc, i) => acc + Number(i.adicional || 0), 0)
  const totalDescontos = data.reduce((acc, i) => acc + Number(i.desconto || 0), 0)
  const totalBruto = totalSalarios + totalExtras + totalAdicionais - totalDescontos

  const metrics = [
    {
      label: 'Funcionários',
      value: String(data.length),
      valueClass: 'text-white',
    },
    {
      label: 'Salários base',
      value: fmtCurrency(totalSalarios),
      valueClass: 'text-white',
    },
    {
      label: 'Extras / Encargos',
      value: fmtCurrency(totalExtras),
      valueClass: 'text-amber-400',
    },
    {
      label: 'Adicionais',
      value: fmtCurrency(totalAdicionais),
      valueClass: 'text-emerald-400',
      sub: totalDescontos > 0 ? `−${fmtCurrency(totalDescontos)} em descontos` : undefined,
    },
    {
      label: 'Custo total',
      value: fmtCurrency(totalBruto),
      valueClass: 'text-white',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {metrics.map(m => (
        <div
          key={m.label}
          className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 flex flex-col gap-3"
        >
          <p className="text-xs text-white/40 uppercase tracking-widest">{m.label}</p>
          <p className={`text-xl font-semibold tabular-nums ${m.valueClass}`}>{m.value}</p>
          {m.sub && <p className="text-xs text-white/25">{m.sub}</p>}
        </div>
      ))}
    </div>
  )
}