'use client'

import { useEffect, useState, useMemo } from 'react'
import { getMateriais, deleteMaterial } from '@/services/estoqueService'
import { Material } from '@/types/estoque'
import { MateriaisModal } from './MateriaisModal'
import {
  SearchBar,
  EmptyState,
  TableWrapper,
  TableHead,
  RowActions,
  StatusBadge,
} from '@/components/ui/EstoqueUI'

export function MateriaisTable() {
  const [data, setData] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Material | null>(null)
  const [search, setSearch] = useState('')

  async function load() {
    setLoading(true)
    try {
      const res = await getMateriais()
      setData(res)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja excluir este material?')) return
    await deleteMaterial(id)
    load()
  }

  function handleEdit(item: Material) {
    setEditing(item)
    setOpen(true)
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(
    () => data.filter(m => m.nome?.toLowerCase().includes(search.toLowerCase())),
    [data, search]
  )

  const totalValor = useMemo(
    () => filtered.reduce((acc, m) => acc + (m.valor_unitario ?? 0) * (m.quantidade ?? 0), 0),
    [filtered]
  )

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar material..." />
          <span className="text-xs text-gray-600">{filtered.length} itens</span>
        </div>
        <button
          onClick={() => { setEditing(null); setOpen(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-xl font-medium transition-colors shadow-lg shadow-blue-600/20"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Novo Material
        </button>
      </div>

      <TableWrapper>
        <TableHead cols={['Nome', 'Unidade', 'Quantidade', 'Valor Unit.', 'Total']} />
        <tbody className="divide-y divide-gray-800/60">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: 6 }).map((_, j) => (
                  <td key={j} className="px-4 py-3">
                    <div className="h-4 bg-gray-800 rounded animate-pulse" style={{ width: j === 0 ? '60%' : '40%' }} />
                  </td>
                ))}
              </tr>
            ))
          ) : filtered.length === 0 ? (
            <tr>
              <td colSpan={6}>
                <EmptyState label="material" />
              </td>
            </tr>
          ) : (
            filtered.map(item => (
              <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-4 py-3 font-medium text-gray-200">{item.nome}</td>
                <td className="px-4 py-3 text-gray-500">{item.unidade || '—'}</td>
                <td className="px-4 py-3 text-gray-300">
                  <span className="font-mono">{item.quantidade?.toLocaleString('pt-BR')}</span>
                </td>
                <td className="px-4 py-3 text-gray-300">
                  {item.valor_unitario?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
                <td className="px-4 py-3 text-emerald-400 font-medium">
                  {((item.valor_unitario ?? 0) * (item.quantidade ?? 0)).toLocaleString('pt-BR', {
                    style: 'currency', currency: 'BRL',
                  })}
                </td>
                <RowActions onEdit={() => handleEdit(item)} onDelete={() => handleDelete(item.id)} />
              </tr>
            ))
          )}
        </tbody>
        {filtered.length > 0 && (
          <tfoot className="border-t border-gray-800">
            <tr>
              <td colSpan={4} className="px-4 py-3 text-xs text-gray-600 font-medium uppercase tracking-wider">
                Total em estoque
              </td>
              <td className="px-4 py-3 text-emerald-400 font-bold">
                {totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </td>
              <td />
            </tr>
          </tfoot>
        )}
      </TableWrapper>

      {open && (
        <MateriaisModal
          initial={editing}
          onClose={() => setOpen(false)}
          onSuccess={load}
        />
      )}
    </div>
  )
}
