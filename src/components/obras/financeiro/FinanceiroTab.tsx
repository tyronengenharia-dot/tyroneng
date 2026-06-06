'use client'

import { useEffect, useState, type ChangeEvent } from 'react'
import { toast } from 'sonner'
import {
  getFinanceiroByObra,
  createFinanceiro,
  updateFinanceiro,
  deleteFinanceiro,
  uploadComprovante,
  removeComprovante,
  calcReceitas,
  calcDespesas,
  calcSaldo,
} from '@/services/financeiroService'
import { getItensByObra } from '@/services/planilhaService'
import { Financeiro, FinanceiroStatus, FinanceiroType, PlanilhaItem } from '@/types'
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
  custoItens,
  onClose,
  onSuccess,
}: {
  obra_id: string
  initial: Financeiro | null
  custoItens: PlanilhaItem[]
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
  const [planilhaItemId, setPlanilhaItemId] = useState(initial?.planilha_item_id ?? '')

  // Comprovante (foto)
  const existingUrl  = initial?.comprovante_url ?? null
  const existingPath = initial?.comprovante_path ?? null
  const [file, setFile]               = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [cleared, setCleared]         = useState(false)
  const preview = filePreview ?? (cleared ? null : existingUrl)

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  function onPickFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = '' // permite re-selecionar o mesmo arquivo
    if (!f) return
    if (!f.type.startsWith('image/')) { toast.error('Envie uma imagem (foto do comprovante).'); return }
    if (f.size > 8 * 1024 * 1024)     { toast.error('Imagem muito grande (máx. 8 MB).'); return }
    if (filePreview) URL.revokeObjectURL(filePreview)
    setFile(f)
    setFilePreview(URL.createObjectURL(f))
    setCleared(false)
  }

  function removeFoto() {
    if (filePreview) URL.revokeObjectURL(filePreview)
    setFile(null)
    setFilePreview(null)
    setCleared(true) // marca a remoção de uma foto já existente
  }

  async function handleSave() {
    if (!form.description.trim() || !form.value || !form.date) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }
    setSaving(true)
    try {
      // Campos novos só entram no payload quando relevantes → compatível pré-migration.
      const extra: Partial<Pick<Financeiro, 'planilha_item_id' | 'comprovante_url' | 'comprovante_path'>> = {}

      if (planilhaItemId)             extra.planilha_item_id = planilhaItemId
      else if (initial?.planilha_item_id) extra.planilha_item_id = null

      let novoPath: string | null = null
      if (file) {
        const up = await uploadComprovante(file, obra_id)
        novoPath = up.path
        extra.comprovante_url  = up.url
        extra.comprovante_path = up.path
      } else if (cleared && existingUrl) {
        extra.comprovante_url  = null
        extra.comprovante_path = null
      }

      const payload = {
        obra_id,
        description: form.description.trim(),
        value: parseFloat(form.value),
        date: form.date,
        type: form.type as FinanceiroType,
        status: form.status as FinanceiroStatus,
        category: form.category,
        ...extra,
      }

      const ok = initial
        ? await updateFinanceiro(initial.id, payload)
        : await createFinanceiro(payload)

      if (!ok) { toast.error('Erro ao salvar'); return }

      // Remove do Storage a foto antiga substituída/removida (best-effort).
      if (existingPath && existingPath !== novoPath && (file || cleared)) {
        await removeComprovante(existingPath)
      }

      toast.success(initial ? 'Atualizado!' : 'Lançamento criado!')
      onSuccess()
      onClose()
    } catch (e) {
      console.error('save financeiro error:', e)
      toast.error(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const custoOptions = [
    { value: '', label: '— Sem vínculo —' },
    ...custoItens.map(it => ({
      value: it.id,
      label: `${it.codigo ? it.codigo + ' — ' : ''}${it.descricao || 'Sem descrição'}`,
    })),
  ]

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

      <Select
        label="Item do Custo Real (no que / onde gastou)"
        value={planilhaItemId}
        onChange={e => setPlanilhaItemId(e.target.value)}
        options={custoOptions}
      />

      <div>
        <label className="block text-xs font-medium text-white/40 mb-1.5">Comprovante (foto)</label>
        {preview ? (
          <div className="flex items-center gap-3">
            <a href={preview} target="_blank" rel="noopener noreferrer" className="shrink-0">
              <img src={preview} alt="Comprovante" className="h-24 w-24 object-cover rounded-lg border border-white/10" />
            </a>
            <button type="button" onClick={removeFoto} className="text-xs text-red-400/70 hover:text-red-400 transition-colors">
              Remover
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center gap-1 border border-dashed border-white/15 rounded-xl py-6 cursor-pointer hover:bg-white/[0.03] transition-colors">
            <input type="file" accept="image/*" className="hidden" onChange={onPickFile} />
            <span className="text-xs text-white/50">Clique para carregar a foto</span>
            <span className="text-[10px] text-white/25">JPG/PNG · até 8 MB</span>
          </label>
        )}
      </div>
    </Modal>
  )
}

// ── Main tab ──────────────────────────────────────────────────────────────────

const TIPO_FILTERS  = ['Todos', 'Entradas', 'Saídas']
const STATUS_FILTERS = ['Todos', 'Pago', 'Pendente', 'Atrasado']

export function FinanceiroTab({ obra_id }: Props) {
  const [data, setData]         = useState<Financeiro[]>([])
  const [custoItens, setCustoItens] = useState<PlanilhaItem[]>([])
  const [loading, setLoading]   = useState(true)
  const [tipoFilter, setTipo]   = useState('Todos')
  const [statusFilter, setStatus] = useState('Todos')
  const [modal, setModal]       = useState<'create' | Financeiro | null>(null)

  async function load() {
    const [result, citens] = await Promise.all([
      getFinanceiroByObra(obra_id),
      getItensByObra(obra_id, 'custo_real'),
    ])
    setData(result)
    setCustoItens(citens)
    setLoading(false)
  }

  useEffect(() => {
    let active = true
    Promise.all([
      getFinanceiroByObra(obra_id),
      getItensByObra(obra_id, 'custo_real'),
    ]).then(([result, citens]) => {
      if (!active) return
      setData(result)
      setCustoItens(citens)
      setLoading(false)
    })
    return () => { active = false }
  }, [obra_id])

  const custoById = new Map(custoItens.map(i => [i.id, i]))

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

  async function handleDelete(item: Financeiro) {
    if (!confirm('Excluir este lançamento?')) return
    const ok = await deleteFinanceiro(item.id, item.comprovante_path)
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
              {filtered.map(item => {
                const custo = item.planilha_item_id ? custoById.get(item.planilha_item_id) : undefined
                return (
                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                  <Td>
                    <div className="flex items-center gap-2.5">
                      {item.comprovante_url && (
                        <a
                          href={item.comprovante_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Ver comprovante"
                          className="shrink-0"
                        >
                          <img src={item.comprovante_url} alt="" className="h-9 w-9 object-cover rounded-md border border-white/10" />
                        </a>
                      )}
                      <div className="min-w-0">
                        <div className="font-medium text-white/90 truncate">{item.description}</div>
                        <div className="text-xs text-white/30 mt-0.5 truncate">
                          {item.category}
                          {custo && (
                            <>
                              <span className="text-white/15"> · </span>
                              <span className="text-white/45">
                                {custo.codigo ? `${custo.codigo} — ` : ''}{custo.descricao || 'Item Custo Real'}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
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
                      <Btn variant="danger" onClick={() => handleDelete(item)}>Excluir</Btn>
                    </div>
                  </Td>
                </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </TableCard>

      {modal && (
        <FinanceiroModal
          obra_id={obra_id}
          initial={modal === 'create' ? null : modal}
          custoItens={custoItens}
          onClose={() => setModal(null)}
          onSuccess={load}
        />
      )}
    </div>
  )
}
