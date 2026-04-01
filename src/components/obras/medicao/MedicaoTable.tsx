export function MedicaoTable({ data }: any) {
  if (data.length === 0) {
    return (
      <div className="bg-[#111] p-10 rounded-2xl text-center">
        <p className="text-gray-400">Sem medições</p>
      </div>
    )
  }

  return (
    <div className="bg-[#111] rounded-2xl border border-white/10 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="text-gray-400">
          <tr>
            <th className="p-4 text-left">Etapa</th>
            <th>%</th>
            <th>Valor</th>
            <th>Data</th>
          </tr>
        </thead>

        <tbody>
          {data.map((item: any) => (
            <tr key={item.id} className="border-t border-white/10">
              <td className="p-4 text-white">
                {item.description}
              </td>
              <td>{item.percentage}%</td>
              <td>R$ {item.value.toLocaleString()}</td>
              <td>{item.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}