'use client'

import { useState } from 'react'
import { Modal, Input, Select, Btn } from '@/components/ui'
import { EmprestimoGarantia, GarantiaTipo, GarantiaSituacao } from '@/types/emprestimo'
import { createGarantia, updateGarantia } from '@/services/emprestimoService'
import { garantiaTipoOptions, garantiaSituacaoOptions } from '@/lib/emprestimoConstants'

interface Props {
  emprestimoId: string
  garantia: EmprestimoGarantia | null
  onClose: () => void
  onSaved: () => void
}

const num = (s: string) => {
  const n = Number(String(s).replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

export function GarantiaModal({ emprestimoId, garantia, onClose, onSaved }: Props) {
  const isEditing = !!garantia
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    tipo: (garantia?.tipo ?? 'imovel') as GarantiaTipo,
    descricao: garantia?.descricao ?? '',
    valor_estimado: garantia?.valor_estimado?.toString() ?? '',
    situacao: (garantia?.situacao ?? 'alienado') as GarantiaSituacao,
    matricula: garantia?.matricula ?? '',
    cartorio: garantia?.cartorio ?? '',
    placa: garantia?.placa ?? '',
    renavam: garantia?.renavam ?? '',
    garantidor: garantia?.garantidor ?? '',
    documento: garantia?.documento ?? '',
    observacoes: garantia?.observacoes ?? '',
  })

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  const isImovel = form.tipo === 'imovel'
  const isVeiculo = form.tipo === 'veiculo'
  const isPessoal = form.tipo === 'aval' || form.tipo === 'fianca'

  async function handleSubmit() {
    if (form.descricao.trim() === '') {
      setError('Descreva o bem/garantia.')
      return
    }
    setSaving(true)
    setError(null)

    const payload = {
      emprestimo_id: emprestimoId,
      tipo: form.tipo,
      descricao: form.descricao.trim(),
      valor_estimado: form.valor_estimado ? num(form.valor_estimado) : null,
      situacao: form.situacao,
      matricula: isImovel ? form.matricula.trim() || null : null,
      cartorio: isImovel ? form.cartorio.trim() || null : null,
      placa: isVeiculo ? form.placa.trim() || null : null,
      renavam: isVeiculo ? form.renavam.trim() || null : null,
      garantidor: isPessoal ? form.garantidor.trim() || null : null,
      documento: form.documento.trim() || null,
      observacoes: form.observacoes.trim() || null,
    }

    const { error } = isEditing
      ? await updateGarantia(garantia!.id, payload)
      : await createGarantia(payload)

    setSaving(false)
    if (error) return setError(error)
    onSaved()
  }

  return (
    <Modal
      title={isEditing ? 'Editar garantia' : 'Nova garantia'}
      subtitle="Bem dado em garantia / alienação fiduciária"
      onClose={onClose}
      width="max-w-xl"
      footer={
        <>
          <Btn variant="ghost" size="md" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn variant="primary" size="md" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Btn>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Tipo"
          options={garantiaTipoOptions}
          value={form.tipo}
          onChange={e => set('tipo', e.target.value as GarantiaTipo)}
        />
        <Select
          label="Situação"
          options={garantiaSituacaoOptions}
          value={form.situacao}
          onChange={e => set('situacao', e.target.value as GarantiaSituacao)}
        />
        <div className="col-span-2">
          <Input
            label="Descrição do bem"
            required
            placeholder={
              isImovel
                ? 'Ex.: Apartamento 101, Rua X, 123'
                : isVeiculo
                  ? 'Ex.: Honda Civic 2022 prata'
                  : 'Identifique a garantia'
            }
            value={form.descricao}
            onChange={e => set('descricao', e.target.value)}
          />
        </div>
        <Input
          label="Valor estimado (R$)"
          type="number"
          step="0.01"
          min={0}
          placeholder="0,00"
          value={form.valor_estimado}
          onChange={e => set('valor_estimado', e.target.value)}
        />
        <Input
          label="Documento / identificação"
          placeholder="Nº do documento"
          value={form.documento}
          onChange={e => set('documento', e.target.value)}
        />

        {isImovel && (
          <>
            <Input
              label="Matrícula"
              placeholder="Nº da matrícula"
              value={form.matricula}
              onChange={e => set('matricula', e.target.value)}
            />
            <Input
              label="Cartório"
              placeholder="Cartório de registro"
              value={form.cartorio}
              onChange={e => set('cartorio', e.target.value)}
            />
          </>
        )}

        {isVeiculo && (
          <>
            <Input
              label="Placa"
              placeholder="ABC-1D23"
              value={form.placa}
              onChange={e => set('placa', e.target.value)}
            />
            <Input
              label="Renavam"
              placeholder="Nº do Renavam"
              value={form.renavam}
              onChange={e => set('renavam', e.target.value)}
            />
          </>
        )}

        {isPessoal && (
          <div className="col-span-2">
            <Input
              label="Garantidor / Avalista"
              placeholder="Nome do garantidor"
              value={form.garantidor}
              onChange={e => set('garantidor', e.target.value)}
            />
          </div>
        )}

        <div className="col-span-2">
          <label className="block text-xs font-medium text-white/40 mb-1.5">Observações</label>
          <textarea
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors resize-none"
            rows={2}
            value={form.observacoes}
            onChange={e => set('observacoes', e.target.value)}
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
    </Modal>
  )
}
