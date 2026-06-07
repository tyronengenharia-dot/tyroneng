'use client'

import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  getContratoMedicao,
  getMedidoPorItem,
  getMedicaoItens,
  criarBoletim,
  updateBoletim,
  salvarMedicaoItens,
  uploadComprovante,
  removeComprovante,
  ContratoBloco,
  MedidoPorItem,
} from '@/services/medicaoService'
import { getContas } from '@/services/bancoService'
import { MedicaoBoletim, MedicaoBoletimStatus } from '@/types'
import { ContaComSaldo } from '@/types/banco'
import { Modal, Btn, Input, Select, LoadingSpinner } from '@/components/ui'
import {
  ContaComprovanteFields,
  faltaContaOuComprovante,
} from '@/components/financeiro/ContaComprovanteFields'
import { fmt, fmtCurrency, fmtDateShort, cn } from '@/lib/utils'

type Props = {
  obra_id: string
  /** null = novo boletim */
  boletim: MedicaoBoletim | null
  onClose: () => void
  onSaved: () => void
}

const num = (s: string) => {
  const v = parseFloat(s)
  return isNaN(v) ? 0 : v
}

export function BoletimMedicaoModal({ obra_id, boletim, onClose, onSaved }: Props) {
  const editavel = !boletim || boletim.status === 'rascunho'

  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [blocos, setBlocos]   = useState<ContratoBloco[]>([])
  const [anterior, setAnterior] = useState<MedidoPorItem>({})
  const [qty, setQty]         = useState<Record<string, string>>({})

  // Recebimento (quando status='pago'): conta que recebeu + comprovante.
  const [contas, setContas]   = useState<ContaComSaldo[]>([])
  const [contaId, setContaId] = useState<string | null>(boletim?.conta_id ?? null)
  const [comp, setComp] = useState<{ url: string | null; path: string | null }>({
    url: boletim?.comprovante_url ?? null,
    path: boletim?.comprovante_path ?? null,
  })

  const [form, setForm] = useState({
    periodo:      boletim?.periodo ?? fmtDateShort(new Date().toISOString().slice(0, 10)),
    data_medicao: boletim?.data_medicao ?? new Date().toISOString().slice(0, 10),
    status:       (boletim?.status ?? 'rascunho') as MedicaoBoletimStatus,
    observacao:   boletim?.observacao ?? '',
  })
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    let active = true
    Promise.all([
      getContratoMedicao(obra_id),
      getMedidoPorItem(obra_id, boletim?.id),
      boletim ? getMedicaoItens(boletim.id) : Promise.resolve([]),
      getContas(),
    ]).then(([contrato, ant, itens, contasList]) => {
      if (!active) return
      setBlocos(contrato.blocos)
      setAnterior(ant)
      const initial: Record<string, string> = {}
      for (const it of itens) initial[it.planilha_item_id] = String(it.quantidade)
      setQty(initial)
      setContas(contasList)
      setLoading(false)
    })
    return () => { active = false }
  }, [obra_id, boletim])

  // Mapa de itens do contrato (para snapshot de preço ao salvar)
  const itensContrato = blocos.flatMap(b => b.categorias.flatMap(c => c.itens))

  function totalDoBoletim() {
    return itensContrato.reduce((sum, it) => sum + num(qty[it.id] ?? '') * it.valor_unitario, 0)
  }

  function preencherSaldo() {
    if (!editavel) return
    const next: Record<string, string> = {}
    for (const it of itensContrato) {
      const ant = anterior[it.id]?.qtd ?? 0
      const saldo = it.quantidade - ant
      next[it.id] = saldo > 0 ? String(Number(saldo.toFixed(6))) : '0'
    }
    setQty(next)
  }

  async function handleSave() {
    // Caixa unificado: medição paga = receita realizada → precisa de conta + comprovante.
    if (form.status === 'pago' && faltaContaOuComprovante(contaId, comp.url)) {
      toast.error('Para marcar a medição como paga, informe a conta que recebeu e anexe o comprovante.')
      return
    }
    setSaving(true)
    try {
      const linhas = itensContrato
        .map(it => ({ planilha_item_id: it.id, quantidade: num(qty[it.id] ?? ''), valor_unitario: it.valor_unitario }))
        .filter(l => l.quantidade > 0)

      let boletimId = boletim?.id ?? null

      if (!boletimId) {
        const { id, error } = await criarBoletim(obra_id, form.periodo || null, form.data_medicao)
        if (error || !id) { toast.error(error ?? 'Erro ao emitir boletim'); setSaving(false); return }
        boletimId = id
      }

      const recebimento =
        form.status === 'pago'
          ? {
              conta_id: contaId,
              data_pagamento: form.data_medicao || new Date().toISOString().slice(0, 10),
              comprovante_url: comp.url,
              comprovante_path: comp.path,
            }
          : {
              conta_id: null,
              data_pagamento: null,
              comprovante_url: null,
              comprovante_path: null,
            }

      const okHeader = await updateBoletim(boletimId, {
        periodo:      form.periodo || null,
        data_medicao: form.data_medicao,
        status:       form.status,
        observacao:   form.observacao || null,
        ...recebimento,
      })
      const okItens = await salvarMedicaoItens(boletimId, linhas)

      if (!okHeader || !okItens) { toast.error('Boletim salvo parcialmente — verifique os dados'); setSaving(false); return }

      toast.success('Boletim salvo!')
      onSaved()
      onClose()
    } catch (e) {
      console.error('handleSave boletim error:', e)
      toast.error('Erro ao salvar o boletim')
      setSaving(false)
    }
  }

  const titulo = boletim
    ? `Boletim de Medição Nº ${String(boletim.numero).padStart(3, '0')}`
    : 'Novo Boletim de Medição'

  return (
    <Modal
      title={titulo}
      subtitle={editavel ? 'Informe a quantidade medida de cada item neste período' : 'Boletim já aprovado/pago — somente leitura'}
      onClose={onClose}
      width="max-w-5xl"
      footer={
        <>
          <div className="mr-auto text-left">
            <p className="text-[10px] text-white/30 uppercase tracking-wider">Total deste boletim</p>
            <p className="text-lg font-semibold font-mono text-green-400">{fmtCurrency(totalDoBoletim())}</p>
          </div>
          <Btn onClick={onClose}>{editavel ? 'Cancelar' : 'Fechar'}</Btn>
          {editavel && (
            <Btn variant="primary" size="md" onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar boletim'}
            </Btn>
          )}
        </>
      }
    >
      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* Cabeçalho do boletim */}
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Período" placeholder="Ex: jul/26"
              value={form.periodo} disabled={!editavel}
              onChange={e => set('periodo', e.target.value)}
            />
            <Input
              label="Data da medição" type="date"
              value={form.data_medicao} disabled={!editavel}
              onChange={e => set('data_medicao', e.target.value)}
            />
            <Select
              label="Status" value={form.status} disabled={!editavel}
              onChange={e => set('status', e.target.value)}
              options={[
                { value: 'rascunho', label: 'Rascunho' },
                { value: 'aprovado', label: 'Aprovado (a receber)' },
                { value: 'pago',     label: 'Pago (recebido)' },
              ]}
            />
          </div>

          {form.status === 'pago' && (
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 space-y-2">
              <p className="text-[11px] text-white/40">
                Medição paga = receita realizada: informe a conta que recebeu e anexe o
                comprovante.
              </p>
              <ContaComprovanteFields
                contas={contas}
                contaId={contaId}
                onContaChange={setContaId}
                comprovanteUrl={comp.url}
                comprovantePath={comp.path}
                onComprovanteChange={setComp}
                upload={f => uploadComprovante(f, obra_id)}
                removeStored={removeComprovante}
                required
                disabled={!editavel}
                contaLabel="Conta que recebeu"
              />
            </div>
          )}

          {itensContrato.length === 0 ? (
            <div className="py-10 text-center text-sm text-white/30">
              Nenhum item de contrato para medir. Feche a Planilha de Venda primeiro.
            </div>
          ) : (
            <>
              {editavel && (
                <div className="flex justify-end">
                  <Btn onClick={preencherSaldo}>Preencher com o saldo</Btn>
                </div>
              )}

              <div className="overflow-x-auto border border-white/[0.08] rounded-xl">
                <table className="w-full text-sm" style={{ minWidth: 760 }}>
                  <thead className="border-b border-white/[0.08]">
                    <tr>
                      <th className="px-3 py-2 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider">Descrição</th>
                      <th className="px-3 py-2 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider">Un.</th>
                      <th className="px-3 py-2 text-right text-[10px] font-semibold text-white/30 uppercase tracking-wider">Contratado</th>
                      <th className="px-3 py-2 text-right text-[10px] font-semibold text-white/30 uppercase tracking-wider">Medido ant.</th>
                      <th className="px-3 py-2 text-right text-[10px] font-semibold text-white/30 uppercase tracking-wider">Medir agora</th>
                      <th className="px-3 py-2 text-right text-[10px] font-semibold text-white/30 uppercase tracking-wider">Saldo após</th>
                      <th className="px-3 py-2 text-right text-[10px] font-semibold text-white/30 uppercase tracking-wider">R$ agora</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blocos.map(bloco => {
                      if (!bloco.categorias.some(c => c.itens.length > 0)) return null
                      return (
                        <React.Fragment key={bloco.planilha_id}>
                          <tr className="bg-[#15161c] border-y border-white/[0.08]">
                            <td colSpan={7} className="px-3 py-1.5">
                              <span className={cn(
                                'text-[11px] font-semibold uppercase tracking-wider',
                                bloco.tipo === 'venda' ? 'text-blue-300' : 'text-purple-300'
                              )}>{bloco.label}</span>
                            </td>
                          </tr>
                          {bloco.categorias.map(cat => {
                            if (cat.itens.length === 0) return null
                            return (
                              <React.Fragment key={cat.id}>
                                <tr className="bg-[#111]">
                                  <td colSpan={7} className="px-3 py-1 text-xs font-semibold text-white/50">{cat.nome}</td>
                                </tr>
                                {cat.itens.map(it => {
                                  const ant = anterior[it.id]?.qtd ?? 0
                                  const atual = num(qty[it.id] ?? '')
                                  const saldoApos = it.quantidade - ant - atual
                                  const over = saldoApos < -0.000001
                                  return (
                                    <tr key={it.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                                      <td className="px-3 py-1.5 text-white/70">
                                        <span className="text-white/30 text-[11px] font-mono mr-1.5">{it.codigo || '—'}</span>
                                        {it.descricao || '—'}
                                      </td>
                                      <td className="px-3 py-1.5 text-white/40 text-xs">{it.unidade || '—'}</td>
                                      <td className="px-3 py-1.5 text-right font-mono text-white/60 text-xs">{fmt(it.quantidade)}</td>
                                      <td className="px-3 py-1.5 text-right font-mono text-white/40 text-xs">{fmt(ant)}</td>
                                      <td className="px-3 py-1.5 text-right w-28">
                                        <input
                                          type="number"
                                          value={qty[it.id] ?? ''}
                                          readOnly={!editavel}
                                          placeholder="0"
                                          onChange={e => setQty(p => ({ ...p, [it.id]: e.target.value }))}
                                          className={cn(
                                            'w-24 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-right text-sm text-white',
                                            'focus:outline-none focus:border-white/30 transition-colors',
                                            over && 'border-red-500/40 text-red-300',
                                            !editavel && 'opacity-60 cursor-default'
                                          )}
                                        />
                                      </td>
                                      <td className={cn(
                                        'px-3 py-1.5 text-right font-mono text-xs',
                                        over ? 'text-red-400' : 'text-white/50'
                                      )}>{fmt(saldoApos)}</td>
                                      <td className="px-3 py-1.5 text-right font-mono text-green-400 text-xs">
                                        {fmtCurrency(atual * it.valor_unitario)}
                                      </td>
                                    </tr>
                                  )
                                })}
                              </React.Fragment>
                            )
                          })}
                        </React.Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <Input
                label="Observação"
                placeholder="Observações da medição (opcional)"
                value={form.observacao} disabled={!editavel}
                onChange={e => set('observacao', e.target.value)}
              />
            </>
          )}
        </>
      )}
    </Modal>
  )
}
