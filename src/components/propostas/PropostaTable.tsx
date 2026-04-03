'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Proposta, PropostaStatus } from '@/types/proposta'
import { PropostaStatusBadge } from './PropostaStatusBadge'
import { formatCurrency, formatDate, STATUS_LABEL } from '@/lib/proposta-utils'

interface Props {
  data: Proposta[]
}

const FILTERS: { label: string; value: PropostaStatus | 'todas' }[] = [
  { label: 'Todas', value: 'todas' },
  { label: 'Enviadas', value: 'enviada' },
  { label: 'Aprovadas', value: 'aprovada' },
  { label: 'Rascunho', value: 'rascunho' },
  { label: 'Rejeitadas', value: 'rejeitada' },
]

export function PropostaTable({ data }: Props) {
  const [filter, setFilter] = useState<PropostaStatus | 'todas'>('todas')

  const filtered =
    filter === 'todas' ? data : data.filter((p) => p.status === filter)

  return (
    <div>
      {/* Filter chips */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {FILTERS.map((f) => {
          const active = filter === f.value
          const count =
            f.value === 'todas'
              ? data.length
              : data.filter((p) => p.status === f.value).length
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium
                border transition-all duration-150
                ${
                  active
                    ? 'bg-amber-950/50 border-amber-700/50 text-amber-400'
                    : 'bg-transparent border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'
                }
              `}
            >
              {f.label}
              <span
                className={`
                  text-[10px] font-mono px-1.5 py-0.5 rounded-full
                  ${active ? 'bg-amber-900/60 text-amber-400' : 'bg-zinc-800 text-zinc-500'}
                `}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-zinc-900/80 border-b border-zinc-800">
              {['Nº', 'Cliente', 'Obra / Serviço', 'Valor', 'Prazo', 'Criada em', 'Status', ''].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[10px] text-zinc-500 uppercase tracking-widest font-medium"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-sm text-zinc-600"
                >
                  Nenhuma proposta encontrada.
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr
                  key={p.id}
                  className="bg-zinc-950 hover:bg-zinc-900/60 transition-colors duration-100"
                >
                  <td className="px-4 py-3.5 font-mono text-[11px] text-zinc-500">
                    #{p.numero}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-zinc-200 font-medium">
                    {p.cliente}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-zinc-400 max-w-[220px] truncate">
                    {p.obra}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-sm text-zinc-200">
                    {formatCurrency(p.valor)}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-zinc-400">
                    {p.prazoExecucao}d
                  </td>
                  <td className="px-4 py-3.5 text-[11px] text-zinc-500 font-mono">
                    {formatDate(p.createdAt)}
                  </td>
                  <td className="px-4 py-3.5">
                    <PropostaStatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3.5">
                    <Link href={`/propostas/${p.id}`}>
                      <button className="text-[11px] px-2.5 py-1 rounded-md border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-all">
                        Abrir →
                      </button>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-zinc-600 mt-3">
        {filtered.length} de {data.length} proposta{data.length !== 1 ? 's' : ''}
      </p>
    </div>
  )
}
