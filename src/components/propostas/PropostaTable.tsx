'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Proposta, PropostaStatus } from '@/types/proposta'
import { PropostaStatusBadge } from './PropostaStatusBadge'

interface Props { data: Proposta[] }

const FILTERS: { label: string; value: PropostaStatus | 'todas' }[] = [
  { label: 'Todas',      value: 'todas'     },
  { label: 'Enviadas',   value: 'enviada'   },
  { label: 'Aprovadas',  value: 'aprovada'  },
  { label: 'Rascunho',   value: 'rascunho'  },
  { label: 'Rejeitadas', value: 'rejeitada' },
]

const brl = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const dt = (iso: string) =>
  new Intl.DateTimeFormat('pt-BR').format(new Date(iso))

export function PropostaTable({ data }: Props) {
  const router = useRouter()
  const [filter, setFilter]       = useState<PropostaStatus | 'todas'>('todas')
  const [deleting, setDeleting]   = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [errMsg, setErrMsg]       = useState<string | null>(null)

  const filtered = filter === 'todas' ? data : data.filter(p => p.status === filter)

  async function handleDelete(id: string) {
    setDeleting(id)
    setErrMsg(null)
    try {
      const res = await fetch(`/api/propostas/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao excluir')
      router.refresh()
    } catch (e: any) {
      setErrMsg(e.message)
    } finally {
      setDeleting(null)
      setConfirmId(null)
    }
  }

  return (
    <div>
      {/* Filtros */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {FILTERS.map(f => {
          const count  = f.value === 'todas' ? data.length : data.filter(p => p.status === f.value).length
          const active = filter === f.value
          return (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all
                ${active
                  ? 'bg-amber-950/50 border-amber-700/50 text-amber-400'
                  : 'border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'}`}>
              {f.label}
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full
                ${active ? 'bg-amber-900/60 text-amber-400' : 'bg-zinc-800 text-zinc-500'}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {errMsg && (
        <div className="mb-3 px-3 py-2 bg-red-950/60 border border-red-800/50 rounded-lg">
          <p className="text-[11px] text-red-400">{errMsg}</p>
        </div>
      )}

      {/* Tabela */}
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-zinc-900/80 border-b border-zinc-800">
              {['Nº', 'Cliente', 'Título', 'Valor', 'Prazo', 'Data', 'Status', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] text-zinc-500 uppercase tracking-widest font-medium whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-zinc-600">
                  Nenhuma proposta encontrada.
                </td>
              </tr>
            ) : filtered.map(p => (
              <tr key={p.id} className="bg-zinc-950 hover:bg-zinc-900/50 transition-colors">
                <td className="px-4 py-3.5 font-mono text-[11px] text-zinc-500 whitespace-nowrap">#{p.numero}</td>
                <td className="px-4 py-3.5 text-sm text-zinc-200 font-medium max-w-[140px] truncate">{p.cliente}</td>
                <td className="px-4 py-3.5 text-sm text-zinc-400 max-w-[160px] truncate">
                  {p.tituloCapa.replace(/\n/g, ' ')}
                </td>
                <td className="px-4 py-3.5 font-mono text-sm text-zinc-200 whitespace-nowrap">{brl(p.valor)}</td>
                <td className="px-4 py-3.5 text-sm text-zinc-500 whitespace-nowrap">{p.prazoExecucao}d</td>
                <td className="px-4 py-3.5 text-[11px] text-zinc-600 font-mono whitespace-nowrap">{dt(p.createdAt)}</td>
                <td className="px-4 py-3.5 whitespace-nowrap"><PropostaStatusBadge status={p.status} /></td>
                <td className="px-4 py-3.5">
                  <div className="flex gap-1.5 justify-end items-center">
                    <Link href={`/propostas/${p.id}`}>
                      <button className="text-[11px] px-2.5 py-1.5 rounded-md border border-zinc-700 text-zinc-400 hover:border-amber-700/60 hover:text-amber-400 transition-all whitespace-nowrap">
                        Abrir
                      </button>
                    </Link>

                    {confirmId === p.id ? (
                      <>
                        <button onClick={() => handleDelete(p.id)} disabled={!!deleting}
                          className="text-[11px] px-2.5 py-1.5 rounded-md bg-red-950/70 border border-red-800/60 text-red-400 hover:bg-red-900/50 disabled:opacity-50 transition-all whitespace-nowrap">
                          {deleting === p.id ? '...' : 'Confirmar'}
                        </button>
                        <button onClick={() => setConfirmId(null)}
                          className="text-[11px] px-2 py-1.5 rounded-md border border-zinc-700 text-zinc-500 hover:text-zinc-300 transition-all">
                          ✕
                        </button>
                      </>
                    ) : (
                      <button onClick={() => setConfirmId(p.id)}
                        className="text-[11px] px-2.5 py-1.5 rounded-md border border-zinc-800 text-zinc-600 hover:border-red-800/50 hover:text-red-500 transition-all whitespace-nowrap">
                        Excluir
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-zinc-600 mt-3">
        {filtered.length} de {data.length} proposta{data.length !== 1 ? 's' : ''}
      </p>
    </div>
  )
}
