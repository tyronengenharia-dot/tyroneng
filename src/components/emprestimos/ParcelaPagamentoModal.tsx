'use client'

import { useEffect, useState } from 'react'
import { Upload, FileText, X } from 'lucide-react'
import { Modal, Input, Select, Btn } from '@/components/ui'
import { Emprestimo, EmprestimoParcela, FormaPagamento } from '@/types/emprestimo'
import { ContaComSaldo } from '@/types/banco'
import { registrarPagamento, uploadAnexo } from '@/services/emprestimoService'
import { getContas } from '@/services/bancoService'
import { formaPagamentoOptions } from '@/lib/emprestimoConstants'
import { encargosAtraso } from '@/lib/emprestimoCalc'
import { fmtCurrency, fmtDate } from '@/lib/utils'

interface Props {
  contrato: Emprestimo
  parcela: EmprestimoParcela
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

export function ParcelaPagamentoModal({ contrato, parcela, onClose, onSaved }: Props) {
  const restante = Math.max(0, parcela.valor_total - parcela.valor_pago)
  const enc = encargosAtraso(parcela, contrato)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [contas, setContas] = useState<ContaComSaldo[]>([])
  const [contaId, setContaId] = useState<string | null>(
    parcela.conta_id ?? contrato.conta_id ?? null,
  )

  useEffect(() => {
    let active = true
    getContas().then(cs => { if (active) setContas(cs) })
    return () => { active = false }
  }, [])

  const [form, setForm] = useState({
    valor_pago: (parcela.valor_pago || restante || parcela.valor_total).toString(),
    valor_encargos: (parcela.valor_encargos || enc.total || 0).toString(),
    data_pagamento: parcela.data_pagamento ?? hoje(),
    forma_pagamento: (parcela.forma_pagamento ?? 'pix') as FormaPagamento,
    observacoes: parcela.observacoes ?? '',
  })

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function salvar(valorPago: number, limpar = false) {
    // Caixa unificado: pagar a parcela é uma saída de caixa → conta + comprovante.
    if (!limpar) {
      if (!contaId) { setError('Escolha a conta de onde a parcela foi paga.'); return }
      if (!file && !parcela.comprovante_url) {
        setError('Anexe o comprovante do pagamento.')
        return
      }
    }
    setSaving(true)
    setError(null)

    let comprovante_url = parcela.comprovante_url ?? null
    let comprovante_path = parcela.comprovante_path ?? null

    if (file && !limpar) {
      try {
        const up = await uploadAnexo(file, contrato.id)
        comprovante_url = up.url
        comprovante_path = up.path
      } catch (e) {
        setSaving(false)
        setError(e instanceof Error ? e.message : 'Falha no upload do comprovante.')
        return
      }
    }

    const { error } = await registrarPagamento(contrato, parcela.id, {
      valor_pago: valorPago,
      valor_encargos: limpar ? 0 : num(form.valor_encargos),
      data_pagamento: limpar ? null : form.data_pagamento || hoje(),
      forma_pagamento: limpar ? null : form.forma_pagamento,
      conta_id: limpar ? null : contaId,
      comprovante_url: limpar ? null : comprovante_url,
      comprovante_path: limpar ? null : comprovante_path,
      observacoes: form.observacoes.trim() || null,
    })

    setSaving(false)
    if (error) return setError(error)
    onSaved()
  }

  return (
    <Modal
      title={`Pagamento — parcela ${parcela.numero}`}
      subtitle={`Vencimento ${fmtDate(parcela.vencimento)}`}
      onClose={onClose}
      width="max-w-lg"
      footer={
        <>
          {parcela.valor_pago > 0 && (
            <Btn variant="danger" size="md" onClick={() => salvar(0, true)} disabled={saving}>
              Limpar pagamento
            </Btn>
          )}
          <Btn variant="ghost" size="md" onClick={onClose}>
            Cancelar
          </Btn>
          <Btn
            variant="primary"
            size="md"
            onClick={() => salvar(num(form.valor_pago))}
            disabled={saving}
          >
            {saving ? 'Salvando...' : 'Registrar'}
          </Btn>
        </>
      }
    >
      {/* composição da parcela */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-white/[0.03] rounded-xl py-2.5">
          <p className="text-[10px] text-white/40 uppercase tracking-wider">Saldo base</p>
          <p className="text-sm font-semibold text-white/80 tabular-nums">
            {fmtCurrency(parcela.saldo_inicial)}
          </p>
        </div>
        <div className="bg-white/[0.03] rounded-xl py-2.5">
          <p className="text-[10px] text-white/40 uppercase tracking-wider">Juros</p>
          <p className="text-sm font-semibold text-amber-400 tabular-nums">
            {fmtCurrency(parcela.valor_juros)}
          </p>
        </div>
        <div className="bg-white/[0.03] rounded-xl py-2.5">
          <p className="text-[10px] text-white/40 uppercase tracking-wider">Total devido</p>
          <p className="text-sm font-semibold text-white tabular-nums">
            {fmtCurrency(parcela.valor_total)}
          </p>
        </div>
      </div>

      {/* encargos de atraso */}
      {enc.dias > 0 && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-400">
              Parcela vencida há {enc.dias} dia{enc.dias === 1 ? '' : 's'}
            </span>
            <span className="text-sm font-semibold text-red-400 tabular-nums">
              + {fmtCurrency(enc.total)}
            </span>
          </div>
          <p className="text-[11px] text-white/40 mt-1">
            Multa {fmtCurrency(enc.multa)} + mora {fmtCurrency(enc.mora)}. Total a pagar hoje:{' '}
            <span className="text-white/70 font-medium">{fmtCurrency(restante + enc.total)}</span>
          </p>
        </div>
      )}

      {/* atalhos */}
      <div className="flex flex-wrap gap-2">
        <Btn variant="ghost" size="sm" onClick={() => set('valor_pago', parcela.valor_total.toString())}>
          Valor total ({fmtCurrency(parcela.valor_total)})
        </Btn>
        {restante > 0 && restante !== parcela.valor_total && (
          <Btn variant="ghost" size="sm" onClick={() => set('valor_pago', restante.toString())}>
            Restante ({fmtCurrency(restante)})
          </Btn>
        )}
        {parcela.valor_juros > 0 && (
          <Btn variant="ghost" size="sm" onClick={() => set('valor_pago', parcela.valor_juros.toString())}>
            Só os juros ({fmtCurrency(parcela.valor_juros)})
          </Btn>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Valor pago (R$)"
          required
          type="number"
          step="0.01"
          min={0}
          value={form.valor_pago}
          onChange={e => set('valor_pago', e.target.value)}
        />
        <Input
          label="Multa + mora pagos (R$)"
          type="number"
          step="0.01"
          min={0}
          value={form.valor_encargos}
          onChange={e => set('valor_encargos', e.target.value)}
        />
        <Input
          label="Data do pagamento"
          type="date"
          value={form.data_pagamento}
          onChange={e => set('data_pagamento', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Forma de pagamento"
          options={formaPagamentoOptions}
          value={form.forma_pagamento}
          onChange={e => set('forma_pagamento', e.target.value as FormaPagamento)}
        />
        <Select
          label="Conta de saída *"
          options={[
            { value: '', label: 'Selecione a conta…' },
            ...contas.map(c => ({ value: c.id, label: c.nome })),
          ]}
          value={contaId ?? ''}
          onChange={e => setContaId(e.target.value || null)}
        />
      </div>

      {/* comprovante */}
      <div>
        <label className="block text-xs font-medium text-white/40 mb-1.5">Comprovante</label>
        {file ? (
          <div className="flex items-center justify-between gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5">
            <span className="inline-flex items-center gap-2 text-sm text-white/70 truncate">
              <FileText size={14} className="text-white/40 flex-shrink-0" />
              <span className="truncate">{file.name}</span>
            </span>
            <button onClick={() => setFile(null)} className="text-white/40 hover:text-white">
              <X size={15} />
            </button>
          </div>
        ) : (
          <label className="flex items-center justify-center gap-2 bg-white/5 border border-dashed border-white/15 rounded-xl px-3 py-3 text-sm text-white/40 cursor-pointer hover:bg-white/[0.07] transition-colors">
            <Upload size={15} />
            {parcela.comprovante_url ? 'Substituir comprovante' : 'Anexar comprovante (PDF/imagem)'}
            <input
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
        )}
        {parcela.comprovante_url && !file && (
          <a
            href={parcela.comprovante_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-[11px] text-blue-400 hover:underline mt-1.5"
          >
            Ver comprovante atual
          </a>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-white/40 mb-1.5">Observações</label>
        <textarea
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors resize-none"
          rows={2}
          value={form.observacoes}
          onChange={e => set('observacoes', e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
    </Modal>
  )
}
