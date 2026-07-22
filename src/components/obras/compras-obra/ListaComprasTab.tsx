'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  getListaCompras,
  setItemEtapa,
  setLeadDias,
  type ListaComprasData,
} from '@/services/listaComprasService'
import { espelharPlanejadoNoCustoReal } from '@/services/custoRealMirrorService'
import type { DestinoCompra } from '@/services/comprasFromListaService'
import { getObraById } from '@/services/obraService'
import { getEmpresaConfig } from '@/services/empresaService'
import {
  agruparPorTipo,
  agruparPorCronograma,
  totaisPorTipo,
  TIPO_LABEL,
  type LinhaInsumo,
  type ServicoExplodido,
} from '@/lib/listaCompras'
import { exportListaComprasPdf, exportListaComprasCsv } from '@/lib/exportListaComprasPdf'
import { GerarSolicitacaoModal } from './GerarSolicitacaoModal'
import { InsumoTipo } from '@/types/insumo'
import { KpiCard, LoadingSpinner, EmptyState, Btn } from '@/components/ui'
import { fmtCurrency, fmtDate, cn } from '@/lib/utils'

// Lista de Compras da obra: explode os serviços do Custo Planejado nos seus
// insumos (material / mão de obra / equipamento) e organiza como lista de compra —
// consolidada, por serviço e pela data do cronograma. É a BASE do que comprar
// (planejar primeiro); o gasto efetivo alimenta o Custo Real. Ver @/lib/listaCompras.

type View = 'consolidada' | 'servico' | 'cronograma'

const fmtQty = (n: number) =>
  n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })

const TIPO_DOT: Record<InsumoTipo, string> = {
  material: 'bg-white/40',
  mao_de_obra: 'bg-blue-400',
  equipamento: 'bg-amber-400',
}

// ── Tabela de insumos (reutilizada nas visões consolidada e cronograma) ───────

function InsumoTable({ insumos }: { insumos: LinhaInsumo[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" style={{ minWidth: 620 }}>
        <thead className="border-b border-white/[0.08]">
          <tr>
            {['Código', 'Insumo', 'Qtd', 'Un.', 'Valor Unit.', 'Total'].map((h, i) => (
              <th key={h} className={cn(
                'px-4 py-2.5 text-[10px] font-semibold text-white/30 uppercase tracking-wider',
                i >= 2 && i !== 3 ? 'text-right' : i === 3 ? 'text-center' : 'text-left',
              )}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {insumos.map(i => (
            <tr key={i.insumo_id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
              <td className="px-4 py-2 font-mono text-xs text-white/40">{i.codigo}</td>
              <td className="px-4 py-2 text-white/80">
                <span className="inline-flex items-center gap-2">
                  <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', TIPO_DOT[i.tipo])} />
                  {i.descricao}
                </span>
              </td>
              <td className="px-4 py-2 text-right font-mono text-white/70">{fmtQty(i.quantidade)}</td>
              <td className="px-4 py-2 text-center text-white/40 text-xs">{i.unidade}</td>
              <td className="px-4 py-2 text-right font-mono text-white/40">{fmtCurrency(i.valor_unitario)}</td>
              <td className="px-4 py-2 text-right font-mono text-green-400">{fmtCurrency(i.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SectionCard({
  title, sub, right, children,
}: { title: React.ReactNode; sub?: React.ReactNode; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-[#0d0d0d] border border-white/[0.08] rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.08]">
        <div className="min-w-0">
          <p className="text-sm font-medium text-white/80 truncate">{title}</p>
          {sub && <p className="text-[11px] text-white/30 mt-0.5">{sub}</p>}
        </div>
        {right && <div className="shrink-0 pl-3">{right}</div>}
      </div>
      {children}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export function ListaComprasTab({ obra_id }: { obra_id: string }) {
  const [data, setData] = useState<ListaComprasData | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>('consolidada')
  const [lead, setLead] = useState(0)
  const [exportOpen, setExportOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [obraName, setObraName] = useState('Obra')
  const [espelhando, setEspelhando] = useState(false)
  const [solic, setSolic] = useState<{
    insumos: LinhaInsumo[]
    data?: string
    contexto: string
    destino?: DestinoCompra
    destinoLabel?: string
  } | null>(null)

  const load = useCallback(async () => {
    const d = await getListaCompras(obra_id)
    setData(d)
    setLead(d.leadDias)
  }, [obra_id])

  useEffect(() => {
    let active = true
    Promise.all([getListaCompras(obra_id), getObraById(obra_id)]).then(([d, obra]) => {
      if (!active) return
      setData(d)
      setLead(d.leadDias)
      if (obra?.name) setObraName(obra.name)
      setLoading(false)
    })
    return () => { active = false }
  }, [obra_id])

  const consolidado = useMemo(() => data?.consolidado ?? [], [data])
  const servicos = useMemo(() => data?.servicos ?? [], [data])
  const etapas = useMemo(() => data?.etapas ?? [], [data])
  const semComposicao = useMemo(() => data?.semComposicao ?? [], [data])

  const tot = useMemo(() => totaisPorTipo(consolidado), [consolidado])
  const totalGeral = tot.material + tot.mao_de_obra + tot.equipamento
  const grupos = useMemo(
    () => agruparPorCronograma(servicos, etapas, lead),
    [servicos, etapas, lead],
  )
  const semEtapaCount = servicos.filter(s => !s.etapa_id || !etapas.some(e => e.id === s.etapa_id)).length
  const sourceEditavel = data?.sourceEditavel ?? true
  const custoRealEditavel = data?.custoRealEditavel ?? false
  const realMap = useMemo(() => data?.realItemPorPlanejado ?? {}, [data])
  const espelhados = servicos.filter(s => realMap[s.item_id]).length

  async function handleAssign(item_id: string, etapa_id: string) {
    setData(prev => prev && {
      ...prev,
      servicos: prev.servicos.map(s => s.item_id === item_id ? { ...s, etapa_id: etapa_id || null } : s),
    })
    const { error } = await setItemEtapa(item_id, etapa_id || null)
    if (error) { toast.error(error); load() }
  }

  async function persistLead() {
    if (!data?.etapaLinkDisponivel) return
    const { error } = await setLeadDias(obra_id, lead)
    if (error) toast.error(error)
  }

  async function handleEspelhar() {
    setEspelhando(true)
    const r = await espelharPlanejadoNoCustoReal(obra_id)
    setEspelhando(false)
    if (r.error) { toast.error(r.error); return }
    const partes: string[] = []
    if (r.itens) partes.push(`${r.itens} item(ns) criado(s)`)
    if (r.jaExistiam) partes.push(`${r.jaExistiam} já existiam`)
    if (r.puladosApagados) partes.push(`${r.puladosApagados} apagado(s) mantidos fora`)
    toast.success(`Custo Real espelhado — ${partes.join(', ') || 'nada novo a copiar'}.`)
    load()
  }

  function gerarCompraServico(s: ServicoExplodido) {
    const realId = realMap[s.item_id]
    if (!realId) { toast.error('Espelhe o plano no Custo Real antes de gerar a compra deste serviço.'); return }
    if (s.insumos.length === 0) { toast.error('Este serviço não tem composição de insumos.'); return }
    setSolic({
      insumos: s.insumos,
      contexto: `${s.codigo} · ${s.descricao}`,
      destino: { tipo: 'obra', entrega_obra_id: obra_id, planilha_item_id: realId },
      destinoLabel: s.descricao,
    })
  }

  async function doExport(kind: 'pdf-consolidada' | 'pdf-cronograma' | 'csv') {
    if (!data) return
    setExportOpen(false)
    setExporting(true)
    try {
      const [obra, cfg] = await Promise.all([getObraById(obra_id), getEmpresaConfig()])
      const obraInfo = { name: obra?.name ?? 'Obra', client: obra?.client, location: obra?.location }
      if (kind === 'csv') {
        exportListaComprasCsv({ obraName: obraInfo.name, consolidado, semComposicao })
      } else {
        await exportListaComprasPdf({
          obra: obraInfo,
          modo: kind === 'pdf-cronograma' ? 'cronograma' : 'consolidada',
          consolidado, grupos, semComposicao,
          leadDias: lead,
          logoDataUrl: cfg?.logo_url || undefined,
        })
      }
    } catch (e) {
      console.error('export lista de compras error:', e)
      toast.error('Erro ao exportar.')
    } finally {
      setExporting(false)
    }
  }

  if (loading) return <LoadingSpinner />

  const vazio = servicos.length === 0 && semComposicao.length === 0

  const VIEWS: { id: View; label: string }[] = [
    { id: 'consolidada', label: 'Consolidada' },
    { id: 'servico', label: 'Por serviço' },
    { id: 'cronograma', label: 'Por cronograma' },
  ]

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 bg-[#0d0d0d] border border-white/[0.08] rounded-xl p-1">
          {VIEWS.map(v => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-[13px] font-medium whitespace-nowrap transition-all',
                view === v.id ? 'bg-[#1c1c1c] text-white border border-white/10' : 'text-white/40 hover:text-white/70',
              )}
            >
              {v.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
        <Btn
          variant="primary"
          onClick={() => setSolic({ insumos: consolidado, contexto: 'Lista consolidada' })}
          disabled={consolidado.length === 0}
        >
          Gerar solicitação
        </Btn>
        <div className="relative">
          <button
            onClick={() => setExportOpen(o => !o)}
            disabled={exporting || vazio}
            className="px-3 py-1.5 text-xs font-medium bg-white/5 text-white/50 border border-white/10 rounded-xl hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {exporting ? 'Gerando…' : 'Exportar'} <span className="text-[9px]">▾</span>
          </button>
          {exportOpen && (
            <>
              <button className="fixed inset-0 z-40 cursor-default" onClick={() => setExportOpen(false)} aria-hidden />
              <div className="absolute right-0 mt-1.5 z-50 w-64 bg-[#161616] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                {[
                  { k: 'pdf-consolidada' as const, t: 'PDF — consolidada', s: 'Agrupada por material / MO / equip.' },
                  { k: 'pdf-cronograma' as const, t: 'PDF — por cronograma', s: 'Uma seção por etapa, com datas' },
                  { k: 'csv' as const, t: 'Planilha (CSV/Excel)', s: 'Lista consolidada para editar' },
                ].map((o, idx) => (
                  <button
                    key={o.k}
                    onClick={() => doExport(o.k)}
                    className={cn('w-full text-left px-3.5 py-2.5 hover:bg-white/[0.04] transition-colors', idx > 0 && 'border-t border-white/[0.06]')}
                  >
                    <span className="block text-xs font-medium text-white/85">{o.t}</span>
                    <span className="block text-[11px] text-white/35 mt-0.5">{o.s}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        </div>
      </div>

      <p className="text-[11px] text-white/30 -mt-1">
        Base: <span className="text-white/50">Custo Planejado</span> da obra — o que comprar. O gasto efetivo alimenta o Custo Real.
      </p>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Materiais" value={fmtCurrency(tot.material)} variant="neutral" />
        <KpiCard label="Mão de obra" value={fmtCurrency(tot.mao_de_obra)} variant="blue" />
        <KpiCard label="Equipamentos" value={fmtCurrency(tot.equipamento)} variant="amber" />
        <KpiCard label="Total da obra" value={fmtCurrency(totalGeral)} variant="green"
          sub={`${servicos.length} serviços`} />
      </div>

      {vazio ? (
        <EmptyState message="Nenhum serviço no Custo Planejado. Monte o Custo Planejado da obra para gerar a lista de compras." />
      ) : view === 'consolidada' ? (
        <div className="space-y-4">
          {agruparPorTipo(consolidado).map(g => (
            <SectionCard
              key={g.tipo}
              title={<span className="inline-flex items-center gap-2"><span className={cn('w-2 h-2 rounded-full', TIPO_DOT[g.tipo])} />{TIPO_LABEL[g.tipo]}</span>}
              sub={`${g.insumos.length} itens`}
              right={<span className="font-mono text-sm font-semibold text-green-400">{fmtCurrency(g.total)}</span>}
            >
              <InsumoTable insumos={g.insumos} />
            </SectionCard>
          ))}
          {semComposicao.length > 0 && (
            <SectionCard
              title="Itens sem detalhamento"
              sub="SINAPI / EMOP / texto livre — sem composição para explodir"
              right={<span className="font-mono text-sm font-semibold text-white/50">{fmtCurrency(semComposicao.reduce((s, i) => s + i.total, 0))}</span>}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ minWidth: 620 }}>
                  <thead className="border-b border-white/[0.08]">
                    <tr>
                      {['Código', 'Descrição', 'Qtd', 'Un.', 'Valor Unit.', 'Total'].map((h, i) => (
                        <th key={h} className={cn('px-4 py-2.5 text-[10px] font-semibold text-white/30 uppercase tracking-wider', i >= 2 && i !== 3 ? 'text-right' : i === 3 ? 'text-center' : 'text-left')}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {semComposicao.map(i => (
                      <tr key={i.item_id} className="border-b border-white/[0.04]">
                        <td className="px-4 py-2 font-mono text-xs text-white/40">{i.codigo}</td>
                        <td className="px-4 py-2 text-white/80">{i.descricao}</td>
                        <td className="px-4 py-2 text-right font-mono text-white/70">{fmtQty(i.quantidade)}</td>
                        <td className="px-4 py-2 text-center text-white/40 text-xs">{i.unidade}</td>
                        <td className="px-4 py-2 text-right font-mono text-white/40">{fmtCurrency(i.valor_unitario)}</td>
                        <td className="px-4 py-2 text-right font-mono text-white/60">{fmtCurrency(i.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}
        </div>
      ) : view === 'servico' ? (
        <div className="space-y-2.5">
          {/* Espelhamento Plano → Custo Real (habilita a compra por serviço) */}
          <div className="flex items-center justify-between gap-3 flex-wrap bg-[#0d0d0d] border border-white/[0.08] rounded-2xl px-5 py-3">
            <div className="text-xs text-white/50 min-w-0">
              <span className="text-white/70 font-medium">Custo Real</span> — {espelhados} de {servicos.length} serviço(s) espelhado(s).
              <span className="text-white/30"> Espelhe para lançar cada compra no Custo Real do serviço.</span>
            </div>
            <Btn variant="primary" onClick={handleEspelhar} disabled={espelhando || !custoRealEditavel}>
              {espelhando ? 'Espelhando…' : 'Espelhar plano no Custo Real'}
            </Btn>
          </div>
          {!custoRealEditavel && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
              Custo Real bloqueado. Aprove o Custo Planejado (aba <span className="font-medium">Custo Planejado</span>) para liberar o espelhamento e a compra por serviço.
            </div>
          )}

          {servicos.map(s => (
            <ServicoRow
              key={s.item_id}
              servico={s}
              open={!!expanded[s.item_id]}
              onToggle={() => setExpanded(p => ({ ...p, [s.item_id]: !p[s.item_id] }))}
              onGerar={() => gerarCompraServico(s)}
              podeGerar={!!realMap[s.item_id]}
            />
          ))}
          {semComposicao.length > 0 && (
            <p className="text-[11px] text-white/30 px-1 pt-1">
              + {semComposicao.length} item(ns) sem composição (SINAPI/EMOP/texto livre) — veja na visão consolidada.
            </p>
          )}
        </div>
      ) : (
        // ── Cronograma ──────────────────────────────────────────────────────
        <div className="space-y-4">
          {!data?.etapaLinkDisponivel && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
              Aplique a migração <span className="font-mono">0015</span> para vincular serviços ao cronograma e usar a antecedência de compra.
            </div>
          )}

          {data?.etapaLinkDisponivel && !sourceEditavel && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
              Custo Planejado aprovado (travado). Reabra o Custo Planejado para reprogramar o vínculo dos serviços com o cronograma.
            </div>
          )}

          <div className="flex items-center gap-3 flex-wrap bg-[#0d0d0d] border border-white/[0.08] rounded-2xl px-5 py-3">
            <label className="text-xs text-white/50">Antecedência de compra (dias)</label>
            <input
              type="number" min={0}
              value={lead}
              disabled={!data?.etapaLinkDisponivel}
              onChange={e => setLead(Math.max(0, Number(e.target.value) || 0))}
              onBlur={persistLead}
              className="w-20 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-sm text-white font-mono focus:outline-none focus:border-white/30 disabled:opacity-40"
            />
            <span className="text-[11px] text-white/30">Comprar até = início da etapa − antecedência</span>
          </div>

          {etapas.length === 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300">
              Nenhuma etapa cadastrada. Monte o cronograma na aba <span className="font-medium">Planejamento</span> para agrupar as compras por data.
            </div>
          )}

          {grupos.map((g, idx) => (
            <SectionCard
              key={g.etapa?.id ?? `sem-etapa-${idx}`}
              title={
                <span className="inline-flex items-center gap-2.5">
                  {g.comprarAte ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded px-2 py-0.5 whitespace-nowrap">
                      Comprar até {fmtDate(g.comprarAte)}
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-white/30 bg-white/5 rounded px-2 py-0.5 whitespace-nowrap">Sem data</span>
                  )}
                  <span>{g.etapa ? `${g.etapa.ordem}. ${g.etapa.nome}` : 'Serviços sem etapa'}</span>
                </span>
              }
              sub={g.etapa
                ? `início ${fmtDate(g.etapa.data_inicio)} · ${g.etapa.duracao_dias}d · ${g.servicos.length} serviço(s)`
                : `${g.servicos.length} serviço(s) — vincule a uma etapa abaixo`}
              right={
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-semibold text-green-400">{fmtCurrency(g.total)}</span>
                  {g.insumos.length > 0 && (
                    <Btn
                      onClick={() => setSolic({
                        insumos: g.insumos,
                        data: g.comprarAte ?? undefined,
                        contexto: g.etapa ? `${g.etapa.ordem}. ${g.etapa.nome}` : 'Serviços sem etapa',
                      })}
                    >
                      Gerar solicitação
                    </Btn>
                  )}
                </div>
              }
            >
              <InsumoTable insumos={g.insumos} />
            </SectionCard>
          ))}

          {/* Painel de vínculo serviço → etapa */}
          {data?.etapaLinkDisponivel && etapas.length > 0 && (
            <SectionCard
              title="Vincular serviços ao cronograma"
              sub={semEtapaCount > 0 ? `${semEtapaCount} serviço(s) ainda sem etapa` : 'Todos os serviços vinculados'}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ minWidth: 620 }}>
                  <thead className="border-b border-white/[0.08]">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider">Serviço</th>
                      <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-white/30 uppercase tracking-wider">Qtd</th>
                      <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-white/30 uppercase tracking-wider">Total</th>
                      <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider w-52">Etapa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {servicos.map(s => (
                      <tr key={s.item_id} className="border-b border-white/[0.04]">
                        <td className="px-4 py-2 text-white/80">
                          <span className="font-mono text-xs text-white/40 mr-2">{s.codigo}</span>{s.descricao}
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-white/60">{fmtQty(s.quantidade)} {s.unidade}</td>
                        <td className="px-4 py-2 text-right font-mono text-white/60">{fmtCurrency(s.total)}</td>
                        <td className="px-4 py-2">
                          <select
                            value={s.etapa_id && etapas.some(e => e.id === s.etapa_id) ? s.etapa_id : ''}
                            onChange={e => handleAssign(s.item_id, e.target.value)}
                            disabled={!sourceEditavel}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white/80 cursor-pointer focus:outline-none focus:border-white/30 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <option value="" className="bg-[#111]">— Sem etapa —</option>
                            {etapas.map(e => (
                              <option key={e.id} value={e.id} className="bg-[#111]">{e.ordem}. {e.nome}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}
        </div>
      )}

      {solic && (
        <GerarSolicitacaoModal
          obra_id={obra_id}
          obra_nome={obraName}
          contexto={solic.contexto}
          insumos={solic.insumos}
          dataNecessariaDefault={solic.data}
          destino={solic.destino}
          destinoLabel={solic.destinoLabel}
          onClose={() => setSolic(null)}
          onDone={() => setSolic(null)}
        />
      )}
    </div>
  )
}

// ── Linha expansível da visão "Por serviço" ──────────────────────────────────

function ServicoRow({
  servico, open, onToggle, onGerar, podeGerar,
}: {
  servico: ServicoExplodido
  open: boolean
  onToggle: () => void
  onGerar?: () => void
  podeGerar?: boolean
}) {
  return (
    <div className="bg-[#0d0d0d] border border-white/[0.08] rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3">
        <button
          onClick={onToggle}
          className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-90 transition-opacity text-left"
        >
          <span className="text-white/30 text-xs w-4">{open ? '▼' : '▶'}</span>
          <span className="font-mono text-xs text-white/40 w-20 shrink-0">{servico.codigo}</span>
          <span className="text-sm text-white/80 flex-1 truncate">{servico.descricao}</span>
          <span className="text-xs text-white/40 font-mono whitespace-nowrap">{fmtQty(servico.quantidade)} {servico.unidade}</span>
        </button>
        <span className="text-sm font-mono font-semibold text-green-400 w-28 text-right">{fmtCurrency(servico.total)}</span>
        {onGerar && servico.insumos.length > 0 && (
          <Btn
            onClick={onGerar}
            disabled={!podeGerar}
            title={podeGerar ? 'Gerar compra lançando no Custo Real deste serviço' : 'Espelhe o plano no Custo Real primeiro'}
          >
            Gerar compra
          </Btn>
        )}
      </div>
      {open && (
        servico.insumos.length > 0
          ? <div className="border-t border-white/[0.06]"><InsumoTable insumos={servico.insumos} /></div>
          : <div className="border-t border-white/[0.06] px-5 py-4 text-xs text-white/30">Este serviço não tem composição de insumos cadastrada.</div>
      )}
    </div>
  )
}
