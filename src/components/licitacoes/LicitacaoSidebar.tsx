'use client'

import { useState } from 'react'
import { Licitacao } from '@/types/licitacao'
import { STATUS_CONFIG, calcProgress } from '@/lib/licitacaoUtils'

interface Props {
  licitacoes: Licitacao[]
  selectedId: string | null
  onSelect: (id: string) => void
  onNew: () => void
}

export function LicitacaoSidebar({ licitacoes, selectedId, onSelect, onNew }: Props) {
  const [search, setSearch] = useState('')

  const filtered = licitacoes.filter(l =>
    l.titulo.toLowerCase().includes(search.toLowerCase()) ||
    l.orgao.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <aside className="w-64 min-w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-zinc-800">
        <p className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-3">
          Licitações
        </p>
        <button
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors"
        >
          <span className="text-lg leading-none">+</span>
          Nova Licitação
        </button>
      </div>

      <div className="px-3 pt-3">
        <input
          type="text"
          placeholder="Buscar..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 text-sm text-zinc-100 placeholder-zinc-500 rounded-lg px-3 py-2 outline-none focus:border-blue-500/50 transition-colors"
        />
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-1 mt-2">
        {filtered.length === 0 && (
          <p className="text-xs text-zinc-600 text-center py-6">Nenhuma licitação encontrada</p>
        )}
        {filtered.map(lic => {
          const sc = STATUS_CONFIG[lic.status]
          const pct = calcProgress(lic.checklist)
          const isActive = lic.id === selectedId

          return (
            <button
              key={lic.id}
              onClick={() => onSelect(lic.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all ${
                isActive
                  ? 'bg-blue-500/10 border-blue-500/30'
                  : 'border-transparent hover:bg-zinc-800 hover:border-zinc-700'
              }`}
            >
              <p className="text-sm font-medium text-zinc-100 truncate">{lic.titulo}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${sc.dot}`} />
                <span className="text-xs text-zinc-500">{sc.label}</span>
                <span className="text-xs text-zinc-600 ml-auto">{pct}%</span>
              </div>
              <div className="mt-1.5 h-0.5 bg-zinc-800 rounded-full">
                <div
                  className="h-0.5 bg-blue-500 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
