'use client'

import { useEffect, useState } from 'react'
import {
  getResumoFinanceiroObra,
  type ResumoFinanceiroObra,
  type MovStatusKey,
} from '@/services/financeiroObraService'
import {
  Badge, KpiCard, EmptyState, LoadingSpinner,
  TableCard, TableHead, Th, Td,
} from '@/components/ui'
import { fmtCurrency, fmtDate, cn } from '@/lib/utils'

type Props = { obra_id: string }

const TIPO_FILTERS = ['Todos', 'Entradas', 'Saídas'] as const
const STATUS_FILTERS = ['Todos', 'Pago', 'A receber', 'Pendente', 'Atrasado'] as const

function StatusBadge({ s }: { s: MovStatusKey }) {
  if (s === 'a_receber') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        A receber
      </span>
    )
  }
  return <Badge value={s} />
}

export function FinanceiroTab({ obra_id }: Props) {
  const [resumo, setResumo] = useState<ResumoFinanceiroObra | null>(null)
  const [loading, setLoading] = useState(true)
  const [tipoFilter, setTipo] = useState<(typeof TIPO_FILTERS)[number]>('Todos')
  const [statusFilter, setStatus] = useState<(typeof STATUS_FILTERS)[number]>('Todos')

  useEffect(() => {
    let active = true
    getResumoFinanceiroObra(obra_id).then(r => {
      if (!active) return
      setResumo(r)
      setLoading(false)
    })
    return () => { active = false }
  }, [obra_id])

  if (loading || !resumo) return <LoadingSpinner />

  const filtered = resumo.movimentacoes.filter(m => {
    const tipoOk =
      tipoFilter === 'Todos' ? true
      : tipoFilter === 'Entradas' ? m.tipo === 'entrada'
      : m.tipo === 'saida'
    const statusOk =
      statusFilter === 'Todos' ? true
      : statusFilter === 'Pago' ? m.statusKey === 'pago'
      : statusFilter === 'A receber' ? m.statusKey === 'a_receber'
      : statusFilter === 'Pendente' ? m.statusKey === 'pendente'
      : m.statusKey === 'atrasado'
    return tipoOk && statusOk
  })

  return (
    <div className="space-y-4">
      {/* Aviso: aba só-leitura */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-xs text-white/50">
        <span className="text-white/30">Somente leitura.</span>
        As <span className="text-white/70">saídas</span> são lançadas no <span className="text-white/70">Custo Real</span> (pagamentos de cada item) e as{' '}
        <span className="text-white/70">entradas</span> vêm das <span className="text-white/70">Medições</span>.
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        <KpiCard label="Receita realizada" value={fmtCurrency(resumo.receitaRealizada)} variant="green" sub="Medições pagas" />
        <KpiCard label="Despesa realizada" value={fmtCurrency(resumo.despesaRealizada)} variant="red" sub="Parcelas pagas" />
        <KpiCard label="Saldo" value={fmtCurrency(resumo.saldo)} variant={resumo.saldo >= 0 ? 'green' : 'red'} sub="Realizado" />
        <KpiCard label="A receber" value={fmtCurrency(resumo.aReceber)} variant="blue" sub="Medições aprovadas" />
        <KpiCard label="A pagar" value={fmtCurrency(resumo.aPagar)} variant="amber" sub="Parcelas pendentes/atrasadas" />
      </div>

      {/* Movimentações */}
      <TableCard>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08] flex-wrap gap-2">
          <div className="flex gap-1.5 flex-wrap">
            {TIPO_FILTERS.map(f => (
              <button key={f}
                onClick={() => setTipo(f)}
                className={cn('px-3 py-1 rounded-lg text-xs font-medium transition-colors',
                  tipoFilter === f ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70')}
              >
                {f}
              </button>
            ))}
            <span className="text-white/10 mx-1">|</span>
            {STATUS_FILTERS.map(f => (
              <button key={f}
                onClick={() => setStatus(f)}
                className={cn('px-3 py-1 rounded-lg text-xs font-medium transition-colors',
                  statusFilter === f ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70')}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState message="Nenhuma movimentação encontrada" />
        ) : (
          <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
            <TableHead>
              <Th>Descrição</Th>
              <Th>Tipo</Th>
              <Th right>Valor</Th>
              <Th>Status</Th>
              <Th>Data</Th>
            </TableHead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.key} className="hover:bg-white/[0.02] transition-colors">
                  <Td>
                    <div className="flex items-center gap-2.5">
                      {m.comprovante_url && (
                        <a href={m.comprovante_url} target="_blank" rel="noopener noreferrer" title="Ver comprovante" className="shrink-0">
                          <img src={m.comprovante_url} alt="" className="h-9 w-9 object-cover rounded-md border border-white/10" />
                        </a>
                      )}
                      <div className="min-w-0">
                        <div className="font-medium text-white/90 truncate">{m.titulo}</div>
                        <div className="text-xs text-white/30 mt-0.5 truncate">{m.origem}</div>
                      </div>
                    </div>
                  </Td>
                  <Td><Badge value={m.tipo} /></Td>
                  <Td right mono>
                    <span className={m.tipo === 'entrada' ? 'text-green-400' : 'text-red-400'}>
                      {m.tipo === 'entrada' ? '+' : '-'} {fmtCurrency(m.valor)}
                    </span>
                  </Td>
                  <Td><StatusBadge s={m.statusKey} /></Td>
                  <Td muted>{m.data ? fmtDate(m.data) : '—'}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TableCard>
    </div>
  )
}
