'use client'

import { useState } from 'react'
import { Modal, Input, Select, Btn } from '@/components/ui'
import { Insumo, InsumoTipo } from '@/types/insumo'
import { createInsumo, updateInsumo } from '@/services/insumoService'

interface Props {
  insumo: Insumo | null
  onClose: () => void
  onSaved: () => void
}

const tipoOptions = [
  { value: 'material', label: 'Material' },
  { value: 'mao_de_obra', label: 'Mão de obra' },
  { value: 'equipamento', label: 'Equipamento' },
]

export function InsumoModal({ insumo, onClose, onSaved }: Props) {
  const isEditing = !!insumo
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    codigo: insumo?.codigo ?? '',
    tipo: (insumo?.tipo ?? 'material') as InsumoTipo,
    descricao: insumo?.descricao ?? '',
    unidade: insumo?.unidade ?? '',
    valor_unitario: insumo?.valor_unitario?.toString() ?? '',
    ativo: insumo?.ativo ?? true,
  })

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  const valido =
    form.codigo.trim() !== '' &&
    form.descricao.trim() !== '' &&
    form.unidade.trim() !== '' &&
    form.valor_unitario !== '' &&
    Number(form.valor_unitario) >= 0

  async function handleSubmit() {
    if (!valido) {
      setError('Preencha código, descrição, unidade e um valor unitário ≥ 0.')
      return
    }
    setSaving(true)
    setError(null)

    const payload = {
      codigo: form.codigo.trim(),
      tipo: form.tipo,
      descricao: form.descricao.trim(),
      unidade: form.unidade.trim(),
      valor_unitario: Number(form.valor_unitario),
      ativo: form.ativo,
    }

    const { error } = isEditing
      ? await updateInsumo(insumo!.id, payload)
      : await createInsumo(payload)

    setSaving(false)
    if (error) {
      setError(error)
      return
    }
    onSaved()
  }

  return (
    <Modal
      title={isEditing ? 'Editar insumo' : 'Novo insumo'}
      subtitle={isEditing ? insumo!.codigo : 'Cadastre um item no catálogo da empresa'}
      onClose={onClose}
      footer={
        <>
          <Btn variant="ghost" size="md" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn variant="primary" size="md" onClick={handleSubmit} disabled={saving || !valido}>
            {saving ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar insumo'}
          </Btn>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Código"
          required
          placeholder="Ex.: INS-001"
          value={form.codigo}
          onChange={e => set('codigo', e.target.value)}
        />
        <Select
          label="Tipo"
          options={tipoOptions}
          value={form.tipo}
          onChange={e => set('tipo', e.target.value as InsumoTipo)}
        />
        <div className="col-span-2">
          <Input
            label="Descrição"
            required
            placeholder="Ex.: Cimento CP-II 50kg"
            value={form.descricao}
            onChange={e => set('descricao', e.target.value)}
          />
        </div>
        <Input
          label="Unidade"
          required
          placeholder="Ex.: kg, m², h"
          value={form.unidade}
          onChange={e => set('unidade', e.target.value)}
        />
        <Input
          label="Valor unitário (R$)"
          required
          type="number"
          min={0}
          step="0.0001"
          placeholder="0,00"
          value={form.valor_unitario}
          onChange={e => set('valor_unitario', e.target.value)}
        />
        <Select
          label="Situação"
          options={[
            { value: 'true', label: 'Ativo' },
            { value: 'false', label: 'Inativo' },
          ]}
          value={form.ativo ? 'true' : 'false'}
          onChange={e => set('ativo', e.target.value === 'true')}
        />
      </div>

      {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
    </Modal>
  )
}
