'use client'

import { useEffect, useState, useMemo } from 'react'
import { getEquipamentos, deleteEquipamento } from '@/services/estoqueService'
import { Equipamento } from '@/types/estoque'
import { EquipamentosModal } from './EquipamentosModal'
import {
  SearchBar,
  EmptyState,
  TableWrapper,
  TableHead,
  RowActions,
  StatusBadge,
} from '@/components/estoque/estoqueUI'

export function EquipamentosTable() {
  const [data, setData] = useState<Equipamento[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Equipamento | null>(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')

  async function load() {
    setLoading(true)
    try {
      const res = await getEquipamentos()
      setData(res)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja excluir este equipamento?')) return
    await deleteEquipamento(id)
    load()
  }

  function handleEdit(item: Equipamento) {
    setEditing(item)
    setOpen(true)
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() =>
    data.filter(e => {
      const matchSearch = [e.nome, e.categoria, e.numero_serie, e.responsavel].some(f =>
        f?.toLowerCase().includes(search.toLowerCase())
      )
      const matchStatus = filterStatus === 'todos' || e.status === filterStatus
      return matchSearch && matchStatus
    }), [data, search, filterStatus])

  const statuses = ['todos', 'disponivel', 'em_uso', 'manutencao']
  const statusLabels: Record<string, string> = {
    todos: 'Todos',
    disponivel: 'Disponível',
    em_uso: 'Em uso',
    manutencao: 'Manutenção',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <SearchBar value={search} onChange={setSearch} placeholder="Nome, série, categoria..." />

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
          Novo Equipamento
        </button>
      </div>

      <TableWrapper>
        <TableHead cols={['Nome', 'Nº Série', 'Categoria', 'Localização', 'Responsável', 'Status', 'Valor']} />
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
            <tr><td colSpan={8}><EmptyState label="equipamento" /></td></tr>
          ) : (
            filtered.map(item => (
              <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-4 py-3 font-medium text-gray-200">{item.nome}</td>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-gray-500">{item.numero_serie || '—'}</span>
                </td>
                <td className="px-4 py-3 text-gray-400">{item.categoria || '—'}</td>
                <td className="px-4 py-3 text-gray-500">{item.localizacao || '—'}</td>
                <td className="px-4 py-3 text-gray-400">{item.responsavel || '—'}</td>
                <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                <td className="px-4 py-3 text-gray-400">
                  {item.valor
                    ? item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    : '—'}
                </td>
                <RowActions onEdit={() => handleEdit(item)} onDelete={() => handleDelete(item.id)} />
              </tr>
            ))
          )}
        </tbody>
      </TableWrapper>

      {open && (
        <EquipamentosModal
          initial={editing}
          onClose={() => setOpen(false)}
          onSuccess={load}
        />
      )}
    </div>
  )
}
