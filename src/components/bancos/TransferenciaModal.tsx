'use client'

import { useState } from 'react'
import { Modal, Input, Select, Btn } from '@/components/ui'
import { ContaComSaldo, MovStatus } from '@/types/banco'
import { transferir } from '@/services/bancoService'
import { fmtCurrency } from '@/lib/utils'

interface Props {
  contas: ContaComSaldo[]
  onClose: () => void
  onSaved: () => void
}

function hoje() {
  return new Date().toLocaleDateString('en-CA')
}

export function TransferenciaModal({ contas, onClose, onSaved }: Props) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    origem: contas[0]?.id ?? '',
    destino: contas[1]?.id ?? '',
    valor: '',
    data: hoje(),
    descricao: '',
    status: 'pago' as MovStatus,
  })

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  const contaOrigem = contas.find(c => c.id === form.origem)
  const valido =
    form.origem !== '' &&
    form.destino !== '' &&
    form.origem !== form.destino &&
    form.valor !== '' &&
    Number(form.valor) > 0

  async function handleSubmit() {
    if (!valido) {
      setError('Selecione contas diferentes e um valor maior que zero.')
      return
    }
    setSaving(true)
    setError(null)

    const { error } = await transferir({
      origem: form.origem,
      destino: form.destino,
      valor: Number(form.valor),
      data: form.data,
      descricao: form.descricao.trim() || undefined,
      status: form.status,
    })

    setSaving(false)
    if (error) {
      setError(error)
      return
    }
    onSaved()
  }

  return (
    <Modal
      title="Transferência entre contas"
      subtitle="Cria uma saída na origem e uma entrada no destino"
      onClose={onClose}
      footer={
        <>
          <Btn variant="ghost" size="md" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn
            variant="primary"
            size="md"
            onClick={handleSubmit}
            disabled={saving || !valido}
          >
            {saving ? 'Transferindo...' : 'Transferir'}
          </Btn>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="De (origem)"
          options={contas.map(c => ({ value: c.id, label: c.nome }))}
          value={form.origem}
          onChange={e => set('origem', e.target.value)}
        />
        <Select
          label="Para (destino)"
          options={contas.map(c => ({ value: c.id, label: c.nome }))}
          value={form.destino}
          onChange={e => set('destino', e.target.value)}
        />
      </div>

      {contaOrigem && (
        <p className="text-xs text-white/40 -mt-1">
          Saldo atual da origem:{' '}
          <span
            className={
              contaOrigem.saldo_atual >= 0 ? 'text-white/70' : 'text-red-400'
            }
          >
            {fmtCurrency(contaOrigem.saldo_atual)}
          </span>
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Valor (R$)"
          required
          type="number"
          step="0.01"
          min={0}
          placeholder="0,00"
          value={form.valor}
          onChange={e => set('valor', e.target.value)}
        />
        <Input
          label="Data"
          required
          type="date"
          value={form.data}
          onChange={e => set('data', e.target.value)}
        />
      </div>

      <Input
        label="Descrição (opcional)"
        placeholder="Ex.: Remanejamento de caixa"
        value={form.descricao}
        onChange={e => set('descricao', e.target.value)}
      />

      <Select
        label="Status"
        options={[
          { value: 'pago', label: 'Pago (realizada)' },
          { value: 'previsto', label: 'Previsto (agendada)' },
        ]}
        value={form.status}
        onChange={e => set('status', e.target.value as MovStatus)}
      />

      {form.origem === form.destino && form.origem !== '' && (
        <p className="text-sm text-amber-400">
          A conta de origem e destino devem ser diferentes.
        </p>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </Modal>
  )
}
