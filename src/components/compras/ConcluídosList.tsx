'use client'

import { useState, useMemo } from 'react'
import type { Entrega, PedidoCompra } from '@/types/compras'
import { formatarData, formatarMoeda } from '@/lib/formatters'

interface Props {
  entregas: Entrega[]
  pedidos: PedidoCompra[]
}

interface CicloCompleto {
  id: string
  descricao_item: string
  fornecedor: string
  valor_final: number
  data_prevista: string
  data_real?: string
  forma_pagamento: string
  pedido?: PedidoCompra
  entrega: Entrega
}

function DetalheModal({
  ciclo,
  onFechar,
}: {
  ciclo: CicloCompleto
  onFechar: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onFechar() }}
    >
      <div className="w-full max-w-lg rounded-2xl border border-zinc-700/60 bg-zinc-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-800 px-6 py-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-400">
                ✓ Ciclo Concluído
              </span>
            </div>
            <h2 className="text-[15px] font-semibold text-zinc-100">{ciclo.descricao_item}</h2>
            <p className="mt-0.5 text-[11px] text-zinc-500">{ciclo.fornecedor}</p>
          </div>
          <button
            onClick={onFechar}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
          >
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Valor em destaque */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-500/70 mb-1">Valor Total</p>
            <p className="text-[28px] font-bold text-emerald-400">{formatarMoeda(ciclo.valor_final)}</p>
          </div>

          {/* Grid de detalhes */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Forma de Pagamento', value: { a_vista: 'À vista', '7_dias': '7 dias', '14_dias': '14 dias', '30_dias': '30 dias', '60_dias': '60 dias' }[ciclo.forma_pagamento] ?? ciclo.forma_pagamento },
              { label: 'Previsão de Entrega', value: formatarData(ciclo.data_prevista) },
              { label: 'Data de Recebimento', value: ciclo.data_real ? formatarData(ciclo.data_real) : 'Não registrado' },
              { label: 'Responsável', value: ciclo.entrega.responsavel_recebimento ?? 'Sistema' },
              ...(ciclo.pedido ? [
                { label: 'Quantidade', value: `${ciclo.pedido.quantidade} ${ciclo.pedido.unidade}` },
                { label: 'Valor Unitário', value: formatarMoeda(ciclo.pedido.valor_unitario) },
              ] : []),
              ...(ciclo.entrega.nf_numero ? [
                { label: 'Nota Fiscal', value: `NF ${ciclo.entrega.nf_numero}` },
              ] : []),
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-600">{label}</p>
                <p className="mt-0.5 text-[12px] text-zinc-300">{value}</p>
              </div>
            ))}
          </div>

          {ciclo.entrega.observacoes && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-800/30 px-4 py-3">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-600 mb-1">Observações</p>
              <p className="text-[11px] text-zinc-400">{ciclo.entrega.observacoes}</p>
            </div>
          )}

          {/* Aviso somente leitura */}
          <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-800/30 px-3 py-2">
            <svg className="h-3.5 w-3.5 shrink-0 text-zinc-600" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="7" width="12" height="8" rx="1"/>
              <path d="M5 7V5a3 3 0 016 0v2" strokeLinecap="round"/>
            </svg>
            <p className="text-[10px] text-zinc-600">Registro somente leitura — ciclo de compra encerrado</p>
          </div>
        </div>

        <div className="border-t border-zinc-800 px-6 py-4">
          <button
            onClick={onFechar}
            className="w-full rounded-lg border border-zinc-700/60 py-2 text-[12px] font-medium text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-300"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

export function ConcluídosList({ entregas, pedidos }: Props) {
  const [busca, setBusca] = useState('')
  const [detalheAberto, setDetalheAberto] = useState<CicloCompleto | null>(null)

  const ciclos: CicloCompleto[] = useMemo(() => {
    return entregas.map((e) => {
      const pedido = pedidos.find((p) => p.id === e.pedido_id) ?? e.pedido
      return {
        id: e.id,
        descricao_item: e.descricao_item ?? pedido?.descricao_item ?? '—',
        fornecedor: e.fornecedor ?? pedido?.fornecedor ?? '—',
        valor_final: pedido?.valor_final ?? 0,
        data_prevista: e.data_prevista,
        data_real: e.data_real,
        forma_pagamento: pedido?.forma_pagamento ?? 'a_vista',
        pedido,
        entrega: e,
      }
    })
  }, [entregas, pedidos])

  const filtrados = useMemo(() => {
    if (!busca) return ciclos
    return ciclos.filter((c) =>
      [c.descricao_item, c.fornecedor].some((v) => v.toLowerCase().includes(busca.toLowerCase()))
    )
  }, [ciclos, busca])

  const totalGasto = useMemo(() => ciclos.reduce((acc, c) => acc + c.valor_final, 0), [ciclos])

  if (ciclos.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 py-16 text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800 mx-auto">
          <svg className="h-6 w-6 text-zinc-500" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M3 8l4 4 6-6" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="8" cy="8" r="7"/>
          </svg>
        </div>
        <p className="text-[13px] font-medium text-zinc-400">Nenhum ciclo concluído ainda</p>
        <p className="mt-1 text-[11px] text-zinc-600">As compras finalizadas aparecerão aqui após a confirmação de entrega.</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header com total */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[13px] font-semibold text-zinc-200">Ciclos Concluídos</h2>
            <p className="mt-0.5 text-[11px] text-zinc-500">Somente visualização — sem alterações permitidas</p>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-3 text-right">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-emerald-500/70">Total gasto</p>
            <p className="text-[18px] font-bold text-emerald-400">{formatarMoeda(totalGasto)}</p>
          </div>
        </div>

        {/* Busca */}
        <div className="relative max-w-xs">
          <svg className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="6.5" cy="6.5" r="5"/><path d="M10.5 10.5L14 14" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar por item ou fornecedor..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-lg border border-zinc-700/60 bg-zinc-800/60 py-2 pl-9 pr-3 text-[12px] text-zinc-200 placeholder-zinc-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
          />
        </div>

        {/* Lista */}
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/80">
                  {['#', 'Item', 'Fornecedor', 'Valor Total', 'Pagamento', 'Previsto', 'Recebido', 'Detalhes'].map((h) => (
                    <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-zinc-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filtrados.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-[12px] text-zinc-500">Nenhum resultado encontrado</td>
                  </tr>
                ) : (
                  filtrados.map((c, i) => {
                    const diasAtraso = c.data_real && c.data_prevista
                      ? Math.max(0, Math.floor((new Date(c.data_real).getTime() - new Date(c.data_prevista).getTime()) / 86400000))
                      : 0
                    return (
                      <tr key={c.id} className="group transition-colors hover:bg-zinc-800/30">
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-[10px] text-zinc-600">#{String(i + 1).padStart(4, '0')}</td>
                        <td className="max-w-[180px] px-4 py-3">
                          <p className="truncate text-[12px] font-medium text-zinc-200">{c.descricao_item}</p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-[12px] text-zinc-400">{c.fornecedor}</td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <span className="text-[13px] font-semibold text-emerald-400">{formatarMoeda(c.valor_final)}</span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-[11px] text-zinc-400">
                          {{ a_vista: 'À vista', '7_dias': '7 dias', '14_dias': '14 dias', '30_dias': '30 dias', '60_dias': '60 dias' }[c.forma_pagamento] ?? c.forma_pagamento}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-[12px] text-zinc-400">{formatarData(c.data_prevista)}</td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] text-zinc-300">{c.data_real ? formatarData(c.data_real) : '—'}</span>
                            {diasAtraso > 0 && (
                              <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-400">+{diasAtraso}d</span>
                            )}
                            {diasAtraso === 0 && c.data_real && (
                              <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">No prazo</span>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <button
                            onClick={() => setDetalheAberto(c)}
                            className="rounded-md border border-zinc-700 px-2.5 py-1 text-[10px] font-medium text-zinc-400 opacity-0 transition-all hover:border-zinc-600 hover:text-zinc-300 group-hover:opacity-100"
                          >
                            Ver
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-right text-[11px] text-zinc-600">{filtrados.length} de {ciclos.length} ciclos concluídos</p>
      </div>

      {detalheAberto && (
        <DetalheModal ciclo={detalheAberto} onFechar={() => setDetalheAberto(null)} />
      )}
    </>
  )
}
