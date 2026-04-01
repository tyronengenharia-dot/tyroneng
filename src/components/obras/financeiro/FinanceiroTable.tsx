export function FinanceiroTable({ data }: any) {
  if (data.length === 0) {
    return (
      <div className="bg-[#111] p-10 rounded-2xl text-center">
        <p className="text-gray-400">Sem movimentações</p>
      </div>
    )
  }

  return (
    <div className="bg-[#111] rounded-2xl border border-white/10 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="text-gray-400">
          <tr>
            <th className="p-4 text-left">Descrição</th>
            <th>Categoria</th>
            <th>Tipo</th>
            <th>Valor</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {data.map((item: any) => (
            <tr key={item.id} className="border-t border-white/10">
              <td className="p-4 text-white">
                {item.description}
              </td>

              <td>{item.category}</td>

              <td
                className={
                  item.type === 'entrada'
                    ? 'text-green-400'
                    : 'text-red-400'
                }
              >
                {item.type}
              </td>

              <td className="font-semibold">
                R$ {item.value.toLocaleString()}
              </td>

              <td>{item.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}