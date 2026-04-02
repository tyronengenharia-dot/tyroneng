'use client'

import { useState } from 'react'
import { createMaquinario, updateMaquinario } from '@/services/estoqueService'
import { Maquinario } from '@/types/estoque'
import { ModalOverlay, Field, inputCls, selectCls } from '@/components/estoque/estoqueUI'

type Props = {
  initial?: Maquinario | null
  onClose: () => void
  onSuccess: () => void
}

export function MaquinarioModal({ initial, onClose, onSuccess }: Props) {
  const [form, setForm] = useState({
    nome: initial?.nome ?? '',
    tipo: initial?.tipo ?? '',
    modelo: initial?.modelo ?? '',
    fabricante: initial?.fabricante ?? '',
    ano: initial?.ano ?? new Date().getFullYear(),
    horimetro: initial?.horimetro ?? 0,
    custo_hora: initial?.custo_hora ?? 0,
    status: initial?.status ?? 'ativo',
    localizacao: initial?.localizacao ?? '',
    observacoes: initial?.observacoes ?? '',
  })

  const isEditing = !!initial

  async function handleSave() {
    if (!form.nome.trim()) return
    if (isEditing) {
      await updateMaquinario(initial!.id, form)
    } else {
      await createMaquinario(form)
    }
    onSuccess()
    onClose()
  }

  return (
    <ModalOverlay
      title={isEditing ? 'Editar Maquinário' : 'Novo Maquinário'}
      onClose={onClose}
      onSave={handleSave}
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Field label="Nome *">
            <input className={inputCls} placeholder="Ex: Escavadeira Hidráulica" value={form.nome}
              onChange={e => setForm({ ...form, nome: e.target.value })} />
          </Field>
        </div>

        <Field label="Tipo">
          <input className={inputCls} placeholder="Ex: Escavadeira" value={form.tipo}
            onChange={e => setForm({ ...form, tipo: e.target.value })} />
        </Field>

        <Field label="Modelo">
          <input className={inputCls} placeholder="Ex: PC210LC-11" value={form.modelo}
            onChange={e => setForm({ ...form, modelo: e.target.value })} />
        </Field>

        <Field label="Fabricante">
          <input className={inputCls} placeholder="Ex: Komatsu" value={form.fabricante}
            onChange={e => setForm({ ...form, fabricante: e.target.value })} />
        </Field>

        <Field label="Ano">
          <input type="number" className={inputCls} value={form.ano}
            onChange={e => setForm({ ...form, ano: Number(e.target.value) })} />
        </Field>

        <Field label="Horímetro (h)">
          <input type="number" min={0} className={inputCls} value={form.horimetro}
            onChange={e => setForm({ ...form, horimetro: Number(e.target.value) })} />
        </Field>

        <Field label="Custo por Hora (R$)">
          <input type="number" min={0} step={0.01} className={inputCls} value={form.custo_hora}
            onChange={e => setForm({ ...form, custo_hora: Number(e.target.value) })} />
        </Field>

        <Field label="Status">
          <select className={selectCls} value={form.status}
            onChange={e => setForm({ ...form, status: e.target.value as any })}>
            <option value="ativo">Ativo</option>
            <option value="em_uso">Em uso</option>
            <option value="manutencao">Manutenção</option>
            <option value="parado">Parado</option>
          </select>
        </Field>

        <div className="col-span-2">
          <Field label="Localização / Obra">
            <input className={inputCls} placeholder="Ex: Obra Centro - Bloco A" value={form.localizacao}
              onChange={e => setForm({ ...form, localizacao: e.target.value })} />
          </Field>
        </div>

        <div className="col-span-2">
          <Field label="Observações">
            <textarea rows={2} className={inputCls} placeholder="Informações adicionais..." value={form.observacoes}
              onChange={e => setForm({ ...form, observacoes: e.target.value })} />
          </Field>
        </div>
      </div>

      {/* Cost preview */}
      {form.horimetro > 0 && form.custo_hora > 0 && (
        <div className="mt-1 px-3 py-2.5 bg-blue-500/5 border border-blue-500/20 rounded-lg">
          <p className="text-xs text-gray-500">Custo acumulado estimado</p>
          <p className="text-lg font-bold text-blue-400">
            {(form.horimetro * form.custo_hora).toLocaleString('pt-BR', {
              style: 'currency', currency: 'BRL'
            })}
          </p>
        </div>
      )}
    </ModalOverlay>
  )
}
