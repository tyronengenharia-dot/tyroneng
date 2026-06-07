'use client'

import { useEffect, useState } from 'react'
import { getResumoFinanceiroObra, type ResumoFinanceiroObra } from '@/services/financeiroObraService'
import { getMedicaoResumo, MedicaoResumo } from '@/services/medicaoService'
import { getEtapasByObra } from '@/services/etapaService'
import { Etapa } from '@/types'
import { KpiCard, LoadingSpinner, ProgressBar } from '@/components/ui'
import { fmtCurrency } from '@/lib/utils'

type Props = { obra_id: string; budget: number }

export function DashboardTab({ obra_id, budget }: Props) {
  const [resumo, setResumo] = useState<ResumoFinanceiroObra | null>(null)
  const [medicao, setMedicao] = useState<MedicaoResumo | null>(null)
  const [etapas, setEtapas] = useState<Etapa[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    Promise.all([
      getResumoFinanceiroObra(obra_id),
      getMedicaoResumo(obra_id),
      getEtapasByObra(obra_id),
    ]).then(([f, m, e]) => {
      if (!active) return
      setResumo(f)
      setMedicao(m)
      setEtapas(e)
      setLoading(false)
    })
    return () => { active = false }
  }, [obra_id])

  if (loading || !resumo) return <LoadingSpinner />

  const receitas  = resumo.receitaRealizada
  const despesas  = resumo.despesaRealizada
  const saldo     = resumo.saldo
  const margem    = receitas > 0 ? ((saldo / receitas) * 100).toFixed(1) : '0'

  const totalMedido   = medicao?.totalMedido ?? 0
  const pctMedicao    = (medicao?.pct ?? 0).toFixed(1)

  const etapasConcl   = etapas.filter(e => e.status === 'concluida').length
  const etapasTotal   = etapas.length
  const pctFisico     = etapasTotal > 0
    ? Math.round(etapas.reduce((a, e) => a + e.percentual_fisico, 0) / etapasTotal)
    : 0

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="Receitas" value={fmtCurrency(receitas)} sub="entradas pagas" variant="green" />
        <KpiCard label="Despesas" value={fmtCurrency(despesas)} sub="custos reais" variant="red" />
        <KpiCard label="Saldo" value={fmtCurrency(saldo)} sub={`margem ${margem}%`} variant="blue" />
        <KpiCard label="Medido (acum.)" value={fmtCurrency(totalMedido)} sub={`${pctMedicao}% do contrato`} variant="amber" />
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-2 gap-4">
        {/* Progress por etapas */}
        <div className="bg-[#0d0d0d] border border-white/[0.08] rounded-2xl p-5">
          <div className="flex justify-between items-baseline mb-4">
            <p className="text-sm font-medium text-white/60">Progresso por Etapa</p>
            <span className="text-2xl font-semibold text-green-400">{pctFisico}%</span>
          </div>
          <ProgressBar value={pctFisico} color={pctFisico >= 80 ? 'green' : pctFisico >= 40 ? 'blue' : 'amber'} className="mb-4 h-2" />
          <div className="space-y-2.5 mt-4">
            {etapas.slice(0, 6).map(etapa => (
              <div key={etapa.id} className="flex items-center gap-3">
                <span className="text-[12px] text-white/50 truncate flex-1">{etapa.nome}</span>
                <div className="w-20">
                  <ProgressBar
                    value={etapa.percentual_fisico}
                    color={
                      etapa.status === 'concluida' ? 'green'
                      : etapa.status === 'atrasada' ? 'red'
                      : 'blue'
                    }
                  />
                </div>
                <span className="text-[11px] font-mono text-white/30 w-8 text-right">
                  {etapa.percentual_fisico}%
                </span>
              </div>
            ))}
            {etapas.length === 0 && (
              <p className="text-xs text-white/20 text-center py-4">Nenhuma etapa cadastrada</p>
            )}
          </div>
        </div>

        {/* Financeiro resumo */}
        <div className="bg-[#0d0d0d] border border-white/[0.08] rounded-2xl p-5">
          <p className="text-sm font-medium text-white/60 mb-4">Financeiro da Obra</p>

          <div className="space-y-3">
            <div className="flex justify-between items-center py-2.5 border-b border-white/[0.06]">
              <span className="text-sm text-white/50">Orçamento contratado</span>
              <span className="font-mono text-sm text-white">{fmtCurrency(budget)}</span>
            </div>
            <div className="flex justify-between items-center py-2.5 border-b border-white/[0.06]">
              <span className="text-sm text-white/50">Total medido</span>
              <span className="font-mono text-sm text-amber-400">{fmtCurrency(totalMedido)}</span>
            </div>
            <div className="flex justify-between items-center py-2.5 border-b border-white/[0.06]">
              <span className="text-sm text-white/50">Receitas recebidas</span>
              <span className="font-mono text-sm text-green-400">{fmtCurrency(receitas)}</span>
            </div>
            <div className="flex justify-between items-center py-2.5 border-b border-white/[0.06]">
              <span className="text-sm text-white/50">Despesas realizadas</span>
              <span className="font-mono text-sm text-red-400">{fmtCurrency(despesas)}</span>
            </div>
            <div className="flex justify-between items-center py-2.5">
              <span className="text-sm font-semibold text-white">Saldo atual</span>
              <span className={`font-mono text-sm font-semibold ${saldo >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {fmtCurrency(saldo)}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/[0.06]">
            <div className="flex justify-between text-xs text-white/30 mb-1.5">
              <span>Etapas concluídas</span>
              <span className="font-mono">{etapasConcl}/{etapasTotal}</span>
            </div>
            <ProgressBar
              value={etapasTotal > 0 ? (etapasConcl / etapasTotal) * 100 : 0}
              color="green"
            />
          </div>
        </div>
      </div>

      {/* Últimas transações */}
      <div className="bg-[#0d0d0d] border border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.08]">
          <p className="text-sm font-medium text-white/60">Últimas Movimentações</p>
        </div>
        <table className="w-full text-sm">
          <tbody>
            {resumo.movimentacoes.slice(0, 5).map(m => (
              <tr key={m.key} className="border-t border-white/[0.05] hover:bg-white/[0.02]">
                <td className="px-5 py-3 text-white/80 font-medium">{m.titulo}</td>
                <td className="px-5 py-3 text-white/30 text-xs">{m.origem}</td>
                <td className="px-5 py-3 text-right font-mono">
                  <span className={m.tipo === 'entrada' ? 'text-green-400' : 'text-red-400'}>
                    {m.tipo === 'entrada' ? '+' : '-'} {fmtCurrency(m.valor)}
                  </span>
                </td>
              </tr>
            ))}
            {resumo.movimentacoes.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center py-8 text-white/20 text-xs">
                  Nenhuma movimentação registrada
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
