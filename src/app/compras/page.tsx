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
  updateSolicitacaoStatus,
} from '@/services/comprasService'

import { ComprasDashboard } from '@/components/compras/ComprasDashboard'
import { SolicitacaoList } from '@/components/compras/SolicitacaoList'
import { ComparativoCotacao } from '@/components/compras/ComparativoCotacao'
import { PedidoList } from '@/components/compras/PedidoList'
import { EntregaList } from '@/components/compras/EntregaList'
import { AuditoriaTimeline } from '@/components/compras/AuditoriaTimeline'
import { ConcluídosList } from '@/components/compras/ConcluídosList'
import { NovaSolicitacaoModal } from '@/components/compras/NovaSolicitacaoModal'

type TabId = 'dashboard' | 'solicitacoes' | 'cotacoes' | 'pedidos' | 'entregas' | 'concluidos' | 'auditoria'

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

    // Recarrega logs ao entrar na aba de auditoria
  useEffect(() => {
    if (activeTab !== 'auditoria') return
    getAuditoriaLogs(100).then(setLogs).catch(console.warn)
  }, [activeTab])

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

  // *** CORREÇÃO PRINCIPAL ***
  // Botão "Cotar" atualiza o status da solicitação para em_cotacao no banco,
  // atualiza o estado local, e navega para a aba de cotações.
  const handleCotar = async (solicitacao: SolicitacaoCompra) => {
    try {
      await updateSolicitacaoStatus(solicitacao.id, 'em_cotacao', 'comprador')
      setSolicitacoes((prev) =>
        prev.map((s) => s.id === solicitacao.id ? { ...s, status: 'em_cotacao' as const } : s)
      )
      setMetricas((prev) => ({
        ...prev,
        solicitacoes_pendentes: Math.max(0, prev.solicitacoes_pendentes - 1),
      }))
    } catch (err) {
      console.error('[Compras] Erro ao mover para cotação:', err)
    }
    setActiveTab('cotacoes')
  }

  const handleSelecionarCotacao = async (cotacaoId: string, solicitacaoId: string) => {
    try {
      const { pedido } = await selecionarCotacao(cotacaoId, solicitacaoId, 'cotador')
      setCotacoes((prev) =>
        prev.map((c) =>
          c.solicitacao_id === solicitacaoId
            ? { ...c, selecionada: c.id === cotacaoId }
            : c
        )
      )
      setPedidos((prev) => [pedido, ...prev.filter((p) => p.cotacao_id !== cotacaoId)])
      setActiveTab('pedidos')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err)
      console.error('[Compras] Erro ao selecionar cotação:', msg)
      // Mostra o erro para o usuário — provavelmente constraint no banco
      alert(`Erro ao enviar para pedidos:\n\n${msg}\n\nVerifique se a coluna "status" da tabela pedidos_compra aceita o valor "aguardando_aprovacao". Rode o SQL indicado no console.`)
    }
  }

  const handleDesselecionarCotacao = async (cotacaoId: string, solicitacaoId: string) => {
    await desselecionarCotacao(cotacaoId, solicitacaoId)
    setCotacoes((prev) =>
      prev.map((c) => c.id === cotacaoId ? { ...c, selecionada: false } : c)
    )
    setPedidos((prev) =>
      prev.map((p) =>
        p.cotacao_id === cotacaoId && ['aguardando_aprovacao', 'rascunho'].includes(p.status)
          ? { ...p, status: 'cancelado' as PedidoCompra['status'] }
          : p
      )
    )
  }

    const handleAutorizarPedido = async (pedido: PedidoCompra) => {
      const { pedido: atualizado, entrega } = await autorizarPedido(pedido.id, 'autorizador')
      
      setPedidos((prev) => prev.map((p) => p.id === pedido.id ? atualizado : p))
      setSolicitacoes((prev) =>
        prev.map((s) => s.id === pedido.solicitacao_id ? { ...s, status: 'aprovada' as const } : s)
      )
      setEntregas((prev) => [entrega, ...prev])
      setActiveTab('entregas')
    }

  const handleRecusarPedido = async (pedido: PedidoCompra) => {
    const atualizado = await recusarPedido(pedido.id, 'autorizador')
    setPedidos((prev) => prev.map((p) => p.id === pedido.id ? atualizado : p))
    if (pedido.cotacao_id) {
      setCotacoes((prev) =>
        prev.map((c) => c.id === pedido.cotacao_id ? { ...c, selecionada: false } : c)
      )
    }
    setSolicitacoes((prev) =>
      prev.map((s) => s.id === pedido.solicitacao_id ? { ...s, status: 'em_cotacao' as const } : s)
    )
    setActiveTab('cotacoes')
  }

    const handleConfirmarEntrega = async (id: string) => {
      await confirmarEntrega(id, 'usuário')
      setEntregas((prev) =>
        prev.map((e) => e.id === id
          ? { ...e, status: 'entregue' as const, data_real: new Date().toISOString().split('T')[0] }
          : e
        )
      )
      // Recarrega métricas para refletir o novo total comprado
      try {
        const novasMetricas = await getMetricasCompras()
        setMetricas(novasMetricas)
      } catch (err) {
        console.warn('[Compras] Erro ao recarregar métricas:', err)
      }
    }

  // ── Dados derivados ───────────────────────────────────────────────────────

  const pendentes = solicitacoes.filter((s) => s.status === 'pendente').length

  const pedidosCotacaoIds = new Set(
    pedidos
      .filter((p) => ['aguardando_aprovacao', 'rascunho', 'aprovado'].includes(p.status))
      .map((p) => p.cotacao_id)
      .filter(Boolean)
  )
  const cotacoesFiltradas = cotacoes.filter((c) => !pedidosCotacaoIds.has(c.id))

  const solicitacoesParaCotacao = solicitacoes.filter((s) => {
    if (s.status !== 'em_cotacao') return false
    const temPedidoAtivo = pedidos.some(
      (p) => p.solicitacao_id === s.id && ['aguardando_aprovacao', 'rascunho', 'aprovado'].includes(p.status)
    )
    return !temPedidoAtivo
  })

  const cotacoesPorSolicitacao = cotacoesFiltradas.reduce<Record<string, CotacaoFornecedor[]>>(
    (acc, c) => {
      if (!acc[c.solicitacao_id]) acc[c.solicitacao_id] = []
      acc[c.solicitacao_id].push(c)
      return acc
    },
    {}
  )

  const pedidosAtivos = pedidos.filter((p) =>
    p.status === 'aguardando_aprovacao' || p.status === 'rascunho'
  )
  const aguardandoAprovacao = pedidosAtivos.length

  const entregasAtivas = entregas.filter((e) => e.status !== 'entregue')
  const entregasConcluidas = entregas.filter((e) => e.status === 'entregue')
  const entregasAtrasadas = entregasAtivas.filter((e) => e.status === 'atrasado').length
  const emCotacaoCount = solicitacoesParaCotacao.length

  const tabs: Tab[] = [
    { id: 'dashboard',    label: 'Dashboard' },
    { id: 'solicitacoes', label: 'Solicitações', badge: pendentes },
    { id: 'cotacoes',     label: 'Cotações',     badge: emCotacaoCount },
    { id: 'pedidos',      label: 'Pedidos',      badge: aguardandoAprovacao },
    { id: 'entregas',     label: 'Entregas',     badge: entregasAtrasadas > 0 ? entregasAtrasadas : undefined },
    { id: 'concluidos',   label: 'Concluídos' },
    { id: 'auditoria',    label: 'Auditoria' },
  ]

  const handleSolicitacaoExcluida = (id: string) => {
  setSolicitacoes((prev) => prev.filter((s) => s.id !== id))
}

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
                  entregasAtivas={entregasAtivas.slice(0, 4)}
                  onTabChange={(tab) => setActiveTab(tab as TabId)}
                />
              )}

              {activeTab === 'solicitacoes' && (
                <SolicitacaoList
                  data={solicitacoes}
                  onCotar={handleCotar}
                  onVerDetalhes={() => {}}
                  onNovaSolicitacao={() => setModalAberto(true)}
                  onExcluida={handleSolicitacaoExcluida}
                />
              )}

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

              {activeTab === 'pedidos' && (
                <PedidoList
                  data={pedidosAtivos}
                  onAutorizar={handleAutorizarPedido}
                  onRecusar={handleRecusarPedido}
                  onVerDetalhes={() => {}}
                />
              )}

              {activeTab === 'entregas' && (
                <EntregaList
                  data={entregasAtivas}
                  onConfirmar={handleConfirmarEntrega}
                />
              )}

              {activeTab === 'concluidos' && (
                <ConcluídosList
                  entregas={entregasConcluidas}
                  pedidos={pedidos.filter((p) => p.status === 'aprovado')}
                />
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
