'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getMembrosByObra, createMembro, updateMembro, deleteMembro } from '@/services/equipeService'
import { Membro } from '@/types'
import { Btn, EmptyState, LoadingSpinner, Modal, Input, Select } from '@/components/ui'
import { initials, cn } from '@/lib/utils'

type Props = { obra_id: string }

// ── Avatar colors ─────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'bg-blue-500/20 text-blue-400',
  'bg-green-500/20 text-green-400',
  'bg-amber-500/20 text-amber-400',
  'bg-purple-500/20 text-purple-400',
  'bg-teal-500/20 text-teal-400',
  'bg-red-500/20 text-red-400',
]

// ── Modal ─────────────────────────────────────────────────────────────────────

function MembroModal({
  obra_id,
  initial,
  onClose,
  onSuccess,
}: {
  obra_id: string
  initial: Membro | null
  onClose: () => void
  onSuccess: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nome:          initial?.nome ?? '',
    cargo:         initial?.cargo ?? '',
    registro:      initial?.registro ?? '',
    especialidade: initial?.especialidade ?? '',
    telefone:      initial?.telefone ?? '',
    email:         initial?.email ?? '',
  })
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  async function handleSave() {
    if (!form.nome.trim() || !form.cargo.trim()) {
      toast.error('Nome e cargo são obrigatórios')
      return
    }
    setSaving(true)
    const payload = { obra_id, ...form }
    const ok = initial
      ? await updateMembro(initial.id, payload)
      : await createMembro(payload)

    setSaving(false)
    if (ok) { toast.success('Membro salvo!'); onSuccess(); onClose() }
    else toast.error('Erro ao salvar')
  }

  return (
    <Modal
      title={initial ? 'Editar membro' : 'Adicionar membro'}
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
        <Input label="Nome completo" required value={form.nome} onChange={e => set('nome', e.target.value)} />
        <Input label="Cargo / Função" required value={form.cargo} onChange={e => set('cargo', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Registro (CREA/CAU)" value={form.registro} onChange={e => set('registro', e.target.value)} />
        <Input label="Especialidade" value={form.especialidade} onChange={e => set('especialidade', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Telefone" type="tel" value={form.telefone} onChange={e => set('telefone', e.target.value)} />
        <Input label="E-mail" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
      </div>
    </Modal>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function EquipeTab({ obra_id }: Props) {
  const [membros, setMembros] = useState<Membro[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState<'create' | Membro | null>(null)

  async function load() {
    const data = await getMembrosByObra(obra_id)
    setMembros(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [obra_id])

  async function handleDelete(id: string) {
    if (!confirm('Remover este membro da obra?')) return
    await deleteMembro(id)
    toast.success('Membro removido')
    load()
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-base font-semibold text-white">Equipe da Obra</p>
          <p className="text-xs text-white/30 mt-0.5">{membros.length} membros alocados</p>
        </div>
        <Btn variant="primary" onClick={() => setModal('create')}>+ Adicionar membro</Btn>
      </div>

      {membros.length === 0 ? (
        <EmptyState message="Nenhum membro cadastrado nesta obra" />
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {membros.map((m, idx) => (
            <div
              key={m.id}
              className="bg-[#0d0d0d] border border-white/[0.08] rounded-2xl p-4 flex gap-3 items-start group hover:border-white/15 transition-colors"
            >
              {/* Avatar */}
              <div className={cn(
                'w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold shrink-0',
                AVATAR_COLORS[idx % AVATAR_COLORS.length]
              )}>
                {initials(m.nome)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white/90 truncate">{m.nome}</p>
                <p className="text-xs text-white/40 mb-2">{m.cargo}</p>
                <div className="flex flex-wrap gap-1.5">
                  {m.registro && (
                    <span className="px-2 py-0.5 bg-white/5 border border-white/8 rounded text-[10px] font-mono text-white/40">
                      {m.registro}
                    </span>
                  )}
                  {m.especialidade && (
                    <span className="px-2 py-0.5 bg-white/5 border border-white/8 rounded text-[10px] text-white/40">
                      {m.especialidade}
                    </span>
                  )}
                </div>
                {(m.email || m.telefone) && (
                  <div className="mt-2 space-y-0.5">
                    {m.email && <p className="text-[11px] text-white/30 truncate">{m.email}</p>}
                    {m.telefone && <p className="text-[11px] text-white/30">{m.telefone}</p>}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Btn onClick={() => setModal(m)}>✎</Btn>
                <Btn variant="danger" onClick={() => handleDelete(m.id)}>✕</Btn>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <MembroModal
          obra_id={obra_id}
          initial={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSuccess={load}
        />
      )}
    </div>
  )
}
