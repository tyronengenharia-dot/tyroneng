'use client'

import { useState, useEffect, useCallback } from 'react'
import type {
  SolicitacaoCompra,
  CotacaoFornecedor,
  PedidoCompra,
  Entrega,
  AuditoriaLog,
  MetricasCompras,
} from '@/types/compras'
import {
  getSolicitacoes,
  getAllCotacoes,
  getPedidos,
  getEntregas,
  getAuditoriaLogs,
  getMetricasCompras,
  selecionarCotacao,
  desselecionarCotacao,
  autorizarPedido,
  recusarPedido,
  confirmarEntrega,
} from '@/services/comprasService'

import { ComprasDashboard } from '@/components/compras/ComprasDashboard'
import { SolicitacaoList } from '@/components/compras/SolicitacaoList'
import { ComparativoCotacao } from '@/components/compras/ComparativoCotacao'
import { PedidoList } from '@/components/compras/PedidoList'
import { EntregaList } from '@/components/compras/EntregaList'
import { AuditoriaTimeline } from '@/components/compras/AuditoriaTimeline'
import { NovaSolicitacaoModal } from '@/components/compras/NovaSolicitacaoModal'

type TabId = 'dashboard' | 'solicitacoes' | 'cotacoes' | 'pedidos' | 'entregas' | 'auditoria'

interface Tab {
  id: TabId
  label: string
  badge?: number
}

const METRICAS_VAZIO: MetricasCompras = {
  total_comprado: 0,
  economia_cotacoes: 0,
  solicitacoes_pendentes: 0,
  entregas_atrasadas: 0,
  variacao_total_pct: 0,
  variacao_economia_pct: 0,
  solicitacoes_novas_semana: 0,
  entregas_atrasadas_variacao: 0,
}

function ComprasTabs({ tabs, activeTab, onChange }: { tabs: Tab[]; activeTab: TabId; onChange: (id: TabId) => void }) {
  return (
    <div className="flex items-end gap-0 border-b border-zinc-800">
      {tabs.map((tab) => {
        const ativo = tab.id === activeTab
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium transition-colors ${
              ativo
                ? 'text-zinc-100 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-indigo-500'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab.label}
            {tab.badge != null && tab.badge > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none ${
                ativo ? 'bg-indigo-500/30 text-indigo-300' : 'bg-zinc-800 text-zinc-500'
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-zinc-800/60" />)}
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
        <div className="col-span-3 h-52 rounded-xl bg-zinc-800/60" />
        <div className="col-span-2 h-52 rounded-xl bg-zinc-800/60" />
      </div>
    </div>
  )
}

function AvisoBanco({ onRecarregar }: { onRecarregar: () => void }) {
  return (
    <div className="mb-5 flex items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/8 px-4 py-3">
      <svg className="h-4 w-4 shrink-0 text-amber-400" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M8 2L1.5 13h13L8 2z" strokeLinejoin="round"/>
        <path d="M8 7v3" strokeLinecap="round"/>
        <circle cx="8" cy="11.5" r="0.5" fill="currentColor"/>
      </svg>
      <p className="flex-1 text-[12px] text-amber-300">
        Erro de conexão com o banco de dados. Verifique as tabelas do Supabase.
      </p>
      <button onClick={onRecarregar} className="shrink-0 rounded-md border border-amber-500/30 px-3 py-1 text-[11px] font-medium text-amber-400 transition-colors hover:border-amber-400/50 hover:text-amber-300">
        Tentar novamente
      </button>
    </div>
  )
}

export default function ComprasPage() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard')
  const [loading, setLoading] = useState(true)
  const [temErroBanco, setTemErroBanco] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)

  const [metricas, setMetricas] = useState<MetricasCompras>(METRICAS_VAZIO)
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoCompra[]>([])
  const [cotacoes, setCotacoes] = useState<CotacaoFornecedor[]>([])
  const [pedidos, setPedidos] = useState<PedidoCompra[]>([])
  const [entregas, setEntregas] = useState<Entrega[]>([])
  const [logs, setLogs] = useState<AuditoriaLog[]>([])

  const carregarDados = useCallback(async () => {
    setLoading(true)
    let algumErro = false

    async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
      try { return await fn() }
      catch (err) { algumErro = true; console.warn('[Compras] Falha na query:', err); return fallback }
    }

    const [m, s, c, p, e, l] = await Promise.all([
      safe(getMetricasCompras, METRICAS_VAZIO),
      safe(getSolicitacoes, [] as SolicitacaoCompra[]),
      safe(getAllCotacoes, [] as CotacaoFornecedor[]),
      safe(getPedidos, [] as PedidoCompra[]),
      safe(getEntregas, [] as Entrega[]),
      safe(() => getAuditoriaLogs(100), [] as AuditoriaLog[]),
    ])

    setMetricas(m); setSolicitacoes(s); setCotacoes(c)
    setPedidos(p); setEntregas(e); setLogs(l)
    setTemErroBanco(algumErro)
    setLoading(false)
  }, [])

  useEffect(() => { carregarDados() }, [carregarDados])

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleNovaSolicitacaoCriada = (nova: SolicitacaoCompra) => {
    setSolicitacoes((prev) => [nova, ...prev])
    setMetricas((prev) => ({
      ...prev,
      solicitacoes_pendentes: prev.solicitacoes_pendentes + 1,
      solicitacoes_novas_semana: prev.solicitacoes_novas_semana + 1,
    }))
    setActiveTab('solicitacoes')
  }

  const handleNovaCotacaoCriada = (nova: CotacaoFornecedor) => {
    setCotacoes((prev) => [nova, ...prev])
  }

  // Etapa 2: pessoa seleciona a melhor cotação → cria pedido aguardando aprovação
  const handleSelecionarCotacao = async (cotacaoId: string, solicitacaoId: string) => {
    const { pedido } = await selecionarCotacao(cotacaoId, solicitacaoId, 'cotador')

    // Atualiza cotações: marca a selecionada, desmarca as demais da mesma solicitação
    setCotacoes((prev) =>
      prev.map((c) =>
        c.solicitacao_id === solicitacaoId
          ? { ...c, selecionada: c.id === cotacaoId }
          : c
      )
    )
    // Adiciona o pedido ao estado (aguardando aprovação)
    setPedidos((prev) => [pedido, ...prev.filter((p) => p.cotacao_id !== cotacaoId)])

    // Navega para pedidos para a 3ª pessoa ver e autorizar
    setActiveTab('pedidos')
  }

  // Troca de cotação: cancela o pedido anterior, seleciona o novo
  const handleDesselecionarCotacao = async (cotacaoId: string, solicitacaoId: string) => {
    await desselecionarCotacao(cotacaoId, solicitacaoId)

    // Desmarca no estado local
    setCotacoes((prev) =>
      prev.map((c) => c.id === cotacaoId ? { ...c, selecionada: false } : c)
    )
    // Marca o pedido vinculado como cancelado no estado local
    setPedidos((prev) =>
      prev.map((p) =>
        p.cotacao_id === cotacaoId && ['aguardando_aprovacao', 'rascunho'].includes(p.status)
          ? { ...p, status: 'cancelado' as PedidoCompra['status'] }
          : p
      )
    )
  }

  // Etapa 3: pessoa autoriza a compra
  const handleAutorizarPedido = async (pedido: PedidoCompra) => {
    const atualizado = await autorizarPedido(pedido.id, 'autorizador')
    setPedidos((prev) => prev.map((p) => p.id === pedido.id ? atualizado : p))
    setSolicitacoes((prev) =>
      prev.map((s) => s.id === pedido.solicitacao_id ? { ...s, status: 'aprovada' as const } : s)
    )
  }

  // Recusa: pedido cancelado, cotação volta para seleção
  const handleRecusarPedido = async (pedido: PedidoCompra) => {
    const atualizado = await recusarPedido(pedido.id, 'autorizador')
    setPedidos((prev) => prev.map((p) => p.id === pedido.id ? atualizado : p))
    // Desmarca a cotação vinculada no estado local
    if (pedido.cotacao_id) {
      setCotacoes((prev) =>
        prev.map((c) => c.id === pedido.cotacao_id ? { ...c, selecionada: false } : c)
      )
    }
    // Volta solicitação para em_cotacao
    setSolicitacoes((prev) =>
      prev.map((s) => s.id === pedido.solicitacao_id ? { ...s, status: 'em_cotacao' as const } : s)
    )
  }

  const handleConfirmarEntrega = async (id: string) => {
    await confirmarEntrega(id, 'usuário')
    setEntregas((prev) =>
      prev.map((e) => e.id === id
        ? { ...e, status: 'entregue' as const, data_real: new Date().toISOString().split('T')[0] }
        : e
      )
    )
  }

  // ── Dados derivados ───────────────────────────────────────────────────────

  const pendentes = solicitacoes.filter((s) => s.status === 'pendente').length
  const emCotacao = solicitacoes.filter((s) => s.status === 'em_cotacao').length
  const atrasadas = entregas.filter((e) => e.status === 'atrasado').length
  const aguardandoAprovacao = pedidos.filter((p) =>
    p.status === 'aguardando_aprovacao' || p.status === 'rascunho'
  ).length

  const cotacoesPorSolicitacao = cotacoes.reduce<Record<string, CotacaoFornecedor[]>>(
    (acc, c) => {
      if (!acc[c.solicitacao_id]) acc[c.solicitacao_id] = []
      acc[c.solicitacao_id].push(c)
      return acc
    },
    {}
  )

  const solicitacoesParaCotacao =
    solicitacoes.filter((s) => s.status === 'em_cotacao').length > 0
      ? solicitacoes.filter((s) => s.status === 'em_cotacao')
      : solicitacoes.slice(0, 5)

  const tabs: Tab[] = [
    { id: 'dashboard',    label: 'Dashboard' },
    { id: 'solicitacoes', label: 'Solicitações', badge: pendentes },
    { id: 'cotacoes',     label: 'Cotações',     badge: emCotacao },
    { id: 'pedidos',      label: 'Pedidos',      badge: aguardandoAprovacao },
    { id: 'entregas',     label: 'Entregas',     badge: atrasadas },
    { id: 'auditoria',    label: 'Auditoria' },
  ]

  return (
    <>
      <div className="flex min-h-screen flex-col">
        <div className="border-b border-zinc-800/60 px-6 pt-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-100">Compras</h1>
              <p className="mt-0.5 text-[12px] text-zinc-500">
                Gestão de solicitações, cotações, pedidos e entregas
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={carregarDados}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-700/60 bg-zinc-900 px-3 py-2 text-[11px] font-medium text-zinc-400 transition-colors hover:text-zinc-300 disabled:opacity-50"
              >
                <svg className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M13 8A5 5 0 112 8" strokeLinecap="round"/>
                  <path d="M13 3v5h-5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Atualizar
              </button>
              <button className="flex items-center gap-1.5 rounded-lg border border-zinc-700/60 bg-zinc-900 px-3 py-2 text-[11px] font-medium text-zinc-400 transition-colors hover:text-zinc-300">
                <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M8 2v9M5 8l3 4 3-4" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 13h12" strokeLinecap="round"/>
                </svg>
                Exportar
              </button>
              <button
                onClick={() => setModalAberto(true)}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-[12px] font-medium text-white transition-colors hover:bg-indigo-500 active:scale-[0.98]"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 3v10M3 8h10" strokeLinecap="round"/>
                </svg>
                Nova Solicitação
              </button>
            </div>
          </div>
          <ComprasTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>

        <div className="flex-1 px-6 py-6">
          {temErroBanco && !loading && <AvisoBanco onRecarregar={carregarDados} />}

          {loading ? <LoadingSkeleton /> : (
            <>
              {activeTab === 'dashboard' && (
                <ComprasDashboard
                  metricas={metricas}
                  solicitacoesRecentes={solicitacoes.slice(0, 5)}
                  entregasAtivas={entregas.filter((e) => e.status !== 'entregue').slice(0, 4)}
                  onTabChange={(tab) => setActiveTab(tab as TabId)}
                />
              )}

              {activeTab === 'solicitacoes' && (
                <SolicitacaoList
                  data={solicitacoes}
                  onCotar={() => setActiveTab('cotacoes')}
                  onVerDetalhes={() => {}}
                  onNovaSolicitacao={() => setModalAberto(true)}
                />
              )}

              {/* Etapa 2 — cotador escolhe a melhor cotação */}
              {activeTab === 'cotacoes' && (
                <ComparativoCotacao
                  solicitacoes={solicitacoesParaCotacao}
                  cotacoesPorSolicitacao={cotacoesPorSolicitacao}
                  onSelecionar={handleSelecionarCotacao}
                  onDesselecionar={handleDesselecionarCotacao}
                  onAdicionarCotacao={() => {}}
                  onCotacaoCriada={handleNovaCotacaoCriada}
                />
              )}

              {/* Etapa 3 — autorizador aprova ou recusa */}
              {activeTab === 'pedidos' && (
                <PedidoList
                  data={pedidos}
                  onAutorizar={handleAutorizarPedido}
                  onRecusar={handleRecusarPedido}
                  onVerDetalhes={() => {}}
                />
              )}

              {activeTab === 'entregas' && (
                <EntregaList data={entregas} onConfirmar={handleConfirmarEntrega} />
              )}

              {activeTab === 'auditoria' && (
                <AuditoriaTimeline logs={logs} />
              )}
            </>
          )}
        </div>
      </div>

      <NovaSolicitacaoModal
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        onCriada={handleNovaSolicitacaoCriada}
      />
    </>
  )
}
