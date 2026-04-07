'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createObra } from '@/services/obraService'
import { ObraStatus } from '@/types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ── Input components inline para não depender do ui/index ─────────────────────

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-white/40 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )
}

const inputCls =
  'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white ' +
  'placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors'

// ── Status option ─────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: ObraStatus; label: string; color: string }[] = [
  { value: 'andamento', label: 'Em andamento', color: 'border-blue-500/40 bg-blue-500/10 text-blue-400' },
  { value: 'concluida', label: 'Concluída',    color: 'border-green-500/40 bg-green-500/10 text-green-400' },
  { value: 'atrasada',  label: 'Atrasada',     color: 'border-red-500/40 bg-red-500/10 text-red-400' },
]

// ── Form state & validation ───────────────────────────────────────────────────

type FormState = {
  name:        string
  client:      string
  location:    string
  budget:      string
  status:      ObraStatus
  start_date:  string
  end_date:    string
  description: string
}

type Errors = Partial<Record<keyof FormState, string>>

function validate(form: FormState): Errors {
  const e: Errors = {}
  if (!form.name.trim())       e.name       = 'Informe o nome da obra'
  if (!form.client.trim())     e.client     = 'Informe o cliente'
  if (!form.location.trim())   e.location   = 'Informe o local'
  if (!form.budget || isNaN(Number(form.budget)) || Number(form.budget) <= 0)
    e.budget = 'Informe um orçamento válido'
  if (!form.start_date)        e.start_date = 'Informe a data de início'
  if (form.end_date && form.start_date && form.end_date < form.start_date)
    e.end_date = 'Data de término deve ser após o início'
  return e
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function NovaObraPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Errors>({})

  const [form, setForm] = useState<FormState>({
    name:        '',
    client:      '',
    location:    '',
    budget:      '',
    status:      'andamento',
    start_date:  '',
    end_date:    '',
    description: '',
  })

  function set(k: keyof FormState, v: string) {
    setForm(prev => ({ ...prev, [k]: v }))
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: undefined }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      toast.error('Corrija os campos destacados')
      return
    }

    setSaving(true)
    const nova = await createObra({
      name:        form.name.trim(),
      client:      form.client.trim(),
      location:    form.location.trim(),
      budget:      parseFloat(form.budget),
      status:      form.status,
      start_date:  form.start_date,
      end_date:    form.end_date || undefined,
      description: form.description.trim(),
    })
    setSaving(false)

    if (!nova) {
      toast.error('Erro ao criar obra. Verifique o Supabase.')
      return
    }

    toast.success('Obra criada com sucesso!')
    router.push(`/obras/${nova.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-white/30 mb-6">
        <Link href="/obras" className="hover:text-white/60 transition-colors">Obras</Link>
        <span>/</span>
        <span className="text-white/60">Nova Obra</span>
      </div>

      {/* Title */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Nova Obra</h1>
        <p className="text-sm text-white/30 mt-1">Preencha os dados básicos para cadastrar a obra</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Bloco 1 — Identificação */}
        <div className="bg-[#0d0d0d] border border-white/[0.08] rounded-2xl p-6 space-y-4">
          <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-4">Identificação</p>

          <Field label="Nome da obra" required error={errors.name}>
            <input
              className={cn(inputCls, errors.name && 'border-red-500/50')}
              placeholder="Ex: Construção Escola Municipal Centro"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              autoFocus
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Cliente / Contratante" required error={errors.client}>
              <input
                className={cn(inputCls, errors.client && 'border-red-500/50')}
                placeholder="Ex: Prefeitura do Rio"
                value={form.client}
                onChange={e => set('client', e.target.value)}
              />
            </Field>

            <Field label="Local / Município" required error={errors.location}>
              <input
                className={cn(inputCls, errors.location && 'border-red-500/50')}
                placeholder="Ex: Rio de Janeiro, RJ"
                value={form.location}
                onChange={e => set('location', e.target.value)}
              />
            </Field>
          </div>

          <Field label="Descrição / Observações">
            <textarea
              className={cn(inputCls, 'resize-none h-20')}
              placeholder="Detalhes adicionais sobre a obra..."
              value={form.description}
              onChange={e => set('description', e.target.value)}
            />
          </Field>
        </div>

        {/* Bloco 2 — Financeiro */}
        <div className="bg-[#0d0d0d] border border-white/[0.08] rounded-2xl p-6 space-y-4">
          <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-4">Financeiro</p>

          <Field label="Orçamento contratado (R$)" required error={errors.budget}>
            <input
              type="number"
              min="0"
              step="0.01"
              className={cn(inputCls, errors.budget && 'border-red-500/50')}
              placeholder="0,00"
              value={form.budget}
              onChange={e => set('budget', e.target.value)}
            />
          </Field>
        </div>

        {/* Bloco 3 — Datas */}
        <div className="bg-[#0d0d0d] border border-white/[0.08] rounded-2xl p-6 space-y-4">
          <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-4">Cronograma</p>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Data de início" required error={errors.start_date}>
              <input
                type="date"
                className={cn(inputCls, errors.start_date && 'border-red-500/50')}
                value={form.start_date}
                onChange={e => set('start_date', e.target.value)}
              />
            </Field>

            <Field label="Prazo / Data de entrega" error={errors.end_date}>
              <input
                type="date"
                className={cn(inputCls, errors.end_date && 'border-red-500/50')}
                value={form.end_date}
                onChange={e => set('end_date', e.target.value)}
              />
            </Field>
          </div>
        </div>

        {/* Bloco 4 — Status */}
        <div className="bg-[#0d0d0d] border border-white/[0.08] rounded-2xl p-6">
          <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-4">Status inicial</p>
          <div className="grid grid-cols-3 gap-3">
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => set('status', opt.value)}
                className={cn(
                  'flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all',
                  form.status === opt.value
                    ? opt.color
                    : 'border-white/[0.08] bg-white/[0.02] text-white/40 hover:border-white/20 hover:text-white/60'
                )}
              >
                <span className={cn(
                  'w-2 h-2 rounded-full',
                  form.status === opt.value ? 'bg-current' : 'bg-white/20'
                )} />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-2">
          <Link
            href="/obras"
            className="px-5 py-2.5 text-sm font-medium text-white/40 hover:text-white/70 border border-white/10 rounded-xl hover:bg-white/5 transition-colors"
          >
            Cancelar
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-white text-black text-sm font-semibold rounded-xl hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                Criando obra...
              </>
            ) : (
              'Criar Obra →'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
