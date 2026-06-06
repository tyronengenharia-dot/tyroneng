'use client'

import { useEffect, useMemo, useState } from 'react'
import { LoadingSpinner, KpiCard } from '@/components/ui'
import {
  getContas,
  getCategorias,
  getMovimentacoes,
} from '@/services/bancoService'
import { getObras } from '@/services/obraService'
import {
  ContaComSaldo,
  BancoCategoria,
  MovimentacaoComRelacoes,
} from '@/types/banco'
import { Obra } from '@/types'
import { fmtCurrency } from '@/lib/utils'
import { ContasTab } from '@/components/bancos/ContasTab'
import { MovimentacoesTab } from '@/components/bancos/MovimentacoesTab'
import { CategoriasTab } from '@/components/bancos/CategoriasTab'
import { TransferenciaModal } from '@/components/bancos/TransferenciaModal'

type Tab = 'contas' | 'movimentacoes' | 'categorias'

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`relative px-5 py-3 text-sm font-medium transition-colors ${
        active ? 'text-white' : 'text-white/40 hover:text-white/70'
      }`}
    >
      {children}
      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-px bg-white rounded-full" />
      )}
    </button>
  )
}

export default function BancosPage() {
  const [contas, setContas] = useState<ContaComSaldo[]>([])
  const [categorias, setCategorias] = useState<BancoCategoria[]>([])
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoComRelacoes[]>([])
  const [obras, setObras] = useState<Obra[]>([])
  const [loading, setLoading] = useState(true)

  const [activeTab, setActiveTab] = useState<Tab>('contas')
  const [contaFiltro, setContaFiltro] = useState<string | undefined>(undefined)
  const [transferOpen, setTransferOpen] = useState(false)

  async function refreshAll() {
    const [c, cat, mov, obs] = await Promise.all([
      getContas(),
      getCategorias(),
      getMovimentacoes(),
      getObras(),
    ])
    setContas(c)
    setCategorias(cat)
    setMovimentacoes(mov)
    setObras(obs)
  }

  useEffect(() => {
    let active = true
    Promise.all([getContas(), getCategorias(), getMovimentacoes(), getObras()]).then(
      ([c, cat, mov, obs]) => {
        if (!active) return
        setContas(c)
        setCategorias(cat)
        setMovimentacoes(mov)
        setObras(obs)
        setLoading(false)
      }
    )
    return () => {
      active = false
    }
  }, [])

  // ── KPIs consolidados ──────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const now = new Date()
    const ini = new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString('en-CA')
    const fim = new Date(now.getFullYear(), now.getMonth() + 1, 0).toLocaleDateString('en-CA')

    const saldoConsolidado = contas.reduce((a, c) => a + c.saldo_atual, 0)
    const saldoPrevisto = contas.reduce((a, c) => a + c.saldo_previsto, 0)

    const doMes = movimentacoes.filter(
      m => m.data >= ini && m.data <= fim && m.status !== 'previsto'
    )
    const entradasMes = doMes
      .filter(m => m.tipo === 'entrada')
      .reduce((a, m) => a + m.valor, 0)
    const saidasMes = doMes
      .filter(m => m.tipo === 'saida')
      .reduce((a, m) => a + m.valor, 0)

    return {
      saldoConsolidado,
      saldoPrevisto,
      entradasMes,
      saidasMes,
      resultadoMes: entradasMes - saidasMes,
      mesLabel: now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
    }
  }, [contas, movimentacoes])

  function goToMovimentacoes(contaId?: string) {
    setContaFiltro(contaId)
    setActiveTab('movimentacoes')
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Bancos</h1>
        <p className="text-gray-400 text-sm">
          Controle de gastos e saldo de cada central de conta da empresa — contas,
          caixa, aplicações e transferências.
        </p>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard
              label="Saldo consolidado"
              value={fmtCurrency(kpis.saldoConsolidado)}
              sub={`Previsto: ${fmtCurrency(kpis.saldoPrevisto)}`}
              variant={kpis.saldoConsolidado >= 0 ? 'green' : 'red'}
            />
            <KpiCard
              label="Entradas do mês"
              value={fmtCurrency(kpis.entradasMes)}
              sub={kpis.mesLabel}
              variant="blue"
            />
            <KpiCard
              label="Saídas do mês"
              value={fmtCurrency(kpis.saidasMes)}
              sub={kpis.mesLabel}
              variant="red"
            />
            <KpiCard
              label="Resultado do mês"
              value={fmtCurrency(kpis.resultadoMes)}
              sub={kpis.mesLabel}
              variant={kpis.resultadoMes >= 0 ? 'green' : 'amber'}
            />
          </div>

          {/* Abas */}
          <div className="border-b border-white/[0.07]">
            <div className="flex">
              <TabButton active={activeTab === 'contas'} onClick={() => setActiveTab('contas')}>
                Contas ({contas.length})
              </TabButton>
              <TabButton
                active={activeTab === 'movimentacoes'}
                onClick={() => {
                  setContaFiltro(undefined)
                  setActiveTab('movimentacoes')
                }}
              >
                Movimentações
              </TabButton>
              <TabButton active={activeTab === 'categorias'} onClick={() => setActiveTab('categorias')}>
                Categorias
              </TabButton>
            </div>
          </div>

          {activeTab === 'contas' && (
            <ContasTab
              contas={contas}
              onRefresh={refreshAll}
              onVerMovimentacoes={goToMovimentacoes}
              onTransferir={() => setTransferOpen(true)}
            />
          )}

          {activeTab === 'movimentacoes' && (
            <MovimentacoesTab
              movimentacoes={movimentacoes}
              contas={contas}
              categorias={categorias}
              obras={obras}
              onRefresh={refreshAll}
              onTransferir={() => setTransferOpen(true)}
              contaInicial={contaFiltro}
            />
          )}

          {activeTab === 'categorias' && (
            <CategoriasTab categorias={categorias} onRefresh={refreshAll} />
          )}
        </>
      )}

      {transferOpen && (
        <TransferenciaModal
          contas={contas}
          onClose={() => setTransferOpen(false)}
          onSaved={() => {
            setTransferOpen(false)
            refreshAll()
          }}
        />
      )}
    </div>
  )
}
