'use client'

import { useState } from 'react'
import type { CotacaoFornecedor, SolicitacaoCompra } from '@/types/compras'
import { formatarMoeda } from '@/lib/formatters'
import { NovaCotacaoModal } from './NovaCotacaoModal'

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
        <svg
          key={i}
          className={`h-2.5 w-2.5 ${i <= Math.round(nota) ? 'text-amber-400' : 'text-zinc-700'}`}
          viewBox="0 0 12 12" fill="currentColor"
        >
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
  // Estado do modal — gerenciado aqui mesmo
  const [modalAberto, setModalAberto] = useState(false)

  // Dados da solicitação ativa
  const solicitacao = solicitacoes.find((s) => s.id === solicitacaoAtiva)

  // Cotações locais — permite update otimista sem recarregar a page
  const [cotacoesLocais, setCotacoesLocais] = useState<
    Record<string, CotacaoFornecedor[]>
  >(cotacoesPorSolicitacao)

  const cotacoes = cotacoesLocais[solicitacaoAtiva] ?? []
  const menorValor = cotacoes.length > 0 ? Math.min(...cotacoes.map((c) => c.valor)) : 0
  const maiorValor = cotacoes.length > 0 ? Math.max(...cotacoes.map((c) => c.valor)) : 0
  const economia = maiorValor - menorValor

  function handleAbrirModal() {
    setModalAberto(true)
    onAdicionarCotacao?.(solicitacaoAtiva)
  }

  function handleCotacaoCriada(nova: CotacaoFornecedor) {
    setCotacoesLocais((prev) => ({
      ...prev,
      [nova.solicitacao_id]: [nova, ...(prev[nova.solicitacao_id] ?? [])],
    }))
  }

  function handleSelecionar(cotacaoId: string, solicitacaoId: string) {
    // Update otimista: marca como selecionada localmente
    setCotacoesLocais((prev) => ({
      ...prev,
      [solicitacaoId]: (prev[solicitacaoId] ?? []).map((c) => ({
        ...c,
        selecionada: c.id === cotacaoId,
      })),
    }))
    onSelecionar?.(cotacaoId, solicitacaoId)
  }

  if (solicitacoes.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 py-16 text-center">
        <p className="text-[13px] text-zinc-400">Nenhuma solicitação em cotação</p>
        <p className="mt-1 text-[11px] text-zinc-600">
          Aprove uma solicitação para o status "Em Cotação" para começar.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {/* Seletor de solicitação */}
        {solicitacoes.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {solicitacoes.map((s) => {
              const n = (cotacoesLocais[s.id] ?? []).length
              const ativo = s.id === solicitacaoAtiva
              return (
                <button
                  key={s.id}
                  onClick={() => setSolicitacaoAtiva(s.id)}
                  className={`rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-all ${
                    ativo
                      ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300'
                      : 'border-zinc-700/60 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
                  }`}
                >
                  {s.descricao}
                  <span className={`ml-1.5 text-[10px] ${ativo ? 'text-indigo-400' : 'text-zinc-600'}`}>
                    {n} {n === 1 ? 'cotação' : 'cotações'}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* Contexto da solicitação ativa */}
        {solicitacao && (
          <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
            <div>
              <p className="text-[13px] font-medium text-zinc-200">{solicitacao.descricao}</p>
              <p className="mt-0.5 text-[11px] text-zinc-500">
                {solicitacao.categoria} · {solicitacao.quantidade} {solicitacao.unidade}
                {solicitacao.obra_nome && ` · ${solicitacao.obra_nome}`}
              </p>
            </div>
            <button
              onClick={handleAbrirModal}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-[11px] font-medium text-white transition-colors hover:bg-indigo-500"
            >
              <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3v10M3 8h10" strokeLinecap="round" />
              </svg>
              Adicionar cotação
            </button>
          </div>
        )}

        {/* Mini métricas — só aparecem quando há cotações */}
        {cotacoes.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Menor preço',      value: formatarMoeda(menorValor), color: 'text-emerald-400' },
              { label: 'Maior preço',      value: formatarMoeda(maiorValor), color: 'text-red-400' },
              { label: 'Economia possível', value: formatarMoeda(economia),   color: 'text-indigo-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-center">
                <div className={`text-lg font-bold tracking-tight ${color}`}>{value}</div>
                <div className="mt-0.5 text-[10px] uppercase tracking-wide text-zinc-500">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Gráfico comparativo visual */}
        {cotacoes.length > 1 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <h3 className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
              Comparativo Visual
            </h3>
            <div className="space-y-3">
              {[...cotacoes]
                .sort((a, b) => a.valor - b.valor)
                .map((c) => {
                  const largura = maiorValor > 0 ? (c.valor / maiorValor) * 100 : 0
                  const melhor = c.valor === menorValor
                  return (
                    <div key={c.id}>
                      <div className="mb-1 flex items-center justify-between text-[11px]">
                        <span className={`flex items-center gap-1.5 ${melhor ? 'font-medium text-zinc-200' : 'text-zinc-400'}`}>
                          {melhor && (
                            <span className="rounded bg-emerald-500/15 px-1 py-0.5 text-[8px] font-bold uppercase text-emerald-400">
                              Melhor
                            </span>
                          )}
                          {c.fornecedor}
                        </span>
                        <span className={melhor ? 'font-semibold text-emerald-400' : 'text-zinc-400'}>
                          {formatarMoeda(c.valor)}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${melhor ? 'bg-emerald-500' : 'bg-indigo-500/50'}`}
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
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800">
                <svg className="h-5 w-5 text-zinc-500" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M2 4h12v9a1 1 0 01-1 1H3a1 1 0 01-1-1V4z"/>
                  <path d="M5 4V2h6v2M6 8h4M6 10.5h2.5" strokeLinecap="round"/>
                </svg>
              </div>
              <p className="text-[12px] font-medium text-zinc-400">Nenhuma cotação registrada</p>
              <p className="mt-1 text-[11px] text-zinc-600">Clique em "Adicionar cotação" para começar.</p>
              <button
                onClick={handleAbrirModal}
                className="mt-4 flex items-center gap-1.5 rounded-lg bg-indigo-600/80 px-4 py-2 text-[11px] font-medium text-white transition-colors hover:bg-indigo-600"
              >
                <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3v10M3 8h10" strokeLinecap="round"/>
                </svg>
                Adicionar primeira cotação
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/80">
                    {['Fornecedor', 'CNPJ', 'Avaliação', 'Valor Total', 'Prazo', 'Pagamento', 'Frete', 'Condições', ''].map((h) => (
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
                  {[...cotacoes]
                    .sort((a, b) => a.valor - b.valor)
                    .map((c) => {
                      const melhor = c.valor === menorValor
                      return (
                        <tr
                          key={c.id}
                          className={`transition-colors hover:bg-zinc-800/40 ${melhor ? 'bg-emerald-500/5' : ''}`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {melhor && (
                                <span className="shrink-0 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-emerald-400">
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
                          <td className="whitespace-nowrap px-4 py-3">
                            <span className={`text-[13px] font-semibold ${melhor ? 'text-emerald-400' : 'text-zinc-300'}`}>
                              {formatarMoeda(c.valor)}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-[12px] text-zinc-400">
                            {c.prazo_dias} dias
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-[11px] text-zinc-400">
                            {{
                              a_vista: 'À vista',
                              '7_dias': '7 dias',
                              '14_dias': '14 dias',
                              '30_dias': '30 dias',
                              '60_dias': '60 dias',
                            }[c.forma_pagamento ?? 'a_vista']}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-[11px]">
                            {c.frete_incluso ? (
                              <span className="text-emerald-400">Incluso</span>
                            ) : (
                              <span className="text-zinc-500">A cobrar</span>
                            )}
                          </td>
                          <td className="max-w-[140px] px-4 py-3">
                            <p className="truncate text-[11px] text-zinc-500">{c.condicoes || '—'}</p>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            {c.selecionada ? (
                              <span className="rounded-lg bg-emerald-500/15 px-3 py-1.5 text-[10px] font-medium text-emerald-400">
                                ✓ Selecionada
                              </span>
                            ) : (
                              <button
                                onClick={() => handleSelecionar(c.id, c.solicitacao_id)}
                                className={`rounded-lg px-3 py-1.5 text-[10px] font-medium transition-colors ${
                                  melhor
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                                    : 'border border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
                                }`}
                              >
                                Selecionar
                              </button>
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

      {/* Modal — fora do flow para não ter problemas de z-index */}
      <NovaCotacaoModal
        aberto={modalAberto}
        solicitacao={solicitacao ?? null}
        onFechar={() => setModalAberto(false)}
        onCriada={handleCotacaoCriada}
      />
    </>
  )
}
