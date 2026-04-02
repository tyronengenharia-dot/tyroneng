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

// Só mostra entregas ativas (sem entregue)
const FILTROS: { label: string; value: StatusEntrega | 'todas' }[] = [
  { label: 'Todas', value: 'todas' },
  { label: 'Aguardando', value: 'aguardando' },
  { label: 'Em Transporte', value: 'transporte' },
  { label: 'Atrasadas', value: 'atrasado' },
]

function ModalConfirmarEntrega({
  entrega,
  carregando,
  onConfirmar,
  onCancelar,
}: {
  entrega: Entrega
  carregando: boolean
  onConfirmar: () => void
  onCancelar: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-zinc-700/60 bg-zinc-900 shadow-2xl">
        <div className="border-b border-zinc-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15">
              <svg className="h-4 w-4 text-emerald-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 8l4 4 6-6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h2 className="text-[14px] font-semibold text-zinc-100">Confirmar Entrega?</h2>
              <p className="text-[11px] text-zinc-500">O ciclo será encerrado e o item irá para Concluídos</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-600">Item</p>
              <p className="mt-0.5 text-[13px] font-semibold text-zinc-200">{entrega.descricao_item ?? entrega.pedido?.descricao_item}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-600">Fornecedor</p>
                <p className="mt-0.5 text-[11px] text-zinc-300">{entrega.fornecedor ?? entrega.pedido?.fornecedor}</p>
              </div>
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-600">Previsão</p>
                <p className="mt-0.5 text-[11px] text-zinc-300">{formatarData(entrega.data_prevista)}</p>
              </div>
            </div>
          </div>

          <p className="mt-3 text-[11px] text-zinc-500 leading-relaxed">
            Ao confirmar, esta entrega será movida para a aba <span className="text-zinc-300 font-medium">Concluídos</span> e o ciclo de compra será encerrado.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-zinc-800 px-6 py-4">
          <button onClick={onCancelar} disabled={carregando} className="rounded-lg border border-zinc-700/60 px-4 py-2 text-[12px] font-medium text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-300 disabled:opacity-50">
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            disabled={carregando}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-[12px] font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
          >
            {carregando ? (
              <>
                <svg className="h-3 w-3 animate-spin" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="8" cy="8" r="6" strokeOpacity="0.3"/><path d="M8 2a6 6 0 016 6" strokeLinecap="round"/>
                </svg>
                Confirmando...
              </>
            ) : (
              <>
                <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M3 8l4 4 6-6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Confirmar Entrega
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export function EntregaList({ data, onConfirmar }: Props) {
  const [filtro, setFiltro] = useState<StatusEntrega | 'todas'>('todas')
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)

  const entregaConfirmando = confirmandoId ? data.find((e) => e.id === confirmandoId) : null

  const filtrados = useMemo(() => {
    if (filtro === 'todas') return data
    return data.filter((e) => e.status === filtro)
  }, [data, filtro])

  const stats = useMemo(() => ({
    transporte: data.filter((e) => e.status === 'transporte').length,
    aguardando: data.filter((e) => e.status === 'aguardando').length,
    atrasadas: data.filter((e) => e.status === 'atrasado').length,
  }), [data])

  async function handleConfirmarEntrega() {
    if (!confirmandoId) return
    setCarregando(true)
    try {
      await onConfirmar?.(confirmandoId)
    } finally {
      setCarregando(false)
      setConfirmandoId(null)
    }
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 py-16 text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800 mx-auto">
          <svg className="h-6 w-6 text-zinc-500" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M1 3h14l-1.5 9H2.5L1 3z"/>
            <path d="M5 3l1-2h4l1 2" strokeLinecap="round"/>
            <circle cx="5.5" cy="14" r="1" fill="currentColor"/>
            <circle cx="10.5" cy="14" r="1" fill="currentColor"/>
          </svg>
        </div>
        <p className="text-[13px] font-medium text-zinc-400">Nenhuma entrega em andamento</p>
        <p className="mt-1 text-[11px] text-zinc-600">As entregas aparecerão aqui quando uma compra for fechada.</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {/* Mini stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-4 py-3 text-center">
            <div className="text-xl font-bold text-indigo-400">{stats.transporte}</div>
            <div className="mt-0.5 text-[10px] uppercase tracking-wide text-zinc-500">Em Transporte</div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-center">
            <div className="text-xl font-bold text-zinc-400">{stats.aguardando}</div>
            <div className="mt-0.5 text-[10px] uppercase tracking-wide text-zinc-500">Aguardando</div>
          </div>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-center">
            <div className="text-xl font-bold text-amber-400">{stats.atrasadas}</div>
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
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <BadgeStatus status={e.status} />
                      {(e.status === 'aguardando' || e.status === 'transporte' || e.status === 'atrasado') && (
                        <button
                          onClick={() => setConfirmandoId(e.id)}
                          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[10px] font-semibold text-white opacity-0 transition-all hover:bg-emerald-500 group-hover:opacity-100"
                        >
                          <svg className="h-2.5 w-2.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M3 8l4 4 6-6" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Confirmar Entrega
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

                  {/* Etapas */}
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
                       e.status === 'atrasado' ? 'Atrasado' : 'Entregue'}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {entregaConfirmando && (
        <ModalConfirmarEntrega
          entrega={entregaConfirmando}
          carregando={carregando}
          onConfirmar={handleConfirmarEntrega}
          onCancelar={() => setConfirmandoId(null)}
        />
      )}
    </>
  )
}
