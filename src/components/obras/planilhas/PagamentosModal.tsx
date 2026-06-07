'use client'

import { useEffect, useState, type ChangeEvent } from 'react'
import { toast } from 'sonner'
import { PlanilhaItem, CustoRealPagamento, PagamentoStatus } from '@/types'
import {
  getPagamentosByItem,
  createPagamento,
  updatePagamento,
  deletePagamento,
  uploadComprovante,
  removeComprovante,
  resumoPagamentos,
} from '@/services/custoRealPagamentoService'
import { Modal, Btn, LoadingSpinner } from '@/components/ui'
import { fmtCurrency, cn } from '@/lib/utils'

const STATUS_OPTS: { value: PagamentoStatus; label: string }[] = [
  { value: 'pago', label: 'Pago' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'atrasado', label: 'Atrasado' },
]

const cellInput =
  'bg-transparent w-full text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:bg-white/5 rounded px-1.5 py-1 transition-colors read-only:cursor-default read-only:text-white/50'

type Props = {
  item: PlanilhaItem
  obra_id: string
  editavel: boolean
  onClose: () => void
  /** avisa o pai (Custo Real) que os pagamentos mudaram, para recarregar os totais */
  onChanged: () => void
}

export function PagamentosModal({ item, obra_id, editavel, onClose, onChanged }: Props) {
  const [pagamentos, setPagamentos] = useState<CustoRealPagamento[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const itemTotal = (Number(item.quantidade) || 0) * (Number(item.valor_unitario) || 0)

  useEffect(() => {
    let active = true
    getPagamentosByItem(item.id).then(list => {
      if (!active) return
      setPagamentos(list)
      setLoading(false)
    })
    return () => { active = false }
  }, [item.id])

  function patchLocal(id: string, patch: Partial<CustoRealPagamento>) {
    setPagamentos(prev => prev.map(p => (p.id === id ? { ...p, ...patch } : p)))
  }

  async function persist(p: CustoRealPagamento, patch: Partial<CustoRealPagamento>) {
    const ok = await updatePagamento(p.id, patch)
    if (!ok) { toast.error('Erro ao salvar a parcela'); return }
    onChanged()
  }

  async function handleAdd() {
    if (!editavel) return
    setBusy(true)
    const created = await createPagamento({
      planilha_item_id: item.id,
      obra_id,
      descricao: '',
      valor: 0,
      data: null,
      status: 'pendente',
    })
    setBusy(false)
    if (!created) { toast.error('Erro ao adicionar parcela'); return }
    setPagamentos(prev => [...prev, created])
    onChanged()
  }

  async function handleDelete(p: CustoRealPagamento) {
    if (!editavel) return
    if (!confirm('Excluir esta parcela?')) return
    const ok = await deletePagamento(p.id, p.comprovante_path)
    if (!ok) { toast.error('Erro ao excluir'); return }
    setPagamentos(prev => prev.filter(x => x.id !== p.id))
    onChanged()
  }

  async function handlePickFile(p: CustoRealPagamento, e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = '' // permite re-selecionar o mesmo arquivo
    if (!f) return
    if (!f.type.startsWith('image/')) { toast.error('Envie uma imagem (foto do comprovante).'); return }
    if (f.size > 8 * 1024 * 1024) { toast.error('Imagem muito grande (máx. 8 MB).'); return }
    setBusy(true)
    try {
      const up = await uploadComprovante(f, obra_id)
      if (p.comprovante_path) await removeComprovante(p.comprovante_path)
      patchLocal(p.id, { comprovante_url: up.url, comprovante_path: up.path })
      await persist(p, { comprovante_url: up.url, comprovante_path: up.path })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro no upload')
    } finally {
      setBusy(false)
    }
  }

  async function handleRemoveFoto(p: CustoRealPagamento) {
    if (!editavel || !p.comprovante_path) return
    await removeComprovante(p.comprovante_path)
    patchLocal(p.id, { comprovante_url: null, comprovante_path: null })
    await persist(p, { comprovante_url: null, comprovante_path: null })
  }

  const resumo = resumoPagamentos(pagamentos)
  const diff = resumo.total - itemTotal // >0 sobra, <0 falta
  const bate = Math.abs(diff) < 0.005

  const titulo = `${item.codigo ? item.codigo + ' — ' : ''}${item.descricao || 'Item de Custo Real'}`

  return (
    <Modal
      title="Pagamentos do item"
      subtitle={titulo}
      width="max-w-3xl"
      onClose={onClose}
      footer={<Btn onClick={onClose}>Fechar</Btn>}
    >
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="space-y-4">
          {/* Reconciliação: soma das parcelas × total do item */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-3">
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1">Total do item</p>
              <p className="text-base font-semibold font-mono text-white/80">{fmtCurrency(itemTotal)}</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-3">
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1">Pago</p>
              <p className="text-base font-semibold font-mono text-green-400">{fmtCurrency(resumo.pago)}</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-3">
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1">Comprometido</p>
              <p className="text-base font-semibold font-mono text-amber-400">{fmtCurrency(resumo.comprometido)}</p>
            </div>
          </div>

          {/* Aviso de reconciliação */}
          <div
            className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs border',
              bate
                ? 'bg-green-500/10 border-green-500/20 text-green-300'
                : diff < 0
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                : 'bg-red-500/10 border-red-500/20 text-red-300',
            )}
          >
            {bate
              ? '✓ A soma das parcelas bate com o total do item.'
              : diff < 0
              ? `Falta lançar ${fmtCurrency(-diff)} em parcelas para fechar o total do item.`
              : `As parcelas somam ${fmtCurrency(diff)} a mais que o total do item.`}
          </div>

          {/* Tabela de parcelas */}
          <div className="border border-white/[0.08] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-white/[0.08] bg-white/[0.02]">
                <tr>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider">Descrição</th>
                  <th className="px-3 py-2 text-right text-[10px] font-semibold text-white/30 uppercase tracking-wider w-32">Valor</th>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider w-36">Data</th>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider w-32">Status</th>
                  <th className="px-3 py-2 text-center text-[10px] font-semibold text-white/30 uppercase tracking-wider w-20">Comprov.</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {pagamentos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-white/30 text-xs">
                      Nenhuma parcela lançada ainda.
                    </td>
                  </tr>
                ) : (
                  pagamentos.map(p => (
                    <tr key={p.id} className="group border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
                      {/* Descrição */}
                      <td className="px-2 py-1">
                        <input
                          className={cellInput}
                          placeholder="Ex.: Parcela 1/3, NF 123…"
                          value={p.descricao ?? ''}
                          readOnly={!editavel}
                          onChange={e => patchLocal(p.id, { descricao: e.target.value })}
                          onBlur={() => editavel && persist(p, { descricao: p.descricao ?? '' })}
                        />
                      </td>

                      {/* Valor */}
                      <td className="px-2 py-1">
                        <input
                          type="number"
                          className={cn(cellInput, 'text-right')}
                          placeholder="0,00"
                          value={p.valor}
                          readOnly={!editavel}
                          onChange={e => patchLocal(p.id, { valor: Number(e.target.value) })}
                          onBlur={() => editavel && persist(p, { valor: Number(p.valor) || 0 })}
                        />
                      </td>

                      {/* Data */}
                      <td className="px-2 py-1">
                        <input
                          type="date"
                          className={cellInput}
                          value={p.data ?? ''}
                          readOnly={!editavel}
                          onChange={e => patchLocal(p.id, { data: e.target.value || null })}
                          onBlur={() => editavel && persist(p, { data: p.data || null })}
                        />
                      </td>

                      {/* Status */}
                      <td className="px-2 py-1">
                        {editavel ? (
                          <select
                            className={cn(cellInput, 'cursor-pointer')}
                            value={p.status}
                            onChange={e => {
                              const status = e.target.value as PagamentoStatus
                              patchLocal(p.id, { status })
                              persist(p, { status })
                            }}
                          >
                            {STATUS_OPTS.map(o => (
                              <option key={o.value} value={o.value} className="bg-[#111]">{o.label}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs text-white/60">
                            {STATUS_OPTS.find(o => o.value === p.status)?.label ?? p.status}
                          </span>
                        )}
                      </td>

                      {/* Comprovante */}
                      <td className="px-2 py-1 text-center">
                        {p.comprovante_url ? (
                          <div className="inline-flex items-center gap-1">
                            <a href={p.comprovante_url} target="_blank" rel="noopener noreferrer" title="Ver comprovante">
                              <img src={p.comprovante_url} alt="" className="h-8 w-8 object-cover rounded border border-white/10" />
                            </a>
                            {editavel && (
                              <button
                                onClick={() => handleRemoveFoto(p)}
                                className="text-red-400/50 hover:text-red-400 text-xs"
                                title="Remover foto"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ) : editavel ? (
                          <label className="cursor-pointer text-[11px] text-blue-400/60 hover:text-blue-400" title="Anexar comprovante">
                            <input type="file" accept="image/*" className="hidden" onChange={e => handlePickFile(p, e)} />
                            anexar
                          </label>
                        ) : (
                          <span className="text-white/20 text-xs">—</span>
                        )}
                      </td>

                      {/* Excluir */}
                      <td className="px-1 py-1 text-center">
                        {editavel && (
                          <button
                            onClick={() => handleDelete(p)}
                            className="text-red-400/0 group-hover:text-red-400/50 hover:!text-red-400 transition-colors text-xs"
                            title="Excluir parcela"
                          >
                            ✕
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {editavel ? (
            <Btn variant="primary" onClick={handleAdd} disabled={busy}>
              {busy ? 'Aguarde…' : '+ Parcela'}
            </Btn>
          ) : (
            <p className="text-xs text-white/30">
              Custo Real bloqueado — aprove o Custo Planejado para registrar pagamentos.
            </p>
          )}
        </div>
      )}
    </Modal>
  )
}
