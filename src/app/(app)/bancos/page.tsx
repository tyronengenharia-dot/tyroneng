'use client'

import { useEffect, useMemo, useState } from 'react'
import { LoadingSpinner, KpiCard } from '@/components/ui'
import { getContas, getCategorias } from '@/services/bancoService'
import { getMovimentacoesConsolidadas } from '@/services/caixaService'
import { ContaComSaldo, BancoCategoria } from '@/types/banco'
import { MovimentacaoConsolidada } from '@/types/caixa'
import { fmtCurrency } from '@/lib/utils'
import { ContasTab } from '@/components/bancos/ContasTab'
import { CategoriasTab } from '@/components/bancos/CategoriasTab'
import { TransferenciaModal } from '@/components/bancos/TransferenciaModal'

type Tab = 'contas' | 'categorias'

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
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoConsolidada[]>([])
  const [loading, setLoading] = useState(true)

  const [activeTab, setActiveTab] = useState<Tab>('contas')
  const [transferOpen, setTransferOpen] = useState(false)

  async function refreshAll() {
    const [c, cat, mov] = await Promise.all([
      getContas(),
      getCategorias(),
      getMovimentacoesConsolidadas(),
    ])
    setContas(c)
    setCategorias(cat)
    setMovimentacoes(mov)
  }

  useEffect(() => {
    let active = true
    Promise.all([getContas(), getCategorias(), getMovimentacoesConsolidadas()]).then(
      ([c, cat, mov]) => {
        if (!active) return
        setContas(c)
        setCategorias(cat)
        setMovimentacoes(mov)
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
      m => m.realizado && m.data && m.data >= ini && m.data <= fim
    )
    const entradasMes = doMes
      .filter(m => m.tipo === 'entrada')
      .reduce((a, m) => a + (Number(m.valor) || 0), 0)
    const saidasMes = doMes
      .filter(m => m.tipo === 'saida')
      .reduce((a, m) => a + (Number(m.valor) || 0), 0)

    return {
      saldoConsolidado,
      saldoPrevisto,
      entradasMes,
      saidasMes,
      resultadoMes: entradasMes - saidasMes,
      mesLabel: now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
    }
  }, [contas, movimentacoes])

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Bancos</h1>
        <p className="text-gray-400 text-sm">
          Centrais de conta da empresa — onde o dinheiro fica. O saldo de cada conta
          é calculado pelas movimentações lançadas no Financeiro e nas obras (não se
          lança movimentação aqui).
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
              <TabButton active={activeTab === 'categorias'} onClick={() => setActiveTab('categorias')}>
                Categorias
              </TabButton>
            </div>
          </div>

          {activeTab === 'contas' && (
            <ContasTab
              contas={contas}
              onRefresh={refreshAll}
              onTransferir={() => setTransferOpen(true)}
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
