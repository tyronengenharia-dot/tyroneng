import { Documento } from '@/types/documento'

export function DocumentosTable({ data }: { data: Documento[] }) {
  if (data.length === 0) {
    return (
      <div className="bg-[#111] p-10 rounded-2xl text-center border border-white/10">
        <p className="text-gray-400">Nenhum documento encontrado</p>
      </div>
    )
  }

  function getStatusStyle(status: string) {
    if (status === 'valido') return 'text-green-400 bg-green-500/10'
    if (status === 'vencendo') return 'text-yellow-400 bg-yellow-500/10'
    if (status === 'vencido') return 'text-red-400 bg-red-500/10'
  }

  return (
    <div className="bg-[#111] rounded-2xl border border-white/10 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="text-gray-400">
          <tr>
            <th className="p-4 text-left">Documento</th>
            <th>Categoria</th>
            <th>Validade</th>
            <th>Status</th>
            <th>Arquivo</th>
          </tr>
        </thead>

        <tbody>
          {data.map(item => (
            <tr key={item.id} className="border-t border-white/10">
              <td className="p-4 text-white">{item.name}</td>
              <td>{item.category}</td>
              <td>{item.expiration_date}</td>

              <td>
                <span className={`px-2 py-1 rounded-lg text-xs ${getStatusStyle(item.status)}`}>
                  {item.status}
                </span>
              </td>

              <td>
                {item.file_url ? (
                  <a href={item.file_url} target="_blank" className="text-blue-400">
                    Ver
                  </a>
                ) : (
                  <span className="text-gray-500">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}