'use client'

import { useEffect, useState, useRef } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { createEvento, updateEvento, deleteEvento } from '@/services/agenda'
import { supabase } from '@/lib/supabaseClient'

// ─── tipos ────────────────────────────────────────────────────────────────────

type ChecklistItem = { id: string; text: string; done: boolean }

type FormState = {
  titulo: string
  tipo: string
  status: 'pendente' | 'confirmado' | 'concluido' | 'cancelado'
  prioridade: 'baixa' | 'media' | 'alta'
  data: string
  horaInicio: string
  horaFim: string
  local: string
  endereco: string
  responsavel: string
  temEquipe: boolean
  equipe: string
  temCliente: boolean
  clienteNome: string
  clienteContato: string
  checklist: ChecklistItem[]
  observacoes: string
}

const INITIAL_FORM: FormState = {
  titulo: '',
  tipo: 'Reunião',
  status: 'pendente',
  prioridade: 'media',
  data: '',
  horaInicio: '',
  horaFim: '',
  local: '',
  endereco: '',
  responsavel: '',
  temEquipe: false,
  equipe: '',
  temCliente: false,
  clienteNome: '',
  clienteContato: '',
  checklist: [],
  observacoes: '',
}

const TIPOS_PADRAO = ['Reunião', 'Vistoria', 'Entrega', 'Ligação', 'Visita']

// ─── select de tipo com opção "Outro" ────────────────────────────────────────

function TipoSelect({
  value,
  onChange,
  userId,
}: {
  value: string
  onChange: (v: string) => void
  userId: string
}) {
  const [tiposExtras, setTiposExtras] = useState<string[]>([])
  const [novoTipo, setNovoTipo] = useState('')
  const [salvando, setSalvando] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // todos os tipos disponíveis
  const allTipos = [...TIPOS_PADRAO, ...tiposExtras]
  const isOutro = !allTipos.includes(value) && value !== '' && value !== 'outro'
  const showInput = value === 'outro' || isOutro

  // carregar tipos extras do Supabase
  useEffect(() => {
    if (!userId) return
    supabase
      .from('agenda_tipos')
      .select('nome')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setTiposExtras(data.map((d: any) => d.nome))
      })
  }, [userId])

  // focar input quando "Outro" for selecionado
  useEffect(() => {
    if (showInput) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [showInput])

  async function salvarNovoTipo() {
    const nome = novoTipo.trim()
    if (!nome || allTipos.includes(nome)) {
      if (allTipos.includes(nome)) onChange(nome)
      return
    }

    setSalvando(true)
    try {
      await supabase.from('agenda_tipos').insert({ user_id: userId, nome })
      setTiposExtras((prev) => [...prev, nome])
      onChange(nome)
      setNovoTipo('')
    } catch (err) {
      console.error(err)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <select
        value={allTipos.includes(value) ? value : 'outro'}
        onChange={(e) => {
          if (e.target.value === 'outro') {
            onChange('outro')
            setNovoTipo('')
          } else {
            onChange(e.target.value)
          }
        }}
        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30 transition"
      >
        {allTipos.map((t) => (
          <option key={t} value={t} className="bg-[#111]">
            {t}
          </option>
        ))}
        <option value="outro" className="bg-[#111]">
          + Outro
        </option>
      </select>

      {showInput && (
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={novoTipo}
            onChange={(e) => setNovoTipo(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), salvarNovoTipo())}
            placeholder="Nome do novo tipo..."
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 border-dashed transition"
          />
          <button
            type="button"
            onClick={salvarNovoTipo}
            disabled={salvando || !novoTipo.trim()}
            className="px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm hover:bg-emerald-500/30 disabled:opacity-40 transition"
          >
            {salvando ? '...' : 'Salvar'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── helpers visuais ──────────────────────────────────────────────────────────

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('')
}

const AVATAR_COLORS = [
  'bg-blue-900/40 text-blue-300',
  'bg-teal-900/40 text-teal-300',
  'bg-purple-900/40 text-purple-300',
  'bg-rose-900/40 text-rose-300',
  'bg-amber-900/40 text-amber-300',
]

function avatarColor(name: string) {
  const code = name.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[code]
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-8 h-8 text-[11px]'
  return (
    <div
      className={`${dim} ${avatarColor(name)} rounded-full flex items-center justify-center font-medium flex-shrink-0`}
    >
      {initials(name)}
    </div>
  )
}

function Badge({
  label,
  variant,
}: {
  label: string
  variant: 'blue' | 'green' | 'red' | 'yellow' | 'gray'
}) {
  const styles = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    gray: 'bg-white/5 text-gray-400 border-white/10',
  }
  return (
    <span
      className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${styles[variant]}`}
    >
      {label}
    </span>
  )
}

function statusVariant(s: string): 'green' | 'blue' | 'gray' | 'red' | 'yellow' {
  if (s === 'confirmado') return 'green'
  if (s === 'concluido') return 'blue'
  if (s === 'cancelado') return 'red'
  return 'yellow'
}

function prioVariant(p: string): 'red' | 'yellow' | 'gray' {
  if (p === 'alta') return 'red'
  if (p === 'media') return 'yellow'
  return 'gray'
}

function prioLabel(p: string) {
  if (p === 'alta') return 'Alta prioridade'
  if (p === 'media') return 'Média prioridade'
  return 'Baixa prioridade'
}

// ─── sub-componentes do formulário ────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-3">
      {children}
    </p>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] text-gray-500">{label}</span>
      {children}
    </div>
  )
}

function Input({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/30 transition ${className ?? ''}`}
    />
  )
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30 transition"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-[#111]">
          {o.label}
        </option>
      ))}
    </select>
  )
}

function Toggle({
  value,
  onChange,
  label,
}: {
  value: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-8 h-[18px] rounded-full transition-colors ${
          value ? 'bg-emerald-500' : 'bg-white/10'
        }`}
      >
        <span
          className={`absolute top-[3px] w-3 h-3 rounded-full bg-white transition-all ${
            value ? 'left-[17px]' : 'left-[3px]'
          }`}
        />
      </button>
      <span className="text-[13px] font-medium text-gray-300">{label}</span>
    </div>
  )
}

// ─── checklist ────────────────────────────────────────────────────────────────

function ChecklistEditor({
  items,
  onChange,
}: {
  items: ChecklistItem[]
  onChange: (items: ChecklistItem[]) => void
}) {
  const [newText, setNewText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function add() {
    const text = newText.trim()
    if (!text) return
    onChange([...items, { id: crypto.randomUUID(), text, done: false }])
    setNewText('')
    inputRef.current?.focus()
  }

  function toggle(id: string) {
    onChange(items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)))
  }

  function remove(id: string) {
    onChange(items.filter((i) => i.id !== id))
  }

  const done = items.filter((i) => i.done).length
  const pct = items.length ? Math.round((done / items.length) * 100) : 0

  return (
    <div>
      <ul className="space-y-1.5 mb-3">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-2.5 group">
            <button
              type="button"
              onClick={() => toggle(item.id)}
              className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border transition ${
                item.done
                  ? 'bg-emerald-500 border-emerald-500'
                  : 'border-white/20 bg-white/5'
              }`}
            >
              {item.done && (
                <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                  <path
                    d="M1 3.5l2.5 2.5 5-5"
                    stroke="white"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
            <span
              className={`text-sm flex-1 ${
                item.done ? 'line-through text-gray-600' : 'text-gray-200'
              }`}
            >
              {item.text}
            </span>
            <button
              type="button"
              onClick={() => remove(item.id)}
              className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition text-xs"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      {items.length > 0 && (
        <div className="mb-3">
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-gray-600 mt-1">
            <span>{done} de {items.length} itens</span>
            <span>{pct}%</span>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder="Adicionar item..."
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/30 transition"
        />
        <button
          type="button"
          onClick={add}
          className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-sm text-gray-300 transition"
        >
          + Add
        </button>
      </div>
    </div>
  )
}

// ─── modal principal ──────────────────────────────────────────────────────────

export function AgendaModal({
  userId,
  onClose,
  onSaved,
  onDeleted,
  initialData,
}: any) {
  const isEdit = !!initialData?.id
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // ── popular form no modo edição ──
  useEffect(() => {
    if (!initialData) return

    const dataObj = initialData.data ? new Date(initialData.data) : null

    setForm({
      titulo: initialData.titulo || initialData.title || '',
      tipo: initialData.tipo || 'Reunião',
      status: initialData.status || 'pendente',
      prioridade: initialData.prioridade || 'media',
      data: dataObj ? dataObj.toISOString().split('T')[0] : '',
      horaInicio: dataObj ? dataObj.toTimeString().slice(0, 5) : initialData.time || '',
      horaFim: initialData.hora_fim || '',
      local: initialData.local || '',
      endereco: initialData.endereco || '',
      responsavel: initialData.responsavel || '',
      temEquipe: !!initialData.equipe,
      equipe: initialData.equipe || '',
      temCliente: !!initialData.cliente_nome,
      clienteNome: initialData.cliente_nome || '',
      clienteContato: initialData.cliente_contato || '',
      checklist: initialData.checklist
        ? typeof initialData.checklist === 'string'
          ? JSON.parse(initialData.checklist)
          : initialData.checklist
        : [],
      observacoes: initialData.observacoes || '',
    })
  }, [initialData])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  // ── salvar ──
  async function handleSave() {
    if (!form.titulo.trim()) return
    setSaving(true)
    try {
      const dataCompleta = form.data
        ? new Date(`${form.data}T${form.horaInicio || '00:00'}`)
        : new Date()

      const payload: any = {
        titulo: form.titulo,
        tipo: form.tipo,
        status: form.status,
        prioridade: form.prioridade,
        data: dataCompleta,
        hora_fim: form.horaFim,
        local: form.local,
        endereco: form.endereco,
        responsavel: form.responsavel,
        equipe: form.temEquipe ? form.equipe : null,
        cliente_nome: form.temCliente ? form.clienteNome : null,
        cliente_contato: form.temCliente ? form.clienteContato : null,
        checklist: form.checklist,
        observacoes: form.observacoes,
      }

      let result
      if (isEdit) {
        const res = await updateEvento(initialData.id, payload)
        result = res?.[0] || { ...initialData, ...payload }
      } else {
        result = await createEvento({ ...payload, user_id: userId })
      }

      if (onSaved) onSaved(result)
      onClose()
    } catch (err: any) {
      console.error(err)
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  // ── excluir ──
  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    try {
      await deleteEvento(initialData.id)
      if (onDeleted) onDeleted(initialData.id)
      onClose()
    } catch (err: any) {
      console.error(err)
      alert(err.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#0f0f0f] w-full max-w-xl rounded-2xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── header ── */}
        <div className="px-6 pt-5 pb-4 border-b border-white/5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <textarea
              ref={textareaRef}
              value={form.titulo}
              onChange={(e) => {
                set('titulo', e.target.value)
                const el = textareaRef.current
                if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px' }
              }}
              placeholder="Título do compromisso..."
              rows={1}
              className="flex-1 bg-transparent text-white text-lg font-semibold resize-none overflow-hidden focus:outline-none placeholder-gray-700 leading-snug"
            />
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-white transition flex-shrink-0 mt-0.5"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* badges */}
          <div className="flex flex-wrap gap-1.5">
            <Badge label={form.tipo} variant="blue" />
            <Badge label={form.status} variant={statusVariant(form.status)} />
            <Badge label={prioLabel(form.prioridade)} variant={prioVariant(form.prioridade)} />
            {form.data && (
              <Badge
                label={`${form.data.split('-').reverse().join('/')} ${form.horaInicio}${form.horaFim ? '–' + form.horaFim : ''}`}
                variant="gray"
              />
            )}
          </div>
        </div>

        {/* ── body scrollável ── */}
        <div className="overflow-y-auto flex-1 divide-y divide-white/5">

          {/* identidade */}
          <div className="px-6 py-4">
            <SectionLabel>Identificação</SectionLabel>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tipo">
                <TipoSelect
                  value={form.tipo}
                  onChange={(v) => set('tipo', v)}
                  userId={userId}
                />
              </Field>
              <Field label="Status">
                <Select
                  value={form.status}
                  onChange={(v) => set('status', v as FormState['status'])}
                  options={[
                    { value: 'pendente', label: 'Pendente' },
                    { value: 'confirmado', label: 'Confirmado' },
                    { value: 'concluido', label: 'Concluído' },
                    { value: 'cancelado', label: 'Cancelado' },
                  ]}
                />
              </Field>
              <Field label="Prioridade">
                <Select
                  value={form.prioridade}
                  onChange={(v) => set('prioridade', v as FormState['prioridade'])}
                  options={[
                    { value: 'baixa', label: 'Baixa' },
                    { value: 'media', label: 'Média' },
                    { value: 'alta', label: 'Alta' },
                  ]}
                />
              </Field>
            </div>
          </div>

          {/* data e hora */}
          <div className="px-6 py-4">
            <SectionLabel>Data & Horário</SectionLabel>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Data">
                <DatePicker
                  selected={form.data ? new Date(`${form.data}T12:00`) : null}
                  onChange={(d: Date) => set('data', d.toISOString().split('T')[0])}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="dd/mm/aaaa"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/30"
                />
              </Field>
              <Field label="Início">
                <input
                  type="time"
                  value={form.horaInicio}
                  onChange={(e) => set('horaInicio', e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30 transition"
                />
              </Field>
              <Field label="Fim">
                <input
                  type="time"
                  value={form.horaFim}
                  onChange={(e) => set('horaFim', e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30 transition"
                />
              </Field>
            </div>
          </div>

          {/* local */}
          <div className="px-6 py-4">
            <SectionLabel>Localização</SectionLabel>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Local">
                <Input value={form.local} onChange={(v) => set('local', v)} placeholder="Ex: Escritório central" />
              </Field>
              <Field label="Endereço">
                <Input value={form.endereco} onChange={(v) => set('endereco', v)} placeholder="Rua, número" />
              </Field>
            </div>
          </div>

          {/* responsável */}
          <div className="px-6 py-4">
            <SectionLabel>Responsável</SectionLabel>
            <div className="flex items-center gap-3">
              {form.responsavel && <Avatar name={form.responsavel} />}
              <Input
                value={form.responsavel}
                onChange={(v) => set('responsavel', v)}
                placeholder="Nome do responsável"
                className="flex-1"
              />
            </div>
          </div>

          {/* equipe */}
          <div className="px-6 py-4">
            <Toggle value={form.temEquipe} onChange={(v) => set('temEquipe', v)} label="Equipe" />
            {form.temEquipe && (
              <div>
                <Input
                  value={form.equipe}
                  onChange={(v) => set('equipe', v)}
                  placeholder="Nomes separados por vírgula: Carlos, Pedro"
                  className="w-full mb-3"
                />
                {form.equipe && (
                  <div className="flex flex-wrap gap-2">
                    {form.equipe.split(',').map((n) => n.trim()).filter(Boolean).map((name) => (
                      <div
                        key={name}
                        className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full pl-1 pr-3 py-0.5"
                      >
                        <Avatar name={name} size="sm" />
                        <span className="text-xs text-gray-300">{name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* cliente */}
          <div className="px-6 py-4">
            <Toggle value={form.temCliente} onChange={(v) => set('temCliente', v)} label="Cliente" />
            {form.temCliente && (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  {form.clienteNome && <Avatar name={form.clienteNome} />}
                  <Input
                    value={form.clienteNome}
                    onChange={(v) => set('clienteNome', v)}
                    placeholder="Nome do cliente"
                    className="flex-1"
                  />
                </div>
                <Input
                  value={form.clienteContato}
                  onChange={(v) => set('clienteContato', v)}
                  placeholder="(00) 00000-0000"
                />
              </div>
            )}
          </div>

          {/* checklist */}
          <div className="px-6 py-4">
            <SectionLabel>Checklist</SectionLabel>
            <ChecklistEditor
              items={form.checklist}
              onChange={(items) => set('checklist', items)}
            />
          </div>

          {/* observações */}
          <div className="px-6 py-4">
            <SectionLabel>Observações</SectionLabel>
            <textarea
              value={form.observacoes}
              onChange={(e) => set('observacoes', e.target.value)}
              placeholder="Anotações adicionais..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-white/30 transition resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* ── footer ── */}
        <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between bg-black/30">
          {isEdit ? (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className={`text-sm px-3 py-2 rounded-xl transition ${
                confirmDelete
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'text-red-400/70 hover:text-red-400 hover:bg-red-500/10'
              }`}
            >
              {deleting ? 'Excluindo...' : confirmDelete ? 'Confirmar exclusão' : 'Excluir'}
            </button>
          ) : (
            <span />
          )}

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-sm px-4 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.titulo.trim()}
              className="text-sm px-5 py-2 rounded-xl bg-white text-black font-medium hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}