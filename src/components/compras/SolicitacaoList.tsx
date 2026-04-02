'use client'

import { useState, useMemo } from 'react'
import type { SolicitacaoCompra, StatusSolicitacao } from '@/types/compras'
import { BadgeStatus, BadgeUrgencia } from './ComprasBadges'
import { formatarData } from '@/lib/formatters'

interface Props {
  data: SolicitacaoCompra[]
  onCotar?: (id: string) => void
  onVerDetalhes?: (item: SolicitacaoCompra) => void
  onNovaSolicitacao?: () => void
}

const FILTROS_STATUS: { label: string; value: StatusSolicitacao | 'todas' }[] = [
  { label: 'Todas', value: 'todas' },
  { label: 'Pendentes', value: 'pendente' },
  { label: 'Em Cotação', value: 'em_cotacao' },
  { label: 'Aprovadas', value: 'aprovada' },
  { label: 'Recusadas', value: 'recusada' },
]

export function SolicitacaoList({ data, onCotar, onVerDetalhes, onNovaSolicitacao }: Props) {
  const [filtroStatus, setFiltroStatus] = useState<StatusSolicitacao | 'todas'>('todas')
  const [busca, setBusca] = useState('')

  const filtrados = useMemo(() => {
    return data.filter((s) => {
      const passaStatus = filtroStatus === 'todas' || s.status === filtroStatus
      const passaBusca =
        !busca ||
        s.descricao.toLowerCase().includes(busca.toLowerCase()) ||
        s.categoria.toLowerCase().includes(busca.toLowerCase()) ||
        s.solicitante.toLowerCase().includes(busca.toLowerCase())
      return passaStatus && passaBusca
    })
  }, [data, filtroStatus, busca])

  const contadores = useMemo(() => ({
    todas: data.length,
    pendente: data.filter((s) => s.status === 'pendente').length,
    em_cotacao: data.filter((s) => s.status === 'em_cotacao').length,
    aprovada: data.filter((s) => s.status === 'aprovada').length,
    recusada: data.filter((s) => s.status === 'recusada').length,
  }), [data])

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Busca */}
        <div className="relative max-w-xs flex-1">
          <svg
            className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500"
            viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
          >
            <circle cx="6.5" cy="6.5" r="5" />
            <path d="M10.5 10.5L14 14" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Buscar solicitações..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-lg border border-zinc-700/60 bg-zinc-800/60 py-2 pl-9 pr-3 text-[12px] text-zinc-200 placeholder-zinc-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
          />
        </div>

        <button
          onClick={onNovaSolicitacao}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-[12px] font-medium text-white transition-colors hover:bg-indigo-500"
        >
          <span className="text-base leading-none">+</span>
          Nova Solicitação
        </button>
      </div>

      {/* Filtros chips */}
      <div className="flex flex-wrap gap-1.5">
        {FILTROS_STATUS.map((f) => {
          const count = contadores[f.value]
          const ativo = filtroStatus === f.value
          return (
            <button
              key={f.value}
              onClick={() => setFiltroStatus(f.value)}
              className={`rounded-full px-3 py-1 text-[11px] font-medium transition-all ${
                ativo
                  ? 'bg-indigo-600 text-white'
                  : 'border border-zinc-700/60 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
              }`}
            >
              {f.label}
              <span className={`ml-1.5 ${ativo ? 'text-indigo-200' : 'text-zinc-600'}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Tabela */}
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/80">
                {['#', 'Descrição', 'Categoria', 'Qtd', 'Urgência', 'Necessidade', 'Status', 'Solicitante', ''].map((h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-zinc-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[12px] text-zinc-500">
                    Nenhuma solicitação encontrada
                  </td>
                </tr>
              ) : (
                filtrados.map((s, i) => (
                  <tr
                    key={s.id}
                    className="group transition-colors hover:bg-zinc-800/40"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-[11px] font-mono text-zinc-500">
                      #{String(i + 1).padStart(4, '0')}
                    </td>
                    <td className="max-w-[200px] px-4 py-3">
                      <p className="truncate text-[12px] font-medium text-zinc-200">{s.descricao}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[12px] text-zinc-400">{s.categoria}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-[12px] text-zinc-400">
                      {s.quantidade} {s.unidade}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <BadgeUrgencia urgencia={s.urgencia} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[12px] text-zinc-400">
                      {formatarData(s.data_necessaria)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <BadgeStatus status={s.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[12px] text-zinc-400">{s.solicitante}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                        {(s.status === 'pendente') && (
                          <button
                            onClick={() => onCotar?.(s.id)}
                            className="rounded-md bg-indigo-600/80 px-2.5 py-1 text-[10px] font-medium text-white hover:bg-indigo-500 transition-colors"
                          >
                            Cotar
                          </button>
                        )}
                        <button
                          onClick={() => onVerDetalhes?.(s)}
                          className="rounded-md border border-zinc-700 px-2.5 py-1 text-[10px] font-medium text-zinc-400 hover:border-zinc-600 hover:text-zinc-300 transition-colors"
                        >
                          Ver
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-right text-[11px] text-zinc-600">
        {filtrados.length} de {data.length} solicitações
      </p>
    </div>
  )
}
