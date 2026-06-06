'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Modal, Btn } from '@/components/ui'
import { fmtCurrency } from '@/lib/utils'
import { BdiConfig, BDI_ZERO, bdiFator, bdiPct, bdiValido } from '@/lib/bdi'
import { getBdiConfig, upsertBdiConfig, aplicarBdiNaVenda } from '@/services/bdiService'
import { getItensByObra, calcTotalItens } from '@/services/planilhaService'

type CampoKey = keyof BdiConfig

const CAMPOS: { key: CampoKey; label: string; hint?: string }[] = [
  { key: 'lucro',                label: 'Lucro',                hint: 'Margem de lucro desejada' },
  { key: 'impostos',             label: 'Impostos',             hint: 'PIS, COFINS, ISS, CPRB (incide sobre a venda)' },
  { key: 'administracao',        label: 'Administração central',hint: 'Custos administrativos da empresa' },
  { key: 'despesas_financeiras', label: 'Despesas financeiras', hint: 'Custo de capital / antecipação' },
  { key: 'risco',                label: 'Risco',                hint: 'Imprevistos e contingências' },
  { key: 'perdas',               label: 'Perdas',               hint: 'Desperdício de material / retrabalho' },
  { key: 'seguro_garantia',      label: 'Seguro / Garantia',    hint: 'Seguros e garantias contratuais' },
]

interface Props {
  obra_id: string
  onClose: () => void
  onAplicado: () => void
}

export function BdiModal({ obra_id, onClose, onAplicado }: Props) {
  const [config, setConfig]     = useState<BdiConfig>({ ...BDI_ZERO })
  const [custoTotal, setCustoTotal] = useState<number | null>(null)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([
      getBdiConfig(obra_id),
      getItensByObra(obra_id, 'custo_planejado'),
    ]).then(([cfg, custoItens]) => {
      if (!active) return
      setConfig(cfg)
      setCustoTotal(calcTotalItens(custoItens))
      setLoading(false)
    })
    return () => { active = false }
  }, [obra_id])

  function setCampo(k: CampoKey, v: string) {
    const n = v === '' ? 0 : parseFloat(v)
    setConfig(prev => ({ ...prev, [k]: Number.isNaN(n) ? 0 : n }))
  }

  const fator   = bdiFator(config)
  const pct     = bdiPct(config)
  const valido  = bdiValido(config)
  const vendaTotal = custoTotal != null && valido ? custoTotal * fator : null

  async function handleSalvar() {
    setSaving(true)
    const { error } = await upsertBdiConfig(obra_id, config)
    setSaving(false)
    if (error) { toast.error(error); return }
    toast.success('BDI salvo.')
  }

  async function handleAplicar() {
    if (!valido) { toast.error('BDI inválido — verifique os impostos (< 100%).'); return }
    setApplying(true)
    // Salva a config e aplica na venda numa tacada
    const save = await upsertBdiConfig(obra_id, config)
    if (save.error) { setApplying(false); toast.error(save.error); return }
    const res = await aplicarBdiNaVenda(obra_id, config)
    setApplying(false)
    if (res.error) { toast.error(res.error); return }
    toast.success(
      `Venda atualizada: ${res.criados} criado(s), ${res.atualizados} reprecificado(s).`
    )
    onAplicado()
    onClose()
  }

  return (
    <Modal
      title="BDI da Venda"
      subtitle="Calcule o BDI a partir dos componentes e aplique sobre o Custo Planejado"
      onClose={() => { if (!saving && !applying) onClose() }}
      width="max-w-lg"
      footer={
        <>
          <Btn variant="ghost" size="md" onClick={handleSalvar} disabled={saving || applying || loading}>
            {saving ? 'Salvando…' : 'Salvar BDI'}
          </Btn>
          <Btn variant="primary" size="md" onClick={handleAplicar} disabled={applying || loading || !valido}>
            {applying ? 'Aplicando…' : 'Aplicar à Venda'}
          </Btn>
        </>
      }
    >
      {loading ? (
        <p className="text-sm text-white/40 py-6 text-center">Carregando…</p>
      ) : (
        <>
          {/* Campos */}
          <div className="grid grid-cols-2 gap-3">
            {CAMPOS.map(c => (
              <div key={c.key}>
                <label className="block text-xs font-medium text-white/50 mb-1">{c.label}</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={config[c.key] === 0 ? '' : config[c.key]}
                    onChange={e => setCampo(c.key, e.target.value)}
                    placeholder="0"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-3 pr-7 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-xs">%</span>
                </div>
                {c.hint && <p className="text-[10px] text-white/25 mt-1 leading-tight">{c.hint}</p>}
              </div>
            ))}
          </div>

          {/* Resultado BDI */}
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-4 mt-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/40">BDI calculado</p>
                <p className="text-[10px] text-white/25 mt-0.5">Fórmula oficial (TCU)</p>
              </div>
              <p className={`text-3xl font-semibold font-mono ${valido ? 'text-green-400' : 'text-red-400'}`}>
                {valido ? `${pct.toFixed(2)}%` : '—'}
              </p>
            </div>

            {!valido && (
              <p className="text-[11px] text-red-400/80 mt-2">
                Impostos devem ser menores que 100%.
              </p>
            )}

            {custoTotal != null && (
              <div className="border-t border-white/[0.08] mt-3 pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-white/40">Custo total</span>
                  <span className="font-mono text-white/70">{fmtCurrency(custoTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Fator</span>
                  <span className="font-mono text-white/70">{valido ? fator.toFixed(4) : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60 font-medium">Venda (itens do custo)</span>
                  <span className="font-mono font-semibold text-green-400">
                    {vendaTotal != null ? fmtCurrency(vendaTotal) : '—'}
                  </span>
                </div>
              </div>
            )}
          </div>

          <p className="text-[11px] text-white/30 leading-relaxed">
            <strong className="text-white/45">Aplicar à Venda</strong> recalcula o valor unitário dos
            itens que vieram do Custo. Itens adicionados ou editados manualmente na Venda permanecem
            intactos. Novos itens do Custo são incluídos automaticamente.
          </p>
        </>
      )}
    </Modal>
  )
}
