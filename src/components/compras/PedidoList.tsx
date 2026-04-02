'use client'

import { useState, useMemo } from 'react'
import type { PedidoCompra } from '@/types/compras'
import { LabelPagamento } from './ComprasBadges'
import { formatarData, formatarMoeda } from '@/lib/formatters'

interface Props {
  data: PedidoCompra[]
  onAutorizar?: (pedido: PedidoCompra) => Promise<void>
  onRecusar?: (pedido: PedidoCompra) => Promise<void>
  onVerDetalhes?: (pedido: PedidoCompra) => void
}

// ─── Modal de confirmação ─────────────────────────────────────────────────────

function ModalAcao({
  pedido,
  tipo,
  carregando,
  onConfirmar,
  onCancelar,
}: {
  pedido: PedidoCompra
  tipo: 'fechar' | 'devolver'
  carregando: boolean
  onConfirmar: () => void
  onCancelar: () => void
}) {
  const fechando = tipo === 'fechar'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-zinc-700/60 bg-zinc-900 shadow-2xl">
        <div className="border-b border-zinc-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-full ${fechando ? 'bg-emerald-500/15' : 'bg-amber-500/15'}`}>
              {fechando ? (
                <svg className="h-4 w-4 text-emerald-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 8l4 4 6-6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg className="h-4 w-4 text-amber-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M10 8H2M5 5L2 8l3 3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <div>
              <h2 className="text-[14px] font-semibold text-zinc-100">
                {fechando ? 'Fechar Compra?' : 'Devolver para Cotação?'}
              </h2>
              <p className="text-[11px] text-zinc-500">
                {fechando
                  ? 'A compra será aprovada e a entrega será registrada'
                  : 'O pedido será cancelado e voltará para seleção de cotações'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-3">
          <div className={`rounded-lg border p-4 ${fechando ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-amber-500/20 bg-amber-500/5'}`}>
            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div>
                <p className="text-zinc-600 mb-0.5">Fornecedor</p>
                <p className="font-semibold text-zinc-200">{pedido.fornecedor}</p>
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
                <p className={`text-[16px] font-bold ${fechando ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {formatarMoeda(pedido.valor_final)}
                </p>
              </div>
            </div>
          </div>

          {!fechando && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/8 px-3 py-2.5">
              <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="8" cy="8" r="6"/><path d="M8 5v4M8 11v.5" strokeLinecap="round"/>
              </svg>
              <p className="text-[11px] text-amber-300">
                A cotação será <span className="font-medium">desmarcada</span> e a solicitação voltará para o fluxo de cotações para nova seleção.
              </p>
            </div>
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
              fechando ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-amber-600 hover:bg-amber-500'
            }`}
          >
            {carregando ? (
              <>
                <svg className="h-3 w-3 animate-spin" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="8" cy="8" r="6" strokeOpacity="0.3"/><path d="M8 2a6 6 0 016 6" strokeLinecap="round"/>
                </svg>
                {fechando ? 'Fechando...' : 'Devolvendo...'}
              </>
            ) : fechando ? 'Sim, fechar compra' : 'Sim, devolver'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function PedidoList({ data, onAutorizar, onRecusar, onVerDetalhes }: Props) {
  const [busca, setBusca] = useState('')
  const [confirmacao, setConfirmacao] = useState<{ pedido: PedidoCompra; tipo: 'fechar' | 'devolver' } | null>(null)
  const [carregando, setCarregando] = useState(false)

  const filtrados = useMemo(() => {
    if (!busca) return data
    return data.filter((p) =>
      [p.fornecedor, p.descricao_item, p.aprovado_por]
        .some((v) => v.toLowerCase().includes(busca.toLowerCase()))
    )
  }, [data, busca])

  const totalPendente = useMemo(
    () => data.reduce((acc, p) => acc + p.valor_final, 0),
    [data]
  )

  async function handleConfirmar() {
    if (!confirmacao) return
    setCarregando(true)
    try {
      if (confirmacao.tipo === 'fechar') {
        await onAutorizar?.(confirmacao.pedido)
      } else {
        await onRecusar?.(confirmacao.pedido)
      }
    } finally {
      setCarregando(false)
      setConfirmacao(null)
    }
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 py-16 text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800 mx-auto">
          <svg className="h-6 w-6 text-zinc-500" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M2 2h10l2 2v10a1 1 0 01-1 1H2a1 1 0 01-1-1V3a1 1 0 011-1z"/>
            <path d="M5 7h6M5 10h4" strokeLinecap="round"/>
          </svg>
        </div>
        <p className="text-[13px] font-medium text-zinc-400">Nenhum pedido aguardando aprovação</p>
        <p className="mt-1 text-[11px] text-zinc-600">Quando uma cotação for selecionada e enviada, o pedido aparecerá aqui.</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {/* Banner instrucional */}
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/8 px-4 py-3">
          <svg className="h-4 w-4 shrink-0 text-amber-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="8" cy="8" r="6"/><path d="M8 5v4M8 11v.5" strokeLinecap="round"/>
          </svg>
          <p className="text-[12px] text-amber-300">
            <span className="font-semibold">{data.length} pedido{data.length > 1 ? 's' : ''}</span> aguardando aprovação — revise e feche a compra ou devolva para cotação.
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3">
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
            <p className="text-[10px] uppercase tracking-widest text-zinc-500">Total pendente</p>
            <p className="text-[14px] font-bold text-amber-400">{formatarMoeda(totalPendente)}</p>
          </div>
        </div>

        {/* Cards de pedidos */}
        <div className="space-y-3">
          {filtrados.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 py-8 text-center text-[12px] text-zinc-500">
              Nenhum pedido encontrado
            </div>
          ) : (
            filtrados.map((p, i) => (
              <div
                key={p.id}
                className="group rounded-xl border border-amber-500/20 bg-zinc-900 p-5 transition-colors hover:border-amber-500/30 hover:bg-zinc-800/40"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Info principal */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[10px] text-zinc-600">#PC-{String(i + 1).padStart(4, '0')}</span>
                      <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-400 ring-1 ring-amber-500/20">
                        Aguardando aprovação
                      </span>
                    </div>
                    <p className="text-[14px] font-semibold text-zinc-100 truncate">{p.descricao_item}</p>
                    <p className="mt-0.5 text-[12px] text-zinc-400">{p.fornecedor}</p>
                  </div>

                  {/* Valor */}
                  <div className="text-right shrink-0">
                    <p className="text-[22px] font-bold text-amber-400 leading-none">{formatarMoeda(p.valor_final)}</p>
                    <p className="mt-1 text-[10px] text-zinc-500">
                      {p.quantidade} {p.unidade} · {formatarMoeda(p.valor_unitario)}/un
                    </p>
                  </div>
                </div>

                {/* Detalhes */}
                <div className="mt-4 grid grid-cols-3 gap-3 rounded-lg border border-zinc-800 bg-zinc-800/30 p-3">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-600">Pagamento</p>
                    <p className="mt-0.5 text-[11px] text-zinc-300">
                      <LabelPagamento forma={p.forma_pagamento} />
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-600">Cotado por</p>
                    <p className="mt-0.5 text-[11px] text-zinc-300">{p.aprovado_por}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-600">Data</p>
                    <p className="mt-0.5 text-[11px] text-zinc-300">{formatarData(p.created_at)}</p>
                  </div>
                </div>

                {p.observacoes && (
                  <p className="mt-2 text-[11px] text-zinc-500 italic">"{p.observacoes}"</p>
                )}

                {/* Ações */}
                <div className="mt-4 flex items-center justify-end gap-2">
                  <button
                    onClick={() => onVerDetalhes?.(p)}
                    className="rounded-lg border border-zinc-700/60 px-3 py-2 text-[11px] font-medium text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-300"
                  >
                    Ver detalhes
                  </button>
                  <button
                    onClick={() => setConfirmacao({ pedido: p, tipo: 'devolver' })}
                    className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/8 px-3.5 py-2 text-[11px] font-medium text-amber-400 transition-colors hover:border-amber-500/50 hover:bg-amber-500/15"
                  >
                    <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 8H2M5 5L2 8l3 3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Devolver para Cotação
                  </button>
                  <button
                    onClick={() => setConfirmacao({ pedido: p, tipo: 'fechar' })}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-[11px] font-semibold text-white transition-colors hover:bg-emerald-500"
                  >
                    <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M3 8l4 4 6-6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Fechar Compra
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {confirmacao && (
        <ModalAcao
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
