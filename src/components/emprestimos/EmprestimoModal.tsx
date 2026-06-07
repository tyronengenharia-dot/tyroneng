'use client'

import { useMemo, useState } from 'react'
import { Modal, Input, Select, Btn } from '@/components/ui'
import {
  Emprestimo,
  EmprestimoCategoria,
  EmprestimoRegime,
  EmprestimoStatus,
  FormaContemplacao,
} from '@/types/emprestimo'
import { Obra } from '@/types'
import {
  createEmprestimo,
  updateEmprestimo,
  regenerarParcelas,
} from '@/services/emprestimoService'
import {
  regimeOptions,
  regimeDescricao,
  statusOptions,
  formaContemplacaoOptions,
  CORES,
} from '@/lib/emprestimoConstants'
import { gerarParcelas, numeroDeParcelas } from '@/lib/emprestimoCalc'
import { fmtCurrency } from '@/lib/utils'

interface Props {
  emprestimo: Emprestimo | null
  obras: Obra[]
  onClose: () => void
  onSaved: () => void
}

function hoje() {
  return new Date().toLocaleDateString('en-CA')
}

const num = (s: string) => {
  const n = Number(String(s).replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

export function EmprestimoModal({ emprestimo, obras, onClose, onSaved }: Props) {
  const isEditing = !!emprestimo
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    categoria: (emprestimo?.categoria ?? 'emprestimo') as EmprestimoCategoria,
    descricao: emprestimo?.descricao ?? '',
    credor: emprestimo?.credor ?? '',
    proposito: emprestimo?.proposito ?? '',
    valor_principal: emprestimo?.valor_principal?.toString() ?? '',
    data_inicio: emprestimo?.data_inicio ?? hoje(),
    data_limite: emprestimo?.data_limite ?? '',
    dia_vencimento: emprestimo?.dia_vencimento?.toString() ?? '',
    status: (emprestimo?.status ?? 'ativo') as EmprestimoStatus,
    obra_id: emprestimo?.obra_id ?? '',
    regime: (emprestimo?.regime ?? 'juros_saldo') as EmprestimoRegime,
    taxa_juros_mensal: emprestimo?.taxa_juros_mensal?.toString() ?? '',
    capitaliza: emprestimo?.capitaliza ?? true,
    num_parcelas: emprestimo?.num_parcelas?.toString() ?? '',
    taxa_admin_pct: emprestimo?.taxa_admin_pct?.toString() ?? '',
    fundo_reserva_pct: emprestimo?.fundo_reserva_pct?.toString() ?? '',
    contemplado: emprestimo?.contemplado ?? false,
    data_contemplacao: emprestimo?.data_contemplacao ?? '',
    forma_contemplacao: (emprestimo?.forma_contemplacao ?? 'nao') as FormaContemplacao,
    valor_lance: emprestimo?.valor_lance?.toString() ?? '',
    cor: emprestimo?.cor ?? CORES[0],
    observacoes: emprestimo?.observacoes ?? '',
  })

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  const isConsorcio = form.categoria === 'consorcio'
  const mostraJuros = !isConsorcio && form.regime !== 'sem_juros'
  const mostraNumParcelas = isConsorcio || form.regime !== 'juros_saldo'

  // Monta um contrato-rascunho para a prévia do cronograma.
  const contratoPreview = useMemo(
    () => ({
      categoria: form.categoria,
      regime: form.regime,
      valor_principal: num(form.valor_principal),
      taxa_juros_mensal: num(form.taxa_juros_mensal),
      capitaliza: form.capitaliza,
      num_parcelas: form.num_parcelas ? Math.round(num(form.num_parcelas)) : null,
      data_inicio: form.data_inicio || hoje(),
      data_limite: form.data_limite || null,
      dia_vencimento: form.dia_vencimento ? Math.round(num(form.dia_vencimento)) : null,
      taxa_admin_pct: num(form.taxa_admin_pct),
      fundo_reserva_pct: num(form.fundo_reserva_pct),
    }),
    [form]
  )

  const preview = useMemo(() => {
    if (contratoPreview.valor_principal <= 0) return null
    try {
      const parcelas = gerarParcelas(contratoPreview)
      if (parcelas.length === 0) return null
      const totalPagar = parcelas.reduce((a, p) => a + p.valor_total, 0)
      const totalJuros = parcelas.reduce((a, p) => a + p.valor_juros, 0)
      return {
        n: parcelas.length,
        primeira: parcelas[0].valor_total,
        ultima: parcelas[parcelas.length - 1].valor_total,
        totalPagar,
        totalJuros,
      }
    } catch {
      return null
    }
  }, [contratoPreview])

  const valido =
    form.descricao.trim() !== '' &&
    num(form.valor_principal) > 0 &&
    form.data_inicio !== '' &&
    (mostraNumParcelas
      ? Math.round(num(form.num_parcelas)) > 0
      : form.data_limite !== '' || Math.round(num(form.num_parcelas)) > 0)

  async function handleSubmit() {
    if (!valido) {
      setError(
        'Preencha o nome, um valor maior que zero, a data de início e o prazo (nº de parcelas ou data limite).'
      )
      return
    }
    setSaving(true)
    setError(null)

    const payload = {
      categoria: form.categoria,
      descricao: form.descricao.trim(),
      credor: form.credor.trim() || null,
      proposito: form.proposito.trim() || null,
      valor_principal: num(form.valor_principal),
      data_inicio: form.data_inicio,
      data_limite: form.data_limite || null,
      dia_vencimento: form.dia_vencimento ? Math.round(num(form.dia_vencimento)) : null,
      status: form.status,
      obra_id: form.obra_id || null,
      regime: isConsorcio ? ('sem_juros' as EmprestimoRegime) : form.regime,
      taxa_juros_mensal: mostraJuros ? num(form.taxa_juros_mensal) : 0,
      capitaliza: form.regime === 'juros_saldo' ? form.capitaliza : false,
      num_parcelas: mostraNumParcelas
        ? Math.round(num(form.num_parcelas))
        : numeroDeParcelas(contratoPreview),
      taxa_admin_pct: isConsorcio ? num(form.taxa_admin_pct) : null,
      fundo_reserva_pct: isConsorcio ? num(form.fundo_reserva_pct) : null,
      contemplado: isConsorcio ? form.contemplado : false,
      data_contemplacao: isConsorcio && form.contemplado ? form.data_contemplacao || null : null,
      forma_contemplacao: isConsorcio ? form.forma_contemplacao : ('nao' as FormaContemplacao),
      valor_lance: isConsorcio && form.valor_lance ? num(form.valor_lance) : null,
      cor: form.cor,
      observacoes: form.observacoes.trim() || null,
    }

    if (isEditing) {
      const { error } = await updateEmprestimo(emprestimo!.id, payload)
      setSaving(false)
      if (error) return setError(error)
      onSaved()
      return
    }

    const { data, error } = await createEmprestimo(payload)
    if (error || !data) {
      setSaving(false)
      return setError(error ?? 'Falha ao criar o contrato.')
    }
    // Gera o cronograma de parcelas a partir do contrato recém-criado.
    const ger = await regenerarParcelas(data)
    setSaving(false)
    if (ger.error) return setError(ger.error)
    onSaved()
  }

  return (
    <Modal
      title={isEditing ? 'Editar contrato' : 'Novo empréstimo / consórcio'}
      subtitle="Dados do contrato, regime de juros e prazo"
      onClose={onClose}
      width="max-w-3xl"
      footer={
        <>
          <Btn variant="ghost" size="md" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn variant="primary" size="md" onClick={handleSubmit} disabled={saving || !valido}>
            {saving ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar contrato'}
          </Btn>
        </>
      }
    >
      {/* Categoria */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => set('categoria', 'emprestimo')}
          className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${
            form.categoria === 'emprestimo'
              ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
              : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'
          }`}
        >
          Empréstimo
        </button>
        <button
          type="button"
          onClick={() => set('categoria', 'consorcio')}
          className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${
            form.categoria === 'consorcio'
              ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
              : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'
          }`}
        >
          Consórcio
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Input
            label="Nome / apelido do contrato"
            required
            placeholder={isConsorcio ? 'Ex.: Consórcio Honda Civic' : 'Ex.: Empréstimo Tio João'}
            value={form.descricao}
            onChange={e => set('descricao', e.target.value)}
          />
        </div>

        <Input
          label={isConsorcio ? 'Administradora' : 'Credor (quem emprestou)'}
          placeholder={isConsorcio ? 'Ex.: Porto Seguro' : 'Ex.: João da Silva'}
          value={form.credor}
          onChange={e => set('credor', e.target.value)}
        />
        <Input
          label={isConsorcio ? 'Valor da carta de crédito (R$)' : 'Valor emprestado (R$)'}
          required
          type="number"
          step="0.01"
          min={0}
          placeholder="0,00"
          value={form.valor_principal}
          onChange={e => set('valor_principal', e.target.value)}
        />

        <div className="col-span-2">
          <Input
            label="Propósito / finalidade"
            placeholder="Ex.: Capital de giro para a obra do Centro"
            value={form.proposito}
            onChange={e => set('proposito', e.target.value)}
          />
        </div>

        <Input
          label="Data de início"
          required
          type="date"
          value={form.data_inicio}
          onChange={e => set('data_inicio', e.target.value)}
        />
        <Input
          label={form.regime === 'juros_saldo' && !isConsorcio ? 'Data limite para quitar' : 'Data limite (opcional)'}
          type="date"
          value={form.data_limite}
          onChange={e => set('data_limite', e.target.value)}
        />
      </div>

      {/* ── Regime / juros (empréstimo) ── */}
      {!isConsorcio && (
        <div className="border border-white/10 rounded-xl p-4 space-y-4 bg-white/[0.02]">
          <Select
            label="Forma de cobrança"
            options={regimeOptions}
            value={form.regime}
            onChange={e => set('regime', e.target.value as EmprestimoRegime)}
          />
          <p className="text-[11px] text-white/40 -mt-2">{regimeDescricao[form.regime]}</p>

          <div className="grid grid-cols-2 gap-4">
            {mostraJuros && (
              <Input
                label="Taxa de juros (% ao mês)"
                type="number"
                step="0.01"
                min={0}
                placeholder="Ex.: 2"
                value={form.taxa_juros_mensal}
                onChange={e => set('taxa_juros_mensal', e.target.value)}
              />
            )}
            {mostraNumParcelas ? (
              <Input
                label="Nº de parcelas"
                type="number"
                min={1}
                placeholder="Ex.: 12"
                value={form.num_parcelas}
                onChange={e => set('num_parcelas', e.target.value)}
              />
            ) : (
              <Input
                label="Nº de meses (ou use a data limite)"
                type="number"
                min={1}
                placeholder="Ex.: 12"
                value={form.num_parcelas}
                onChange={e => set('num_parcelas', e.target.value)}
              />
            )}
            <Input
              label="Dia de vencimento"
              type="number"
              min={1}
              max={31}
              placeholder="Ex.: 10"
              value={form.dia_vencimento}
              onChange={e => set('dia_vencimento', e.target.value)}
            />
          </div>

          {form.regime === 'juros_saldo' && (
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.capitaliza}
                onChange={e => set('capitaliza', e.target.checked)}
                className="mt-0.5 accent-blue-500"
              />
              <span className="text-xs text-white/60">
                <span className="font-medium text-white/80">Capitalizar juros não pagos</span> — se uma
                parcela não for paga, o juros entra no saldo e o mês seguinte rende sobre o novo valor
                (juros compostos). É o caso típico de empréstimo entre pessoas.
              </span>
            </label>
          )}
        </div>
      )}

      {/* ── Consórcio ── */}
      {isConsorcio && (
        <div className="border border-white/10 rounded-xl p-4 space-y-4 bg-white/[0.02]">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Taxa de administração (%)"
              type="number"
              step="0.01"
              min={0}
              placeholder="Ex.: 17"
              value={form.taxa_admin_pct}
              onChange={e => set('taxa_admin_pct', e.target.value)}
            />
            <Input
              label="Fundo de reserva (%)"
              type="number"
              step="0.01"
              min={0}
              placeholder="Ex.: 2"
              value={form.fundo_reserva_pct}
              onChange={e => set('fundo_reserva_pct', e.target.value)}
            />
            <Input
              label="Nº de parcelas"
              required
              type="number"
              min={1}
              placeholder="Ex.: 80"
              value={form.num_parcelas}
              onChange={e => set('num_parcelas', e.target.value)}
            />
            <Input
              label="Dia de vencimento"
              type="number"
              min={1}
              max={31}
              placeholder="Ex.: 10"
              value={form.dia_vencimento}
              onChange={e => set('dia_vencimento', e.target.value)}
            />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.contemplado}
              onChange={e => set('contemplado', e.target.checked)}
              className="accent-purple-500"
            />
            <span className="text-sm text-white/70">Cota já contemplada</span>
          </label>

          {form.contemplado && (
            <div className="grid grid-cols-3 gap-4">
              <Select
                label="Forma"
                options={formaContemplacaoOptions.filter(o => o.value !== 'nao')}
                value={form.forma_contemplacao}
                onChange={e => set('forma_contemplacao', e.target.value as FormaContemplacao)}
              />
              <Input
                label="Data"
                type="date"
                value={form.data_contemplacao}
                onChange={e => set('data_contemplacao', e.target.value)}
              />
              <Input
                label="Valor do lance (R$)"
                type="number"
                step="0.01"
                min={0}
                placeholder="0,00"
                value={form.valor_lance}
                onChange={e => set('valor_lance', e.target.value)}
              />
            </div>
          )}
        </div>
      )}

      {/* Vínculo + status + cor */}
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Status"
          options={statusOptions}
          value={form.status}
          onChange={e => set('status', e.target.value as EmprestimoStatus)}
        />
        <Select
          label="Obra vinculada (opcional)"
          options={[
            { value: '', label: '— Não vinculado —' },
            ...obras.map(o => ({ value: o.id, label: o.name })),
          ]}
          value={form.obra_id}
          onChange={e => set('obra_id', e.target.value)}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-white/40 mb-1.5">Cor</label>
        <div className="flex flex-wrap gap-2">
          {CORES.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => set('cor', c)}
              className={`w-7 h-7 rounded-lg transition-transform ${
                form.cor === c ? 'ring-2 ring-white/70 scale-110' : 'hover:scale-105'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-white/40 mb-1.5">Observações</label>
        <textarea
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors resize-none"
          rows={2}
          placeholder="Condições, garantias, combinados..."
          value={form.observacoes}
          onChange={e => set('observacoes', e.target.value)}
        />
      </div>

      {/* Prévia do cronograma */}
      {preview && (
        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent p-4">
          <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-3">
            Prévia do cronograma
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div>
              <p className="text-lg font-semibold text-white tabular-nums">{preview.n}</p>
              <p className="text-[10px] text-white/40">parcelas</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-white tabular-nums">{fmtCurrency(preview.primeira)}</p>
              <p className="text-[10px] text-white/40">1ª parcela</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-amber-400 tabular-nums">{fmtCurrency(preview.totalJuros)}</p>
              <p className="text-[10px] text-white/40">total de juros</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-white tabular-nums">{fmtCurrency(preview.totalPagar)}</p>
              <p className="text-[10px] text-white/40">total a pagar</p>
            </div>
          </div>
          {isEditing && (
            <p className="text-[11px] text-amber-400/80 mt-3">
              Editar valores não recalcula as parcelas existentes automaticamente. Use “Regenerar
              parcelas” na tela do contrato (apaga pagamentos já lançados).
            </p>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}
    </Modal>
  )
}
