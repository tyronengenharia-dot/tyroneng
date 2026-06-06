'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { Btn, Input, Select, TableCard, TableHead, Th, Td, EmptyState } from '@/components/ui'
import { BancoCategoria, CategoriaTipo } from '@/types/banco'
import {
  createCategoria,
  updateCategoria,
  deleteCategoria,
} from '@/services/bancoService'
import {
  categoriaTipoOptions,
  categoriaTipoLabels,
  CORES,
} from '@/lib/bancoConstants'

interface Props {
  categorias: BancoCategoria[]
  onRefresh: () => void
}

const vazio = { nome: '', tipo: 'saida' as CategoriaTipo, cor: CORES[0] }

export function CategoriasTab({ categorias, onRefresh }: Props) {
  const [editing, setEditing] = useState<BancoCategoria | null>(null)
  const [form, setForm] = useState(vazio)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function startEdit(c: BancoCategoria) {
    setEditing(c)
    setForm({ nome: c.nome, tipo: c.tipo, cor: c.cor })
    setError(null)
  }

  function cancelEdit() {
    setEditing(null)
    setForm(vazio)
    setError(null)
  }

  async function handleSubmit() {
    if (form.nome.trim() === '') {
      setError('Informe o nome da categoria.')
      return
    }
    setSaving(true)
    setError(null)
    const payload = {
      nome: form.nome.trim(),
      tipo: form.tipo,
      cor: form.cor,
    }
    const { error } = editing
      ? await updateCategoria(editing.id, payload)
      : await createCategoria(payload)
    setSaving(false)
    if (error) {
      setError(error)
      return
    }
    cancelEdit()
    onRefresh()
  }

  async function handleDelete(c: BancoCategoria) {
    if (!confirm(`Excluir a categoria "${c.nome}"?`)) return
    const { error } = await deleteCategoria(c.id)
    if (error) {
      alert(error)
      return
    }
    if (editing?.id === c.id) cancelEdit()
    onRefresh()
  }

  return (
    <div className="space-y-5">
      {/* Form add/edit */}
      <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-5">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">
          {editing ? 'Editar categoria' : 'Nova categoria'}
        </p>
        <div className="flex flex-col md:flex-row gap-3 md:items-end">
          <div className="flex-1">
            <Input
              label="Nome"
              placeholder="Ex.: Materiais elétricos"
              value={form.nome}
              onChange={e => set('nome', e.target.value)}
            />
          </div>
          <div className="w-full md:w-44">
            <Select
              label="Aplica-se a"
              options={categoriaTipoOptions}
              value={form.tipo}
              onChange={e => set('tipo', e.target.value as CategoriaTipo)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/40 mb-1.5">Cor</label>
            <div className="flex flex-wrap gap-1.5">
              {CORES.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set('cor', c)}
                  className={`w-6 h-6 rounded-md transition-transform ${
                    form.cor === c ? 'ring-2 ring-white scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            {editing && (
              <Btn variant="ghost" size="md" onClick={cancelEdit}>
                <X size={15} /> Cancelar
              </Btn>
            )}
            <Btn variant="primary" size="md" onClick={handleSubmit} disabled={saving}>
              <Plus size={15} /> {editing ? 'Salvar' : 'Adicionar'}
            </Btn>
          </div>
        </div>
        {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
      </div>

      {/* Lista */}
      {categorias.length === 0 ? (
        <EmptyState message="Nenhuma categoria cadastrada." />
      ) : (
        <TableCard>
          <table className="w-full">
            <TableHead>
              <Th>Categoria</Th>
              <Th>Aplica-se a</Th>
              <Th right>Ações</Th>
            </TableHead>
            <tbody>
              {categorias.map(c => (
                <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5 text-sm border-t border-white/[0.05]">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: c.cor }}
                      />
                      <span className="text-white/80">{c.nome}</span>
                    </div>
                  </td>
                  <Td muted>{categoriaTipoLabels[c.tipo]}</Td>
                  <td className="px-5 py-3.5 border-t border-white/[0.05]">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => startEdit(c)}
                        className="w-8 h-8 rounded-lg hover:bg-white/8 flex items-center justify-center text-blue-400 transition-colors"
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(c)}
                        className="w-8 h-8 rounded-lg hover:bg-white/8 flex items-center justify-center text-red-400 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      )}
    </div>
  )
}
