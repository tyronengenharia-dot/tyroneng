'use client'

import { useState } from 'react'
import { createMaterial, updateMaterial } from '@/services/estoqueService'
import { Material } from '@/types/estoque'
import { ModalOverlay, Field, inputCls, selectCls } from '@/components/ui/EstoqueUI'

const UNIDADES = ['un', 'kg', 'g', 'l', 'ml', 'm', 'm²', 'm³', 'cx', 'pç', 'sc', 'bd', 'rolo', 'par']

type Props = {
  initial?: Material | null
  onClose: () => void
  onSuccess: () => void
}

export function MateriaisModal({ initial, onClose, onSuccess }: Props) {
  const [form, setForm] = useState({
    nome: initial?.nome ?? '',
    unidade: initial?.unidade ?? 'un',
    quantidade: initial?.quantidade ?? 0,
    valor_unitario: initial?.valor_unitario ?? 0,
  })

  const isEditing = !!initial

  async function handleSave() {
    if (!form.nome.trim()) return
    if (isEditing) {
      await updateMaterial(initial!.id, form)
    } else {
      await createMaterial(form)
    }
    onSuccess()
    onClose()
  }

  return (
    <ModalOverlay
      title={isEditing ? 'Editar Material' : 'Novo Material'}
      onClose={onClose}
      onSave={handleSave}
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Field label="Nome *">
            <input
              className={inputCls}
              placeholder="Ex: Cimento CP-II"
              value={form.nome}
              onChange={e => setForm({ ...form, nome: e.target.value })}
            />
          </Field>
        </div>

        <Field label="Unidade">
          <select
            className={selectCls}
            value={form.unidade}
            onChange={e => setForm({ ...form, unidade: e.target.value })}
          >
            {UNIDADES.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </Field>

        <Field label="Quantidade">
          <input
            type="number"
            min={0}
            className={inputCls}
            value={form.quantidade}
            onChange={e => setForm({ ...form, quantidade: Number(e.target.value) })}
          />
        </Field>

        <div className="col-span-2">
          <Field label="Valor Unitário (R$)">
            <input
              type="number"
              min={0}
              step={0.01}
              className={inputCls}
              value={form.valor_unitario}
              onChange={e => setForm({ ...form, valor_unitario: Number(e.target.value) })}
            />
          </Field>
        </div>
      </div>

      {/* Preview */}
      {form.quantidade > 0 && form.valor_unitario > 0 && (
        <div className="mt-2 px-3 py-2.5 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
          <p className="text-xs text-gray-500">Valor total em estoque</p>
          <p className="text-lg font-bold text-emerald-400">
            {(form.quantidade * form.valor_unitario).toLocaleString('pt-BR', {
              style: 'currency', currency: 'BRL'
            })}
          </p>
        </div>
      )}
    </ModalOverlay>
  )
}
