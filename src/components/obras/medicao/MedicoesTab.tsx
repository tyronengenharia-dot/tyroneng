'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getMedicoesByObra, createMedicao, updateMedicao, deleteMedicao } from '@/services/medicaoService'
import { Medicao, MedicaoStatus } from '@/types'
import { Badge, Btn, EmptyState, LoadingSpinner, Modal, Input, Select, ProgressBar } from '@/components/ui'
import { fmt, fmtDate, fmtCurrency } from '@/lib/utils'

type Props = { obra_id: string; budget: number }

// ── Modal ─────────────────────────────────────────────────────────────────────

function MedicaoModal({
  obra_id,
  initial,
  numero,
  onClose,
  onSuccess,
}: {
  obra_id: string
  initial: Medicao | null
  numero: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    numero:      initial?.numero ?? numero,
    description: initial?.description ?? '',
    periodo:     initial?.periodo ?? '',
    percentage:  initial?.percentage?.toString() ?? '',
    value:       initial?.value?.toString() ?? '',
    date:        initial?.date ?? new Date().toISOString().slice(0, 10),
    status:      initial?.status ?? 'em_analise',
  })
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  async function handleSave() {
    if (!form.description.trim() || !form.value || !form.percentage) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }
    setSaving(true)
    const payload = {
      obra_id,
      numero: form.numero,
      description: form.description.trim(),
      periodo: form.periodo,
      percentage: Number(form.percentage),
      value: parseFloat(form.value),
      date: form.date,
      status: form.status as MedicaoStatus,
    }
    const ok = initial
      ? await updateMedicao(initial.id, payload)
      : await createMedicao(payload)

    setSaving(false)
    if (ok) { toast.success('Medição salva!'); onSuccess(); onClose() }
    else toast.error('Erro ao salvar')
  }

  return (
    <Modal
      title={initial ? 'Editar medição' : 'Nova medição'}
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
      <div className="grid grid-cols-2 gap-3">
        <Input label="Nº Boletim" value={form.numero} onChange={e => set('numero', e.target.value)} />
        <Input label="Período" placeholder="Ex: jan/2026" value={form.periodo} onChange={e => set('periodo', e.target.value)} />
      </div>

      <Input label="Descrição / Etapas medidas" required placeholder="Ex: Fundação + Estrutura 50%"
        value={form.description} onChange={e => set('description', e.target.value)} />

      <div className="grid grid-cols-2 gap-3">
        <Input label="% Executado" required type="number" min="0" max="100" placeholder="0"
          value={form.percentage} onChange={e => set('percentage', e.target.value)} />
        <Input label="Valor medido (R$)" required type="number" placeholder="0,00"
          value={form.value} onChange={e => set('value', e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="Data" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
        <Select label="Status" value={form.status} onChange={e => set('status', e.target.value)}
          options={[
            { value: 'em_analise', label: 'Em análise' },
            { value: 'aprovado',   label: 'Aprovado' },
            { value: 'pendente',   label: 'Pendente' },
            { value: 'rejeitado',  label: 'Rejeitado' },
          ]} />
      </div>
    </Modal>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function MedicoesTab({ obra_id, budget }: Props) {
  const [data, setData]       = useState<Medicao[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState<'create' | Medicao | null>(null)

  async function load() {
    const result = await getMedicoesByObra(obra_id)
    setData(result)
    setLoading(false)
  }

  useEffect(() => { load() }, [obra_id])

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta medição?')) return
    await deleteMedicao(id)
    toast.success('Medição removida')
    load()
  }

  if (loading) return <LoadingSpinner />

  const totalMedido = data.reduce((a, m) => a + m.value, 0)
  const pctMedicao  = budget > 0 ? (totalMedido / budget) * 100 : 0
  const aReceber    = budget - totalMedido
  const nextNum     = `#BM-${String(data.length + 1).padStart(3, '0')}`

  return (
    <div className="space-y-4">
      {/* Progress resumo */}
      <div className="bg-[#0d0d0d] border border-white/[0.08] rounded-2xl p-5">
        <div className="flex items-baseline justify-between mb-3">
          <p className="text-sm font-medium text-white/60">Progresso de Medições</p>
          <span className="text-3xl font-semibold text-green-400">{pctMedicao.toFixed(1)}%</span>
        </div>
        <ProgressBar value={pctMedicao} color={pctMedicao >= 80 ? 'green' : pctMedicao >= 40 ? 'blue' : 'amber'} className="h-2 mb-4" />
        <div className="grid grid-cols-4 gap-4 pt-4 border-t border-white/[0.06]">
          <div>
            <p className="text-[11px] text-white/30 mb-1">Total contratado</p>
            <p className="text-sm font-semibold font-mono text-white">{fmtCurrency(budget)}</p>
          </div>
          <div>
            <p className="text-[11px] text-white/30 mb-1">Total medido</p>
            <p className="text-sm font-semibold font-mono text-green-400">{fmtCurrency(totalMedido)}</p>
          </div>
          <div>
            <p className="text-[11px] text-white/30 mb-1">A medir</p>
            <p className="text-sm font-semibold font-mono text-amber-400">{fmtCurrency(aReceber)}</p>
          </div>
          <div>
            <p className="text-[11px] text-white/30 mb-1">Boletins emitidos</p>
            <p className="text-sm font-semibold text-white">{data.length}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0d0d0d] border border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08]">
          <p className="text-sm font-medium text-white/60">Boletins de Medição</p>
          <Btn variant="primary" onClick={() => setModal('create')}>+ Medição</Btn>
        </div>

        {data.length === 0 ? (
          <EmptyState message="Nenhuma medição registrada" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.08]">
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider">Boletim</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider">Período</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider">Descrição</th>
                <th className="px-5 py-3 text-right text-[10px] font-semibold text-white/30 uppercase tracking-wider">% Exec.</th>
                <th className="px-5 py-3 text-right text-[10px] font-semibold text-white/30 uppercase tracking-wider">Valor</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider">Data</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {data.map(m => (
                <tr key={m.id} className="border-t border-white/[0.05] hover:bg-white/[0.02] group">
                  <td className="px-5 py-3.5 font-mono font-semibold text-white/80 text-xs">{m.numero}</td>
                  <td className="px-5 py-3.5 text-white/40 text-xs">{m.periodo || '—'}</td>
                  <td className="px-5 py-3.5 text-white/70">{m.description}</td>
                  <td className="px-5 py-3.5 text-right font-mono text-xs text-white/60">{m.percentage}%</td>
                  <td className="px-5 py-3.5 text-right font-mono text-green-400">R$ {fmt(m.value)}</td>
                  <td className="px-5 py-3.5"><Badge value={m.status} /></td>
                  <td className="px-5 py-3.5 text-white/40 text-xs">{fmtDate(m.date)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                      <Btn onClick={() => setModal(m)}>Editar</Btn>
                      <Btn variant="danger" onClick={() => handleDelete(m.id)}>✕</Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <MedicaoModal
          obra_id={obra_id}
          initial={modal === 'create' ? null : modal}
          numero={nextNum}
          onClose={() => setModal(null)}
          onSuccess={load}
        />
      )}
    </div>
  )
}
