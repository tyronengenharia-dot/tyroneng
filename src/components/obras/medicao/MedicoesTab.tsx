'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  getContratoMedicao,
  getMedidoPorItem,
  getBoletinsComTotais,
  deleteBoletim,
  ContratoBloco,
  MedidoPorItem,
} from '@/services/medicaoService'
import { MedicaoBoletim } from '@/types'
import { Badge, Btn, EmptyState, LoadingSpinner, ProgressBar } from '@/components/ui'
import { fmtCurrency, fmtDate, cn } from '@/lib/utils'
import { EspelhoMedicaoTable } from './EspelhoMedicaoTable'
import { BoletimMedicaoModal } from './BoletimMedicaoModal'

type Props = { obra_id: string }

type BoletimComValor = MedicaoBoletim & { valor: number }
// modal: null = fechado | { boletim: null } = novo | { boletim } = editar
type ModalState = { boletim: MedicaoBoletim | null } | null

export function MedicoesTab({ obra_id }: Props) {
  const [loading, setLoading]   = useState(true)
  const [blocos, setBlocos]     = useState<ContratoBloco[]>([])
  const [medido, setMedido]     = useState<MedidoPorItem>({})
  const [boletins, setBoletins] = useState<BoletimComValor[]>([])
  const [vendaFechada, setVendaFechada] = useState(false)
  const [modal, setModal]       = useState<ModalState>(null)

  const reload = useCallback(async () => {
    const [contrato, med, bols] = await Promise.all([
      getContratoMedicao(obra_id),
      getMedidoPorItem(obra_id),
      getBoletinsComTotais(obra_id),
    ])
    setBlocos(contrato.blocos)
    setVendaFechada(contrato.vendaFechada)
    setMedido(med)
    setBoletins(bols)
  }, [obra_id])

  useEffect(() => {
    let active = true
    Promise.all([
      getContratoMedicao(obra_id),
      getMedidoPorItem(obra_id),
      getBoletinsComTotais(obra_id),
    ]).then(([contrato, med, bols]) => {
      if (!active) return
      setBlocos(contrato.blocos)
      setVendaFechada(contrato.vendaFechada)
      setMedido(med)
      setBoletins(bols)
      setLoading(false)
    })
    return () => { active = false }
  }, [obra_id])

  if (loading) return <LoadingSpinner />

  // ── Totais ──────────────────────────────────────────────────────────────
  const itens = blocos.flatMap(b => b.categorias.flatMap(c => c.itens))
  const totalContratado = itens.reduce((s, it) => s + it.quantidade * it.valor_unitario, 0)
  const totalMedido     = itens.reduce((s, it) => s + (medido[it.id]?.valor ?? 0), 0)
  const saldo           = totalContratado - totalMedido
  const pct             = totalContratado > 0 ? (totalMedido / totalContratado) * 100 : 0

  function handleNovo() {
    if (!vendaFechada) {
      toast.error('Feche a Planilha de Venda para emitir boletins de medição.')
      return
    }
    setModal({ boletim: null })
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este boletim de medição?')) return
    const ok = await deleteBoletim(id)
    if (!ok) { toast.error('Erro ao excluir'); return }
    toast.success('Boletim removido')
    reload()
  }

  return (
    <div className="space-y-4">
      {/* Aviso: Venda não fechada */}
      {!vendaFechada && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
          A Planilha de Venda ainda não foi fechada. Feche-a (aba Plan. Venda) para liberar a emissão de boletins de medição.
        </div>
      )}

      {/* Resumo */}
      <div className="bg-[#0d0d0d] border border-white/[0.08] rounded-2xl p-5">
        <div className="flex items-baseline justify-between mb-3">
          <p className="text-sm font-medium text-white/60">Progresso de Medições</p>
          <span className="text-3xl font-semibold text-green-400">{pct.toFixed(1)}%</span>
        </div>
        <ProgressBar value={pct} color={pct >= 80 ? 'green' : pct >= 40 ? 'blue' : 'amber'} className="h-2 mb-4" />
        <div className="grid grid-cols-4 gap-4 pt-4 border-t border-white/[0.06]">
          <div>
            <p className="text-[11px] text-white/30 mb-1">Total contratado</p>
            <p className="text-sm font-semibold font-mono text-white">{fmtCurrency(totalContratado)}</p>
          </div>
          <div>
            <p className="text-[11px] text-white/30 mb-1">Total medido</p>
            <p className="text-sm font-semibold font-mono text-green-400">{fmtCurrency(totalMedido)}</p>
          </div>
          <div>
            <p className="text-[11px] text-white/30 mb-1">Saldo a receber</p>
            <p className="text-sm font-semibold font-mono text-amber-400">{fmtCurrency(saldo)}</p>
          </div>
          <div>
            <p className="text-[11px] text-white/30 mb-1">Boletins emitidos</p>
            <p className="text-sm font-semibold text-white">{boletins.length}</p>
          </div>
        </div>
      </div>

      {/* Espelho por item */}
      <EspelhoMedicaoTable blocos={blocos} medido={medido} />

      {/* Boletins */}
      <div className="bg-[#0d0d0d] border border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08]">
          <p className="text-sm font-medium text-white/60">Boletins de Medição</p>
          <Btn variant="primary" onClick={handleNovo} disabled={!vendaFechada} title={!vendaFechada ? 'Feche a Venda primeiro' : undefined}>
            + Novo Boletim
          </Btn>
        </div>

        {boletins.length === 0 ? (
          <EmptyState message="Nenhum boletim de medição emitido" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.08]">
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider">Boletim</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider">Período</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider">Data</th>
                <th className="px-5 py-3 text-right text-[10px] font-semibold text-white/30 uppercase tracking-wider">Valor</th>
                <th className="px-5 py-3 text-right text-[10px] font-semibold text-white/30 uppercase tracking-wider">% Contrato</th>
                <th className="px-5 py-3 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {boletins.map(b => {
                const pctB = totalContratado > 0 ? (b.valor / totalContratado) * 100 : 0
                return (
                  <tr key={b.id} className="border-t border-white/[0.05] hover:bg-white/[0.02] group cursor-pointer" onClick={() => setModal({ boletim: b })}>
                    <td className="px-5 py-3.5 font-mono font-semibold text-white/80 text-xs">
                      #BM-{String(b.numero).padStart(3, '0')}
                    </td>
                    <td className="px-5 py-3.5 text-white/40 text-xs">{b.periodo || '—'}</td>
                    <td className="px-5 py-3.5 text-white/40 text-xs">{fmtDate(b.data_medicao)}</td>
                    <td className="px-5 py-3.5 text-right font-mono text-green-400">{fmtCurrency(b.valor)}</td>
                    <td className="px-5 py-3.5 text-right font-mono text-white/50 text-xs">{pctB.toFixed(1)}%</td>
                    <td className="px-5 py-3.5"><Badge value={b.status} /></td>
                    <td className="px-5 py-3.5">
                      <div className={cn('flex gap-1 justify-end opacity-0 group-hover:opacity-100')} onClick={e => e.stopPropagation()}>
                        <Btn onClick={() => setModal({ boletim: b })}>{b.status === 'rascunho' ? 'Editar' : 'Ver'}</Btn>
                        <Btn variant="danger" onClick={() => handleDelete(b.id)}>✕</Btn>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <BoletimMedicaoModal
          obra_id={obra_id}
          boletim={modal.boletim}
          onClose={() => setModal(null)}
          onSaved={reload}
        />
      )}
    </div>
  )
}
