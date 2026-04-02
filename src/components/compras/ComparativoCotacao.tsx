'use client'

import { useState } from 'react'
import type { CotacaoFornecedor, SolicitacaoCompra } from '@/types/compras'
import { formatarMoeda } from '@/lib/formatters'

interface Props {
  solicitacoes: SolicitacaoCompra[]
  cotacoesPorSolicitacao: Record<string, CotacaoFornecedor[]>
  onSelecionar?: (cotacaoId: string, solicitacaoId: string) => void
  onAdicionarCotacao?: (solicitacaoId: string) => void
}

function EstrelasAvaliacao({ nota }: { nota: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className={`h-2.5 w-2.5 ${i <= Math.round(nota) ? 'text-amber-400' : 'text-zinc-700'}`} viewBox="0 0 12 12" fill="currentColor">
          <path d="M6 1l1.5 3 3.3.5-2.4 2.3.6 3.2L6 8.5 3 10.5l.6-3.2L1.2 5l3.3-.5z" />
        </svg>
      ))}
      <span className="ml-1 text-[10px] text-zinc-500">{nota.toFixed(1)}</span>
    </div>
  )
}

export function ComparativoCotacao({
  solicitacoes,
  cotacoesPorSolicitacao,
  onSelecionar,
  onAdicionarCotacao,
}: Props) {
  const [solicitacaoAtiva, setSolicitacaoAtiva] = useState<string>(
    solicitacoes[0]?.id ?? ''
  )

  const solicitacao = solicitacoes.find((s) => s.id === solicitacaoAtiva)
  const cotacoes = cotacoesPorSolicitacao[solicitacaoAtiva] ?? []

  const menorValor = cotacoes.length > 0 ? Math.min(...cotacoes.map((c) => c.valor)) : 0
  const maiorValor = cotacoes.length > 0 ? Math.max(...cotacoes.map((c) => c.valor)) : 0
  const economia = maiorValor - menorValor

  return (
    <div className="space-y-4">
      {/* Seletor de solicitação */}
      {solicitacoes.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {solicitacoes.map((s) => (
            <button
              key={s.id}
              onClick={() => setSolicitacaoAtiva(s.id)}
              className={`rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-all ${
                solicitacaoAtiva === s.id
                  ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300'
                  : 'border-zinc-700/60 text-zinc-400 hover:border-zinc-600'
              }`}
            >
              {s.descricao}
              <span className={`ml-1.5 text-[10px] ${solicitacaoAtiva === s.id ? 'text-indigo-400' : 'text-zinc-600'}`}>
                {(cotacoesPorSolicitacao[s.id] ?? []).length} cotações
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Contexto da solicitação */}
      {solicitacao && (
        <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3">
          <div>
            <p className="text-[12px] font-medium text-zinc-200">{solicitacao.descricao}</p>
            <p className="text-[11px] text-zinc-500">
              {solicitacao.categoria} · {solicitacao.quantidade} {solicitacao.unidade}
            </p>
          </div>
          <button
            onClick={() => onAdicionarCotacao?.(solicitacaoAtiva)}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-[11px] font-medium text-zinc-400 hover:border-zinc-600 hover:text-zinc-300 transition-colors"
          >
            + Adicionar cotação
          </button>
        </div>
      )}

      {/* Mini métricas */}
      {cotacoes.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Menor preço', value: formatarMoeda(menorValor), color: 'text-emerald-400' },
            { label: 'Maior preço', value: formatarMoeda(maiorValor), color: 'text-red-400' },
            { label: 'Economia possível', value: formatarMoeda(economia), color: 'text-indigo-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-center">
              <div className={`text-lg font-bold tracking-tight ${color}`}>{value}</div>
              <div className="mt-0.5 text-[10px] uppercase tracking-wide text-zinc-500">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Gráfico de barras horizontais */}
      {cotacoes.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Comparativo Visual</h3>
          <div className="space-y-3">
            {cotacoes.map((c) => {
              const largura = maiorValor > 0 ? (c.valor / maiorValor) * 100 : 0
              const melhor = c.valor === menorValor
              return (
                <div key={c.id}>
                  <div className="mb-1 flex items-center justify-between text-[11px]">
                    <span className={melhor ? 'font-medium text-zinc-200' : 'text-zinc-400'}>
                      {c.fornecedor}
                    </span>
                    <span className={melhor ? 'font-semibold text-emerald-400' : 'text-zinc-400'}>
                      {formatarMoeda(c.valor)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className={`h-2 rounded-full transition-all ${melhor ? 'bg-emerald-500' : 'bg-indigo-500/50'}`}
                      style={{ width: `${largura}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tabela detalhada */}
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
        {cotacoes.length === 0 ? (
          <div className="py-14 text-center text-[12px] text-zinc-500">
            Nenhuma cotação registrada para esta solicitação
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  {['Fornecedor', 'CNPJ', 'Avaliação', 'Valor Total', 'Prazo', 'Condições', 'Frete', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {cotacoes.map((c) => {
                  const melhor = c.valor === menorValor
                  return (
                    <tr
                      key={c.id}
                      className={`transition-colors hover:bg-zinc-800/40 ${melhor ? 'bg-emerald-500/5' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {melhor && (
                            <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-emerald-400">
                              Melhor
                            </span>
                          )}
                          <span className={`text-[12px] font-medium ${melhor ? 'text-zinc-100' : 'text-zinc-300'}`}>
                            {c.fornecedor}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-zinc-500">{c.cnpj}</td>
                      <td className="px-4 py-3">
                        <EstrelasAvaliacao nota={4.2} />
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[13px] font-semibold ${melhor ? 'text-emerald-400' : 'text-zinc-300'}`}>
                          {formatarMoeda(c.valor)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[12px] text-zinc-400">{c.prazo_dias} dias</td>
                      <td className="max-w-[140px] px-4 py-3">
                        <p className="truncate text-[11px] text-zinc-500">{c.condicoes || '—'}</p>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-zinc-500">
                        {c.frete_incluso ? (
                          <span className="text-emerald-400">Incluso</span>
                        ) : (
                          <span>A cobrar</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {!c.selecionada ? (
                          <button
                            onClick={() => onSelecionar?.(c.id, c.solicitacao_id)}
                            className={`rounded-lg px-3 py-1.5 text-[10px] font-medium transition-colors ${
                              melhor
                                ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                                : 'border border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
                            }`}
                          >
                            Selecionar
                          </button>
                        ) : (
                          <span className="rounded-lg bg-emerald-500/15 px-3 py-1.5 text-[10px] font-medium text-emerald-400">
                            ✓ Selecionada
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
