'use client'

import { useState } from 'react'
import { ChecklistItem, ChecklistStatus, ChecklistCategoria } from '@/types/licitacao'
import { ChecklistItemRow } from './ChecklistItemRow'
import { CHECKLIST_CATEGORIAS, calcProgress } from '@/lib/licitacaoUtils'

type Tab = 'todos' | ChecklistStatus

interface Props {
  items: ChecklistItem[]
  onAddItem: (nome: string, categoria: ChecklistCategoria) => Promise<void>
  onCycleStatus: (itemId: string) => Promise<void>
  onChangeStatus: (itemId: string, status: ChecklistStatus) => Promise<void>
  onDelete: (itemId: string) => Promise<void>
}

export function ChecklistTable({ items, onAddItem, onCycleStatus, onChangeStatus, onDelete }: Props) {
  const [tab, setTab] = useState<Tab>('todos')
  const [nome, setNome] = useState('')
  const [categoria, setCategoria] = useState<ChecklistCategoria>('Documentação')
  const [adding, setAdding] = useState(false)

  const filtered = tab === 'todos' ? items : items.filter(i => i.status === tab)
  const pct = calcProgress(items)
  const done = items.filter(i => i.status === 'concluido').length
  const hasText = nome.trim().length > 0

  const tabs: { key: Tab; label: string }[] = [
    { key: 'todos',     label: 'Todos' },
    { key: 'pendente',  label: 'Pendentes' },
    { key: 'andamento', label: 'Em andamento' },
    { key: 'concluido', label: 'Concluídos' },
  ]

  async function handleAdd() {
    if (!hasText || adding) return
    setAdding(true)
    try {
      await onAddItem(nome.trim(), categoria)
      setNome('')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100 mb-2">Checklist do Edital</h3>
          <div className="flex gap-1">
            {tabs.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  tab === key
                    ? 'bg-blue-500/15 text-blue-400'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="text-right">
          <p className="text-xs text-zinc-500 mb-1.5">{done}/{items.length} concluídos</p>
          <div className="w-36 h-1.5 bg-zinc-800 rounded-full">
            <div
              className="h-1.5 bg-green-500 rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Add item */}
      <div className="flex gap-2 px-5 py-3 border-b border-zinc-800 bg-zinc-900/50">
        <input
          type="text"
          placeholder="Adicionar item ao checklist..."
          value={nome}
          onChange={e => setNome(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          className="flex-1 bg-zinc-800 border border-zinc-700 text-sm text-zinc-100 placeholder-zinc-500 rounded-lg px-3 py-2 outline-none focus:border-blue-500/50 transition-colors"
        />
        <select
          value={categoria}
          onChange={e => setCategoria(e.target.value as ChecklistCategoria)}
          className="bg-zinc-800 border border-zinc-700 text-sm text-zinc-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500/50 transition-colors"
        >
          {CHECKLIST_CATEGORIAS.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <button
          onClick={handleAdd}
          disabled={!hasText || adding}
          className={`text-sm font-medium px-4 rounded-lg transition-all whitespace-nowrap ${
            hasText && !adding
              ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
              : 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-700'
          }`}
        >
          {adding ? 'Adicionando...' : '+ Adicionar'}
        </button>
      </div>

      {/* Items */}
      <div className="max-h-80 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-zinc-600 text-sm">
            {tab === 'todos'
              ? 'Nenhum item no checklist ainda. Adicione acima.'
              : 'Nenhum item com este status.'}
          </div>
        ) : (
          filtered.map(item => (
            <ChecklistItemRow
              key={item.id}
              item={item}
              onCycleStatus={() => onCycleStatus(item.id)}
              onChangeStatus={status => onChangeStatus(item.id, status)}
              onDelete={() => onDelete(item.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
