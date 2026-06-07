'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { KpiCard, Badge, LoadingSpinner } from '@/components/ui'
import {
  getMovimentacoesConsolidadas,
  ORIGEM_LABEL,
} from '@/services/caixaService'
import { getContas, getCategorias, deleteMovimentacao } from '@/services/bancoService'
import { MovimentacaoConsolidada } from '@/types/caixa'
import { ContaComSaldo, BancoCategoria } from '@/types/banco'
import { fmtCurrency, fmtDate, cn } from '@/lib/utils'
import { MovimentacaoGeralModal } from '@/components/financeiro/MovimentacaoGeralModal'
import { FolhaTab } from '@/components/folha/FolhaTab'
import { NotasTab } from '@/components/notas-fiscais/NotasTab'

type Tab = 'movimentacoes' | 'folha' | 'notas'

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
      {active && <span className="absolute bottom-0 left-0 right-0 h-px bg-white rounded-full" />}
    </button>
  )
}

const inputClass =
  'bg-white/5 border border-white/10 text-white placeholder:text-white/30 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-white/30 transition-colors'

const PAGE_SIZE = 12

export default function FinanceiroPage() {
  const [activeTab, setActiveTab] = useState<Tab>('movimentacoes')

  const [movs, setMovs] = useState<MovimentacaoConsolidada[]>([])
  const [contas, setContas] = useState<ContaComSaldo[]>([])
  const [categorias, setCategorias] = useState<BancoCategoria[]>([])
  const [loading, setLoading] = useState(true)
  const [openModal, setOpenModal] = useState(false)
  const [page, setPage] = useState(1)

  // filtros
  const [search, setSearch] = useState('')
  const [tipo, setTipo] = useState('todos')
  const [origem, setOrigem] = useState('todas')
  const [conta, setConta] = useState('todas')
  const [situacao, setSituacao] = useState('todas') // realizado | previsto
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  async function fetchAll() {
    const [m, c, cat] = await Promise.all([
      getMovimentacoesConsolidadas(),
      getContas(),
      getCategorias(),
    ])
    setMovs(m)
    setContas(c)
    setCategorias(cat)
  }

  useEffect(() => {
    let active = true
    Promise.all([getMovimentacoesConsolidadas(), getContas(), getCategorias()]).then(
      ([m, c, cat]) => {
        if (!active) return
        setMovs(m)
        setContas(c)
        setCategorias(cat)
        setLoading(false)
      },
    )
    return () => { active = false }
  }, [])

  const filtered = useMemo(() => {
    let r = [...movs]
    if (search) {
      const q = search.toLowerCase()
      r = r.filter(
        m =>
          (m.descricao ?? '').toLowerCase().includes(q) ||
          (m.beneficiario ?? '').toLowerCase().includes(q) ||
          (m.obra?.name ?? '').toLowerCase().includes(q),
      )
    }
    if (tipo !== 'todos') r = r.filter(m => m.tipo === tipo)
    if (origem !== 'todas') r = r.filter(m => m.origem === origem)
    if (conta !== 'todas') r = r.filter(m => m.conta_id === conta)
    if (situacao !== 'todas')
      r = r.filter(m => (situacao === 'realizado' ? m.realizado : !m.realizado))
    if (startDate) r = r.filter(m => (m.data ?? '') >= startDate)
    if (endDate) r = r.filter(m => (m.data ?? '') <= endDate)
    return r
  }, [movs, search, tipo, origem, conta, situacao, startDate, endDate])

  // KPIs do conjunto filtrado
  const kpis = useMemo(() => {
    const sum = (pred: (m: MovimentacaoConsolidada) => boolean) =>
      filtered.filter(pred).reduce((a, m) => a + (Number(m.valor) || 0), 0)
    const receita = sum(m => m.tipo === 'entrada' && m.realizado)
    const despesa = sum(m => m.tipo === 'saida' && m.realizado)
    const aReceber = sum(m => m.tipo === 'entrada' && !m.realizado)
    const aPagar = sum(m => m.tipo === 'saida' && !m.realizado)
    const saldoContas = contas.reduce((a, c) => a + (Number(c.saldo_atual) || 0), 0)
    return { receita, despesa, resultado: receita - despesa, aReceber, aPagar, saldoContas }
  }, [filtered, contas])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageSafe = Math.min(page, totalPages)
  const pageRows = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE)

  function resetPageAnd<T>(setter: (v: T) => void) {
    return (v: T) => { setter(v); setPage(1) }
  }

  async function handleDeleteGeral(m: MovimentacaoConsolidada) {
    if (m.origem !== 'geral') return
    if (!confirm('Excluir esta movimentação geral?')) return
    const { error } = await deleteMovimentacao(m.origem_id)
    if (error) { toast.error(error); return }
    toast.success('Movimentação excluída.')
    fetchAll()
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold text-white">Financeiro</h1>
          <p className="text-sm text-white/40 mt-1">
            Caixa consolidado da empresa — todas as obras, empréstimos e lançamentos
            gerais num só lugar. As movimentações de obra vêm do Custo Real e das Medições.
          </p>
        </div>

        {activeTab === 'movimentacoes' && (
          <button
            onClick={() => setOpenModal(true)}
            className="flex items-center gap-2 bg-white text-black px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <span className="text-base leading-none">+</span>
            Nova movimentação geral
          </button>
        )}
      </div>

      {/* MÉTRICAS */}
      {activeTab === 'movimentacoes' && !loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <KpiCard label="Receita realizada" value={fmtCurrency(kpis.receita)} variant="green" />
          <KpiCard label="Despesa realizada" value={fmtCurrency(kpis.despesa)} variant="red" />
          <KpiCard
            label="Resultado"
            value={fmtCurrency(kpis.resultado)}
            variant={kpis.resultado >= 0 ? 'green' : 'red'}
          />
          <KpiCard label="A receber" value={fmtCurrency(kpis.aReceber)} variant="blue" />
          <KpiCard label="A pagar" value={fmtCurrency(kpis.aPagar)} variant="amber" />
          <KpiCard label="Saldo em contas" value={fmtCurrency(kpis.saldoContas)} variant="neutral" />
        </div>
      )}

      {/* ABAS */}
      <div className="border-b border-white/[0.07]">
        <div className="flex">
          <TabButton active={activeTab === 'movimentacoes'} onClick={() => setActiveTab('movimentacoes')}>
            Movimentações
          </TabButton>
          <TabButton active={activeTab === 'folha'} onClick={() => setActiveTab('folha')}>
            Folha de Pagamento
          </TabButton>
          <TabButton active={activeTab === 'notas'} onClick={() => setActiveTab('notas')}>
            Notas Fiscais
          </TabButton>
        </div>
      </div>

      {activeTab === 'movimentacoes' && (
        <>
          {/* FILTROS */}
          <div className="flex flex-col lg:flex-row gap-3 justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="text"
                placeholder="Buscar descrição, obra, beneficiário…"
                value={search}
                onChange={e => resetPageAnd(setSearch)(e.target.value)}
                className={`${inputClass} w-64`}
              />
              <div className="flex gap-1">
                {['todos', 'entrada', 'saida'].map(t => (
                  <button
                    key={t}
                    onClick={() => resetPageAnd(setTipo)(t)}
                    className={cn(
                      'px-3.5 py-2 rounded-xl text-sm transition-colors',
                      tipo === t
                        ? 'bg-white text-black font-medium'
                        : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10',
                    )}
                  >
                    {t === 'todos' ? 'Todos' : t === 'entrada' ? 'Entradas' : 'Saídas'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select value={origem} onChange={e => resetPageAnd(setOrigem)(e.target.value)} className={cn(inputClass, 'cursor-pointer')}>
                <option value="todas" className="bg-[#111]">Todas as origens</option>
                {Object.entries(ORIGEM_LABEL).map(([v, l]) => (
                  <option key={v} value={v} className="bg-[#111]">{l}</option>
                ))}
              </select>
              <select value={conta} onChange={e => resetPageAnd(setConta)(e.target.value)} className={cn(inputClass, 'cursor-pointer')}>
                <option value="todas" className="bg-[#111]">Todas as contas</option>
                {contas.map(c => (
                  <option key={c.id} value={c.id} className="bg-[#111]">{c.nome}</option>
                ))}
              </select>
              <select value={situacao} onChange={e => resetPageAnd(setSituacao)(e.target.value)} className={cn(inputClass, 'cursor-pointer')}>
                <option value="todas" className="bg-[#111]">Todas</option>
                <option value="realizado" className="bg-[#111]">Realizadas</option>
                <option value="previsto" className="bg-[#111]">Previstas</option>
              </select>
              <input type="date" value={startDate} onChange={e => resetPageAnd(setStartDate)(e.target.value)} className={inputClass} />
              <span className="text-white/20 text-sm">→</span>
              <input type="date" value={endDate} onChange={e => resetPageAnd(setEndDate)(e.target.value)} className={inputClass} />
            </div>
          </div>

          {/* TABELA */}
          {loading ? (
            <LoadingSpinner />
          ) : filtered.length === 0 ? (
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-16 text-center">
              <div className="text-4xl mb-4">📊</div>
              <h2 className="text-lg font-semibold text-white mb-2">Nenhuma movimentação</h2>
              <p className="text-sm text-white/40">
                As movimentações aparecem aqui automaticamente quando você registra pagamentos
                no Custo Real, recebe Medições ou lança uma movimentação geral.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl overflow-hidden overflow-x-auto">
                <table className="w-full text-sm" style={{ minWidth: 880 }}>
                  <thead>
                    <tr className="border-b border-white/[0.08]">
                      <th className="px-4 py-3 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider">Data</th>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider">Descrição</th>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider">Origem</th>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider">Conta</th>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider">Obra</th>
                      <th className="px-4 py-3 text-right text-[10px] font-semibold text-white/30 uppercase tracking-wider">Valor</th>
                      <th className="px-4 py-3 text-center text-[10px] font-semibold text-white/30 uppercase tracking-wider">Situação</th>
                      <th className="px-4 py-3 text-center text-[10px] font-semibold text-white/30 uppercase tracking-wider">Comp.</th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map(m => (
                      <tr key={m.id} className="group border-t border-white/[0.05] hover:bg-white/[0.02]">
                        <td className="px-4 py-3 text-white/50 font-mono text-xs whitespace-nowrap">
                          {m.data ? fmtDate(m.data) : '—'}
                        </td>
                        <td className="px-4 py-3 text-white/80 max-w-[280px] truncate">{m.descricao ?? '—'}</td>
                        <td className="px-4 py-3 text-white/50 text-xs whitespace-nowrap">{ORIGEM_LABEL[m.origem]}</td>
                        <td className="px-4 py-3 text-white/50 text-xs whitespace-nowrap">{m.conta?.nome ?? '—'}</td>
                        <td className="px-4 py-3 text-white/50 text-xs whitespace-nowrap">{m.obra?.name ?? '—'}</td>
                        <td className={cn(
                          'px-4 py-3 text-right font-mono font-semibold whitespace-nowrap',
                          m.tipo === 'entrada' ? 'text-green-400' : 'text-red-400',
                        )}>
                          {m.tipo === 'entrada' ? '+' : '−'} {fmtCurrency(Number(m.valor) || 0)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge value={m.realizado ? 'pago' : 'pendente'} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          {m.comprovante_url ? (
                            <a href={m.comprovante_url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-400/70 hover:text-blue-400">
                              ver
                            </a>
                          ) : (
                            <span className="text-white/20 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-2 py-3 text-center">
                          {m.origem === 'geral' && (
                            <button
                              onClick={() => handleDeleteGeral(m)}
                              className="text-red-400/0 group-hover:text-red-400/50 hover:!text-red-400 transition-colors text-xs"
                              title="Excluir movimentação geral"
                            >
                              ✕
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* PAGINAÇÃO */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between text-sm text-white/40">
                  <span>{filtered.length} movimentação(ões)</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={pageSafe <= 1}
                      className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 disabled:opacity-40 hover:bg-white/10 transition-colors"
                    >
                      Anterior
                    </button>
                    <span className="font-mono text-white/60">{pageSafe} / {totalPages}</span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={pageSafe >= totalPages}
                      className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 disabled:opacity-40 hover:bg-white/10 transition-colors"
                    >
                      Próxima
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {activeTab === 'folha' && <FolhaTab />}
      {activeTab === 'notas' && <NotasTab />}

      {openModal && (
        <MovimentacaoGeralModal
          contas={contas}
          categorias={categorias}
          onClose={() => setOpenModal(false)}
          onSaved={fetchAll}
        />
      )}
    </div>
  )
}
