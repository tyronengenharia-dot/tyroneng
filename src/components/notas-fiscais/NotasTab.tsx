'use client'

import { useEffect, useState } from 'react'
import { getNotas } from '@/services/notaFiscalService'
import { NotaFiscal } from '@/types/notaFiscal'
import { NotasMetrics } from '@/components/notas-fiscais/NotasMetrics'
import { NotasFilters } from '@/components/notas-fiscais/NotasFilters'
import { NotasTable } from '@/components/notas-fiscais/NotasTable'
import { NotaModal } from '@/components/notas-fiscais/NotasModal'

export function NotasTab() {
  const [data, setData] = useState<NotaFiscal[]>([])
  const [filtered, setFiltered] = useState<NotaFiscal[]>([])
  const [loading, setLoading] = useState(true)
  const [openModal, setOpenModal] = useState(false)
  const [editing, setEditing] = useState<NotaFiscal | null>(null)

  const [search, setSearch] = useState('')
  const [type, setType] = useState('todos')
  const [status, setStatus] = useState('todos')

  async function fetchData() {
    setLoading(true)
    const result = await getNotas()
    setData(result)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    let result = [...data]
    if (search) result = result.filter(n => n.client.toLowerCase().includes(search.toLowerCase()) || n.number.toLowerCase().includes(search.toLowerCase()))
    if (type !== 'todos') result = result.filter(n => n.type === type)
    if (status !== 'todos') result = result.filter(n => n.status === status)
    setFiltered(result)
  }, [search, type, status, data])

  function handleSave(item: Omit<NotaFiscal, 'id'>) {
    if (editing) {
      setData(prev => prev.map(n => n.id === editing.id ? { ...item, id: editing.id } : n))
    } else {
      setData(prev => [...prev, { ...item, id: Date.now().toString() }])
    }
    setEditing(null)
  }

  function handleDelete(id: string) {
    setData(prev => prev.filter(n => n.id !== id))
  }

  return (
    <div className="space-y-6">
      {/* Metrics */}
      {!loading && <NotasMetrics data={data} />}

      {/* Toolbar */}
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <NotasFilters
          search={search}
          setSearch={setSearch}
          type={type}
          setType={setType}
          status={status}
          setStatus={setStatus}
        />

        <button
          onClick={() => { setEditing(null); setOpenModal(true) }}
          className="flex items-center gap-2 bg-white text-black px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          <span className="text-base leading-none">+</span>
          Nova nota
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-12 text-center text-white/40 text-sm">
          Carregando notas fiscais...
        </div>
      ) : (
        <NotasTable
          data={filtered}
          onEdit={item => { setEditing(item); setOpenModal(true) }}
          onDelete={handleDelete}
        />
      )}

      {/* Modal */}
      {openModal && (
        <NotaModal
          initialData={editing}
          onClose={() => { setOpenModal(false); setEditing(null) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}