'use client'

import { useState } from 'react'
import { createVeiculo, updateVeiculo } from '@/services/estoqueService'
import { Veiculo } from '@/types/estoque'
import { ModalOverlay, Field, inputCls, selectCls } from '@/components/estoque/estoqueUI'

type Props = {
  initial?: Veiculo | null
  onClose: () => void
  onSuccess: () => void
}

export function VeiculosModal({ initial, onClose, onSuccess }: Props) {
  const [form, setForm] = useState({
    nome: initial?.nome ?? '',
    placa: initial?.placa ?? '',
    modelo: initial?.modelo ?? '',
    ano: initial?.ano ?? new Date().getFullYear(),
    km: initial?.km ?? 0,
    status: initial?.status ?? 'ativo',
    observacoes: initial?.observacoes ?? '',
  })

  const isEditing = !!initial

  async function handleSave() {
    if (!form.nome.trim() || !form.placa.trim()) return
    if (isEditing) {
      await updateVeiculo(initial!.id, form)
    } else {
      await createVeiculo(form)
    }
    onSuccess()
    onClose()
  }

  return (
    <ModalOverlay
      title={isEditing ? 'Editar Veículo' : 'Novo Veículo'}
      onClose={onClose}
      onSave={handleSave}
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Field label="Nome *">
            <input className={inputCls} placeholder="Ex: Caminhão Betoneira" value={form.nome}
              onChange={e => setForm({ ...form, nome: e.target.value })} />
          </Field>
        </div>

        <Field label="Placa *">
          <input className={inputCls} placeholder="ABC-1234" value={form.placa}
            onChange={e => setForm({ ...form, placa: e.target.value.toUpperCase() })} />
        </Field>

        <Field label="Modelo">
          <input className={inputCls} placeholder="Ex: Mercedes Actros" value={form.modelo}
            onChange={e => setForm({ ...form, modelo: e.target.value })} />
        </Field>

        <Field label="Ano">
          <input type="number" className={inputCls} value={form.ano}
            onChange={e => setForm({ ...form, ano: Number(e.target.value) })} />
        </Field>

        <Field label="KM Atual">
          <input type="number" min={0} className={inputCls} value={form.km}
            onChange={e => setForm({ ...form, km: Number(e.target.value) })} />
        </Field>

        <div className="col-span-2">
          <Field label="Status">
            <select className={selectCls} value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value as any })}>
              <option value="ativo">Ativo</option>
              <option value="manutencao">Manutenção</option>
              <option value="inativo">Inativo</option>
            </select>
          </Field>
        </div>

        <div className="col-span-2">
          <Field label="Observações">
            <textarea rows={3} className={inputCls} placeholder="Informações adicionais..." value={form.observacoes}
              onChange={e => setForm({ ...form, observacoes: e.target.value })} />
          </Field>
        </div>
      </div>
    </ModalOverlay>
  )
}
