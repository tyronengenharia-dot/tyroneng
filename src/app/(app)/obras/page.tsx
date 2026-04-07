'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getObras } from '@/services/obraService'
import { Obra, ObraStatus } from '@/types'
import { Badge, KpiCard, LoadingSpinner, ProgressBar } from '@/components/ui'
import { fmtCurrency, fmtDateShort, cn } from '@/lib/utils'

// ── Filter button ─────────────────────────────────────────────────────────────

function FilterBtn({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all',
        active
          ? 'bg-white/10 text-white border border-white/15'
          : 'text-white/40 hover:text-white/70'
      )}
    >
      {label}
    </button>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

type Filter = 'todas' | ObraStatus

export default function ObrasPage() {
  const [obras, setObras]     = useState<Obra[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState<Filter>('todas')

  useEffect(() => {
    getObras().then(data => {
      setObras(data)
      setLoading(false)
    })
  }, [])

  const filtered = filter === 'todas'
    ? obras
    : obras.filter(o => o.status === filter)

  const total    = obras.length
  const andamento = obras.filter(o => o.status === 'andamento').length
  const concluida = obras.filter(o => o.status === 'concluida').length
  const atrasada  = obras.filter(o => o.status === 'atrasada').length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">Obras</h1>
          <p className="text-sm text-white/30 mt-0.5">{total} obras cadastradas</p>
        </div>
        <Link
          href="/obras/nova"
          className="px-4 py-2 bg-white text-black text-sm font-semibold rounded-xl hover:bg-white/90 transition-colors"
        >
          + Nova Obra
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="Total de Obras"  value={total}     variant="neutral" />
        <KpiCard label="Em Andamento"    value={andamento} variant="blue"    sub="ativas agora" />
        <KpiCard label="Concluídas"      value={concluida} variant="green"   />
        <KpiCard label="Atrasadas"       value={atrasada}  variant="red"     sub="requer atenção" />
      </div>

      {/* Table card */}
      <div className="bg-[#0d0d0d] border border-white/[0.08] rounded-2xl overflow-hidden">
        {/* Table header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08]">
          <p className="text-sm font-medium text-white/60">Todas as Obras</p>
          <div className="flex gap-1">
            <FilterBtn label="Todas"      active={filter === 'todas'}     onClick={() => setFilter('todas')} />
            <FilterBtn label="Andamento"  active={filter === 'andamento'} onClick={() => setFilter('andamento')} />
            <FilterBtn label="Atrasadas"  active={filter === 'atrasada'}  onClick={() => setFilter('atrasada')} />
            <FilterBtn label="Concluídas" active={filter === 'concluida'} onClick={() => setFilter('concluida')} />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-white/30 text-sm">
            Nenhuma obra encontrada com este filtro
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider">Obra</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider">Cliente</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider">Local</th>
                <th className="px-5 py-3 text-right text-[10px] font-semibold text-white/30 uppercase tracking-wider">Orçamento</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider">Prazo</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((obra, idx) => (
                <tr
                  key={obra.id}
                  className={cn(
                    'border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors cursor-pointer',
                    idx % 2 !== 0 && 'bg-white/[0.01]'
                  )}
                >
                  <td className="px-5 py-4">
                    <Link href={`/obras/${obra.id}`} className="block">
                      <p className="font-medium text-white/90 hover:text-white transition-colors">
                        {obra.name}
                      </p>
                      <p className="text-xs text-white/30 mt-0.5">
                        Início {fmtDateShort(obra.start_date)}
                      </p>
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-white/50">{obra.client}</td>
                  <td className="px-5 py-4 text-white/50">{obra.location}</td>
                  <td className="px-5 py-4 text-right font-mono text-white/70">
                    {fmtCurrency(obra.budget)}
                  </td>
                  <td className="px-5 py-4 text-white/40 text-xs">
                    {obra.end_date ? fmtDateShort(obra.end_date) : '—'}
                  </td>
                  <td className="px-5 py-4">
                    <Badge value={obra.status} />
                  </td>
                  <td className="px-5 py-4">
                    <Link
                      href={`/obras/${obra.id}`}
                      className="px-3 py-1.5 text-xs font-medium bg-white/5 border border-white/10 text-white/50 rounded-lg hover:text-white hover:bg-white/10 transition-colors"
                    >
                      Abrir →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
