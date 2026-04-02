'use client'

import { ChecklistItem, ChecklistStatus } from '@/types/licitacao'
import { CHECKLIST_STATUS_CONFIG } from '@/lib/licitacaoUtils'

interface Props {
  item: ChecklistItem
  onCycleStatus: () => void
  onChangeStatus: (status: ChecklistStatus) => void
  onDelete: () => void
}

export function ChecklistItemRow({ item, onCycleStatus, onChangeStatus, onDelete }: Props) {
  const isDone = item.status === 'concluido'

  return (
    <div className="flex items-center gap-3 px-5 py-3 border-b border-zinc-800 hover:bg-zinc-800/40 transition-colors group">
      {/* Checkbox */}
      <button
        onClick={onCycleStatus}
        className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all ${
          isDone
            ? 'bg-green-500 border-green-500'
            : item.status === 'andamento'
              ? 'border-amber-500 bg-amber-500/20'
              : 'border-zinc-600 hover:border-zinc-400'
        }`}
      >
        {isDone && (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
        {item.status === 'andamento' && (
          <div className="w-2 h-2 rounded-sm bg-amber-400" />
        )}
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${isDone ? 'line-through text-zinc-500' : 'text-zinc-100'}`}>
          {item.nome}
        </p>
        <p className="text-xs text-zinc-600 mt-0.5">{item.categoria}</p>
      </div>

      {/* Status select */}
      <select
        value={item.status}
        onChange={e => onChangeStatus(e.target.value as ChecklistStatus)}
        className="bg-zinc-800 border border-zinc-700 text-xs text-zinc-300 rounded-md px-2 py-1.5 outline-none focus:border-blue-500/50 cursor-pointer"
      >
        {(Object.entries(CHECKLIST_STATUS_CONFIG) as [ChecklistStatus, { label: string }][]).map(
          ([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          )
        )}
      </select>

      {/* Delete */}
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all text-base w-6 h-6 flex items-center justify-center rounded"
      >
        ✕
      </button>
    </div>
  )
}
