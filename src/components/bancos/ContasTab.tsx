'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, ArrowRightLeft, ListFilter } from 'lucide-react'
import { Btn, EmptyState } from '@/components/ui'
import { ContaComSaldo, BancoConta } from '@/types/banco'
import { deleteConta } from '@/services/bancoService'
import { contaTipoLabels } from '@/lib/bancoConstants'
import { fmtCurrency } from '@/lib/utils'
import { ContaModal } from './ContaModal'

interface Props {
  contas: ContaComSaldo[]
  onRefresh: () => void
  onVerMovimentacoes: (contaId: string) => void
  onTransferir: () => void
}

export function ContasTab({
  contas,
  onRefresh,
  onVerMovimentacoes,
  onTransferir,
}: Props) {
  const [openModal, setOpenModal] = useState(false)
  const [selected, setSelected] = useState<BancoConta | null>(null)

  function openNew() {
    setSelected(null)
    setOpenModal(true)
  }
  function openEdit(c: BancoConta) {
    setSelected(c)
    setOpenModal(true)
  }

  async function handleDelete(c: ContaComSaldo) {
    if (
      !confirm(
        `Excluir a conta "${c.nome}"?\n\nTODAS as movimentações dela serão removidas. Esta ação não pode ser desfeita.`
      )
    )
      return
    const { error } = await deleteConta(c.id)
    if (error) {
      alert(error)
      return
    }
    onRefresh()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-end gap-2">
        <Btn variant="ghost" size="md" onClick={onTransferir} disabled={contas.length < 2}>
          <ArrowRightLeft size={15} /> Transferência
        </Btn>
        <Btn variant="primary" size="md" onClick={openNew}>
          <Plus size={15} /> Nova conta
        </Btn>
      </div>

      {contas.length === 0 ? (
        <EmptyState message='Nenhuma conta cadastrada. Clique em "Nova conta" para começar.' />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {contas.map(c => {
            const temPrevisto = c.saldo_previsto !== c.saldo_atual
            return (
              <div
                key={c.id}
                className={`relative bg-[#111] border border-white/[0.08] rounded-2xl p-5 overflow-hidden ${
                  c.ativo ? '' : 'opacity-50'
                }`}
              >
                <span
                  className="absolute top-0 left-0 bottom-0 w-1"
                  style={{ backgroundColor: c.cor }}
                />

                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-white truncate">{c.nome}</h3>
                    <p className="text-[11px] text-white/40 mt-0.5">
                      {contaTipoLabels[c.tipo]}
                      {c.banco ? ` · ${c.banco}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button
                      onClick={() => openEdit(c)}
                      className="w-7 h-7 rounded-lg hover:bg-white/8 flex items-center justify-center text-blue-400 transition-colors"
                      title="Editar"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(c)}
                      className="w-7 h-7 rounded-lg hover:bg-white/8 flex items-center justify-center text-red-400 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">
                  Saldo atual
                </p>
                <p
                  className={`text-2xl font-semibold tracking-tight ${
                    c.saldo_atual >= 0 ? 'text-white' : 'text-red-400'
                  }`}
                >
                  {fmtCurrency(c.saldo_atual)}
                </p>

                {temPrevisto && (
                  <p className="text-[11px] text-white/40 mt-1">
                    Previsto:{' '}
                    <span
                      className={
                        c.saldo_previsto >= 0 ? 'text-white/60' : 'text-red-400'
                      }
                    >
                      {fmtCurrency(c.saldo_previsto)}
                    </span>
                  </p>
                )}

                {(c.agencia || c.numero_conta) && (
                  <p className="text-[11px] text-white/30 mt-2 font-mono">
                    {c.agencia ? `Ag. ${c.agencia}` : ''}
                    {c.agencia && c.numero_conta ? ' · ' : ''}
                    {c.numero_conta ? `Cc. ${c.numero_conta}` : ''}
                  </p>
                )}

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.06]">
                  <span className="text-[11px] text-white/40">
                    {c.qtd_realizados} lançamento{c.qtd_realizados === 1 ? '' : 's'}
                    {c.qtd_previstos > 0 && (
                      <span className="text-amber-400/80"> · {c.qtd_previstos} previsto{c.qtd_previstos === 1 ? '' : 's'}</span>
                    )}
                  </span>
                  <button
                    onClick={() => onVerMovimentacoes(c.id)}
                    className="inline-flex items-center gap-1 text-[11px] text-white/50 hover:text-white transition-colors"
                  >
                    <ListFilter size={12} /> Ver extrato
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {openModal && (
        <ContaModal
          conta={selected}
          onClose={() => setOpenModal(false)}
          onSaved={() => {
            setOpenModal(false)
            onRefresh()
          }}
        />
      )}
    </div>
  )
}
