'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  getFinanceiroByObra,
  createFinanceiro,
  updateFinanceiro,
  deleteFinanceiro,
  calcReceitas,
  calcDespesas,
  calcSaldo,
} from '@/services/financeiroService'
import { Financeiro, FinanceiroStatus, FinanceiroType } from '@/types'
import {
  Badge, Btn, EmptyState, LoadingSpinner, Modal,
  Input, Select, TableCard, TableHead, Th, Td,
} from '@/components/ui'
import { fmt, fmtDate, fmtCurrency } from '@/lib/utils'

type Props = { obra_id: string }

// ── Modal ─────────────────────────────────────────────────────────────────────

function FinanceiroModal({
  obra_id,
  initial,
  onClose,
  onSuccess,
}: {
  obra_id: string
  initial: Financeiro | null
  onClose: () => void
  onSuccess: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    description: initial?.description ?? '',
    value:       initial?.value?.toString() ?? '',
    date:        initial?.date ?? '',
    type:        initial?.type ?? 'entrada',
    status:      initial?.status ?? 'pago',
    category:    initial?.category ?? 'Obra',
  })

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  async function handleSave() {
    if (!form.description.trim() || !form.value || !form.date) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }
    setSaving(true)
    const payload = {
      obra_id,
      description: form.description.trim(),
      value: parseFloat(form.value),
      date: form.date,
      type: form.type as FinanceiroType,
      status: form.status as FinanceiroStatus,
      category: form.category,
    }
    const ok = initial
      ? await updateFinanceiro(initial.id, payload)
      : await createFinanceiro(payload)

    setSaving(false)
    if (ok) {
      toast.success(initial ? 'Atualizado!' : 'Lançamento criado!')
      onSuccess()
      onClose()
    } else {
      toast.error('Erro ao salvar')
    }
  }

  return (
    <Modal
      title={initial ? 'Editar lançamento' : 'Novo lançamento'}
      subtitle={initial ? 'Atualize os dados abaixo' : 'Registre uma entrada ou saída'}
      onClose={onClose}
      footer={
        <>
          <Btn onClick={onClose}>Cancelar</Btn>
          <Btn variant="primary" size="md" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Btn>
        </>
      }
    >
      <Input label="Descrição" required placeholder="Ex: Pagamento fornecedor cimento"
        value={form.description} onChange={e => set('description', e.target.value)} />

      <div className="grid grid-cols-2 gap-3">
        <Input label="Valor (R$)" required type="number" placeholder="0,00"
          value={form.value} onChange={e => set('value', e.target.value)} />
        <Input label="Data" required type="date"
          value={form.date} onChange={e => set('date', e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Select label="Tipo" value={form.type} onChange={e => set('type', e.target.value)}
          options={[{ value: 'entrada', label: 'Entrada' }, { value: 'saida', label: 'Saída' }]} />
        <Select label="Status" value={form.status} onChange={e => set('status', e.target.value)}
          options={[
            { value: 'pago', label: 'Pago' },
            { value: 'pendente', label: 'Pendente' },
            { value: 'atrasado', label: 'Atrasado' },
          ]} />
      </div>

      <Select label="Categoria" value={form.category} onChange={e => set('category', e.target.value)}
        options={['Obra','Material','Mão de obra','Equipamento','Serviço','Receita','Outros'].map(c => ({ value: c, label: c }))} />
    </Modal>
  )
}

// ── Main tab ──────────────────────────────────────────────────────────────────

const TIPO_FILTERS  = ['Todos', 'Entradas', 'Saídas']
const STATUS_FILTERS = ['Todos', 'Pago', 'Pendente', 'Atrasado']

export function FinanceiroTab({ obra_id }: Props) {
  const [data, setData]         = useState<Financeiro[]>([])
  const [loading, setLoading]   = useState(true)
  const [tipoFilter, setTipo]   = useState('Todos')
  const [statusFilter, setStatus] = useState('Todos')
  const [modal, setModal]       = useState<'create' | Financeiro | null>(null)

  async function load() {
    const result = await getFinanceiroByObra(obra_id)
    setData(result)
    setLoading(false)
  }

  useEffect(() => { load() }, [obra_id])

  const filtered = data.filter(i => {
    const tipoOk =
      tipoFilter === 'Todos' ? true
      : tipoFilter === 'Entradas' ? i.type === 'entrada'
      : i.type === 'saida'
    const statusOk =
      statusFilter === 'Todos' ? true
      : i.status === statusFilter.toLowerCase()
    return tipoOk && statusOk
  })

  async function handleDelete(id: string) {
    if (!confirm('Excluir este lançamento?')) return
    const ok = await deleteFinanceiro(id)
    if (ok) { toast.success('Excluído!'); load() }
    else toast.error('Erro ao excluir')
  }

  if (loading) return <LoadingSpinner />

  const receitas = calcReceitas(data)
  const despesas = calcDespesas(data)
  const saldo    = calcSaldo(data)

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#0d0d0d] border border-white/[0.08] rounded-xl p-4">
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1">Receitas</p>
          <p className="text-xl font-semibold font-mono text-green-400">{fmtCurrency(receitas)}</p>
        </div>
        <div className="bg-[#0d0d0d] border border-white/[0.08] rounded-xl p-4">
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1">Despesas</p>
          <p className="text-xl font-semibold font-mono text-red-400">{fmtCurrency(despesas)}</p>
        </div>
        <div className="bg-[#0d0d0d] border border-white/[0.08] rounded-xl p-4">
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1">Saldo</p>
          <p className={`text-xl font-semibold font-mono ${saldo >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {fmtCurrency(saldo)}
          </p>
        </div>
      </div>

      {/* Table */}
      <TableCard>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08]">
          <div className="flex gap-1.5">
            {TIPO_FILTERS.map(f => (
              <button key={f}
                onClick={() => setTipo(f)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  tipoFilter === f
                    ? 'bg-white/10 text-white'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                {f}
              </button>
            ))}
            <span className="text-white/10 mx-1">|</span>
            {STATUS_FILTERS.map(f => (
              <button key={f}
                onClick={() => setStatus(f)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === f
                    ? 'bg-white/10 text-white'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <Btn variant="primary" onClick={() => setModal('create')}>+ Lançamento</Btn>
        </div>

        {filtered.length === 0 ? (
          <EmptyState message="Nenhum lançamento encontrado" />
        ) : (
          <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
            <TableHead>
              <Th>Descrição</Th>
              <Th>Tipo</Th>
              <Th right>Valor</Th>
              <Th>Status</Th>
              <Th>Data</Th>
              <Th>Ações</Th>
            </TableHead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                  <Td>
                    <div className="font-medium text-white/90 truncate">{item.description}</div>
                    <div className="text-xs text-white/30 mt-0.5">{item.category}</div>
                  </Td>
                  <Td><Badge value={item.type} /></Td>
                  <Td right mono>
                    <span className={item.type === 'entrada' ? 'text-green-400' : 'text-red-400'}>
                      {item.type === 'entrada' ? '+' : '-'} R$ {fmt(item.value)}
                    </span>
                  </Td>
                  <Td><Badge value={item.status} /></Td>
                  <Td muted>{fmtDate(item.date)}</Td>
                  <Td>
                    <div className="flex gap-1.5">
                      <Btn onClick={() => setModal(item)}>Editar</Btn>
                      <Btn variant="danger" onClick={() => handleDelete(item.id)}>Excluir</Btn>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TableCard>

      {modal && (
        <FinanceiroModal
          obra_id={obra_id}
          initial={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSuccess={load}
        />
      )}
    </div>
  )
}
