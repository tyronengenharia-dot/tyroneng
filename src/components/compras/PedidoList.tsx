'use client'

import { useState, useMemo } from 'react'
import type { PedidoCompra } from '@/types/compras'
import { BadgeStatus, LabelPagamento } from './ComprasBadges'
import { formatarData, formatarMoeda } from '@/lib/formatters'

interface Props {
  data: PedidoCompra[]
  onAutorizar?: (pedido: PedidoCompra) => Promise<void>
  onRecusar?: (pedido: PedidoCompra) => Promise<void>
  onVerDetalhes?: (pedido: PedidoCompra) => void
}

// ─── Modal de confirmação de autorização ─────────────────────────────────────

function ModalAutorizacao({
  pedido,
  tipo,
  carregando,
  onConfirmar,
  onCancelar,
}: {
  pedido: PedidoCompra
  tipo: 'autorizar' | 'recusar'
  carregando: boolean
  onConfirmar: () => void
  onCancelar: () => void
}) {
  const autorizando = tipo === 'autorizar'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-zinc-700/60 bg-zinc-900 shadow-2xl">
        <div className="border-b border-zinc-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-full ${autorizando ? 'bg-emerald-500/15' : 'bg-red-500/15'}`}>
              {autorizando ? (
                <svg className="h-4 w-4 text-emerald-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 8l4 4 6-6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg className="h-4 w-4 text-red-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round"/>
                </svg>
              )}
            </div>
            <div>
              <h2 className="text-[14px] font-semibold text-zinc-100">
                {autorizando ? 'Autorizar compra?' : 'Recusar pedido?'}
              </h2>
              <p className="text-[11px] text-zinc-500">
                {autorizando ? 'O pedido será aprovado e a compra autorizada' : 'O pedido será recusado e a cotação desmarcada'}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-3">
          {/* Resumo do pedido */}
          <div className={`rounded-lg border p-4 ${autorizando ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div>
                <p className="text-zinc-600 mb-0.5">Fornecedor</p>
                <p className="font-medium text-zinc-200">{pedido.fornecedor}</p>
              </div>
              <div>
                <p className="text-zinc-600 mb-0.5">Item</p>
                <p className="font-medium text-zinc-200 truncate">{pedido.descricao_item}</p>
              </div>
              <div>
                <p className="text-zinc-600 mb-0.5">Quantidade</p>
                <p className="font-medium text-zinc-200">{pedido.quantidade} {pedido.unidade}</p>
              </div>
              <div>
                <p className="text-zinc-600 mb-0.5">Valor total</p>
                <p className={`text-[15px] font-bold ${autorizando ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatarMoeda(pedido.valor_final)}
                </p>
              </div>
              <div>
                <p className="text-zinc-600 mb-0.5">Pagamento</p>
                <p className="font-medium text-zinc-300">
                  {{ a_vista: 'À vista', '7_dias': '7 dias', '14_dias': '14 dias', '30_dias': '30 dias', '60_dias': '60 dias' }[pedido.forma_pagamento] ?? pedido.forma_pagamento}
                </p>
              </div>
              <div>
                <p className="text-zinc-600 mb-0.5">Solicitado por</p>
                <p className="font-medium text-zinc-300">{pedido.aprovado_por}</p>
              </div>
            </div>
          </div>

          {!autorizando && (
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              A cotação será <span className="text-red-400 font-medium">desmarcada</span> e o item voltará para o processo de cotação.
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-zinc-800 px-6 py-4">
          <button
            onClick={onCancelar}
            disabled={carregando}
            className="rounded-lg border border-zinc-700/60 px-4 py-2 text-[12px] font-medium text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-300 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            disabled={carregando}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-[12px] font-medium text-white transition-colors disabled:opacity-50 ${
              autorizando ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'
            }`}
          >
            {carregando ? (
              <>
                <svg className="h-3 w-3 animate-spin" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="8" cy="8" r="6" strokeOpacity="0.3"/><path d="M8 2a6 6 0 016 6" strokeLinecap="round"/>
                </svg>
                {autorizando ? 'Autorizando...' : 'Recusando...'}
              </>
            ) : autorizando ? 'Sim, autorizar compra' : 'Sim, recusar pedido'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Badge de etapa do fluxo ──────────────────────────────────────────────────

function EtapaFluxo({ status }: { status: string }) {
  const config: Record<string, { label: string; step: number; className: string }> = {
    rascunho:              { label: 'Rascunho',            step: 1, className: 'bg-zinc-500/10 text-zinc-400 ring-1 ring-zinc-500/20' },
    aguardando_aprovacao:  { label: 'Aguard. Aprovação',   step: 2, className: 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20' },
    aprovado:              { label: 'Aprovado',            step: 3, className: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20' },
    cancelado:             { label: 'Cancelado',           step: 0, className: 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20' },
  }
  const cfg = config[status] ?? config['rascunho']
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cfg.className}`}>
      {cfg.step > 0 && <span className="font-mono text-[9px] opacity-60">{cfg.step}º</span>}
      {cfg.label}
    </span>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function PedidoList({ data, onAutorizar, onRecusar, onVerDetalhes }: Props) {
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [confirmacao, setConfirmacao] = useState<{ pedido: PedidoCompra; tipo: 'autorizar' | 'recusar' } | null>(null)
  const [carregando, setCarregando] = useState(false)

  const aguardando = useMemo(() => data.filter((p) => p.status === 'aguardando_aprovacao' || p.status === 'rascunho').length, [data])
  const aprovados  = useMemo(() => data.filter((p) => p.status === 'aprovado').length, [data])
  const cancelados = useMemo(() => data.filter((p) => p.status === 'cancelado').length, [data])

  const filtrados = useMemo(() => {
    return data.filter((p) => {
      const passaStatus = filtroStatus === 'todos' || p.status === filtroStatus ||
        (filtroStatus === 'aguardando' && (p.status === 'aguardando_aprovacao' || p.status === 'rascunho'))
      const passaBusca = !busca || [p.fornecedor, p.descricao_item, p.aprovado_por]
        .some((v) => v.toLowerCase().includes(busca.toLowerCase()))
      return passaStatus && passaBusca
    })
  }, [data, filtroStatus, busca])

  const totalAprovado = useMemo(
    () => data.filter((p) => p.status === 'aprovado').reduce((acc, p) => acc + p.valor_final, 0),
    [data]
  )

  async function handleConfirmar() {
    if (!confirmacao) return
    setCarregando(true)
    try {
      if (confirmacao.tipo === 'autorizar') {
        await onAutorizar?.(confirmacao.pedido)
      } else {
        await onRecusar?.(confirmacao.pedido)
      }
    } finally {
      setCarregando(false)
      setConfirmacao(null)
    }
  }

  return (
    <>
      <div className="space-y-4">
        {/* Mini stats do fluxo */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-center">
            <div className="text-xl font-bold text-amber-400">{aguardando}</div>
            <div className="mt-0.5 text-[10px] uppercase tracking-wide text-zinc-500">Aguard. Aprovação</div>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-center">
            <div className="text-xl font-bold text-emerald-400">{aprovados}</div>
            <div className="mt-0.5 text-[10px] uppercase tracking-wide text-zinc-500">Aprovados</div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-center">
            <div className="text-xl font-bold text-zinc-400">{cancelados}</div>
            <div className="mt-0.5 text-[10px] uppercase tracking-wide text-zinc-500">Cancelados</div>
          </div>
        </div>

        {/* Banner instrucional quando há pedidos aguardando */}
        {aguardando > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3">
            <svg className="h-4 w-4 shrink-0 text-amber-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="8" cy="8" r="6"/><path d="M8 5v4M8 11v.5" strokeLinecap="round"/>
            </svg>
            <p className="text-[12px] text-amber-300">
              <span className="font-semibold">{aguardando} pedido{aguardando > 1 ? 's' : ''}</span> aguardando aprovação — use os botões abaixo para autorizar ou recusar.
            </p>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {[
              { value: 'todos',      label: 'Todos',      count: data.length },
              { value: 'aguardando', label: 'Aguardando', count: aguardando },
              { value: 'aprovado',   label: 'Aprovados',  count: aprovados },
              { value: 'cancelado',  label: 'Cancelados', count: cancelados },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFiltroStatus(f.value)}
                className={`rounded-full px-3 py-1 text-[11px] font-medium transition-all ${
                  filtroStatus === f.value
                    ? 'bg-indigo-600 text-white'
                    : 'border border-zinc-700/60 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
                }`}
              >
                {f.label} <span className="ml-1 opacity-60">{f.count}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="6.5" cy="6.5" r="5"/><path d="M10.5 10.5L14 14" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                placeholder="Buscar pedidos..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="rounded-lg border border-zinc-700/60 bg-zinc-800/60 py-2 pl-9 pr-3 text-[12px] text-zinc-200 placeholder-zinc-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
              />
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-right shrink-0">
              <p className="text-[10px] uppercase tracking-widest text-zinc-500">Total aprovado</p>
              <p className="text-[14px] font-bold text-zinc-200">{formatarMoeda(totalAprovado)}</p>
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  {['Pedido', 'Fornecedor', 'Item', 'Qtd', 'Valor Unit.', 'Valor Total', 'Pagamento', 'Cotado por', 'Data', 'Status', ''].map((h) => (
                    <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-zinc-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filtrados.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-[12px] text-zinc-500">Nenhum pedido encontrado</td>
                  </tr>
                ) : (
                  filtrados.map((p, i) => {
                    const aguardaAprovacao = p.status === 'aguardando_aprovacao' || p.status === 'rascunho'
                    return (
                      <tr
                        key={p.id}
                        className={`group transition-colors hover:bg-zinc-800/40 ${aguardaAprovacao ? 'bg-amber-500/3' : ''}`}
                      >
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] text-zinc-500">
                          #PC-{String(i + 1).padStart(4, '0')}
                        </td>
                        <td className="px-4 py-3 text-[12px] font-medium text-zinc-200">{p.fornecedor}</td>
                        <td className="max-w-[160px] px-4 py-3">
                          <p className="truncate text-[12px] text-zinc-300">{p.descricao_item}</p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-[12px] text-zinc-400">{p.quantidade} {p.unidade}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-[12px] text-zinc-400">{formatarMoeda(p.valor_unitario)}</td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <span className={`text-[13px] font-semibold ${aguardaAprovacao ? 'text-amber-400' : p.status === 'aprovado' ? 'text-emerald-400' : 'text-zinc-400'}`}>
                            {formatarMoeda(p.valor_final)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-[12px]"><LabelPagamento forma={p.forma_pagamento} /></td>
                        <td className="whitespace-nowrap px-4 py-3 text-[12px] text-zinc-400">{p.aprovado_por}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-[12px] text-zinc-400">{formatarData(p.created_at)}</td>
                        <td className="whitespace-nowrap px-4 py-3"><EtapaFluxo status={p.status} /></td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {/* Botões de ação — só aparecem para pedidos aguardando */}
                            {aguardaAprovacao && (
                              <>
                                <button
                                  onClick={() => setConfirmacao({ pedido: p, tipo: 'autorizar' })}
                                  className="flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-[10px] font-medium text-white transition-colors hover:bg-emerald-500"
                                >
                                  <svg className="h-2.5 w-2.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M3 8l4 4 6-6" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                  Autorizar
                                </button>
                                <button
                                  onClick={() => setConfirmacao({ pedido: p, tipo: 'recusar' })}
                                  className="flex items-center gap-1 rounded-md border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[10px] font-medium text-red-400 transition-colors hover:bg-red-500/20"
                                >
                                  <svg className="h-2.5 w-2.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round"/>
                                  </svg>
                                  Recusar
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => onVerDetalhes?.(p)}
                              className="rounded-md border border-zinc-700 px-2.5 py-1 text-[10px] font-medium text-zinc-400 opacity-0 transition-all hover:border-zinc-600 hover:text-zinc-300 group-hover:opacity-100"
                            >
                              Ver
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {confirmacao && (
        <ModalAutorizacao
          pedido={confirmacao.pedido}
          tipo={confirmacao.tipo}
          carregando={carregando}
          onConfirmar={handleConfirmar}
          onCancelar={() => setConfirmacao(null)}
        />
      )}
    </>
  )
}
