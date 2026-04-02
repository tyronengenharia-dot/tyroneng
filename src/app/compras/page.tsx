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
  confirmarEntrega,
} from '@/services/comprasService'

import { ComprasDashboard } from '@/components/compras/ComprasDashboard'
import { SolicitacaoList } from '@/components/compras/SolicitacaoList'
import { ComparativoCotacao } from '@/components/compras/ComparativoCotacao'
import { PedidoList } from '@/components/compras/PedidoList'
import { EntregaList } from '@/components/compras/EntregaList'
import { AuditoriaTimeline } from '@/components/compras/AuditoriaTimeline'

// ─── Tipos internos ─────────────────────────────────────────────────────────

type TabId = 'dashboard' | 'solicitacoes' | 'cotacoes' | 'pedidos' | 'entregas' | 'auditoria'

interface Tab {
  id: TabId
  label: string
  badge?: number
}

// ─── Constantes ─────────────────────────────────────────────────────────────

const METRICAS_FALLBACK: MetricasCompras = {
  total_comprado: 0,
  economia_cotacoes: 0,
  solicitacoes_pendentes: 0,
  entregas_atrasadas: 0,
  variacao_total_pct: 0,
  variacao_economia_pct: 0,
  solicitacoes_novas_semana: 0,
  entregas_atrasadas_variacao: 0,
}

// ─── Sub-componente: Tab bar ─────────────────────────────────────────────────

function ComprasTabs({
  tabs,
  activeTab,
  onChange,
}: {
  tabs: Tab[]
  activeTab: TabId
  onChange: (id: TabId) => void
}) {
  return (
    <div className="flex items-end gap-0 border-b border-zinc-800">
      {tabs.map((tab) => {
        const ativo = tab.id === activeTab
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium transition-all ${
              ativo
                ? 'text-zinc-100 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-indigo-500'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab.label}
            {tab.badge != null && tab.badge > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none ${
                  ativo ? 'bg-indigo-500/30 text-indigo-300' : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ─── Sub-componente: Loading skeleton ───────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="grid grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-zinc-800/60" />
        ))}
      </div>
      <div className="grid grid-cols-5 gap-3">
        <div className="col-span-3 h-52 rounded-xl bg-zinc-800/60" />
        <div className="col-span-2 h-52 rounded-xl bg-zinc-800/60" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="h-64 rounded-xl bg-zinc-800/60" />
        <div className="h-64 rounded-xl bg-zinc-800/60" />
      </div>
    </div>
  )
}

// ─── Page principal ─────────────────────────────────────────────────────────

export default function ComprasPage() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard')
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  // Dados
  const [metricas, setMetricas] = useState<MetricasCompras>(METRICAS_FALLBACK)
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoCompra[]>([])
  const [cotacoes, setCotacoes] = useState<CotacaoFornecedor[]>([])
  const [pedidos, setPedidos] = useState<PedidoCompra[]>([])
  const [entregas, setEntregas] = useState<Entrega[]>([])
  const [logs, setLogs] = useState<AuditoriaLog[]>([])

  // ── Carregamento inicial ──────────────────────────────────────────────────

  const carregarDados = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const [m, s, c, p, e, l] = await Promise.all([
        getMetricasCompras(),
        getSolicitacoes(),
        getAllCotacoes(),
        getPedidos(),
        getEntregas(),
        getAuditoriaLogs(100),
      ])
      setMetricas(m)
      setSolicitacoes(s)
      setCotacoes(c)
      setPedidos(p)
      setEntregas(e)
      setLogs(l)
    } catch (err) {
      setErro('Erro ao carregar dados. Verifique a conexão.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  // ── Ações ────────────────────────────────────────────────────────────────

  const handleSelecionarCotacao = async (cotacaoId: string, solicitacaoId: string) => {
    try {
      await selecionarCotacao(cotacaoId, solicitacaoId, 'usuário')
      await carregarDados()
    } catch (err) {
      console.error('Erro ao selecionar cotação:', err)
    }
  }

  const handleConfirmarEntrega = async (id: string) => {
    try {
      await confirmarEntrega(id, 'usuário')
      await carregarDados()
    } catch (err) {
      console.error('Erro ao confirmar entrega:', err)
    }
  }

  // ── Dados derivados ───────────────────────────────────────────────────────

  const pendentes = solicitacoes.filter((s) => s.status === 'pendente').length
  const emCotacao = solicitacoes.filter((s) => s.status === 'em_cotacao').length
  const atrasadas = entregas.filter((e) => e.status === 'atrasado').length

  const cotacoesPorSolicitacao = cotacoes.reduce<Record<string, CotacaoFornecedor[]>>(
    (acc, c) => {
      if (!acc[c.solicitacao_id]) acc[c.solicitacao_id] = []
      acc[c.solicitacao_id].push(c)
      return acc
    },
    {}
  )

  const solicitacoesEmCotacao = solicitacoes.filter((s) => s.status === 'em_cotacao')

  const tabs: Tab[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'solicitacoes', label: 'Solicitações', badge: pendentes },
    { id: 'cotacoes', label: 'Cotações', badge: emCotacao },
    { id: 'pedidos', label: 'Pedidos' },
    { id: 'entregas', label: 'Entregas', badge: atrasadas },
    { id: 'auditoria', label: 'Auditoria' },
  ]

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950">
      {/* Cabeçalho da página */}
      <div className="border-b border-zinc-800/60 bg-zinc-950 px-6 pt-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">Compras</h1>
            <p className="mt-0.5 text-[12px] text-zinc-500">
              Gestão de solicitações, cotações, pedidos e entregas
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={carregarDados}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700/60 bg-zinc-900 px-3 py-2 text-[11px] font-medium text-zinc-400 transition-colors hover:text-zinc-300"
            >
              <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M13.5 8A5.5 5.5 0 112 8a5.5 5.5 0 0111.5 0z" />
                <path d="M13.5 3v5h-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Atualizar
            </button>
            <button className="flex items-center gap-1.5 rounded-lg border border-zinc-700/60 bg-zinc-900 px-3 py-2 text-[11px] font-medium text-zinc-400 transition-colors hover:text-zinc-300">
              <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8 2v12M4 10l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Exportar
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <ComprasTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      {/* Conteúdo */}
      <div className="flex-1 px-6 py-6">
        {/* Erro */}
        {erro && (
          <div className="mb-4 flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-[12px] text-red-400">
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 4a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0v-3A.75.75 0 018 5zm0 6.5a.75.75 0 110-1.5.75.75 0 010 1.5z" />
            </svg>
            {erro}
            <button onClick={carregarDados} className="ml-auto underline hover:no-underline">
              Tentar novamente
            </button>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <LoadingSkeleton />
        ) : (
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
                onCotar={(id) => {
                  setActiveTab('cotacoes')
                }}
                onVerDetalhes={(item) => {
                  console.log('Ver detalhes:', item)
                }}
                onNovaSolicitacao={() => {
                  console.log('Nova solicitação')
                }}
              />
            )}

            {activeTab === 'cotacoes' && (
              <ComparativoCotacao
                solicitacoes={solicitacoesEmCotacao.length > 0 ? solicitacoesEmCotacao : solicitacoes.slice(0, 3)}
                cotacoesPorSolicitacao={cotacoesPorSolicitacao}
                onSelecionar={handleSelecionarCotacao}
                onAdicionarCotacao={(id) => {
                  console.log('Adicionar cotação para:', id)
                }}
              />
            )}

            {activeTab === 'pedidos' && (
              <PedidoList
                data={pedidos}
                onVerDetalhes={(pedido) => {
                  console.log('Ver pedido:', pedido)
                }}
              />
            )}

            {activeTab === 'entregas' && (
              <EntregaList
                data={entregas}
                onConfirmar={handleConfirmarEntrega}
              />
            )}

            {activeTab === 'auditoria' && (
              <AuditoriaTimeline logs={logs} />
            )}
          </>
        )}
      </div>
    </div>
  )
}
