'use client'

import { useState, useMemo } from 'react'
import type { Entrega, StatusEntrega } from '@/types/compras'
import { BadgeStatus } from './ComprasBadges'
import { formatarData, calcularAtraso } from '@/lib/formatters'

interface Props {
  data: Entrega[]
  onConfirmar?: (id: string) => void
}

const PROGRESSO: Record<StatusEntrega, number> = {
  aguardando: 10,
  transporte: 65,
  entregue: 100,
  atrasado: 45,
}

const COR_PROG: Record<StatusEntrega, string> = {
  aguardando: 'bg-zinc-600',
  transporte: 'bg-indigo-500',
  entregue: 'bg-emerald-500',
  atrasado: 'bg-amber-500',
}

const FILTROS: { label: string; value: StatusEntrega | 'todas' }[] = [
  { label: 'Todas', value: 'todas' },
  { label: 'Aguardando', value: 'aguardando' },
  { label: 'Transporte', value: 'transporte' },
  { label: 'Entregues', value: 'entregue' },
  { label: 'Atrasadas', value: 'atrasado' },
]

export function EntregaList({ data, onConfirmar }: Props) {
  const [filtro, setFiltro] = useState<StatusEntrega | 'todas'>('todas')

  const filtrados = useMemo(() => {
    if (filtro === 'todas') return data
    return data.filter((e) => e.status === filtro)
  }, [data, filtro])

  const stats = useMemo(() => ({
    transporte: data.filter((e) => e.status === 'transporte').length,
    entregues: data.filter((e) => e.status === 'entregue').length,
    atrasadas: data.filter((e) => e.status === 'atrasado').length,
  }), [data])

  return (
    <div className="space-y-4">
      {/* Mini stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-center">
          <div className="text-xl font-bold text-purple-400">{stats.transporte}</div>
          <div className="mt-0.5 text-[10px] uppercase tracking-wide text-zinc-500">Em Transporte</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-center">
          <div className="text-xl font-bold text-emerald-400">{stats.entregues}</div>
          <div className="mt-0.5 text-[10px] uppercase tracking-wide text-zinc-500">Entregues</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-center">
          <div className="text-xl font-bold text-red-400">{stats.atrasadas}</div>
          <div className="mt-0.5 text-[10px] uppercase tracking-wide text-zinc-500">Atrasadas</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-1.5">
        {FILTROS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFiltro(f.value)}
            className={`rounded-full px-3 py-1 text-[11px] font-medium transition-all ${
              filtro === f.value
                ? 'bg-indigo-600 text-white'
                : 'border border-zinc-700/60 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Cards de entrega */}
      <div className="space-y-2">
        {filtrados.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 py-12 text-center text-[12px] text-zinc-500">
            Nenhuma entrega neste status
          </div>
        ) : (
          filtrados.map((e) => {
            const diasAtraso = calcularAtraso(e.data_prevista, e.data_real)
            const atrasada = e.status === 'atrasado' || (diasAtraso > 0 && e.status !== 'entregue')

            return (
              <div
                key={e.id}
                className={`group rounded-xl border bg-zinc-900 p-4 transition-colors hover:bg-zinc-800/50 ${
                  atrasada ? 'border-amber-500/20' : 'border-zinc-800'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[13px] font-medium text-zinc-200">
                        {e.descricao_item ?? e.pedido?.descricao_item}
                      </p>
                      {atrasada && diasAtraso > 0 && (
                        <span className="shrink-0 rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-400">
                          +{diasAtraso}d atraso
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] text-zinc-500">
                      {e.fornecedor ?? e.pedido?.fornecedor} ·{' '}
                      Previsto {formatarData(e.data_prevista)}
                      {e.data_real && ` · Recebido ${formatarData(e.data_real)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <BadgeStatus status={e.status} />
                    {e.status === 'transporte' && (
                      <button
                        onClick={() => onConfirmar?.(e.id)}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[10px] font-medium text-white opacity-0 transition-all hover:bg-emerald-500 group-hover:opacity-100"
                      >
                        Confirmar
                      </button>
                    )}
                  </div>
                </div>

                {/* Barra de progresso */}
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex-1">
                    <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className={`h-1.5 rounded-full transition-all ${COR_PROG[e.status]}`}
                        style={{ width: `${PROGRESSO[e.status]}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-zinc-600">{PROGRESSO[e.status]}%</span>
                </div>

                {/* Etapas visuais */}
                <div className="mt-2 flex items-center gap-0">
                  {(['aguardando', 'transporte', 'entregue'] as const).map((etapa, idx) => {
                    const etapas = ['aguardando', 'transporte', 'entregue']
                    const currentIdx = etapas.indexOf(e.status === 'atrasado' ? 'transporte' : e.status)
                    const ativa = idx <= currentIdx
                    return (
                      <div key={etapa} className="flex items-center">
                        <div className={`h-1.5 w-1.5 rounded-full ${ativa ? COR_PROG[e.status] : 'bg-zinc-700'}`} />
                        {idx < 2 && (
                          <div className={`h-px w-8 ${ativa && idx < currentIdx ? COR_PROG[e.status] : 'bg-zinc-700'}`} />
                        )}
                      </div>
                    )
                  })}
                  <span className="ml-2 text-[10px] text-zinc-500 capitalize">
                    {e.status === 'aguardando' ? 'Aguardando despacho' :
                     e.status === 'transporte' ? 'A caminho' :
                     e.status === 'entregue' ? 'Entregue' : 'Atrasado'}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
