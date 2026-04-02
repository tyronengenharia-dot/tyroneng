'use client'

import { useEffect, useState, useMemo } from 'react'
import { getMaquinarios, deleteMaquinario } from '@/services/estoqueService'
import { Maquinario } from '@/types/estoque'
import { MaquinarioModal } from './MaquinarioModal'
import {
  SearchBar,
  EmptyState,
  TableWrapper,
  TableHead,
  RowActions,
  StatusBadge,
} from '@/components/ui/EstoqueUI'

export function MaquinarioTable() {
  const [data, setData] = useState<Maquinario[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Maquinario | null>(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')

  async function load() {
    setLoading(true)
    try {
      const res = await getMaquinarios()
      setData(res)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja excluir este maquinário?')) return
    await deleteMaquinario(id)
    load()
  }

  function handleEdit(item: Maquinario) {
    setEditing(item)
    setOpen(true)
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() =>
    data.filter(m => {
      const matchSearch = [m.nome, m.tipo, m.modelo, m.fabricante].some(f =>
        f?.toLowerCase().includes(search.toLowerCase())
      )
      const matchStatus = filterStatus === 'todos' || m.status === filterStatus
      return matchSearch && matchStatus
    }), [data, search, filterStatus])

  const statuses = ['todos', 'ativo', 'em_uso', 'manutencao', 'parado']
  const statusLabels: Record<string, string> = {
    todos: 'Todos', ativo: 'Ativo', em_uso: 'Em uso', manutencao: 'Manutenção', parado: 'Parado'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <SearchBar value={search} onChange={setSearch} placeholder="Nome, tipo, modelo..." />

          <div className="flex gap-1 bg-[#111113] border border-gray-800 rounded-lg p-1">
            {statuses.map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  filterStatus === s ? 'bg-gray-700 text-white' : 'text-gray-600 hover:text-gray-400'
                }`}
              >
                {statusLabels[s]}
              </button>
            ))}
          </div>
          <span className="text-xs text-gray-600">{filtered.length} item(s)</span>
        </div>

        <button
          onClick={() => { setEditing(null); setOpen(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-xl font-medium transition-colors shadow-lg shadow-blue-600/20"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Novo Maquinário
        </button>
      </div>

      <TableWrapper>
        <TableHead cols={['Nome', 'Tipo', 'Modelo', 'Fabricante', 'Horímetro', 'Custo/H', 'Status']} />
        <tbody className="divide-y divide-gray-800/60">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: 8 }).map((_, j) => (
                  <td key={j} className="px-4 py-3">
                    <div className="h-4 bg-gray-800 rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))
          ) : filtered.length === 0 ? (
            <tr><td colSpan={8}><EmptyState label="maquinário" /></td></tr>
          ) : (
            filtered.map(item => (
              <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-4 py-3 font-medium text-gray-200">{item.nome}</td>
                <td className="px-4 py-3 text-gray-400">{item.tipo}</td>
                <td className="px-4 py-3 text-gray-500">{item.modelo}</td>
                <td className="px-4 py-3 text-gray-500">{item.fabricante || '—'}</td>
                <td className="px-4 py-3">
                  <span className="font-mono text-gray-300">{item.horimetro?.toLocaleString('pt-BR')}</span>
                  <span className="text-gray-600 text-xs ml-1">h</span>
                </td>
                <td className="px-4 py-3 text-gray-400">
                  {item.custo_hora
                    ? item.custo_hora.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    : '—'}
                </td>
                <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                <RowActions onEdit={() => handleEdit(item)} onDelete={() => handleDelete(item.id)} />
              </tr>
            ))
          )}
        </tbody>
      </TableWrapper>

      {open && (
        <MaquinarioModal
          initial={editing}
          onClose={() => setOpen(false)}
          onSuccess={load}
        />
      )}
    </div>
  )
}
