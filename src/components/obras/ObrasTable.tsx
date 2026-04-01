import Link from 'next/link'
import { Obra } from '@/types/obra'

export function ObrasTable({ data }: { data: Obra[] }) {
  if (data.length === 0) {
    return (
      <div className="bg-[#111] p-10 rounded-2xl text-center border border-white/10">
        <p className="text-gray-400">Nenhuma obra encontrada</p>
      </div>
    )
  }

  return (
    <div className="bg-[#111] rounded-2xl border border-white/10 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="text-gray-400">
          <tr>
            <th className="p-4 text-left">Nome</th>
            <th>Cliente</th>
            <th>Local</th>
            <th>Orçamento</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {data.map(item => (
            <tr
              key={item.id}
              className="border-t border-white/10 hover:bg-white/5 cursor-pointer"
            >
              <td className="p-4 text-white">
                <Link href={`/obras/${item.id}`}>
                  {item.name}
                </Link>
              </td>

              <td>{item.client}</td>
              <td>{item.location}</td>
              <td>R$ {item.budget.toLocaleString()}</td>

              <td>
                <span
                  className={`text-xs px-2 py-1 rounded-lg ${
                    item.status === 'andamento'
                      ? 'bg-yellow-500/10 text-yellow-400'
                      : 'bg-green-500/10 text-green-400'
                  }`}
                >
                  {item.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}