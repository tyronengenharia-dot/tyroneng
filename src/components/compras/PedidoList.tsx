'use client'

import { useState, useMemo } from 'react'
import type { PedidoCompra } from '@/types/compras'
import { BadgeStatus, LabelPagamento } from './ComprasBadges'
import { formatarData, formatarMoeda } from '@/lib/formatters'

interface Props {
  data: PedidoCompra[]
  onVerDetalhes?: (pedido: PedidoCompra) => void
}

export function PedidoList({ data, onVerDetalhes }: Props) {
  const [busca, setBusca] = useState('')

  const filtrados = useMemo(() => {
    if (!busca) return data
    const b = busca.toLowerCase()
    return data.filter(
      (p) =>
        p.fornecedor.toLowerCase().includes(b) ||
        p.descricao_item.toLowerCase().includes(b) ||
        p.aprovado_por.toLowerCase().includes(b)
    )
  }, [data, busca])

  const totalGasto = useMemo(
    () => data.filter((p) => p.status === 'aprovado').reduce((acc, p) => acc + p.valor_final, 0),
    [data]
  )

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
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
            placeholder="Buscar pedidos..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-lg border border-zinc-700/60 bg-zinc-800/60 py-2 pl-9 pr-3 text-[12px] text-zinc-200 placeholder-zinc-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
          />
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-right">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">Total aprovado</p>
          <p className="text-[14px] font-bold text-zinc-200">{formatarMoeda(totalGasto)}</p>
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                {['Pedido', 'Fornecedor', 'Item', 'Qtd', 'Valor Unit.', 'Valor Total', 'Pagamento', 'Aprovado por', 'Data', 'Status', ''].map((h) => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-[12px] text-zinc-500">
                    Nenhum pedido encontrado
                  </td>
                </tr>
              ) : (
                filtrados.map((p, i) => (
                  <tr key={p.id} className="group transition-colors hover:bg-zinc-800/40">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] text-zinc-500">
                      #PC-{String(i + 1).padStart(4, '0')}
                    </td>
                    <td className="px-4 py-3 text-[12px] font-medium text-zinc-200">{p.fornecedor}</td>
                    <td className="max-w-[160px] px-4 py-3">
                      <p className="truncate text-[12px] text-zinc-300">{p.descricao_item}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[12px] text-zinc-400">
                      {p.quantidade} {p.unidade}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[12px] text-zinc-400">
                      {formatarMoeda(p.valor_unitario)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[13px] font-semibold text-zinc-200">
                      {formatarMoeda(p.valor_final)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[12px]">
                      <LabelPagamento forma={p.forma_pagamento} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[12px] text-zinc-400">{p.aprovado_por}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-[12px] text-zinc-400">
                      {formatarData(p.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <BadgeStatus status={p.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <button
                        onClick={() => onVerDetalhes?.(p)}
                        className="rounded-md border border-zinc-700 px-2.5 py-1 text-[10px] font-medium text-zinc-400 opacity-0 transition-all hover:border-zinc-600 hover:text-zinc-300 group-hover:opacity-100"
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
