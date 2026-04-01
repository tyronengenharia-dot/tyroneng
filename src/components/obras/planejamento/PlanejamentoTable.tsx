export function PlanejamentoTable({ data }: any) {
  return (
    <div className="bg-[#111] rounded-2xl border border-white/10 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="text-gray-400">
          <tr>
            <th className="p-4 text-left">Categoria</th>
            <th>Orçado</th>
            <th>Realizado</th>
            <th>Desvio</th>
          </tr>
        </thead>

        <tbody>
          {data.map((item: any) => {
            const diff = item.planned_value - item.actual_value

            return (
              <tr key={item.id} className="border-t border-white/10">
                <td className="p-4 text-white">
                  {item.category}
                </td>

                <td>R$ {item.planned_value}</td>
                <td>R$ {item.actual_value}</td>

                <td
                  className={
                    diff >= 0
                      ? 'text-green-400'
                      : 'text-red-400'
                  }
                >
                  R$ {diff}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}