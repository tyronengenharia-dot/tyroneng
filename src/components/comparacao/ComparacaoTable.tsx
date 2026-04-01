export function ComparacaoTable({ data }: any) {
  const sorted = [...data].sort(
    (a, b) =>
      (b.receitas - b.despesas) - (a.receitas - a.despesas)
  )

  return (
    <div className="bg-[#111] rounded-2xl border border-white/10 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="text-gray-400">
          <tr>
            <th className="p-4 text-left">Obra</th>
            <th>Receita</th>
            <th>Despesa</th>
            <th>Lucro</th>
            <th>Progresso</th>
          </tr>
        </thead>

        <tbody>
          {sorted.map((item: any) => {
            const lucro = item.receitas - item.despesas

            return (
              <tr key={item.id} className="border-t border-white/10">
                <td className="p-4 text-white">{item.name}</td>
                <td>R$ {item.receitas}</td>
                <td>R$ {item.despesas}</td>

                <td className={lucro >= 0 ? 'text-green-400' : 'text-red-400'}>
                  R$ {lucro}
                </td>

                <td>{item.progresso}%</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}