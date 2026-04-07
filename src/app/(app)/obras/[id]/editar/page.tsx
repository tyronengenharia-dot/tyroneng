'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getObraById, updateObra, deleteObra } from '@/services/obraService'
import { Obra, ObraStatus } from '@/types'
import { LoadingSpinner } from '@/components/ui'
import { toast } from 'sonner'

const STATUS_OPTIONS: { value: ObraStatus; label: string }[] = [
  { value: 'andamento', label: 'Em andamento' },
  { value: 'concluida', label: 'Concluída' },
  { value: 'atrasada',  label: 'Atrasada' },
]

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-white/40 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  )
}

const inputCls =
  'w-full bg-white/[0.04] border border-white/[0.08] text-white text-sm rounded-xl px-4 py-2.5 placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-colors'

export default function EditarObraPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()

  const [obra, setObra] = useState<Obra | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // form state
  const [name, setName]           = useState('')
  const [client, setClient]       = useState('')
  const [location, setLocation]   = useState('')
  const [budget, setBudget]       = useState('')
  const [status, setStatus]       = useState<ObraStatus>('andamento')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate]     = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    getObraById(id).then(data => {
      if (!data) { router.replace('/obras'); return }
      setObra(data)
      setName(data.name)
      setClient(data.client)
      setLocation(data.location)
      setBudget(String(data.budget))
      setStatus(data.status)
      setStartDate(data.start_date?.slice(0, 10) ?? '')
      setEndDate(data.end_date?.slice(0, 10) ?? '')
      setDescription(data.description ?? '')
      setLoading(false)
    })
  }, [id, router])

  async function handleSave() {
    if (!name.trim()) { toast.error('Nome da obra é obrigatório'); return }

    setSaving(true)
    const updated = await updateObra(id, {
      name: name.trim(),
      client: client.trim(),
      location: location.trim(),
      budget: parseFloat(budget.replace(',', '.')) || 0,
      status,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      description: description.trim() || undefined,
    })

    setSaving(false)

    if (updated) {
      toast.success('Obra atualizada com sucesso')
      router.push(`/obras/${id}`)
    } else {
      toast.error('Erro ao salvar. Tente novamente.')
    }
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    const ok = await deleteObra(id)
    if (ok) {
      toast.success('Obra excluída')
      router.push('/obras')
    } else {
      toast.error('Erro ao excluir')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="text-xs text-white/30 hover:text-white/60 transition-colors mb-2 flex items-center gap-1"
          >
            ← Voltar
          </button>
          <h1 className="text-xl font-semibold text-white">Editar Obra</h1>
          <p className="text-sm text-white/30 mt-0.5 font-mono">#{id.slice(0, 8)}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-white text-black text-sm font-semibold rounded-xl hover:bg-white/90 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Salvando…' : 'Salvar alterações'}
        </button>
      </div>

      {/* Form */}
      <div className="bg-[#0d0d0d] border border-white/[0.08] rounded-2xl p-6 space-y-5">

        <Field label="Nome da Obra">
          <input
            className={inputCls}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ex: Obra de Pavimentação - Marapoã"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Cliente / Contratante">
            <input
              className={inputCls}
              value={client}
              onChange={e => setClient(e.target.value)}
              placeholder="Nome do cliente"
            />
          </Field>

          <Field label="Localização">
            <input
              className={inputCls}
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Cidade, Estado"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Orçamento (R$)">
            <input
              className={inputCls}
              type="number"
              value={budget}
              onChange={e => setBudget(e.target.value)}
              placeholder="0,00"
              min={0}
              step={0.01}
            />
          </Field>

          <Field label="Status">
            <select
              className={inputCls}
              value={status}
              onChange={e => setStatus(e.target.value as ObraStatus)}
            >
              {STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value} className="bg-[#111]">
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Data de Início">
            <input
              className={inputCls}
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </Field>

          <Field label="Prazo / Data de Término">
            <input
              className={inputCls}
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </Field>
        </div>

        <Field label="Descrição (opcional)">
          <textarea
            className={`${inputCls} resize-none`}
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Descreva o escopo, observações ou notas relevantes…"
          />
        </Field>
      </div>

      {/* Zona de perigo */}
      <div className="bg-[#0d0d0d] border border-red-500/10 rounded-2xl p-6">
        <p className="text-sm font-medium text-white/60 mb-1">Zona de perigo</p>
        <p className="text-xs text-white/30 mb-4">
          Excluir a obra remove permanentemente todos os dados associados (financeiro, medições, equipe, documentos etc).
        </p>
        <button
          onClick={handleDelete}
          className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
            confirmDelete
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
          }`}
        >
          {confirmDelete ? 'Confirmar exclusão' : 'Excluir obra'}
        </button>
        {confirmDelete && (
          <button
            onClick={() => setConfirmDelete(false)}
            className="ml-3 text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            Cancelar
          </button>
        )}
      </div>

    </div>
  )
}
