import { Contrato, ContratoStatus } from '@/types/contrato'
import { formatCurrency, formatDate, getDaysUntilEnd } from '@/services/contratoService'

const STATUS_STYLE: Record<ContratoStatus, string> = {
  ativo: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  pendente: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  finalizado: 'bg-gray-500/10 text-gray-400 border border-gray-500/20',
  cancelado: 'bg-red-500/10 text-red-400 border border-red-500/20',
}

const STATUS_LABEL: Record<ContratoStatus, string> = {
  ativo: 'Ativo',
  pendente: 'Pendente',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
}

function DaysIndicator({ end_date, status }: { end_date: string; status: ContratoStatus }) {
  if (status !== 'ativo') return null
  const days = getDaysUntilEnd(end_date)

  if (days < 0) return <span className="text-xs text-red-400">Vencido</span>
  if (days <= 30) return <span className="text-xs text-amber-400">{days}d restantes</span>
  return <span className="text-xs text-gray-500">{days}d restantes</span>
}

interface ContratosTableProps {
  data: Contrato[]
  onEdit?: (item: Contrato) => void
  onDelete?: (id: string) => void
}

export function ContratosTable({ data, onEdit, onDelete }: ContratosTableProps) {
  if (data.length === 0) {
    return (
      <div className="bg-[#111] p-16 rounded-2xl text-center border border-white/10">
        <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <p className="text-gray-400 text-sm font-medium">Nenhum contrato encontrado</p>
        <p className="text-gray-600 text-xs mt-1">Tente ajustar os filtros ou crie um novo contrato</p>
      </div>
    )
  }

  return (
    <div className="bg-[#111] rounded-2xl border border-white/10 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contrato</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vigência</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Arquivo</th>
            <th className="px-4 py-3 w-20" />
          </tr>
        </thead>

        <tbody className="divide-y divide-white/5">
          {data.map(item => (
            <tr
              key={item.id}
              className="hover:bg-white/[0.02] transition-colors group"
            >
              {/* Name + tags */}
              <td className="px-4 py-3.5">
                <p className="text-white font-medium leading-snug">{item.name}</p>
                {item.tags && item.tags.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {item.tags.map(tag => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-white/5 text-gray-500 rounded-md">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </td>

              {/* Client */}
              <td className="px-4 py-3.5">
                <p className="text-gray-300">{item.client}</p>
                {item.client_email && (
                  <p className="text-gray-600 text-xs">{item.client_email}</p>
                )}
              </td>

              {/* Value */}
              <td className="px-4 py-3.5">
                <span className="text-gray-300 font-mono text-sm">
                  {formatCurrency(item.value)}
                </span>
              </td>

              {/* Dates */}
              <td className="px-4 py-3.5">
                <p className="text-gray-300">{formatDate(item.start_date)} → {formatDate(item.end_date)}</p>
                <DaysIndicator end_date={item.end_date} status={item.status} />
              </td>

              {/* Status */}
              <td className="px-4 py-3.5">
                <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${STATUS_STYLE[item.status]}`}>
                  {STATUS_LABEL[item.status]}
                </span>
              </td>

              {/* File */}
              <td className="px-4 py-3.5">
                {item.file_url ? (
                  <a
                    href={item.file_url}
                    className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1 transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                    Ver
                  </a>
                ) : (
                  <span className="text-gray-700 text-xs">—</span>
                )}
              </td>

              {/* Actions */}
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(item)}
                      className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
                      title="Editar"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                      </svg>
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(item.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors"
                      title="Excluir"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
