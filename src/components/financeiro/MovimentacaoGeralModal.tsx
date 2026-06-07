'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Modal, Input, Select, Btn } from '@/components/ui'
import {
  createMovimentacao,
  uploadComprovante,
  removeComprovante,
} from '@/services/bancoService'
import { ContaComSaldo, BancoCategoria, MovTipo, MovStatus, FormaPagamento } from '@/types/banco'
import { ContaComprovanteFields } from './ContaComprovanteFields'

// Lançamento GERAL (não ligado a obra): impostos, folha, aportes, despesas
// administrativas… Grava em bancos_movimentacoes e entra no caixa consolidado.
// Movimentações de obra NÃO se lançam aqui — vêm do Custo Real / Medições.

const FORMA_OPTS: { value: FormaPagamento; label: string }[] = [
  { value: 'pix', label: 'PIX' },
  { value: 'ted', label: 'TED' },
  { value: 'doc', label: 'DOC' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'cartao', label: 'Cartão' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'transferencia', label: 'Transferência' },
  { value: 'outro', label: 'Outro' },
]

type Props = {
  contas: ContaComSaldo[]
  categorias: BancoCategoria[]
  onClose: () => void
  onSaved: () => void
}

const num = (s: string) => {
  const n = Number(String(s).replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

export function MovimentacaoGeralModal({ contas, categorias, onClose, onSaved }: Props) {
  const [saving, setSaving] = useState(false)
  const [contaId, setContaId] = useState<string | null>(null)
  const [comp, setComp] = useState<{ url: string | null; path: string | null }>({
    url: null,
    path: null,
  })

  const [form, setForm] = useState({
    tipo: 'saida' as MovTipo,
    descricao: '',
    valor: '',
    data: new Date().toLocaleDateString('en-CA'),
    categoria_id: '',
    forma_pagamento: '' as FormaPagamento | '',
    beneficiario: '',
    documento: '',
    status: 'pago' as MovStatus,
  })
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  const realizado = form.status === 'pago' || form.status === 'conciliado'

  const categoriaOpts = [
    { value: '', label: 'Sem categoria' },
    ...categorias
      .filter(c => c.tipo === 'ambos' || c.tipo === form.tipo)
      .map(c => ({ value: c.id, label: c.nome })),
  ]

  async function handleSave() {
    if (!form.descricao.trim()) { toast.error('Informe a descrição.'); return }
    if (num(form.valor) <= 0) { toast.error('Informe um valor maior que zero.'); return }
    if (!contaId) { toast.error('Escolha a conta bancária.'); return }
    if (realizado && !comp.url) {
      toast.error('Toda movimentação realizada precisa de comprovante.')
      return
    }

    setSaving(true)
    const { error } = await createMovimentacao({
      conta_id: contaId,
      tipo: form.tipo,
      data: form.data,
      valor: num(form.valor),
      descricao: form.descricao.trim(),
      categoria_id: form.categoria_id || null,
      obra_id: null,
      beneficiario: form.beneficiario.trim() || null,
      forma_pagamento: form.forma_pagamento || null,
      documento: form.documento.trim() || null,
      status: form.status,
      data_conciliacao: null,
      transferencia_id: null,
      anexo_url: comp.url,
      observacoes: null,
    })
    setSaving(false)
    if (error) { toast.error(error); return }
    toast.success('Movimentação lançada!')
    onSaved()
    onClose()
  }

  return (
    <Modal
      title="Nova movimentação geral"
      subtitle="Lançamento não ligado a obra (impostos, folha, aportes…)"
      onClose={onClose}
      width="max-w-xl"
      footer={
        <>
          <Btn variant="ghost" size="md" onClick={onClose}>Cancelar</Btn>
          <Btn variant="primary" size="md" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando…' : 'Lançar'}
          </Btn>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Tipo"
          value={form.tipo}
          onChange={e => set('tipo', e.target.value as MovTipo)}
          options={[
            { value: 'saida', label: 'Saída (despesa)' },
            { value: 'entrada', label: 'Entrada (receita)' },
          ]}
        />
        <Select
          label="Situação"
          value={form.status}
          onChange={e => set('status', e.target.value as MovStatus)}
          options={[
            { value: 'pago', label: 'Realizado (pago)' },
            { value: 'previsto', label: 'Previsto (agendado)' },
          ]}
        />
      </div>

      <Input
        label="Descrição"
        required
        placeholder="Ex.: DAS, aluguel, aporte de capital…"
        value={form.descricao}
        onChange={e => set('descricao', e.target.value)}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Valor (R$)"
          required
          type="number"
          step="0.01"
          min={0}
          value={form.valor}
          onChange={e => set('valor', e.target.value)}
        />
        <Input
          label="Data"
          type="date"
          value={form.data}
          onChange={e => set('data', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Categoria"
          value={form.categoria_id}
          onChange={e => set('categoria_id', e.target.value)}
          options={categoriaOpts}
        />
        <Select
          label="Forma de pagamento"
          value={form.forma_pagamento}
          onChange={e => set('forma_pagamento', e.target.value as FormaPagamento | '')}
          options={[{ value: '', label: '—' }, ...FORMA_OPTS]}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Beneficiário / pagador"
          placeholder="Fornecedor ou favorecido"
          value={form.beneficiario}
          onChange={e => set('beneficiario', e.target.value)}
        />
        <Input
          label="Documento / NF"
          placeholder="Nº do documento"
          value={form.documento}
          onChange={e => set('documento', e.target.value)}
        />
      </div>

      <ContaComprovanteFields
        contas={contas}
        contaId={contaId}
        onContaChange={setContaId}
        comprovanteUrl={comp.url}
        comprovantePath={comp.path}
        onComprovanteChange={setComp}
        upload={uploadComprovante}
        removeStored={removeComprovante}
        required={realizado}
      />
      {realizado && (
        <p className="text-[11px] text-white/30">
          Movimentação realizada exige conta e comprovante. Para lançar sem comprovante,
          use a situação “Previsto”.
        </p>
      )}
    </Modal>
  )
}
