'use client'

import { useEffect, useMemo, useState } from 'react'
import { getContratos, formatCurrency } from '@/services/contratoService'
import { Contrato } from '@/types/contrato'

import { ContratosTable } from '@/components/contratos/ContratosTable'
import { ContratosFilters } from '@/components/contratos/ContratosFilters'
import { ContratoModal } from '@/components/contratos/ContratoModal'

// ─── Stats Card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }: {
  label: string
  value: string
  sub?: string
  accent?: string
}) {
  return (
    <div className="bg-[#111] border border-white/10 rounded-2xl px-5 py-4 flex flex-col gap-1">
      <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</span>
      <span className={`text-2xl font-semibold ${accent ?? 'text-white'}`}>{value}</span>
      {sub && <span className="text-xs text-gray-500">{sub}</span>}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function ContratosPage() {
  const [data, setData] = useState<Contrato[]>([])
  const [status, setStatus] = useState('todos')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Contrato | null>(null)

  useEffect(() => {
    getContratos().then(result => {
      setData(result)
      setLoading(false)
    })
  }, [])

  // ─── Filtered data
  const filtered = useMemo(() => {
    return data.filter(c => {
      const matchStatus = status === 'todos' || c.status === status
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.client.toLowerCase().includes(q) ||
        c.client_email?.toLowerCase().includes(q) ||
        c.tags?.some(t => t.toLowerCase().includes(q))
      return matchStatus && matchSearch
    })
  }, [data, status, search])

  // ─── Status counts (before status filter, after search)
  const counts = useMemo(() => {
    const base = search
      ? data.filter(c => {
          const q = search.toLowerCase()
          return (
            c.name.toLowerCase().includes(q) ||
            c.client.toLowerCase().includes(q) ||
            c.client_email?.toLowerCase().includes(q) ||
            c.tags?.some(t => t.toLowerCase().includes(q))
          )
        })
      : data

    return base.reduce<Record<string, number>>((acc, c) => {
      acc[c.status] = (acc[c.status] ?? 0) + 1
      return acc
    }, {})
  }, [data, search])

  // ─── Stats
  const stats = useMemo(() => {
    const ativos = data.filter(c => c.status === 'ativo')
    const totalValue = ativos.reduce((s, c) => s + (c.value ?? 0), 0)
    const pendentes = data.filter(c => c.status === 'pendente').length
    const vencendo = ativos.filter(c => {
      const days = Math.ceil((new Date(c.end_date).getTime() - Date.now()) / 86400000)
      return days >= 0 && days <= 30
    }).length
    return { totalValue, ativos: ativos.length, pendentes, vencendo }
  }, [data])

  // ─── CRUD handlers
  function handleSave(item: Omit<Contrato, 'id'>) {
    if (editTarget) {
      setData(prev => prev.map(c => c.id === editTarget.id ? { ...item, id: editTarget.id } : c))
    } else {
      setData(prev => [...prev, { ...item, id: Date.now().toString() }])
    }
    setEditTarget(null)
  }

  function handleEdit(item: Contrato) {
    setEditTarget(item)
    setModalOpen(true)
  }

  function handleDelete(id: string) {
    if (confirm('Deseja excluir este contrato?')) {
      setData(prev => prev.filter(c => c.id !== id))
    }
  }

  function handleCloseModal() {
    setModalOpen(false)
    setEditTarget(null)
  }

  // ─── Export CSV
  function handleExport() {
    const headers = ['Nome', 'Cliente', 'E-mail', 'Valor', 'Início', 'Fim', 'Status']
    const rows = filtered.map(c => [
      c.name, c.client, c.client_email ?? '', c.value ?? '', c.start_date, c.end_date, c.status
    ])
    const csv = [headers, ...rows].map(r => r.join(';')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'contratos.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-8 px-4">

      {/* ── Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Contratos</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {data.length} contrato{data.length !== 1 ? 's' : ''} cadastrado{data.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white border border-white/10 rounded-xl hover:bg-white/5 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Exportar CSV
          </button>

          <button
            onClick={() => { setEditTarget(null); setModalOpen(true) }}
            className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Novo contrato
          </button>
        </div>
      </div>

      {/* ── Stats */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Valor em contratos ativos"
            value={formatCurrency(stats.totalValue)}
            sub={`${stats.ativos} contrato${stats.ativos !== 1 ? 's' : ''} ativo${stats.ativos !== 1 ? 's' : ''}`}
          />
          <StatCard
            label="Contratos ativos"
            value={String(stats.ativos)}
            accent="text-emerald-400"
          />
          <StatCard
            label="Pendentes de assinatura"
            value={String(stats.pendentes)}
            accent={stats.pendentes > 0 ? 'text-amber-400' : 'text-white'}
          />
          <StatCard
            label="Vencem em 30 dias"
            value={String(stats.vencendo)}
            accent={stats.vencendo > 0 ? 'text-red-400' : 'text-white'}
            sub={stats.vencendo > 0 ? 'Atenção necessária' : 'Tudo em ordem'}
          />
        </div>
      )}

      {/* ── Filters */}
      <ContratosFilters
        status={status}
        setStatus={setStatus}
        search={search}
        setSearch={setSearch}
        counts={counts}
      />

      {/* ── Table */}
      {loading ? (
        <div className="bg-[#111] border border-white/10 rounded-2xl p-10 text-center">
          <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Carregando contratos...</p>
        </div>
      ) : (
        <ContratosTable
          data={filtered}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* ── Footer count */}
      {!loading && filtered.length > 0 && (
        <p className="text-xs text-gray-600 text-right">
          Exibindo {filtered.length} de {data.length} contratos
        </p>
      )}

      {/* ── Modal */}
      {modalOpen && (
        <ContratoModal
          onClose={handleCloseModal}
          onSave={handleSave}
          initial={editTarget ?? undefined}
        />
      )}
    </div>
  )
}
