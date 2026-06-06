'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  getCategoriasByObra,
  getItensByObra,
  createCategoria,
  updateCategoria,
  deleteCategoria,
  createItem,
  updateItem,
  deleteItem,
  calcTotalItens,
} from '@/services/planilhaService'
import { getPlanilhasStatus, planilhaEditavel } from '@/services/planilhaEstadoService'
import { getObraById } from '@/services/obraService'
import { PlanilhaCategoria, PlanilhaItem, PlanilhaTipo, PlanilhaHeader, PlanilhaStatus } from '@/types'
import { Btn, EmptyState, LoadingSpinner } from '@/components/ui'
import { fmtCurrency, cn } from '@/lib/utils'
import { exportPlanilhaPdf, PlanilhaPdfMode } from '@/lib/exportPlanilhaPdf'
import { PlanilhaEstadoBar } from './PlanilhaEstadoBar'
import { SelecionarItemModal, SelecaoItem } from './SelecionarItemModal'
import { BdiModal } from './BdiModal'

// ── Types ─────────────────────────────────────────────────────────────────────

type CategoriaComItens = PlanilhaCategoria & {
  itens: PlanilhaItem[]
  collapsed: boolean
}

type Props = {
  obra_id: string
  tipo: PlanilhaTipo
  title: string
  subtitle: string
  /** quando definido, escopa a planilha por id (usado pelos aditivos) */
  planilhaId?: string
  /** status explícito da planilha (aditivos passam o seu próprio) */
  status?: PlanilhaStatus
  /** extra column headers beyond the base columns */
  extraHeaders?: string[]
  /** render extra cells per item */
  extraCells?: (item: PlanilhaItem, catItems: PlanilhaItem[]) => React.ReactNode
  /** render extra cells per category */
  extraCatCells?: (itens: PlanilhaItem[]) => React.ReactNode
  /** render extra cells in total row */
  extraTotalCells?: (allItems: PlanilhaItem[]) => React.ReactNode
  /** marca esta planilha como a Venda — habilita o BDI (Custo × fator) */
  isVenda?: boolean
}

// ── Inline editable cell ──────────────────────────────────────────────────────

function EditableCell({
  value,
  onChange,
  onBlur,
  type = 'text',
  className = '',
  placeholder = '',
  readOnly = false,
}: {
  value: string | number
  onChange: (v: string) => void
  onBlur?: () => void
  type?: 'text' | 'number'
  className?: string
  placeholder?: string
  readOnly?: boolean
}) {
  return (
    <input
      type={type}
      value={value}
      readOnly={readOnly}
      onChange={e => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      className={cn(
        'bg-transparent w-full text-sm text-white/70 placeholder:text-white/20',
        'focus:outline-none rounded px-1 -mx-1 py-0.5 transition-colors',
        readOnly ? 'cursor-default text-white/50' : 'focus:bg-white/5',
        className
      )}
    />
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function PlanilhaTab({
  obra_id,
  tipo,
  title,
  subtitle,
  planilhaId,
  status,
  extraHeaders = [],
  extraCells,
  extraCatCells,
  extraTotalCells,
  isVenda = false,
}: Props) {
  const [categorias, setCategorias] = useState<CategoriaComItens[]>([])
  const [headers, setHeaders]       = useState<PlanilhaHeader[]>([])
  const [loading, setLoading]       = useState(true)
  const [, setSaving]               = useState<Record<string, boolean>>({})
  const [pickerCat, setPickerCat]   = useState<string | null>(null)

  // ── BDI da Venda ────────────────────────────────────────────────────────────
  const [bdiOpen, setBdiOpen] = useState(false)

  // ── Exportar PDF ────────────────────────────────────────────────────────────
  const [exportOpen, setExportOpen] = useState(false)
  const [exporting, setExporting]   = useState(false)

  // ── Estado / bloqueio ───────────────────────────────────────────────────────
  const meuHeader = headers.find(h => h.tipo === tipo)
  // status: prop explícita (aditivos) ou header da obra (planilhas nomeadas).
  const statusEfetivo = status ?? meuHeader?.status
  // Sem status (migration não aplicada) => modo legado, sempre editável.
  const editavel = statusEfetivo ? planilhaEditavel(tipo, statusEfetivo) : true
  // Barra de fluxo só nas planilhas nomeadas (aditivos têm controle próprio).
  const temEstado = !planilhaId && headers.length > 0

  function bannerBloqueio(): string | null {
    if (editavel || !statusEfetivo) return null
    if (tipo === 'custo_real' && statusEfetivo === 'bloqueada')
      return 'Custo Real bloqueado. Aprove o Custo Planejado para liberar a edição.'
    if (tipo === 'custo_planejado' && statusEfetivo === 'aprovada')
      return 'Custo Planejado aprovado — somente leitura.'
    if (tipo === 'venda' && statusEfetivo === 'fechada')
      return 'Venda fechada — somente leitura.'
    if (tipo === 'aditivo' && statusEfetivo === 'fechada')
      return 'Aditivo fechado — somente leitura.'
    return 'Planilha bloqueada — somente leitura.'
  }

  // ── Load ──────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    const [cats, itens, hs] = await Promise.all([
      getCategoriasByObra(obra_id, tipo, planilhaId),
      getItensByObra(obra_id, tipo, planilhaId),
      getPlanilhasStatus(obra_id),
    ])
    const merged: CategoriaComItens[] = cats.map(cat => ({
      ...cat,
      collapsed: false,
      itens: itens.filter(i => i.categoria_id === cat.id),
    }))
    setCategorias(merged)
    setHeaders(hs)
  }, [obra_id, tipo, planilhaId])

  useEffect(() => {
    let active = true
    Promise.all([
      getCategoriasByObra(obra_id, tipo, planilhaId),
      getItensByObra(obra_id, tipo, planilhaId),
      getPlanilhasStatus(obra_id),
    ]).then(([cats, itens, hs]) => {
      if (!active) return
      const merged: CategoriaComItens[] = cats.map(cat => ({
        ...cat,
        collapsed: false,
        itens: itens.filter(i => i.categoria_id === cat.id),
      }))
      setCategorias(merged)
      setHeaders(hs)
      setLoading(false)
    })
    return () => { active = false }
  }, [obra_id, tipo, planilhaId])

  // ── Totals ────────────────────────────────────────────────────────────────

  const allItens = categorias.flatMap(c => c.itens)
  const totalGeral = calcTotalItens(allItens)

  // ── Category actions ──────────────────────────────────────────────────────

  async function handleAddCategoria() {
    if (!editavel) return
    const nova: Omit<PlanilhaCategoria, 'id' | 'created_at'> = {
      obra_id,
      tipo,
      nome: 'Nova categoria',
      ordem: categorias.length + 1,
      ...(planilhaId ? { planilha_id: planilhaId } : {}),
    }
    const created = await createCategoria(nova)
    if (!created) { toast.error('Erro ao criar categoria'); return }
    setCategorias(prev => [...prev, { ...created, itens: [], collapsed: false }])
  }

  async function handleExportPdf(mode: PlanilhaPdfMode) {
    setExportOpen(false)
    if (categorias.length === 0) { toast.error('Nada para exportar — planilha vazia.'); return }
    setExporting(true)
    try {
      const obra = await getObraById(obra_id)
      exportPlanilhaPdf({
        obra: { name: obra?.name ?? 'Obra', client: obra?.client, location: obra?.location },
        titulo: title,
        categorias,
        mode,
      })
    } catch (e) {
      console.error('export pdf error:', e)
      toast.error('Erro ao gerar o PDF.')
    } finally {
      setExporting(false)
    }
  }

  function handleUpdateCategoriaNome(id: string, nome: string) {
    setCategorias(prev =>
      prev.map(c => c.id === id ? { ...c, nome } : c)
    )
  }

  async function handleSaveCategoriaNome(id: string, nome: string) {
    if (!editavel) return
    await updateCategoria(id, { nome })
  }

  async function handleDeleteCategoria(id: string) {
    if (!editavel) return
    if (!confirm('Excluir esta categoria e todos os seus itens?')) return
    await deleteCategoria(id)
    setCategorias(prev => prev.filter(c => c.id !== id))
    toast.success('Categoria removida')
  }

  function toggleCategoria(id: string) {
    setCategorias(prev =>
      prev.map(c => c.id === id ? { ...c, collapsed: !c.collapsed } : c)
    )
  }

  async function handleMoveCategoria(id: string, dir: 'up' | 'down') {
    if (!editavel) return
    const idx = categorias.findIndex(c => c.id === id)
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= categorias.length) return

    // Optimistic update
    const newCats = [...categorias]
    ;[newCats[idx], newCats[targetIdx]] = [newCats[targetIdx], newCats[idx]]
    setCategorias(newCats)

    // Persist the two swapped rows with their new positional ordem
    await Promise.all([
      updateCategoria(newCats[idx].id,       { ordem: idx + 1 }),
      updateCategoria(newCats[targetIdx].id, { ordem: targetIdx + 1 }),
    ])
  }

  // ── Item actions ──────────────────────────────────────────────────────────

  function abrirPicker(categoriaId: string) {
    if (!editavel) return
    setPickerCat(categoriaId)
  }

  // Regra 4: item criado a partir de Serviço / SINAPI / EMOP (snapshot + origem).
  async function handleSelecionarItem(sel: SelecaoItem) {
    const categoriaId = pickerCat
    if (!categoriaId) return
    const cat = categorias.find(c => c.id === categoriaId)
    if (!cat) return
    const novoItem: Omit<PlanilhaItem, 'id' | 'created_at'> = {
      categoria_id: categoriaId,
      obra_id,
      tipo,
      codigo: sel.codigo,
      descricao: sel.descricao,
      quantidade: 0,
      unidade: sel.unidade,
      valor_unitario: sel.valor_unitario,
      ordem: cat.itens.length + 1,
      origem: sel.origem,
      servico_id: sel.servico_id,
      referencia_item_id: sel.referencia_item_id,
      ...(planilhaId ? { planilha_id: planilhaId } : {}),
    }
    const created = await createItem(novoItem)
    if (!created) { toast.error('Erro ao adicionar item'); return }
    setCategorias(prev =>
      prev.map(c =>
        c.id === categoriaId ? { ...c, itens: [...c.itens, created] } : c
      )
    )
    setPickerCat(null)
  }

  function handleUpdateItemLocal(
    categoriaId: string,
    itemId: string,
    field: keyof PlanilhaItem,
    value: string | number
  ) {
    setCategorias(prev =>
      prev.map(c =>
        c.id === categoriaId
          ? {
              ...c,
              itens: c.itens.map(i =>
                i.id === itemId ? { ...i, [field]: value } : i
              ),
            }
          : c
      )
    )
  }

  async function handleSaveItem(_categoriaId: string, item: PlanilhaItem) {
    if (!editavel) return
    setSaving(prev => ({ ...prev, [item.id]: true }))
    await updateItem(item.id, {
      codigo:         item.codigo,
      descricao:      item.descricao,
      quantidade:     item.quantidade,
      unidade:        item.unidade,
      valor_unitario: item.valor_unitario,
    })
    setSaving(prev => ({ ...prev, [item.id]: false }))
  }

  async function handleDeleteItem(categoriaId: string, itemId: string) {
    if (!editavel) return
    await deleteItem(itemId)
    setCategorias(prev =>
      prev.map(c =>
        c.id === categoriaId
          ? { ...c, itens: c.itens.filter(i => i.id !== itemId) }
          : c
      )
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) return <LoadingSpinner />

  const BASE_HEADERS = ['Item', 'Código', 'Descrição', 'Qtd', 'Un.', 'Valor Unit.', 'Total']
  const allHeaders = [...BASE_HEADERS, ...extraHeaders, '']
  const banner = bannerBloqueio()

  return (
    <div className="space-y-3">
      {/* Barra de estado / bloqueio (só aparece pós-migration) */}
      {temEstado && (
        <PlanilhaEstadoBar obra_id={obra_id} tipo={tipo} headers={headers} onChanged={load} />
      )}

      {banner && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
          {banner}
        </div>
      )}

      <div className="bg-[#0d0d0d] border border-white/[0.08] rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
          <div>
            <p className="text-sm font-semibold text-white">{title}</p>
            <p className="text-xs text-white/30 mt-0.5">{subtitle}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">Total Geral</p>
              <p className="text-xl font-semibold font-mono text-green-400">{fmtCurrency(totalGeral)}</p>
            </div>
            {isVenda && editavel && (
              <Btn variant="ghost" onClick={() => setBdiOpen(true)}>BDI da Venda</Btn>
            )}
            {editavel && <Btn variant="primary" onClick={handleAddCategoria}>+ Categoria</Btn>}

            {/* Exportar PDF — resumo ou completa */}
            <div className="relative">
              <button
                onClick={() => setExportOpen(o => !o)}
                disabled={exporting || categorias.length === 0}
                className="px-3 py-1.5 text-xs font-medium bg-white/5 text-white/50 border border-white/10 rounded-xl hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {exporting ? 'Gerando…' : 'Exportar PDF'}
                <span className="text-[9px]">▾</span>
              </button>

              {exportOpen && (
                <>
                  <button
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={() => setExportOpen(false)}
                    aria-hidden
                  />
                  <div className="absolute right-0 mt-1.5 z-50 w-60 bg-[#161616] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                    <button
                      onClick={() => handleExportPdf('resumo')}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-white/[0.04] transition-colors"
                    >
                      <span className="block text-xs font-medium text-white/85">Resumo</span>
                      <span className="block text-[11px] text-white/35 mt-0.5">Só as categorias e totais</span>
                    </button>
                    <button
                      onClick={() => handleExportPdf('completa')}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-white/[0.04] transition-colors border-t border-white/[0.06]"
                    >
                      <span className="block text-xs font-medium text-white/85">Completa</span>
                      <span className="block text-[11px] text-white/35 mt-0.5">Categorias + todos os itens expandidos</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {categorias.length === 0 ? (
          <EmptyState message="Nenhuma categoria cadastrada. Clique em + Categoria para começar." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: 700 }}>
              {/* Column headers */}
              <thead className="border-b border-white/[0.08]">
                <tr>
                  {allHeaders.map((h, i) => (
                    <th
                      key={i}
                      className={cn(
                        'px-3 py-2.5 text-[10px] font-semibold text-white/30 uppercase tracking-wider',
                        ['Qtd', 'Valor Unit.', 'Total', ...extraHeaders].includes(h) ? 'text-right' : 'text-left'
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {categorias.map((cat, catIdx) => {
                  const catTotal = calcTotalItens(cat.itens)

                  return (
                    <React.Fragment key={cat.id}>
                      {/* ── Category row ── */}
                      <tr className="group bg-[#111] border-y border-white/[0.06] hover:bg-[#141414] transition-colors">
                        <td colSpan={allHeaders.length} className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            {/* Toggle */}
                            <button
                              onClick={() => toggleCategoria(cat.id)}
                              className="text-white/30 hover:text-white transition-colors text-xs w-4"
                            >
                              {cat.collapsed ? '▶' : '▼'}
                            </button>

                            {/* Number */}
                            <span className="text-white/30 text-xs font-mono w-5">{catIdx + 1}.</span>

                            {/* Name editable */}
                            <input
                              value={cat.nome}
                              readOnly={!editavel}
                              onChange={e => handleUpdateCategoriaNome(cat.id, e.target.value)}
                              onBlur={e => handleSaveCategoriaNome(cat.id, e.target.value)}
                              className={cn(
                                'bg-transparent outline-none font-semibold text-sm text-white/80 flex-1 rounded px-1 -mx-1',
                                editavel ? 'focus:bg-white/5' : 'cursor-default'
                              )}
                            />

                            {/* Spacer */}
                            <div className="flex-1 border-b border-dashed border-white/[0.06] mx-2" />

                            {/* Cat total */}
                            <span className="text-green-400 font-semibold font-mono text-sm">
                              {fmtCurrency(catTotal)}
                            </span>

                            {/* Extra cat cells */}
                            {extraCatCells?.(cat.itens)}

                            {/* Reorder ↑/↓ */}
                            {editavel && (
                              <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleMoveCategoria(cat.id, 'up')}
                                  disabled={catIdx === 0}
                                  title="Mover para cima"
                                  className="text-white/30 hover:text-white/70 disabled:opacity-20 disabled:cursor-not-allowed text-[9px] leading-none"
                                >▲</button>
                                <button
                                  onClick={() => handleMoveCategoria(cat.id, 'down')}
                                  disabled={catIdx === categorias.length - 1}
                                  title="Mover para baixo"
                                  className="text-white/30 hover:text-white/70 disabled:opacity-20 disabled:cursor-not-allowed text-[9px] leading-none"
                                >▼</button>
                              </div>
                            )}

                            {/* Delete */}
                            {editavel && (
                              <button
                                onClick={() => handleDeleteCategoria(cat.id)}
                                className="text-red-400/0 group-hover:text-red-400/60 hover:!text-red-400 transition-colors ml-1 text-xs"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* ── Items ── */}
                      {!cat.collapsed && cat.itens.map((item, itemIdx) => {
                        const total = item.quantidade * item.valor_unitario
                        return (
                          <tr
                            key={item.id}
                            className="group border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                          >
                            {/* Item number */}
                            <td className="px-3 py-1.5 text-white/30 text-xs font-mono">
                              {catIdx + 1}.{itemIdx + 1}
                            </td>

                            {/* Código */}
                            <td className="px-3 py-1.5 w-24">
                              <EditableCell
                                value={item.codigo}
                                placeholder="COD"
                                readOnly={!editavel || !!item.origem}
                                onChange={v => handleUpdateItemLocal(cat.id, item.id, 'codigo', v)}
                                onBlur={() => handleSaveItem(cat.id, item)}
                              />
                            </td>

                            {/* Descrição */}
                            <td className="px-3 py-1.5">
                              <EditableCell
                                value={item.descricao}
                                placeholder="Descrição do item"
                                readOnly={!editavel || !!item.origem}
                                onChange={v => handleUpdateItemLocal(cat.id, item.id, 'descricao', v)}
                                onBlur={() => handleSaveItem(cat.id, item)}
                              />
                            </td>

                            {/* Quantidade */}
                            <td className="px-3 py-1.5 w-20">
                              <EditableCell
                                type="number"
                                value={item.quantidade}
                                className="text-right"
                                readOnly={!editavel}
                                onChange={v => handleUpdateItemLocal(cat.id, item.id, 'quantidade', Number(v))}
                                onBlur={() => handleSaveItem(cat.id, item)}
                              />
                            </td>

                            {/* Unidade */}
                            <td className="px-3 py-1.5 w-16">
                              <EditableCell
                                value={item.unidade}
                                placeholder="m²"
                                readOnly={!editavel || !!item.origem}
                                onChange={v => handleUpdateItemLocal(cat.id, item.id, 'unidade', v)}
                                onBlur={() => handleSaveItem(cat.id, item)}
                              />
                            </td>

                            {/* Valor unitário */}
                            <td className="px-3 py-1.5 w-28">
                              <EditableCell
                                type="number"
                                value={item.valor_unitario}
                                className="text-right"
                                readOnly={!editavel}
                                onChange={v => handleUpdateItemLocal(cat.id, item.id, 'valor_unitario', Number(v))}
                                onBlur={() => handleSaveItem(cat.id, item)}
                              />
                            </td>

                            {/* Total */}
                            <td className="px-3 py-1.5 text-right font-mono text-green-400 text-sm w-28">
                              {fmtCurrency(total)}
                            </td>

                            {/* Extra cells */}
                            {extraCells?.(item, cat.itens)}

                            {/* Delete */}
                            <td className="px-3 py-1.5 w-8">
                              {editavel && (
                                <button
                                  onClick={() => handleDeleteItem(cat.id, item.id)}
                                  className="text-red-400/0 group-hover:text-red-400/50 hover:!text-red-400 transition-colors text-xs"
                                >
                                  ✕
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}

                      {/* ── Add item button ── */}
                      {!cat.collapsed && editavel && (
                        <tr>
                          <td colSpan={allHeaders.length} className="px-3 py-1.5 border-b border-white/[0.04]">
                            <button
                              onClick={() => abrirPicker(cat.id)}
                              className="text-xs text-blue-400/60 hover:text-blue-400 transition-colors"
                            >
                              + Adicionar item (do catálogo)
                            </button>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}

                {/* ── Total row ── */}
                <tr className="bg-[#111] border-t border-white/10">
                  <td colSpan={6} className="px-3 py-3 text-right text-xs font-semibold text-white/40 uppercase tracking-wider">
                    Total Geral
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-semibold text-green-400">
                    {fmtCurrency(totalGeral)}
                  </td>
                  {extraTotalCells?.(allItens)}
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pickerCat && (
        <SelecionarItemModal
          onClose={() => setPickerCat(null)}
          onSelect={handleSelecionarItem}
        />
      )}

      {bdiOpen && (
        <BdiModal
          obra_id={obra_id}
          onClose={() => setBdiOpen(false)}
          onAplicado={load}
        />
      )}
    </div>
  )
}
