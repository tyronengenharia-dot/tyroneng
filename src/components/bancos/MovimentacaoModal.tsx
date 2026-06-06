'use client'

import { useState } from 'react'
import { Modal, Input, Select, Btn } from '@/components/ui'
import {
  BancoMovimentacao,
  ContaComSaldo,
  BancoCategoria,
  MovTipo,
  MovStatus,
  FormaPagamento,
} from '@/types/banco'
import { Obra } from '@/types'
import {
  createMovimentacao,
  updateMovimentacao,
} from '@/services/bancoService'
import {
  movStatusOptions,
  formaPagamentoOptions,
} from '@/lib/bancoConstants'

interface Props {
  movimentacao: BancoMovimentacao | null
  contas: ContaComSaldo[]
  categorias: BancoCategoria[]
  obras: Obra[]
  defaultContaId?: string
  onClose: () => void
  onSaved: () => void
}

function hoje() {
  return new Date().toLocaleDateString('en-CA') // YYYY-MM-DD (local)
}

export function MovimentacaoModal({
  movimentacao,
  contas,
  categorias,
  obras,
  defaultContaId,
  onClose,
  onSaved,
}: Props) {
  const isEditing = !!movimentacao
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    tipo: (movimentacao?.tipo ?? 'saida') as MovTipo,
    conta_id: movimentacao?.conta_id ?? defaultContaId ?? contas[0]?.id ?? '',
    data: movimentacao?.data ?? hoje(),
    valor: movimentacao?.valor?.toString() ?? '',
    descricao: movimentacao?.descricao ?? '',
    categoria_id: movimentacao?.categoria_id ?? '',
    obra_id: movimentacao?.obra_id ?? '',
    beneficiario: movimentacao?.beneficiario ?? '',
    forma_pagamento: (movimentacao?.forma_pagamento ?? '') as FormaPagamento | '',
    documento: movimentacao?.documento ?? '',
    status: (movimentacao?.status ?? 'pago') as MovStatus,
    observacoes: movimentacao?.observacoes ?? '',
  })

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  const valido =
    form.conta_id !== '' &&
    form.descricao.trim() !== '' &&
    form.valor !== '' &&
    Number(form.valor) > 0 &&
    form.data !== ''

  // categorias aplicáveis ao tipo selecionado
  const categoriasFiltradas = categorias.filter(
    c => c.tipo === 'ambos' || c.tipo === form.tipo
  )

  async function handleSubmit() {
    if (!valido) {
      setError('Preencha conta, descrição, um valor maior que zero e a data.')
      return
    }
    setSaving(true)
    setError(null)

    const payload = {
      conta_id: form.conta_id,
      tipo: form.tipo,
      data: form.data,
      valor: Number(form.valor),
      descricao: form.descricao.trim(),
      categoria_id: form.categoria_id || null,
      obra_id: form.obra_id || null,
      beneficiario: form.beneficiario.trim() || null,
      forma_pagamento: form.forma_pagamento || null,
      documento: form.documento.trim() || null,
      status: form.status,
      data_conciliacao:
        form.status === 'conciliado'
          ? movimentacao?.data_conciliacao ?? hoje()
          : null,
      observacoes: form.observacoes.trim() || null,
    }

    const { error } = isEditing
      ? await updateMovimentacao(movimentacao!.id, payload)
      : await createMovimentacao(payload)

    setSaving(false)
    if (error) {
      setError(error)
      return
    }
    onSaved()
  }

  return (
    <Modal
      title={isEditing ? 'Editar movimentação' : 'Nova movimentação'}
      subtitle="Lançamento de entrada ou saída em uma conta"
      onClose={onClose}
      width="max-w-2xl"
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
            {saving ? 'Salvando...' : isEditing ? 'Salvar' : 'Lançar'}
          </Btn>
        </>
      }
    >
      {/* Toggle entrada/saída */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => set('tipo', 'entrada')}
          className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${
            form.tipo === 'entrada'
              ? 'bg-green-500/15 text-green-400 border-green-500/30'
              : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'
          }`}
        >
          ↓ Entrada
        </button>
        <button
          type="button"
          onClick={() => set('tipo', 'saida')}
          className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${
            form.tipo === 'saida'
              ? 'bg-red-500/15 text-red-400 border-red-500/30'
              : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'
          }`}
        >
          ↑ Saída
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Conta"
          options={contas.map(c => ({ value: c.id, label: c.nome }))}
          value={form.conta_id}
          onChange={e => set('conta_id', e.target.value)}
        />
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

        <div className="col-span-2">
          <Input
            label="Descrição"
            required
            placeholder="Ex.: Pagamento de cimento — NF 1234"
            value={form.descricao}
            onChange={e => set('descricao', e.target.value)}
          />
        </div>

        <Input
          label="Data"
          required
          type="date"
          value={form.data}
          onChange={e => set('data', e.target.value)}
        />
        <Select
          label="Status"
          options={movStatusOptions}
          value={form.status}
          onChange={e => set('status', e.target.value as MovStatus)}
        />

        <Select
          label="Categoria"
          options={[
            { value: '', label: '— Sem categoria —' },
            ...categoriasFiltradas.map(c => ({ value: c.id, label: c.nome })),
          ]}
          value={form.categoria_id}
          onChange={e => set('categoria_id', e.target.value)}
        />
        <Select
          label="Obra (opcional)"
          options={[
            { value: '', label: '— Não vinculado —' },
            ...obras.map(o => ({ value: o.id, label: o.name })),
          ]}
          value={form.obra_id}
          onChange={e => set('obra_id', e.target.value)}
        />

        <Input
          label="Beneficiário / Fornecedor"
          placeholder="A quem foi pago / de quem recebeu"
          value={form.beneficiario}
          onChange={e => set('beneficiario', e.target.value)}
        />
        <Select
          label="Forma de pagamento"
          options={[
            { value: '', label: '— Não informado —' },
            ...formaPagamentoOptions,
          ]}
          value={form.forma_pagamento}
          onChange={e => set('forma_pagamento', e.target.value as FormaPagamento | '')}
        />

        <Input
          label="Documento / NF"
          placeholder="Nº da nota ou comprovante"
          value={form.documento}
          onChange={e => set('documento', e.target.value)}
        />

        <div className="col-span-2">
          <label className="block text-xs font-medium text-white/40 mb-1.5">
            Observações
          </label>
          <textarea
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors resize-none"
            rows={2}
            placeholder="Detalhes adicionais..."
            value={form.observacoes}
            onChange={e => set('observacoes', e.target.value)}
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
    </Modal>
  )
}
