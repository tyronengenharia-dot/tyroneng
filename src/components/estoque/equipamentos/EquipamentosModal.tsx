'use client'

import { useState } from 'react'
import { createEquipamento, updateEquipamento } from '@/services/estoqueService'
import { Equipamento } from '@/types/estoque'
import { ModalOverlay, Field, inputCls, selectCls } from '@/components/estoque/estoqueUI'

type Props = {
  initial?: Equipamento | null
  onClose: () => void
  onSuccess: () => void
}

export function EquipamentosModal({ initial, onClose, onSuccess }: Props) {
  const [form, setForm] = useState({
    nome: initial?.nome ?? '',
    numero_serie: initial?.numero_serie ?? '',
    categoria: initial?.categoria ?? '',
    status: initial?.status ?? 'disponivel',
    localizacao: initial?.localizacao ?? '',
    responsavel: initial?.responsavel ?? '',
    valor: initial?.valor ?? 0,
  })

  const isEditing = !!initial

  async function handleSave() {
    if (!form.nome.trim()) return
    if (isEditing) {
      await updateEquipamento(initial!.id, form)
    } else {
      await createEquipamento(form)
    }
    onSuccess()
    onClose()
  }

  return (
    <ModalOverlay
      title={isEditing ? 'Editar Equipamento' : 'Novo Equipamento'}
      onClose={onClose}
      onSave={handleSave}
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Field label="Nome *">
            <input className={inputCls} placeholder="Ex: Compactador de Solo" value={form.nome}
              onChange={e => setForm({ ...form, nome: e.target.value })} />
          </Field>
        </div>

        <Field label="Número de Série">
          <input className={inputCls} placeholder="SN-00001" value={form.numero_serie}
            onChange={e => setForm({ ...form, numero_serie: e.target.value })} />
        </Field>

        <Field label="Categoria">
          <input className={inputCls} placeholder="Ex: Elétrico" value={form.categoria}
            onChange={e => setForm({ ...form, categoria: e.target.value })} />
        </Field>

        <Field label="Localização">
          <input className={inputCls} placeholder="Ex: Almoxarifado A" value={form.localizacao}
            onChange={e => setForm({ ...form, localizacao: e.target.value })} />
        </Field>

        <Field label="Responsável">
          <input className={inputCls} placeholder="Nome do responsável" value={form.responsavel}
            onChange={e => setForm({ ...form, responsavel: e.target.value })} />
        </Field>

        <Field label="Status">
          <select className={selectCls} value={form.status}
            onChange={e => setForm({ ...form, status: e.target.value as any })}>
            <option value="disponivel">Disponível</option>
            <option value="em_uso">Em uso</option>
            <option value="manutencao">Manutenção</option>
          </select>
        </Field>

        <Field label="Valor (R$)">
          <input type="number" min={0} step={0.01} className={inputCls} value={form.valor}
            onChange={e => setForm({ ...form, valor: Number(e.target.value) })} />
        </Field>
      </div>
    </ModalOverlay>
  )
}
