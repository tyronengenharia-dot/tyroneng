'use client'

import { NotaFiscal } from '@/types/notaFiscal'

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(d: string) {
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

interface Props {
  data: NotaFiscal[]
  onEdit?: (item: NotaFiscal) => void
  onDelete?: (id: string) => void
}

const statusConfig: Record<string, { label: string; className: string }> = {
  aprovada: { label: 'Aprovada', className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
  pendente: { label: 'Pendente', className: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
  cancelada: { label: 'Cancelada', className: 'bg-red-500/10 text-red-400 border border-red-500/20' },
}

export function NotasTable({ data, onEdit, onDelete }: Props) {
  if (data.length === 0) {
    return (
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-16 text-center">
        <div className="text-4xl mb-4">🧾</div>
        <h2 className="text-lg font-semibold text-white mb-2">Nenhuma nota encontrada</h2>
        <p className="text-sm text-white/40">Tente ajustar os filtros ou adicione uma nova nota fiscal</p>
      </div>
    )
  }

  return (
    <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.07]">
            {['Número', 'Tipo', 'Cliente / Fornecedor', 'Data', 'Valor', 'Status', 'Arquivos', ''].map(h => (
              <th
                key={h}
                className="px-5 py-3.5 text-left text-xs font-medium text-white/40 uppercase tracking-widest first:pl-6 last:pr-6"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((item, idx) => {
            const st = statusConfig[item.status] ?? statusConfig.pendente
            return (
              <tr
                key={item.id}
                className={`group transition-colors hover:bg-white/[0.03] ${
                  idx !== data.length - 1 ? 'border-b border-white/[0.05]' : ''
                }`}
              >
                <td className="px-5 py-4 pl-6">
                  <span className="font-mono text-white font-medium">{item.number}</span>
                </td>

                <td className="px-5 py-4">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-lg ${
                      item.type === 'emitida'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}
                  >
                    {item.type === 'emitida' ? '↑ Emitida' : '↓ Recebida'}
                  </span>
                </td>

                <td className="px-5 py-4 text-white/80">{item.client}</td>

                <td className="px-5 py-4 text-white/50 tabular-nums">{fmtDate(item.date)}</td>

                <td className="px-5 py-4 text-white font-medium tabular-nums">
                  R$ {fmt(item.value)}
                </td>

                <td className="px-5 py-4">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${st.className}`}>
                    {st.label}
                  </span>
                </td>

                <td className="px-5 py-4">
                  <div className="flex gap-3">
                    {item.file_url ? (
                      <a
                        href={item.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                      >
                        PDF
                      </a>
                    ) : (
                      <span className="text-xs text-white/20">—</span>
                    )}
                    {item.xml_url && (
                      <a
                        href={item.xml_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                      >
                        XML
                      </a>
                    )}
                  </div>
                </td>

                <td className="px-5 py-4 pr-6">
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(item)}
                        className="text-xs text-white/50 hover:text-white transition-colors px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10"
                      >
                        Editar
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(item.id)}
                        className="text-xs text-red-400/70 hover:text-red-400 transition-colors px-2.5 py-1 rounded-lg bg-red-500/5 hover:bg-red-500/10"
                      >
                        Excluir
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Footer count */}
      <div className="border-t border-white/[0.07] px-6 py-3 flex items-center justify-between">
        <p className="text-xs text-white/30">
          {data.length} {data.length === 1 ? 'nota' : 'notas'} encontrada{data.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  )
}