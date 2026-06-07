'use client'

import { useEffect, useState, type ChangeEvent } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Btn, LoadingSpinner } from '@/components/ui'
import { EmprestimoRateio, EmprestimoRateioStatus } from '@/types/emprestimo'
import { Obra } from '@/types'
import {
  getRateios,
  createRateio,
  updateRateio,
  deleteRateio,
  uploadAnexo,
  removeAnexo,
} from '@/services/emprestimoService'
import { getObras } from '@/services/obraService'
import { fmtCurrency, cn } from '@/lib/utils'

interface Props {
  emprestimoId: string
  valorPrincipal: number
  /** avisa o pai quando algo muda (pra revalidar totais externos, se quiser) */
  onChanged?: () => void
}

const STATUS_OPTS: { value: EmprestimoRateioStatus; label: string }[] = [
  { value: 'recebido', label: 'Recebido' },
  { value: 'previsto', label: 'Previsto' },
]

const cellInput =
  'bg-transparent w-full text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:bg-white/5 rounded px-1.5 py-1 transition-colors'

export function RateioObrasSection({ emprestimoId, valorPrincipal, onChanged }: Props) {
  const [rateios, setRateios] = useState<EmprestimoRateio[]>([])
  const [obras, setObras] = useState<Obra[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([getRateios(emprestimoId), getObras()]).then(([rs, os]) => {
      if (!active) return
      setRateios(rs)
      setObras(os)
      setLoading(false)
    })
    return () => { active = false }
  }, [emprestimoId])

  function patchLocal(id: string, patch: Partial<EmprestimoRateio>) {
    setRateios(prev => prev.map(r => (r.id === id ? { ...r, ...patch } : r)))
  }

  async function persist(
    r: EmprestimoRateio,
    patch: Partial<Omit<EmprestimoRateio, 'id' | 'created_at' | 'emprestimo_id' | 'emprestimo' | 'obra'>>,
  ) {
    const { error } = await updateRateio(r.id, patch)
    if (error) { alert(error); return }
    onChanged?.()
  }

  async function handleAdd() {
    setBusy(true)
    const { data, error } = await createRateio({
      emprestimo_id: emprestimoId,
      obra_id: null,
      descricao: '',
      valor: 0,
      data: null,
      status: 'recebido',
    })
    setBusy(false)
    if (error || !data) { alert(error ?? 'Erro ao adicionar destino'); return }
    setRateios(prev => [...prev, data])
    onChanged?.()
  }

  async function handleDelete(r: EmprestimoRateio) {
    if (!confirm('Excluir este destino do rateio?')) return
    const { error } = await deleteRateio(r.id, r.comprovante_path)
    if (error) { alert(error); return }
    setRateios(prev => prev.filter(x => x.id !== r.id))
    onChanged?.()
  }

  async function handlePickFile(r: EmprestimoRateio, e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    if (!f.type.startsWith('image/')) { alert('Envie uma imagem (foto do comprovante).'); return }
    if (f.size > 8 * 1024 * 1024) { alert('Imagem muito grande (máx. 8 MB).'); return }
    setBusy(true)
    try {
      const up = await uploadAnexo(f, emprestimoId)
      if (r.comprovante_path) await removeAnexo(r.comprovante_path)
      patchLocal(r.id, { comprovante_url: up.url, comprovante_path: up.path })
      await persist(r, { comprovante_url: up.url, comprovante_path: up.path })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro no upload')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <LoadingSpinner />

  const alocado = rateios.reduce((a, r) => a + (Number(r.valor) || 0), 0)
  const naoAlocado = valorPrincipal - alocado
  const recebido = rateios.filter(r => r.status === 'recebido').reduce((a, r) => a + (Number(r.valor) || 0), 0)

  const obraOptions = [
    { value: '', label: 'Outros / uso geral' },
    ...obras.map(o => ({ value: o.id, label: o.name })),
  ]

  return (
    <div className="space-y-3">
      {/* Reconciliação principal × alocado */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-white/30">Valor principal</p>
          <p className="text-sm font-semibold text-white tabular-nums">{fmtCurrency(valorPrincipal)}</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-white/30">Alocado</p>
          <p className="text-sm font-semibold text-blue-400 tabular-nums">{fmtCurrency(alocado)}</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-white/30">Recebido</p>
          <p className="text-sm font-semibold text-green-400 tabular-nums">{fmtCurrency(recebido)}</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-white/30">Não alocado</p>
          <p className={cn('text-sm font-semibold tabular-nums', naoAlocado < -0.005 ? 'text-red-400' : 'text-white/60')}>
            {fmtCurrency(naoAlocado)}
          </p>
        </div>
      </div>

      {naoAlocado < -0.005 && (
        <p className="text-[11px] text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-1.5">
          Os destinos somam {fmtCurrency(-naoAlocado)} a mais que o valor principal.
        </p>
      )}

      <div className="flex items-center justify-between">
        <p className="text-[11px] text-white/40">
          {rateios.length === 0 ? 'Nenhum destino cadastrado.' : `${rateios.length} destino(s)`}
        </p>
        <Btn variant="ghost" size="sm" onClick={handleAdd} disabled={busy}>
          <Plus size={13} /> Adicionar destino
        </Btn>
      </div>

      {rateios.length > 0 && (
        <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 720 }}>
            <thead className="border-b border-white/[0.08] bg-white/[0.02]">
              <tr>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider">Destino (obra)</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider">Descrição</th>
                <th className="px-3 py-2 text-right text-[10px] font-semibold text-white/30 uppercase tracking-wider w-32">Valor</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider w-36">Data</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-white/30 uppercase tracking-wider w-28">Status</th>
                <th className="px-3 py-2 text-center text-[10px] font-semibold text-white/30 uppercase tracking-wider w-20">Comprov.</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {rateios.map(r => (
                <tr key={r.id} className="group border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
                  {/* Destino (obra) */}
                  <td className="px-2 py-1">
                    <select
                      className={cn(cellInput, 'cursor-pointer')}
                      value={r.obra_id ?? ''}
                      onChange={e => {
                        const obra_id = e.target.value || null
                        patchLocal(r.id, { obra_id })
                        persist(r, { obra_id })
                      }}
                    >
                      {obraOptions.map(o => (
                        <option key={o.value} value={o.value} className="bg-[#111]">{o.label}</option>
                      ))}
                    </select>
                  </td>

                  {/* Descrição */}
                  <td className="px-2 py-1">
                    <input
                      className={cellInput}
                      placeholder="Ex.: Compra de material, capital de giro…"
                      value={r.descricao ?? ''}
                      onChange={e => patchLocal(r.id, { descricao: e.target.value })}
                      onBlur={() => persist(r, { descricao: r.descricao ?? '' })}
                    />
                  </td>

                  {/* Valor */}
                  <td className="px-2 py-1">
                    <input
                      type="number"
                      className={cn(cellInput, 'text-right')}
                      placeholder="0,00"
                      value={r.valor}
                      onChange={e => patchLocal(r.id, { valor: Number(e.target.value) })}
                      onBlur={() => persist(r, { valor: Number(r.valor) || 0 })}
                    />
                  </td>

                  {/* Data */}
                  <td className="px-2 py-1">
                    <input
                      type="date"
                      className={cellInput}
                      value={r.data ?? ''}
                      onChange={e => patchLocal(r.id, { data: e.target.value || null })}
                      onBlur={() => persist(r, { data: r.data || null })}
                    />
                  </td>

                  {/* Status */}
                  <td className="px-2 py-1">
                    <select
                      className={cn(cellInput, 'cursor-pointer')}
                      value={r.status}
                      onChange={e => {
                        const status = e.target.value as EmprestimoRateioStatus
                        patchLocal(r.id, { status })
                        persist(r, { status })
                      }}
                    >
                      {STATUS_OPTS.map(o => (
                        <option key={o.value} value={o.value} className="bg-[#111]">{o.label}</option>
                      ))}
                    </select>
                  </td>

                  {/* Comprovante */}
                  <td className="px-2 py-1 text-center">
                    {r.comprovante_url ? (
                      <a href={r.comprovante_url} target="_blank" rel="noopener noreferrer" title="Ver comprovante" className="text-[11px] text-blue-400/70 hover:text-blue-400">
                        ver
                      </a>
                    ) : (
                      <label className="cursor-pointer text-[11px] text-blue-400/60 hover:text-blue-400" title="Anexar comprovante">
                        <input type="file" accept="image/*" className="hidden" onChange={e => handlePickFile(r, e)} />
                        anexar
                      </label>
                    )}
                  </td>

                  {/* Excluir */}
                  <td className="px-1 py-1 text-center">
                    <button
                      onClick={() => handleDelete(r)}
                      className="w-7 h-7 rounded-lg hover:bg-white/8 inline-flex items-center justify-center text-red-400/60 hover:text-red-400 transition-colors"
                      title="Excluir destino"
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
