import { FinancialRecord } from '@/types/financial'

type Props = {
  data: FinancialRecord[]
  onEdit: (item: FinancialRecord) => void
  onDelete: (id: string) => void
}

function fmt(value: number) {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function fmtDate(d: string) {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

export function FinanceTable({ data, onEdit, onDelete }: Props) {
  if (data.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center text-white/40 text-sm">
        Nenhuma transação encontrada
      </div>
    )
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
        <thead>
          <tr className="border-b border-white/10">
            <th className="p-4 text-left text-xs font-medium text-white/40 uppercase tracking-wider w-[30%]">
              Descrição
            </th>
            <th className="p-4 text-left text-xs font-medium text-white/40 uppercase tracking-wider w-[12%]">
              Tipo
            </th>
            <th className="p-4 text-left text-xs font-medium text-white/40 uppercase tracking-wider w-[16%]">
              Valor
            </th>
            <th className="p-4 text-left text-xs font-medium text-white/40 uppercase tracking-wider w-[12%]">
              Status
            </th>
            <th className="p-4 text-left text-xs font-medium text-white/40 uppercase tracking-wider w-[14%]">
              Data
            </th>
            <th className="p-4 text-left text-xs font-medium text-white/40 uppercase tracking-wider w-[16%]">
              Ações
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map(item => (
            <tr
              key={item.id}
              className="border-t border-white/5 hover:bg-white/5 transition-colors"
            >
              <td className="p-4">
                <div className="font-medium text-white truncate">{item.description}</div>
                {(item as any).category && (
                  <div className="text-xs text-white/30 mt-0.5">{(item as any).category}</div>
                )}
              </td>

              <td className="p-4">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    item.type === 'entrada'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-red-500/10 text-red-400'
                  }`}
                >
                  {item.type === 'entrada' ? 'Entrada' : 'Saída'}
                </span>
              </td>

              <td className="p-4">
                <span
                  className={`font-semibold ${
                    item.type === 'entrada' ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  R$ {fmt(item.value)}
                </span>
              </td>

              <td className="p-4">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    item.status === 'pago'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : item.status === 'pendente'
                      ? 'bg-amber-500/10 text-amber-400'
                      : 'bg-red-500/10 text-red-400'
                  }`}
                >
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </span>
              </td>

              <td className="p-4 text-white/50 text-sm">{fmtDate(item.date)}</td>

              <td className="p-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => onEdit(item)}
                    className="text-xs text-white/40 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="text-xs text-red-400/60 hover:text-red-400 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-colors"
                  >
                    Excluir
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}