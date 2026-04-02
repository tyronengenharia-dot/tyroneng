'use client'

import { Licitacao, LicitacaoStatus } from '@/types/licitacao'
import { STATUS_CONFIG } from '@/lib/licitacaoUtils'

interface Props {
  lic: Licitacao
  onStatusChange: (status: LicitacaoStatus) => void
  onEdit: () => void
}

export function LicitacaoTopbar({ lic, onStatusChange, onEdit }: Props) {
  const sc = STATUS_CONFIG[lic.status]

  return (
    <div className="flex items-center justify-between px-7 py-4 border-b border-zinc-800 bg-zinc-900 flex-shrink-0">
      <div>
        <h1 className="text-base font-semibold text-zinc-100">{lic.titulo}</h1>
        <p className="text-xs text-zinc-500 mt-0.5">{lic.orgao}</p>
      </div>

      <div className="flex items-center gap-3">
        <span className={`text-xs font-medium px-3 py-1.5 rounded-full border ${sc.bg} ${sc.color} ${sc.border}`}>
          {sc.label}
        </span>

        <select
          value={lic.status}
          onChange={e => onStatusChange(e.target.value as LicitacaoStatus)}
          className="bg-zinc-800 border border-zinc-700 text-xs text-zinc-300 rounded-lg px-3 py-1.5 outline-none focus:border-blue-500/50 transition-colors cursor-pointer"
        >
          {(Object.entries(STATUS_CONFIG) as [LicitacaoStatus, { label: string }][]).map(
            ([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            )
          )}
        </select>

        <button
          onClick={onEdit}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-4 py-1.5 rounded-lg transition-colors"
        >
          Editar
        </button>
      </div>
    </div>
  )
}
