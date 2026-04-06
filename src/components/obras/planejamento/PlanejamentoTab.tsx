'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getEtapasByObra, createEtapa, updateEtapa, deleteEtapa } from '@/services/etapaService'
import { Etapa, EtapaStatus } from '@/types'
import { Badge, Btn, EmptyState, LoadingSpinner, Modal, Input, Select, KpiCard } from '@/components/ui'
import { fmtDate, cn } from '@/lib/utils'

type Props = { obra_id: string }

// ── Modal ─────────────────────────────────────────────────────────────────────

function EtapaModal({
  obra_id,
  initial,
  etapas,
  onClose,
  onSuccess,
}: {
  obra_id: string
  initial: Etapa | null
  etapas: Etapa[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nome:                 initial?.nome ?? '',
    data_inicio:          initial?.data_inicio ?? '',
    data_fim:             initial?.data_fim ?? '',
    percentual_fisico:    initial?.percentual_fisico?.toString() ?? '0',
    percentual_financeiro: initial?.percentual_financeiro?.toString() ?? '0',
    status:               initial?.status ?? 'planejada',
    predecessora_id:      initial?.predecessora_id ?? '',
    ordem:                initial?.ordem?.toString() ?? '1',
  })
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  async function handleSave() {
    if (!form.nome.trim() || !form.data_inicio || !form.data_fim) {
      toast.error('Preencha nome e datas')
      return
    }
    setSaving(true)
    const payload = {
      obra_id,
      nome: form.nome.trim(),
      data_inicio: form.data_inicio,
      data_fim: form.data_fim,
      duracao_dias: Math.ceil(
        (new Date(form.data_fim).getTime() - new Date(form.data_inicio).getTime()) / 86400000
      ),
      percentual_fisico: Number(form.percentual_fisico),
      percentual_financeiro: Number(form.percentual_financeiro),
      status: form.status as EtapaStatus,
      predecessora_id: form.predecessora_id || undefined,
      ordem: Number(form.ordem),
    }
    const ok = initial
      ? await updateEtapa(initial.id, payload)
      : await createEtapa(payload)

    setSaving(false)
    if (ok) { toast.success('Salvo!'); onSuccess(); onClose() }
    else toast.error('Erro ao salvar')
  }

  return (
    <Modal
      title={initial ? 'Editar etapa' : 'Nova etapa'}
      onClose={onClose}
      footer={
        <>
          <Btn onClick={onClose}>Cancelar</Btn>
          <Btn variant="primary" size="md" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Btn>
        </>
      }
    >
      <Input label="Nome da etapa" required placeholder="Ex: Fundação"
        value={form.nome} onChange={e => set('nome', e.target.value)} />

      <div className="grid grid-cols-2 gap-3">
        <Input label="Data início" required type="date"
          value={form.data_inicio} onChange={e => set('data_inicio', e.target.value)} />
        <Input label="Data fim" required type="date"
          value={form.data_fim} onChange={e => set('data_fim', e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="% Físico executado" type="number" min="0" max="100"
          value={form.percentual_fisico} onChange={e => set('percentual_fisico', e.target.value)} />
        <Input label="% Financeiro" type="number" min="0" max="100"
          value={form.percentual_financeiro} onChange={e => set('percentual_financeiro', e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Select label="Status" value={form.status} onChange={e => set('status', e.target.value)}
          options={[
            { value: 'planejada', label: 'Planejada' },
            { value: 'em_andamento', label: 'Em andamento' },
            { value: 'concluida', label: 'Concluída' },
            { value: 'atrasada', label: 'Atrasada' },
          ]} />
        <Input label="Ordem" type="number" min="1"
          value={form.ordem} onChange={e => set('ordem', e.target.value)} />
      </div>

      {etapas.length > 0 && (
        <Select label="Precedente" value={form.predecessora_id}
          onChange={e => set('predecessora_id', e.target.value)}
          options={[
            { value: '', label: '— Nenhuma —' },
            ...etapas
              .filter(e => e.id !== initial?.id)
              .map(e => ({ value: e.id, label: e.nome })),
          ]}
        />
      )}
    </Modal>
  )
}

// ── Gantt row ──────────────────────────────────────────────────────────────────

const GANTT_MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function getGanttPosition(startDate: string, endDate: string, minDate: Date, totalDays: number) {
  const start = new Date(startDate)
  const end   = new Date(endDate)
  const left  = Math.max(0, ((start.getTime() - minDate.getTime()) / 86400000 / totalDays) * 100)
  const width = Math.max(2, ((end.getTime() - start.getTime()) / 86400000 / totalDays) * 100)
  return { left: `${left}%`, width: `${Math.min(width, 100 - left)}%` }
}

const ganttBarColor: Record<EtapaStatus, string> = {
  concluida:    'bg-green-500/20 text-green-400 border border-green-500/30',
  em_andamento: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  planejada:    'bg-white/5 text-white/30 border border-white/10',
  atrasada:     'bg-red-500/20 text-red-400 border border-red-500/30',
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function PlanejamentoTab({ obra_id }: Props) {
  const [etapas, setEtapas]   = useState<Etapa[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState<'create' | Etapa | null>(null)

  async function load() {
    const data = await getEtapasByObra(obra_id)
    setEtapas(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [obra_id])

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta etapa?')) return
    await deleteEtapa(id)
    toast.success('Etapa removida')
    load()
  }

  if (loading) return <LoadingSpinner />

  const concluidas  = etapas.filter(e => e.status === 'concluida').length
  const emAndamento = etapas.filter(e => e.status === 'em_andamento').length
  const atrasadas   = etapas.filter(e => e.status === 'atrasada').length

  // Gantt date range
  const allDates = etapas.flatMap(e => [new Date(e.data_inicio), new Date(e.data_fim)])
  const minDate  = allDates.length > 0 ? new Date(Math.min(...allDates.map(d => d.getTime()))) : new Date()
  const maxDate  = allDates.length > 0 ? new Date(Math.max(...allDates.map(d => d.getTime()))) : new Date()
  const totalDays = Math.max(1, (maxDate.getTime() - minDate.getTime()) / 86400000)

  // Build month headers
  const monthHeaders: { label: string; width: string }[] = []
  if (etapas.length > 0) {
    const cur = new Date(minDate)
    cur.setDate(1)
    while (cur <= maxDate) {
      const mStart = cur.getTime()
      const mEnd   = new Date(cur.getFullYear(), cur.getMonth() + 1, 0).getTime()
      const mDays  = Math.min(mEnd, maxDate.getTime()) - Math.max(mStart, minDate.getTime())
      const pct    = (mDays / 86400000 / totalDays) * 100
      monthHeaders.push({ label: `${GANTT_MONTHS[cur.getMonth()]}/${cur.getFullYear().toString().slice(2)}`, width: `${pct}%` })
      cur.setMonth(cur.getMonth() + 1)
    }
  }

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="Total de Etapas" value={etapas.length} variant="neutral" />
        <KpiCard label="Concluídas" value={concluidas} variant="green" />
        <KpiCard label="Em andamento" value={emAndamento} variant="blue" />
        <KpiCard label="Atrasadas" value={atrasadas} variant="red" />
      </div>

      {/* Gantt */}
      <div className="bg-[#0d0d0d] border border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08]">
          <p className="text-sm font-medium text-white/60">Cronograma Físico</p>
          <Btn variant="primary" onClick={() => setModal('create')}>+ Etapa</Btn>
        </div>

        {etapas.length === 0 ? (
          <EmptyState message="Nenhuma etapa cadastrada. Clique em + Etapa para começar." />
        ) : (
          <div className="overflow-x-auto">
            <div style={{ minWidth: 800 }}>
              {/* Month headers */}
              <div className="flex border-b border-white/[0.08]">
                <div className="w-48 shrink-0 px-4 py-2 text-[10px] font-semibold text-white/30 uppercase tracking-wider border-r border-white/[0.08]">
                  Etapa
                </div>
                <div className="flex-1 flex">
                  {monthHeaders.map((m, i) => (
                    <div key={i} style={{ width: m.width }} className="px-2 py-2 text-[10px] font-semibold text-white/30 text-center border-r border-white/[0.05] last:border-0">
                      {m.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Rows */}
              {etapas.map((etapa, idx) => {
                const pos = getGanttPosition(etapa.data_inicio, etapa.data_fim, minDate, totalDays)
                return (
                  <div
                    key={etapa.id}
                    className={cn(
                      'flex items-center border-b border-white/[0.05] last:border-0 group',
                      idx % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.01]'
                    )}
                    style={{ height: 44 }}
                  >
                    {/* Label */}
                    <div className="w-48 shrink-0 px-4 flex items-center gap-2 border-r border-white/[0.08] h-full">
                      <span className="text-[11px] text-white/50 w-5 text-right font-mono">{etapa.ordem}.</span>
                      <span className="text-[12px] font-medium text-white/70 truncate flex-1">{etapa.nome}</span>
                    </div>

                    {/* Timeline */}
                    <div className="flex-1 relative px-1 h-full flex items-center">
                      <div className="absolute inset-x-1" style={{ ...pos }}>
                        <div className={cn(
                          'h-6 rounded flex items-center px-2 text-[10px] font-semibold truncate cursor-pointer',
                          ganttBarColor[etapa.status]
                        )}
                          onClick={() => setModal(etapa)}
                          title={`${etapa.nome}: ${fmtDate(etapa.data_inicio)} → ${fmtDate(etapa.data_fim)}`}
                        >
                          {etapa.percentual_fisico > 0 && `${etapa.percentual_fisico}%`}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="w-16 flex items-center justify-end pr-3 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setModal(etapa)} className="p-1 text-white/30 hover:text-white transition-colors text-xs">✎</button>
                      <button onClick={() => handleDelete(etapa.id)} className="p-1 text-red-400/50 hover:text-red-400 transition-colors text-xs">✕</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Legend */}
        {etapas.length > 0 && (
          <div className="flex gap-5 px-5 py-3 border-t border-white/[0.08]">
            {[
              { color: 'bg-green-500/40', label: 'Concluída' },
              { color: 'bg-blue-500/40',  label: 'Em andamento' },
              { color: 'bg-white/10',     label: 'Planejada' },
              { color: 'bg-red-500/40',   label: 'Atrasada' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className={cn('w-3 h-3 rounded', l.color)} />
                <span className="text-[11px] text-white/30">{l.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail table */}
      <div className="bg-[#0d0d0d] border border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/[0.08]">
          <p className="text-sm font-medium text-white/60">Detalhe das Etapas</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.08]">
              <th className="px-5 py-3 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider">#</th>
              <th className="px-5 py-3 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider">Etapa</th>
              <th className="px-5 py-3 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider">Início</th>
              <th className="px-5 py-3 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider">Fim</th>
              <th className="px-5 py-3 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider">Duração</th>
              <th className="px-5 py-3 text-right text-[10px] font-semibold text-white/30 uppercase tracking-wider">% Físico</th>
              <th className="px-5 py-3 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {etapas.map(etapa => (
              <tr key={etapa.id} className="border-t border-white/[0.05] hover:bg-white/[0.02] group">
                <td className="px-5 py-3 text-white/30 font-mono text-xs">{etapa.ordem}</td>
                <td className="px-5 py-3 font-medium text-white/80">{etapa.nome}</td>
                <td className="px-5 py-3 text-white/40 text-xs">{fmtDate(etapa.data_inicio)}</td>
                <td className="px-5 py-3 text-white/40 text-xs">{fmtDate(etapa.data_fim)}</td>
                <td className="px-5 py-3 text-white/40 text-xs font-mono">{etapa.duracao_dias}d</td>
                <td className="px-5 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 bg-white/5 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', etapa.status === 'concluida' ? 'bg-green-500' : 'bg-blue-500')}
                        style={{ width: `${etapa.percentual_fisico}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-white/40">{etapa.percentual_fisico}%</span>
                  </div>
                </td>
                <td className="px-5 py-3"><Badge value={etapa.status} /></td>
                <td className="px-5 py-3">
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                    <Btn onClick={() => setModal(etapa)}>Editar</Btn>
                    <Btn variant="danger" onClick={() => handleDelete(etapa.id)}>✕</Btn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <EtapaModal
          obra_id={obra_id}
          initial={modal === 'create' ? null : modal}
          etapas={etapas}
          onClose={() => setModal(null)}
          onSuccess={load}
        />
      )}
    </div>
  )
}
