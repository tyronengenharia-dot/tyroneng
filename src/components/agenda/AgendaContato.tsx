'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'

// ─── tipos ────────────────────────────────────────────────────────────────────

type Pessoa = { id: string; nome: string; contato: string }
type Local = { id: string; nome: string; endereco: string }
type Aba = 'pessoas' | 'locais'

// ─── helpers ─────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((n) => n[0]?.toUpperCase() ?? '').join('')
}

const AVATAR_COLORS = [
  'bg-blue-900/40 text-blue-300',
  'bg-teal-900/40 text-teal-300',
  'bg-purple-900/40 text-purple-300',
  'bg-rose-900/40 text-rose-300',
  'bg-amber-900/40 text-amber-300',
]

function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

function Avatar({ name }: { name: string }) {
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-medium flex-shrink-0 ${avatarColor(name)}`}>
      {initials(name)}
    </div>
  )
}

// ─── linha editável ───────────────────────────────────────────────────────────

function EditableRow({
  label,
  sub,
  onSave,
  onDelete,
  icon,
}: {
  label: string
  sub: string
  onSave: (label: string, sub: string) => Promise<void>
  onDelete: () => Promise<void>
  icon: 'person' | 'pin'
}) {
  const [editing, setEditing] = useState(false)
  const [labelVal, setLabelVal] = useState(label)
  const [subVal, setSubVal] = useState(sub)
  const [saving, setSaving] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  async function save() {
    if (!labelVal.trim() || !subVal.trim()) return
    setSaving(true)
    await onSave(labelVal.trim(), subVal.trim())
    setSaving(false)
    setEditing(false)
  }

  async function del() {
    if (!confirmDel) { setConfirmDel(true); return }
    await onDelete()
  }

  return (
    <div className="group flex items-center gap-3 px-4 py-3 hover:bg-white/3 rounded-xl transition">
      {icon === 'person' ? (
        <Avatar name={labelVal} />
      ) : (
        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="text-gray-400">
            <path d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6c0 3.5 4.5 8.5 4.5 8.5S12.5 9.5 12.5 6c0-2.5-2-4.5-4.5-4.5z" stroke="currentColor" strokeWidth="1.3"/>
            <circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.1"/>
          </svg>
        </div>
      )}

      {editing ? (
        <div className="flex-1 flex flex-col gap-1.5">
          <input
            ref={inputRef}
            value={labelVal}
            onChange={(e) => setLabelVal(e.target.value)}
            className="w-full bg-white/5 border border-white/15 rounded-lg px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-white/30"
          />
          <input
            value={subVal}
            onChange={(e) => setSubVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            className="w-full bg-white/5 border border-white/15 rounded-lg px-2.5 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-white/30"
          />
          <div className="flex gap-2 pt-0.5">
            <button
              onClick={save}
              disabled={saving || !labelVal.trim() || !subVal.trim()}
              className="text-xs px-3 py-1.5 rounded-lg bg-white text-black font-medium disabled:opacity-40 transition"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              onClick={() => { setEditing(false); setLabelVal(label); setSubVal(sub) }}
              className="text-xs px-3 py-1.5 rounded-lg text-gray-400 hover:text-white transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{label}</p>
            <p className="text-[11px] text-gray-500 truncate">{sub}</p>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
            <button
              onClick={() => { setEditing(true); setConfirmDel(false) }}
              className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition"
              title="Editar"
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M11.5 2.5l2 2-8 8H3.5v-2l8-8z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              onClick={del}
              className={`p-1.5 rounded-lg transition text-xs ${confirmDel ? 'bg-red-500/20 text-red-400' : 'hover:bg-white/10 text-gray-500 hover:text-red-400'}`}
              title={confirmDel ? 'Confirmar?' : 'Excluir'}
              onBlur={() => setConfirmDel(false)}
            >
              {confirmDel ? (
                <span className="px-1 font-medium">Confirmar?</span>
              ) : (
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                  <path d="M3 4h10M6 4V2.5h4V4M5 4l.5 9h5l.5-9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── formulário de novo item ──────────────────────────────────────────────────

function NovoForm({
  aba,
  onAdd,
}: {
  aba: Aba
  onAdd: (label: string, sub: string) => Promise<void>
}) {
  const [label, setLabel] = useState('')
  const [sub, setSub] = useState('')
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const labelPlaceholder = aba === 'pessoas' ? 'Nome da pessoa' : 'Nome do local'
  const subPlaceholder = aba === 'pessoas' ? '(00) 00000-0000' : 'Rua, número'
  const subLabel = aba === 'pessoas' ? 'telefone' : 'endereço'

  async function handleAdd() {
    if (!label.trim() || !sub.trim()) return
    setSaving(true)
    await onAdd(label.trim(), sub.trim())
    setLabel('')
    setSub('')
    setSaving(false)
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition border border-dashed border-white/10 hover:border-white/20"
      >
        <span className="text-base leading-none">+</span>
        Adicionar {aba === 'pessoas' ? 'pessoa' : 'local'}
      </button>
    )
  }

  return (
    <div className="border border-white/10 rounded-xl p-4 space-y-2.5 bg-white/2">
      <input
        autoFocus
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder={labelPlaceholder}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/30 transition"
      />
      <input
        value={sub}
        onChange={(e) => setSub(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        placeholder={subPlaceholder}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/30 transition"
      />
      {label.trim() && !sub.trim() && (
        <p className="text-[11px] text-amber-500/70">
          Preencha o {subLabel} para salvar
        </p>
      )}
      <div className="flex gap-2 pt-0.5">
        <button
          onClick={handleAdd}
          disabled={saving || !label.trim() || !sub.trim()}
          className="text-sm px-4 py-1.5 rounded-lg bg-white text-black font-medium disabled:opacity-40 transition"
        >
          {saving ? 'Salvando...' : 'Adicionar'}
        </button>
        <button
          onClick={() => { setOpen(false); setLabel(''); setSub('') }}
          className="text-sm px-3 py-1.5 rounded-lg text-gray-400 hover:text-white transition"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ─── painel principal ─────────────────────────────────────────────────────────

export function AgendaContatos({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [aba, setAba] = useState<Aba>('pessoas')
  const [pessoas, setPessoas] = useState<Pessoa[]>([])
  const [locais, setLocais] = useState<Local[]>([])
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    Promise.all([
      supabase.from('agenda_pessoas').select('*').eq('user_id', userId).order('nome'),
      supabase.from('agenda_locais').select('*').eq('user_id', userId).order('nome'),
    ]).then(([{ data: c }, { data: l }]) => {
      if (c) setPessoas(c)
      if (l) setLocais(l)
      setLoading(false)
    })
  }, [userId])

  // ── pessoas ──
  async function addPessoa(nome: string, contato: string) {
    const { data } = await supabase
      .from('agenda_pessoas')
      .insert({ user_id: userId, nome, contato })
      .select().single()
    if (data) setPessoas((prev) => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)))
  }

  async function updatePessoa(id: string, nome: string, contato: string) {
    await supabase.from('agenda_pessoas').update({ nome, contato }).eq('id', id)
    setPessoas((prev) => prev.map((c) => c.id === id ? { ...c, nome, contato } : c))
  }

  async function deletePessoa(id: string) {
    await supabase.from('agenda_pessoas').delete().eq('id', id)
    setPessoas((prev) => prev.filter((c) => c.id !== id))
  }

  // ── locais ──
  async function addLocal(nome: string, endereco: string) {
    const { data } = await supabase
      .from('agenda_locais')
      .insert({ user_id: userId, nome, endereco })
      .select().single()
    if (data) setLocais((prev) => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)))
  }

  async function updateLocal(id: string, nome: string, endereco: string) {
    await supabase.from('agenda_locais').update({ nome, endereco }).eq('id', id)
    setLocais((prev) => prev.map((l) => l.id === id ? { ...l, nome, endereco } : l))
  }

  async function deleteLocal(id: string) {
    await supabase.from('agenda_locais').delete().eq('id', id)
    setLocais((prev) => prev.filter((l) => l.id !== id))
  }

  const pessoasFiltradas = pessoas.filter((c) =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.contato.includes(busca)
  )

  const locaisFiltrados = locais.filter((l) =>
    l.nome.toLowerCase().includes(busca.toLowerCase()) ||
    l.endereco.toLowerCase().includes(busca.toLowerCase())
  )

  const lista = aba === 'pessoas' ? pessoasFiltradas : locaisFiltrados
  const total = aba === 'pessoas' ? pessoas.length : locais.length

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#0f0f0f] w-full max-w-lg rounded-2xl border border-white/10 overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="px-5 pt-5 pb-4 border-b border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-base">Gerenciar</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-white transition"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* abas */}
          <div className="flex gap-1 bg-white/5 rounded-xl p-1">
            {(['pessoas', 'locais'] as Aba[]).map((a) => (
              <button
                key={a}
                onClick={() => { setAba(a); setBusca('') }}
                className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition capitalize ${
                  aba === a
                    ? 'bg-white text-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {a === 'pessoas' ? 'Pessoas' : 'Locais'}
                <span className={`ml-1.5 text-xs ${aba === a ? 'text-gray-500' : 'text-gray-600'}`}>
                  {a === 'pessoas' ? pessoas.length : locais.length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* busca */}
        <div className="px-5 py-3 border-b border-white/5">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" width="13" height="13" viewBox="0 0 16 16" fill="none">
              <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M10.5 10.5l3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder={aba === 'pessoas' ? 'Buscar pessoa...' : 'Buscar local...'}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/30 transition"
            />
          </div>
        </div>

        {/* lista */}
        <div className="overflow-y-auto flex-1 px-5 py-3 space-y-1">
          {loading ? (
            <div className="text-center text-gray-600 text-sm py-8">Carregando...</div>
          ) : lista.length === 0 ? (
            <div className="text-center text-gray-600 text-sm py-8">
              {busca ? 'Nenhum resultado' : `Nenhuma ${aba === 'pessoas' ? 'pessoa' : 'local'} cadastrado`}
            </div>
          ) : aba === 'pessoas' ? (
            (lista as Pessoa[]).map((c) => (
              <EditableRow
                key={c.id}
                label={c.nome}
                sub={c.contato}
                icon="person"
                onSave={(nome, contato) => updatePessoa(c.id, nome, contato)}
                onDelete={() => deletePessoa(c.id)}
              />
            ))
          ) : (
            (lista as Local[]).map((l) => (
              <EditableRow
                key={l.id}
                label={l.nome}
                sub={l.endereco}
                icon="pin"
                onSave={(nome, endereco) => updateLocal(l.id, nome, endereco)}
                onDelete={() => deleteLocal(l.id)}
              />
            ))
          )}
        </div>

        {/* novo item */}
        <div className="px-5 pb-5 pt-2 border-t border-white/5">
          <NovoForm
            aba={aba}
            onAdd={aba === 'pessoas'
              ? (nome, contato) => addPessoa(nome, contato)
              : (nome, endereco) => addLocal(nome, endereco)
            }
          />
        </div>
      </div>
    </div>
  )
}