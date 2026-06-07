'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Pencil,
  Trash2,
  RefreshCw,
  X,
  Wallet,
  CheckCircle2,
  Target,
  ShieldCheck,
  Building2,
} from 'lucide-react'
import { KpiCard, Btn, LoadingSpinner, EmptyState } from '@/components/ui'
import {
  Emprestimo,
  EmprestimoParcela,
  EmprestimoDocumento,
  EmprestimoGarantia,
} from '@/types/emprestimo'
import {
  getParcelas,
  getDocumentos,
  getGarantias,
  regenerarParcelas,
} from '@/services/emprestimoService'
import { getContas } from '@/services/bancoService'
import {
  resumoContrato,
  serieEvolucao,
  statusParcela,
  encargosAtraso,
} from '@/lib/emprestimoCalc'
import {
  categoriaLabels,
  regimeLabels,
  statusClass,
  statusLabels,
  parcelaStatusClass,
  parcelaStatusLabels,
  indiceCorrecaoLabels,
} from '@/lib/emprestimoConstants'
import { fmtCurrency, fmtDate } from '@/lib/utils'
import { SaldoChart } from './SaldoChart'
import { DocumentosSection } from './DocumentosSection'
import { GarantiasSection } from './GarantiasSection'
import { ParcelaPagamentoModal } from './ParcelaPagamentoModal'
import { RateioObrasSection } from './RateioObrasSection'

interface Props {
  emprestimo: Emprestimo
  obraNome?: string
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onChanged: () => void
}

function Campo({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">{label}</p>
      <p className="text-sm text-white/80 mt-0.5">{value || '—'}</p>
    </div>
  )
}

export function EmprestimoDetalhe({
  emprestimo: e,
  obraNome,
  onClose,
  onEdit,
  onDelete,
  onChanged,
}: Props) {
  const [parcelas, setParcelas] = useState<EmprestimoParcela[]>([])
  const [documentos, setDocumentos] = useState<EmprestimoDocumento[]>([])
  const [garantias, setGarantias] = useState<EmprestimoGarantia[]>([])
  const [contaNome, setContaNome] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [pagarParcela, setPagarParcela] = useState<EmprestimoParcela | null>(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      const [p, d, g, contas] = await Promise.all([
        getParcelas(e.id),
        getDocumentos(e.id),
        getGarantias(e.id),
        e.conta_id ? getContas() : Promise.resolve([]),
      ])
      if (!active) return
      setParcelas(p)
      setDocumentos(d)
      setGarantias(g)
      setContaNome(contas.find(c => c.id === e.conta_id)?.nome)
      setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [e.id, e.conta_id])

  async function recarregar() {
    const [p, d, g] = await Promise.all([
      getParcelas(e.id),
      getDocumentos(e.id),
      getGarantias(e.id),
    ])
    setParcelas(p)
    setDocumentos(d)
    setGarantias(g)
    onChanged()
  }

  async function handleRegenerar() {
    if (
      !confirm(
        'Regenerar o cronograma recalcula todas as parcelas a partir dos dados do contrato e APAGA os pagamentos já lançados. Continuar?'
      )
    )
      return
    setBusy(true)
    const { error } = await regenerarParcelas(e)
    setBusy(false)
    if (error) {
      alert(error)
      return
    }
    await recarregar()
  }

  const resumo = useMemo(() => resumoContrato(e, parcelas), [e, parcelas])
  const serie = useMemo(() => serieEvolucao(e, parcelas), [e, parcelas])
  const isConsorcio = e.categoria === 'consorcio'

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto"
      onMouseDown={ev => {
        if (ev.target === ev.currentTarget) onClose()
      }}
    >
      <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl w-full max-w-5xl shadow-2xl my-4">
        {/* Header */}
        <div className="relative border-b border-white/10 p-6">
          <span className="absolute top-0 left-0 bottom-0 w-1.5 rounded-l-2xl" style={{ backgroundColor: e.cor }} />
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-white/5 text-white/50 uppercase tracking-wider">
                  {categoriaLabels[e.categoria]}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${statusClass[e.status]}`}>
                  {statusLabels[e.status]}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white truncate">{e.descricao}</h2>
              {e.proposito && <p className="text-sm text-white/50 mt-0.5">{e.proposito}</p>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Btn variant="ghost" size="sm" onClick={onEdit}>
                <Pencil size={13} /> Editar
              </Btn>
              <Btn variant="ghost" size="sm" onClick={handleRegenerar} disabled={busy}>
                <RefreshCw size={13} className={busy ? 'animate-spin' : ''} /> Regenerar
              </Btn>
              <Btn variant="danger" size="sm" onClick={onDelete}>
                <Trash2 size={13} />
              </Btn>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* dados do contrato */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
            <Campo label={isConsorcio ? 'Administradora' : 'Credor'} value={
              e.credor ? `${e.credor}${e.credor_documento ? ` · ${e.credor_documento}` : ''}` : '—'
            } />
            <Campo
              label={isConsorcio ? 'Carta de crédito' : 'Valor emprestado'}
              value={fmtCurrency(e.valor_principal)}
            />
            <Campo label="Início" value={fmtDate(e.data_inicio)} />
            <Campo label="Data limite" value={e.data_limite ? fmtDate(e.data_limite) : '—'} />

            {e.numero_contrato && <Campo label="Nº do contrato" value={e.numero_contrato} />}
            {e.data_assinatura && <Campo label="Assinatura" value={fmtDate(e.data_assinatura)} />}

            {!isConsorcio ? (
              <>
                <Campo label="Forma de cobrança" value={regimeLabels[e.regime]} />
                {e.regime !== 'sem_juros' && (
                  <Campo
                    label="Juros"
                    value={
                      <>
                        {e.taxa_juros_mensal}% a.m. · {e.taxa_juros_anual}% a.a.
                        {e.regime === 'juros_saldo' && (
                          <span className="text-white/40 text-xs">
                            {' '}
                            · {e.capitaliza ? 'capitaliza' : 'sem capitalizar'}
                          </span>
                        )}
                      </>
                    }
                  />
                )}
                {e.carencia_meses > 0 && (
                  <Campo label="Carência" value={`${e.carencia_meses} ${e.carencia_meses === 1 ? 'mês' : 'meses'}`} />
                )}
                {e.indice_correcao !== 'nenhum' && (
                  <Campo label="Correção" value={indiceCorrecaoLabels[e.indice_correcao]} />
                )}
              </>
            ) : (
              <>
                <Campo label="Taxa de administração" value={e.taxa_admin_pct ? `${e.taxa_admin_pct}%` : '—'} />
                <Campo label="Fundo de reserva" value={e.fundo_reserva_pct ? `${e.fundo_reserva_pct}%` : '—'} />
                <Campo label="Grupo / Cota" value={[e.grupo, e.cota].filter(Boolean).join(' / ') || '—'} />
                <Campo label="Bem objeto" value={e.bem_objeto} />
                <Campo
                  label="Contemplação"
                  value={e.contemplado ? `Sim${e.data_contemplacao ? ` · ${fmtDate(e.data_contemplacao)}` : ''}` : 'Não'}
                />
              </>
            )}

            {(e.multa_atraso_pct > 0 || e.juros_mora_mensal > 0) && (
              <Campo
                label="Encargos de atraso"
                value={`Multa ${e.multa_atraso_pct}% · Mora ${e.juros_mora_mensal}% a.m.`}
              />
            )}
            {(e.iof > 0 || e.tac > 0 || e.seguro > 0) && (
              <Campo
                label="IOF / TAC / Seguro"
                value={`${fmtCurrency(e.iof)} · ${fmtCurrency(e.tac)} · ${fmtCurrency(e.seguro)}`}
              />
            )}
            <Campo label="Dia de vencimento" value={e.dia_vencimento ? `Dia ${e.dia_vencimento}` : '—'} />
            {obraNome && <Campo label="Obra vinculada" value={obraNome} />}
            {contaNome && <Campo label="Conta (Bancos)" value={contaNome} />}
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="p-6 space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <KpiCard
                label="Saldo devedor"
                value={fmtCurrency(Math.max(0, resumo.saldoDevedor))}
                sub={`${resumo.qtdPagas}/${resumo.qtdParcelas} parcelas pagas`}
                variant={resumo.saldoDevedor > 0.005 ? 'red' : 'green'}
              />
              <KpiCard label="Total pago" value={fmtCurrency(resumo.totalPago)} sub={`de ${fmtCurrency(resumo.totalContratado)}`} variant="green" />
              <KpiCard label="Total de juros" value={fmtCurrency(resumo.totalJuros)} sub="custo do crédito" variant="amber" />
              {resumo.emAtraso > 0.005 ? (
                <KpiCard label="Em atraso" value={fmtCurrency(resumo.emAtraso)} sub={`${resumo.qtdAtrasadas} parcela(s)`} variant="red" />
              ) : (
                <KpiCard
                  label="Próxima parcela"
                  value={resumo.proximaParcela ? fmtDate(resumo.proximaParcela) : 'Quitado'}
                  sub={resumo.proximaParcela ? 'a vencer' : 'sem pendências'}
                  variant="blue"
                />
              )}
            </div>

            {/* custo / CET / valor atualizado */}
            {parcelas.length > 0 && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-3">
                  <p className="text-[10px] uppercase tracking-wider text-white/30">Custo total do crédito</p>
                  <p className="text-base font-semibold text-white tabular-nums">{fmtCurrency(resumo.custoTotal)}</p>
                  <p className="text-[10px] text-white/30">juros + IOF + TAC + seguro</p>
                </div>
                <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-3">
                  <p className="text-[10px] uppercase tracking-wider text-white/30">CET</p>
                  <p className="text-base font-semibold text-blue-400 tabular-nums">
                    {resumo.cetMensal === null ? '—' : `${resumo.cetMensal.toFixed(2)}% a.m.`}
                  </p>
                  <p className="text-[10px] text-white/30">
                    {resumo.cetAnual === null ? 'custo efetivo total' : `${resumo.cetAnual.toFixed(1)}% a.a.`}
                  </p>
                </div>
                <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-3">
                  <p className="text-[10px] uppercase tracking-wider text-white/30">Valor atualizado hoje</p>
                  <p className={`text-base font-semibold tabular-nums ${resumo.encargosAtraso > 0 ? 'text-red-400' : 'text-white'}`}>
                    {fmtCurrency(resumo.valorAtualizado)}
                  </p>
                  <p className="text-[10px] text-white/30">saldo + encargos de atraso</p>
                </div>
                <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-3">
                  <p className="text-[10px] uppercase tracking-wider text-white/30">Encargos de atraso</p>
                  <p className={`text-base font-semibold tabular-nums ${resumo.encargosAtraso > 0 ? 'text-red-400' : 'text-white/60'}`}>
                    {fmtCurrency(resumo.encargosAtraso)}
                  </p>
                  <p className="text-[10px] text-white/30">multa + mora acumuladas</p>
                </div>
              </div>
            )}

            {parcelas.length === 0 ? (
              <EmptyState message="Nenhuma parcela gerada. Use “Regenerar” para criar o cronograma a partir do contrato." />
            ) : (
              <>
                {/* Gráfico */}
                <div className="bg-[#111] border border-white/[0.08] rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-white">Evolução do saldo devedor</h3>
                    <div className="flex items-center gap-4 text-[11px]">
                      <span className="inline-flex items-center gap-1.5 text-white/50">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Saldo
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-white/50">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Pago acum.
                      </span>
                    </div>
                  </div>
                  <SaldoChart data={serie} />
                </div>

                {/* Cronograma / parcelas */}
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3">Cronograma de parcelas</h3>
                  <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl overflow-hidden">
                    <div className="max-h-[420px] overflow-y-auto">
                      <table className="w-full">
                        <thead className="sticky top-0 bg-[#141414] z-10">
                          <tr className="border-b border-white/[0.08]">
                            <th className="px-4 py-2.5 text-[10px] font-semibold text-white/30 uppercase tracking-wider text-left">#</th>
                            <th className="px-4 py-2.5 text-[10px] font-semibold text-white/30 uppercase tracking-wider text-left">Vencimento</th>
                            <th className="px-4 py-2.5 text-[10px] font-semibold text-white/30 uppercase tracking-wider text-right">Saldo base</th>
                            <th className="px-4 py-2.5 text-[10px] font-semibold text-white/30 uppercase tracking-wider text-right">Juros</th>
                            <th className="px-4 py-2.5 text-[10px] font-semibold text-white/30 uppercase tracking-wider text-right">Total</th>
                            <th className="px-4 py-2.5 text-[10px] font-semibold text-white/30 uppercase tracking-wider text-right">Encargos</th>
                            <th className="px-4 py-2.5 text-[10px] font-semibold text-white/30 uppercase tracking-wider text-right">Pago</th>
                            <th className="px-4 py-2.5 text-[10px] font-semibold text-white/30 uppercase tracking-wider text-center">Status</th>
                            <th className="px-4 py-2.5 text-[10px] font-semibold text-white/30 uppercase tracking-wider text-right">Ação</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parcelas.map(p => {
                            const st = statusParcela(p)
                            const enc = encargosAtraso(p, e)
                            return (
                              <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="px-4 py-3 text-sm border-t border-white/[0.05] text-white/40 font-mono">{p.numero}</td>
                                <td className="px-4 py-3 text-sm border-t border-white/[0.05] font-mono">
                                  <span className="text-white/70">{fmtDate(p.vencimento)}</span>
                                  {enc.dias > 0 && (
                                    <span className="block text-[10px] text-red-400/80">+{enc.dias}d atraso</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-sm border-t border-white/[0.05] text-right text-white/50 tabular-nums">{fmtCurrency(p.saldo_inicial)}</td>
                                <td className="px-4 py-3 text-sm border-t border-white/[0.05] text-right text-amber-400/80 tabular-nums">{fmtCurrency(p.valor_juros)}</td>
                                <td className="px-4 py-3 text-sm border-t border-white/[0.05] text-right text-white/80 font-semibold tabular-nums">{fmtCurrency(p.valor_total)}</td>
                                <td className="px-4 py-3 text-sm border-t border-white/[0.05] text-right tabular-nums">
                                  {enc.total > 0 ? (
                                    <span className="text-red-400">{fmtCurrency(enc.total)}</span>
                                  ) : p.valor_encargos > 0 ? (
                                    <span className="text-white/40">{fmtCurrency(p.valor_encargos)}</span>
                                  ) : (
                                    <span className="text-white/20">—</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-sm border-t border-white/[0.05] text-right tabular-nums text-green-400">
                                  {p.valor_pago > 0 ? fmtCurrency(p.valor_pago) : '—'}
                                </td>
                                <td className="px-4 py-3 border-t border-white/[0.05] text-center">
                                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${parcelaStatusClass[st]}`}>
                                    {parcelaStatusLabels[st]}
                                  </span>
                                </td>
                                <td className="px-4 py-3 border-t border-white/[0.05] text-right">
                                  <button
                                    onClick={() => setPagarParcela(p)}
                                    className={`inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg transition-colors ${
                                      st === 'paga'
                                        ? 'text-white/40 hover:bg-white/5'
                                        : 'text-blue-400 hover:bg-blue-500/10'
                                    }`}
                                  >
                                    {st === 'paga' ? <CheckCircle2 size={13} /> : <Wallet size={13} />}
                                    {st === 'paga' ? 'Editar' : 'Pagar'}
                                  </button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Rateio entre obras */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Building2 size={15} className="text-white/30" /> Rateio entre obras (destinos)
              </h3>
              <RateioObrasSection
                emprestimoId={e.id}
                valorPrincipal={e.valor_principal}
                onChanged={onChanged}
              />
            </div>

            {/* Garantias */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <ShieldCheck size={15} className="text-white/30" /> Garantias / alienação
              </h3>
              <GarantiasSection emprestimoId={e.id} garantias={garantias} onChanged={recarregar} />
            </div>

            {/* Documentos */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Target size={15} className="text-white/30" /> Documentos
              </h3>
              <DocumentosSection emprestimoId={e.id} documentos={documentos} onChanged={recarregar} />
            </div>

            {e.observacoes && (
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-4">
                <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1">Observações</p>
                <p className="text-sm text-white/70 whitespace-pre-wrap">{e.observacoes}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {pagarParcela && (
        <ParcelaPagamentoModal
          contrato={e}
          parcela={pagarParcela}
          onClose={() => setPagarParcela(null)}
          onSaved={() => {
            setPagarParcela(null)
            recarregar()
          }}
        />
      )}
    </div>
  )
}
