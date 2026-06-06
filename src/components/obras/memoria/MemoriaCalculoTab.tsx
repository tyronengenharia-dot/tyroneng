'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { X, CheckCircle2, AlertTriangle } from 'lucide-react'
import { PlanilhaItem, PlanilhaTipo, PlanilhaHeader } from '@/types'
import { getItensByObra, updateItem } from '@/services/planilhaService'
import { getPlanilhasStatus, planilhaEditavel } from '@/services/planilhaEstadoService'
import { MemoriaCalculo } from '@/types/memoria'
import {
  getMemoriaByObra,
  createMemoria,
  updateMemoria,
  deleteMemoria,
} from '@/services/memoriaService'
import { avaliarFormula } from '@/lib/avaliarFormula'
import { Btn, EmptyState, LoadingSpinner } from '@/components/ui'

const planilhaOpcoes: { value: PlanilhaTipo; label: string }[] = [
  { value: 'venda', label: 'Venda' },
  { value: 'custo_planejado', label: 'Custo Planejado' },
  { value: 'custo_real', label: 'Custo Real' },
]

function fmtQtd(n: number) {
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 4 })
}

export function MemoriaCalculoTab({ obra_id }: { obra_id: string }) {
  const [tipo, setTipo] = useState<PlanilhaTipo>('custo_planejado')
  const [itens, setItens] = useState<PlanilhaItem[]>([])
  const [memoria, setMemoria] = useState<MemoriaCalculo[]>([])
  const [headers, setHeaders] = useState<PlanilhaHeader[]>([])
  const [loading, setLoading] = useState(true)
  const [expandido, setExpandido] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    Promise.all([
      getItensByObra(obra_id, tipo),
      getMemoriaByObra(obra_id),
      getPlanilhasStatus(obra_id),
    ]).then(([its, mem, hs]) => {
      if (!active) return
      setItens(its)
      setMemoria(mem)
      setHeaders(hs)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [obra_id, tipo])

  const header = headers.find(h => h.tipo === tipo)
  const editavel = header ? planilhaEditavel(tipo, header.status) : true

  const linhasDoItem = (itemId: string) =>
    memoria.filter(m => m.planilha_item_id === itemId).sort((a, b) => a.ordem - b.ordem)

  function setLinhaLocal(id: string, patch: Partial<MemoriaCalculo>) {
    setMemoria(prev => prev.map(m => (m.id === id ? { ...m, ...patch } : m)))
  }

  async function salvarLinha(l: MemoriaCalculo) {
    await updateMemoria(l.id, {
      descricao: l.descricao,
      formula: l.formula,
      quantidade: l.quantidade,
    })
  }

  function onFormulaChange(l: MemoriaCalculo, value: string) {
    const q = avaliarFormula(value)
    setLinhaLocal(l.id, { formula: value, ...(q !== null ? { quantidade: q } : {}) })
  }

  async function addLinha(item: PlanilhaItem) {
    const ordem = linhasDoItem(item.id).length + 1
    const { data, error } = await createMemoria({
      obra_id,
      planilha_item_id: item.id,
      descricao: '',
      formula: '',
      quantidade: 0,
      unidade: item.unidade,
      ordem,
    })
    if (error || !data) {
      toast.error(error ?? 'Erro ao adicionar linha')
      return
    }
    setMemoria(prev => [...prev, data])
  }

  async function delLinha(id: string) {
    await deleteMemoria(id)
    setMemoria(prev => prev.filter(m => m.id !== id))
  }

  async function aplicar(item: PlanilhaItem, total: number) {
    const upd = await updateItem(item.id, { quantidade: total })
    if (!upd) {
      toast.error('Não foi possível aplicar (planilha bloqueada?).')
      return
    }
    setItens(prev => prev.map(i => (i.id === item.id ? { ...i, quantidade: total } : i)))
    toast.success('Quantidade aplicada à planilha.')
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-4">
      {/* Cabeçalho + seletor de planilha */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-semibold text-white">Memória de Cálculo</p>
          <p className="text-xs text-white/30 mt-0.5">
            Quantitativos e fórmulas que justificam o volume de cada item.
          </p>
        </div>
        <div className="flex gap-2">
          {planilhaOpcoes.map(o => (
            <button
              key={o.value}
              onClick={() => setTipo(o.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                tipo === o.value
                  ? 'bg-white text-black'
                  : 'bg-[#1a1a1a] text-gray-500 hover:text-white border border-white/8'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {itens.length === 0 ? (
        <EmptyState
          message={`Nenhum item na planilha de ${planilhaOpcoes.find(o => o.value === tipo)?.label}.`}
        />
      ) : (
        <div className="space-y-2">
          {itens.map(item => {
            const linhas = linhasDoItem(item.id)
            const total = linhas.reduce((s, l) => s + (l.quantidade || 0), 0)
            const temLinhas = linhas.length > 0
            const bate = Math.abs(total - item.quantidade) < 0.0001
            const aberto = expandido === item.id

            return (
              <div key={item.id} className="bg-[#0d0d0d] border border-white/[0.08] rounded-xl overflow-hidden">
                {/* Cabeçalho do item */}
                <button
                  onClick={() => setExpandido(aberto ? null : item.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors text-left"
                >
                  <span className="text-white/30 text-xs w-3">{aberto ? '▼' : '▶'}</span>
                  <span className="font-mono text-white/50 text-xs whitespace-nowrap">{item.codigo || '—'}</span>
                  <span className="text-sm text-white/80 flex-1 truncate">{item.descricao || 'Sem descrição'}</span>
                  <span className="text-xs text-white/40 whitespace-nowrap">
                    Planilha: <span className="text-white/70 font-mono">{fmtQtd(item.quantidade)}</span> {item.unidade}
                  </span>
                  {temLinhas && (
                    <span className="inline-flex items-center gap-1 text-xs whitespace-nowrap">
                      <span className="text-white/40">Memória:</span>
                      <span className="font-mono text-white/70">{fmtQtd(total)}</span>
                      {bate ? (
                        <CheckCircle2 size={14} className="text-green-400" />
                      ) : (
                        <AlertTriangle size={14} className="text-amber-400" />
                      )}
                    </span>
                  )}
                </button>

                {/* Editor de memória */}
                {aberto && (
                  <div className="border-t border-white/[0.06] px-4 py-3 space-y-2">
                    {linhas.length === 0 ? (
                      <p className="text-xs text-white/30">Nenhuma linha de memória. Adicione abaixo.</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-[10px] uppercase tracking-wider text-white/30">
                            <th className="text-left py-1 font-semibold">Descrição</th>
                            <th className="text-left py-1 font-semibold w-48">Fórmula</th>
                            <th className="text-right py-1 font-semibold w-28">Quantidade</th>
                            <th className="w-8" />
                          </tr>
                        </thead>
                        <tbody>
                          {linhas.map(l => (
                            <tr key={l.id} className="border-t border-white/[0.04]">
                              <td className="py-1 pr-2">
                                <input
                                  value={l.descricao}
                                  onChange={e => setLinhaLocal(l.id, { descricao: e.target.value })}
                                  onBlur={() => salvarLinha(l)}
                                  placeholder="Ex.: Parede norte"
                                  className="w-full bg-transparent text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:bg-white/5 rounded px-1 py-0.5"
                                />
                              </td>
                              <td className="py-1 pr-2">
                                <input
                                  value={l.formula ?? ''}
                                  onChange={e => onFormulaChange(l, e.target.value)}
                                  onBlur={() => salvarLinha(l)}
                                  placeholder="Ex.: 10*3 + 8*3"
                                  className="w-full bg-transparent font-mono text-sm text-white/70 placeholder:text-white/20 focus:outline-none focus:bg-white/5 rounded px-1 py-0.5"
                                />
                              </td>
                              <td className="py-1">
                                <input
                                  type="number"
                                  value={l.quantidade}
                                  onChange={e => setLinhaLocal(l.id, { quantidade: Number(e.target.value) })}
                                  onBlur={() => salvarLinha(l)}
                                  className="w-full bg-transparent text-right font-mono text-sm text-white/80 focus:outline-none focus:bg-white/5 rounded px-1 py-0.5"
                                />
                              </td>
                              <td className="py-1 text-right">
                                <button
                                  onClick={() => delLinha(l.id)}
                                  className="text-red-400/50 hover:text-red-400 transition-colors"
                                  title="Remover"
                                >
                                  <X size={13} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    <div className="flex items-center justify-between pt-1 gap-3 flex-wrap">
                      <button
                        onClick={() => addLinha(item)}
                        className="text-xs text-blue-400/60 hover:text-blue-400 transition-colors"
                      >
                        + Adicionar linha
                      </button>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-white/40">
                          Total memória: <span className="font-mono text-white/80">{fmtQtd(total)}</span>
                          {' · '}Planilha: <span className="font-mono text-white/80">{fmtQtd(item.quantidade)}</span>
                        </span>
                        {temLinhas && !bate && editavel && (
                          <Btn variant="ghost" size="sm" onClick={() => aplicar(item, total)}>
                            Aplicar à planilha
                          </Btn>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
