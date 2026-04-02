'use client'

import { useState } from 'react'
import type { CotacaoFornecedor, SolicitacaoCompra } from '@/types/compras'
import { formatarMoeda } from '@/lib/formatters'
import { NovaCotacaoModal } from './NovaCotacaoModal'

interface Props {
  solicitacoes: SolicitacaoCompra[]
  cotacoesPorSolicitacao: Record<string, CotacaoFornecedor[]>
  onSelecionar?: (cotacaoId: string, solicitacaoId: string) => Promise<void>
  onDesselecionar?: (cotacaoId: string, solicitacaoId: string) => Promise<void>
  onAdicionarCotacao?: (solicitacaoId: string) => void
  onCotacaoCriada?: (nova: CotacaoFornecedor) => void
}

// ─── Modal de confirmação de envio para pedidos ───────────────────────────────

function ModalConfirmacaoEnvio({
  cotacao,
  carregando,
  onConfirmar,
  onCancelar,
}: {
  cotacao: CotacaoFornecedor
  carregando: boolean
  onConfirmar: () => void
  onCancelar: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-zinc-700/60 bg-zinc-900 shadow-2xl">
        <div className="border-b border-zinc-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/15">
              <svg className="h-4 w-4 text-indigo-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 8h10M9 5l3 3-3 3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h2 className="text-[14px] font-semibold text-zinc-100">Enviar para Pedidos?</h2>
              <p className="text-[11px] text-zinc-500">Esta cotação será enviada para aprovação</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 px-6 py-5">
          <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-4">
            <p className="mb-2 text-[9px] font-semibold uppercase tracking-widest text-indigo-400/70">Cotação selecionada</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-semibold text-zinc-200">{cotacao.fornecedor}</p>
                <p className="mt-0.5 text-[10px] font-mono text-zinc-500">{cotacao.cnpj}</p>
                <p className="mt-1 text-[11px] text-zinc-400">Prazo: {cotacao.prazo_dias} dias</p>
              </div>
              <p className="text-[20px] font-bold text-indigo-400">{formatarMoeda(cotacao.valor)}</p>
            </div>
          </div>

          <p className="text-[11px] text-zinc-500 leading-relaxed">
            Um pedido será criado com status <span className="text-amber-400 font-medium">aguardando aprovação</span>. Esta solicitação sairá da aba de cotações.
          </p>
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
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-[12px] font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            {carregando ? (
              <>
                <svg className="h-3 w-3 animate-spin" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="8" cy="8" r="6" strokeOpacity="0.3"/><path d="M8 2a6 6 0 016 6" strokeLinecap="round"/>
                </svg>
                Enviando...
              </>
            ) : (
              <>
                <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 8h10M9 5l3 3-3 3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Sim, enviar para Pedidos
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal de confirmação de troca ────────────────────────────────────────────

function ModalConfirmacaoTroca({
  cotacaoAtual,
  cotacaoNova,
  carregando,
  onConfirmar,
  onCancelar,
}: {
  cotacaoAtual: CotacaoFornecedor
  cotacaoNova: CotacaoFornecedor
  carregando: boolean
  onConfirmar: () => void
  onCancelar: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-zinc-700/60 bg-zinc-900 shadow-2xl">
        <div className="border-b border-zinc-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/15">
              <svg className="h-4 w-4 text-amber-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8 2L1.5 13h13L8 2z" strokeLinejoin="round"/>
                <path d="M8 7v3" strokeLinecap="round"/>
                <circle cx="8" cy="11.5" r="0.5" fill="currentColor"/>
              </svg>
            </div>
            <div>
              <h2 className="text-[14px] font-semibold text-zinc-100">Trocar cotação selecionada?</h2>
              <p className="text-[11px] text-zinc-500">Já existe uma cotação marcada para esta solicitação</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 px-6 py-5">
          <div className="rounded-lg border border-zinc-800 bg-zinc-800/40 p-3">
            <p className="mb-2 text-[9px] font-semibold uppercase tracking-widest text-zinc-500">Cotação atual — será desmarcada</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] font-medium text-zinc-300">{cotacaoAtual.fornecedor}</p>
                <p className="text-[10px] text-zinc-500 font-mono">{cotacaoAtual.cnpj}</p>
              </div>
              <p className="text-[14px] font-bold text-red-400">{formatarMoeda(cotacaoAtual.valor)}</p>
            </div>
          </div>

          <div className="flex justify-center">
            <svg className="h-4 w-4 text-zinc-600" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 3v10M5 10l3 3 3-3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
            <p className="mb-2 text-[9px] font-semibold uppercase tracking-widest text-emerald-500/70">Nova seleção</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] font-medium text-zinc-200">{cotacaoNova.fornecedor}</p>
                <p className="text-[10px] text-zinc-500 font-mono">{cotacaoNova.cnpj}</p>
              </div>
              <p className="text-[14px] font-bold text-emerald-400">{formatarMoeda(cotacaoNova.valor)}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-zinc-800 px-6 py-4">
          <button onClick={onCancelar} disabled={carregando} className="rounded-lg border border-zinc-700/60 px-4 py-2 text-[12px] font-medium text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-300 disabled:opacity-50">
            Manter atual
          </button>
          <button onClick={onConfirmar} disabled={carregando} className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-[12px] font-medium text-white transition-colors hover:bg-amber-500 disabled:opacity-50">
            {carregando ? 'Trocando...' : 'Sim, trocar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Estrelas ─────────────────────────────────────────────────────────────────

function EstrelasAvaliacao({ nota }: { nota: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className={`h-2.5 w-2.5 ${i <= Math.round(nota) ? 'text-amber-400' : 'text-zinc-700'}`} viewBox="0 0 12 12" fill="currentColor">
          <path d="M6 1l1.5 3 3.3.5-2.4 2.3.6 3.2L6 8.5 3 10.5l.6-3.2L1.2 5l3.3-.5z"/>
        </svg>
      ))}
      <span className="ml-1 text-[10px] text-zinc-500">{nota.toFixed(1)}</span>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function ComparativoCotacao({
  solicitacoes,
  cotacoesPorSolicitacao,
  onSelecionar,
  onDesselecionar,
  onAdicionarCotacao,
  onCotacaoCriada,
}: Props) {
  const [solicitacaoAtiva, setSolicitacaoAtiva] = useState<string>(solicitacoes[0]?.id ?? '')
  const [modalCotacaoAberto, setModalCotacaoAberto] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [cotacaoSelecionadaLocal, setCotacaoSelecionadaLocal] = useState<string | null>(null)
  const [confirmacaoEnvio, setConfirmacaoEnvio] = useState<CotacaoFornecedor | null>(null)
  const [confirmacaoTroca, setConfirmacaoTroca] = useState<{
    cotacaoAtual: CotacaoFornecedor
    cotacaoNova: CotacaoFornecedor
  } | null>(null)

  const solicitacao = solicitacoes.find((s) => s.id === solicitacaoAtiva)
  const cotacoes = cotacoesPorSolicitacao[solicitacaoAtiva] ?? []
  const cotacaoMarcada = cotacoes.find((c) => c.id === cotacaoSelecionadaLocal) ?? cotacoes.find((c) => c.selecionada)
  const menorValor = cotacoes.length > 0 ? Math.min(...cotacoes.map((c) => c.valor)) : 0
  const maiorValor = cotacoes.length > 0 ? Math.max(...cotacoes.map((c) => c.valor)) : 0
  const economia = maiorValor - menorValor

  // Selecionar localmente (não envia ainda)
  function handleMarcarCotacao(cotacao: CotacaoFornecedor) {
    if (cotacaoMarcada && cotacaoMarcada.id !== cotacao.id) {
      setConfirmacaoTroca({ cotacaoAtual: cotacaoMarcada, cotacaoNova: cotacao })
      return
    }
    setCotacaoSelecionadaLocal(cotacao.id)
  }

  // Enviar para pedidos
  async function handleEnviarParaPedidos() {
    if (!cotacaoMarcada) return
    setConfirmacaoEnvio(cotacaoMarcada)
  }

  async function executarEnvio() {
    if (!cotacaoMarcada || !solicitacaoAtiva) return
    setCarregando(true)
    try {
      await onSelecionar?.(cotacaoMarcada.id, solicitacaoAtiva)
      setCotacaoSelecionadaLocal(null)
    } finally {
      setCarregando(false)
      setConfirmacaoEnvio(null)
    }
  }

  if (solicitacoes.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 py-16 text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800 mx-auto">
          <svg className="h-6 w-6 text-zinc-500" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M3 4h10v9a1 1 0 01-1 1H4a1 1 0 01-1-1V4z"/>
            <path d="M1 4h14M6 4V2h4v2" strokeLinecap="round"/>
          </svg>
        </div>
        <p className="text-[13px] font-medium text-zinc-400">Nenhuma solicitação aguardando cotação</p>
        <p className="mt-1 text-[11px] text-zinc-600">Quando uma solicitação for aprovada para cotação, ela aparecerá aqui.</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {/* Seletor de solicitações */}
        {solicitacoes.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {solicitacoes.map((s) => {
              const n = (cotacoesPorSolicitacao[s.id] ?? []).length
              const ativo = s.id === solicitacaoAtiva
              return (
                <button
                  key={s.id}
                  onClick={() => { setSolicitacaoAtiva(s.id); setCotacaoSelecionadaLocal(null) }}
                  className={`rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-all ${
                    ativo ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300' : 'border-zinc-700/60 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
                  }`}
                >
                  {s.descricao}
                  <span className={`ml-1.5 text-[10px] ${ativo ? 'text-indigo-400' : 'text-zinc-600'}`}>
                    {n} cotaç{n === 1 ? 'ão' : 'ões'}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* Cabeçalho da solicitação + botão enviar */}
        {solicitacao && (
          <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
            <div>
              <p className="text-[13px] font-medium text-zinc-200">{solicitacao.descricao}</p>
              <p className="mt-0.5 text-[11px] text-zinc-500">
                {solicitacao.categoria} · {solicitacao.quantidade} {solicitacao.unidade}
                {solicitacao.obra_nome && ` · ${solicitacao.obra_nome}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setModalCotacaoAberto(true); onAdicionarCotacao?.(solicitacaoAtiva) }}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-700/60 px-3 py-2 text-[11px] font-medium text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-300"
              >
                <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3v10M3 8h10" strokeLinecap="round"/>
                </svg>
                Adicionar cotação
              </button>

              {cotacaoMarcada && (
                <button
                  onClick={handleEnviarParaPedidos}
                  disabled={carregando}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-[11px] font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 8h10M9 5l3 3-3 3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Enviar para Pedidos
                </button>
              )}
            </div>
          </div>
        )}

        {/* Instrução quando não há cotação marcada */}
        {cotacoes.length > 0 && !cotacaoMarcada && (
          <div className="flex items-center gap-3 rounded-xl border border-zinc-700/40 bg-zinc-900/40 px-4 py-3">
            <svg className="h-4 w-4 shrink-0 text-zinc-500" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="8" cy="8" r="6"/><path d="M8 5v4M8 11v.5" strokeLinecap="round"/>
            </svg>
            <p className="text-[12px] text-zinc-500">
              Selecione a melhor cotação e clique em <span className="text-zinc-300 font-medium">Enviar para Pedidos</span>
            </p>
          </div>
        )}

        {/* Mini métricas */}
        {cotacoes.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Menor preço',       value: formatarMoeda(menorValor), color: 'text-emerald-400' },
              { label: 'Maior preço',       value: formatarMoeda(maiorValor), color: 'text-red-400' },
              { label: 'Economia possível', value: formatarMoeda(economia),   color: 'text-indigo-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-center">
                <div className={`text-lg font-bold tracking-tight ${color}`}>{value}</div>
                <div className="mt-0.5 text-[10px] uppercase tracking-wide text-zinc-500">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Comparativo visual */}
        {cotacoes.length > 1 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <h3 className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Comparativo Visual</h3>
            <div className="space-y-3">
              {[...cotacoes].sort((a, b) => a.valor - b.valor).map((c) => {
                const largura = maiorValor > 0 ? (c.valor / maiorValor) * 100 : 0
                const melhor = c.valor === menorValor
                const marcada = c.id === cotacaoMarcada?.id
                return (
                  <div key={c.id}>
                    <div className="mb-1 flex items-center justify-between text-[11px]">
                      <span className={`flex items-center gap-1.5 ${marcada ? 'font-medium text-zinc-100' : melhor ? 'font-medium text-zinc-200' : 'text-zinc-400'}`}>
                        {melhor && <span className="rounded bg-emerald-500/15 px-1 py-0.5 text-[8px] font-bold uppercase text-emerald-400">Melhor</span>}
                        {marcada && <span className="rounded bg-indigo-500/15 px-1 py-0.5 text-[8px] font-bold uppercase text-indigo-400">✓ Selecionada</span>}
                        {c.fornecedor}
                      </span>
                      <span className={marcada ? 'font-semibold text-indigo-400' : melhor ? 'font-semibold text-emerald-400' : 'text-zinc-400'}>
                        {formatarMoeda(c.valor)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${marcada ? 'bg-indigo-500' : melhor ? 'bg-emerald-500' : 'bg-indigo-500/30'}`}
                        style={{ width: `${largura}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Tabela */}
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
                onClick={() => { setModalCotacaoAberto(true); onAdicionarCotacao?.(solicitacaoAtiva) }}
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
                    {['Fornecedor', 'CNPJ', 'Avaliação', 'Valor Total', 'Prazo', 'Pagamento', 'Frete', 'Condições', 'Selecionar'].map((h) => (
                      <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-zinc-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {[...cotacoes].sort((a, b) => a.valor - b.valor).map((c) => {
                    const melhor = c.valor === menorValor
                    const marcada = c.id === cotacaoMarcada?.id
                    return (
                      <tr key={c.id} className={`transition-colors hover:bg-zinc-800/40 ${marcada ? 'bg-indigo-500/5' : melhor ? 'bg-emerald-500/5' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {marcada && <span className="shrink-0 rounded bg-indigo-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-indigo-400">✓ Selecionada</span>}
                            {!marcada && melhor && <span className="shrink-0 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-emerald-400">Melhor</span>}
                            <span className={`text-[12px] font-medium ${marcada ? 'text-zinc-100' : melhor ? 'text-zinc-100' : 'text-zinc-300'}`}>{c.fornecedor}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-[10px] text-zinc-500">{c.cnpj}</td>
                        <td className="px-4 py-3"><EstrelasAvaliacao nota={4.2} /></td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <span className={`text-[13px] font-semibold ${marcada ? 'text-indigo-400' : melhor ? 'text-emerald-400' : 'text-zinc-300'}`}>
                            {formatarMoeda(c.valor)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-[12px] text-zinc-400">{c.prazo_dias} dias</td>
                        <td className="whitespace-nowrap px-4 py-3 text-[11px] text-zinc-400">
                          {{ a_vista: 'À vista', '7_dias': '7 dias', '14_dias': '14 dias', '30_dias': '30 dias', '60_dias': '60 dias' }[c.forma_pagamento ?? 'a_vista']}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-[11px]">
                          {c.frete_incluso ? <span className="text-emerald-400">Incluso</span> : <span className="text-zinc-500">A cobrar</span>}
                        </td>
                        <td className="max-w-[140px] px-4 py-3">
                          <p className="truncate text-[11px] text-zinc-500">{c.condicoes || '—'}</p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          {marcada ? (
                            <button
                              onClick={() => setCotacaoSelecionadaLocal(null)}
                              className="inline-flex items-center gap-1 rounded-lg bg-indigo-500/15 px-3 py-1.5 text-[10px] font-medium text-indigo-300 transition-colors hover:bg-indigo-500/25"
                            >
                              <svg className="h-2.5 w-2.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M3 8l4 4 6-6" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              Selecionada
                            </button>
                          ) : (
                            <button
                              onClick={() => handleMarcarCotacao(c)}
                              disabled={carregando}
                              className={`rounded-lg px-3 py-1.5 text-[10px] font-medium transition-colors disabled:opacity-50 ${
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

        {/* Barra de ação fixa quando há seleção */}
        {cotacaoMarcada && (
          <div className="sticky bottom-0 flex items-center justify-between rounded-xl border border-indigo-500/30 bg-indigo-950/80 px-5 py-3.5 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/20">
                <svg className="h-3.5 w-3.5 text-indigo-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 8l4 4 6-6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <p className="text-[12px] font-medium text-zinc-200">{cotacaoMarcada.fornecedor}</p>
                <p className="text-[10px] text-zinc-500">{formatarMoeda(cotacaoMarcada.valor)} · {cotacaoMarcada.prazo_dias} dias</p>
              </div>
            </div>
            <button
              onClick={handleEnviarParaPedidos}
              disabled={carregando}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 8h10M9 5l3 3-3 3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Enviar para Pedidos
            </button>
          </div>
        )}
      </div>

      <NovaCotacaoModal
        aberto={modalCotacaoAberto}
        solicitacao={solicitacao ?? null}
        onFechar={() => setModalCotacaoAberto(false)}
        onCriada={(nova) => onCotacaoCriada?.(nova)}
      />

      {confirmacaoEnvio && (
        <ModalConfirmacaoEnvio
          cotacao={confirmacaoEnvio}
          carregando={carregando}
          onConfirmar={executarEnvio}
          onCancelar={() => setConfirmacaoEnvio(null)}
        />
      )}

      {confirmacaoTroca && (
        <ModalConfirmacaoTroca
          cotacaoAtual={confirmacaoTroca.cotacaoAtual}
          cotacaoNova={confirmacaoTroca.cotacaoNova}
          carregando={carregando}
          onConfirmar={() => {
            setCotacaoSelecionadaLocal(confirmacaoTroca.cotacaoNova.id)
            setConfirmacaoTroca(null)
          }}
          onCancelar={() => setConfirmacaoTroca(null)}
        />
      )}
    </>
  )
}
