import { NotaFiscal } from '@/types/notaFiscal'

export function NotasTable({ data }: { data: NotaFiscal[] }) {
  if (data.length === 0) {
    return (
      <div className="bg-[#111] p-10 rounded-2xl text-center border border-white/10">
        <p className="text-gray-400">Nenhuma nota fiscal encontrada</p>
      </div>
    )
  }

  return (
    <div className="bg-[#111] rounded-2xl border border-white/10 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="text-gray-400">
          <tr>
            <th className="p-4 text-left">Número</th>
            <th>Tipo</th>
            <th>Cliente</th>
            <th>Valor</th>
            <th>Status</th>
            <th>Arquivos</th>
          </tr>
        </thead>

        <tbody>
          {data.map(item => (
            <tr key={item.id} className="border-t border-white/10">
              <td className="p-4 text-white">{item.number}</td>

              <td
                className={
                  item.type === 'emitida'
                    ? 'text-green-400'
                    : 'text-blue-400'
                }
              >
                {item.type}
              </td>

              <td>{item.client}</td>

              <td>R$ {item.value.toLocaleString()}</td>

              <td>
                <span
                  className={`text-xs px-2 py-1 rounded-lg ${
                    item.status === 'aprovada'
                      ? 'bg-green-500/10 text-green-400'
                      : item.status === 'pendente'
                      ? 'bg-yellow-500/10 text-yellow-400'
                      : 'bg-red-500/10 text-red-400'
                  }`}
                >
                  {item.status}
                </span>
              </td>

              <td className="flex gap-2 justify-center">
                {item.file_url && (
                  <a href={item.file_url} target="_blank" className="text-blue-400">
                    PDF
                  </a>
                )}

                {item.xml_url && (
                  <a href={item.xml_url} target="_blank" className="text-green-400">
                    XML
                  </a>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}