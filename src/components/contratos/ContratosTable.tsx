import { Contrato } from '@/types/contrato'

export function ContratosTable({ data }: { data: Contrato[] }) {
  if (data.length === 0) {
    return (
      <div className="bg-[#111] p-10 rounded-2xl text-center border border-white/10">
        <p className="text-gray-400">Nenhum contrato encontrado</p>
      </div>
    )
  }

  return (
    <div className="bg-[#111] rounded-2xl border border-white/10 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="text-gray-400">
          <tr>
            <th className="p-4 text-left">Contrato</th>
            <th>Cliente</th>
            <th>Início</th>
            <th>Fim</th>
            <th>Status</th>
            <th>Arquivo</th>
          </tr>
        </thead>

        <tbody>
          {data.map(item => (
            <tr key={item.id} className="border-t border-white/10">
              <td className="p-4 text-white">{item.name}</td>
              <td>{item.client}</td>
              <td>{item.start_date}</td>
              <td>{item.end_date}</td>

              <td>
                <span
                  className={`text-xs px-2 py-1 rounded-lg ${
                    item.status === 'ativo'
                      ? 'bg-green-500/10 text-green-400'
                      : item.status === 'pendente'
                      ? 'bg-yellow-500/10 text-yellow-400'
                      : 'bg-gray-500/10 text-gray-400'
                  }`}
                >
                  {item.status}
                </span>
              </td>

              <td>
                {item.file_url ? (
                  <a
                    href={item.file_url}
                    className="text-blue-400"
                    target="_blank"
                  >
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