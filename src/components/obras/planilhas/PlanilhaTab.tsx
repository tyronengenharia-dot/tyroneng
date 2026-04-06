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
import { PlanilhaCategoria, PlanilhaItem, PlanilhaTipo } from '@/types'
import { Btn, EmptyState, LoadingSpinner } from '@/components/ui'
import { fmtCurrency, cn } from '@/lib/utils'

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
  /** extra column headers beyond the base columns */
  extraHeaders?: string[]
  /** render extra cells per item */
  extraCells?: (item: PlanilhaItem, catItems: PlanilhaItem[]) => React.ReactNode
  /** render extra cells per category */
  extraCatCells?: (itens: PlanilhaItem[]) => React.ReactNode
  /** render extra cells in total row */
  extraTotalCells?: (allItems: PlanilhaItem[]) => React.ReactNode
}

// ── Inline editable cell ──────────────────────────────────────────────────────

function EditableCell({
  value,
  onChange,
  type = 'text',
  className = '',
  placeholder = '',
}: {
  value: string | number
  onChange: (v: string) => void
  type?: 'text' | 'number'
  className?: string
  placeholder?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        'bg-transparent w-full text-sm text-white/70 placeholder:text-white/20',
        'focus:outline-none focus:bg-white/5 rounded px-1 -mx-1 py-0.5',
        'transition-colors',
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
  extraHeaders = [],
  extraCells,
  extraCatCells,
  extraTotalCells,
}: Props) {
  const [categorias, setCategorias] = useState<CategoriaComItens[]>([])
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState<Record<string, boolean>>({})

  // ── Load ──────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    const [cats, itens] = await Promise.all([
      getCategoriasByObra(obra_id, tipo),
      getItensByObra(obra_id, tipo),
    ])
    const merged: CategoriaComItens[] = cats.map(cat => ({
      ...cat,
      collapsed: false,
      itens: itens.filter(i => i.categoria_id === cat.id),
    }))
    setCategorias(merged)
    setLoading(false)
  }, [obra_id, tipo])

  useEffect(() => { load() }, [load])

  // ── Totals ────────────────────────────────────────────────────────────────

  const allItens = categorias.flatMap(c => c.itens)
  const totalGeral = calcTotalItens(allItens)

  // ── Category actions ──────────────────────────────────────────────────────

  async function handleAddCategoria() {
    const nova: Omit<PlanilhaCategoria, 'id' | 'created_at'> = {
      obra_id,
      tipo,
      nome: 'Nova categoria',
      ordem: categorias.length + 1,
    }
    const created = await createCategoria(nova)
    if (!created) { toast.error('Erro ao criar categoria'); return }
    setCategorias(prev => [...prev, { ...created, itens: [], collapsed: false }])
  }

  async function handleUpdateCategoriaNome(id: string, nome: string) {
    setCategorias(prev =>
      prev.map(c => c.id === id ? { ...c, nome } : c)
    )
  }

  async function handleSaveCategoriaNome(id: string, nome: string) {
    await updateCategoria(id, { nome })
  }

  async function handleDeleteCategoria(id: string) {
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

  // ── Item actions ──────────────────────────────────────────────────────────

  async function handleAddItem(categoriaId: string) {
    const cat = categorias.find(c => c.id === categoriaId)
    if (!cat) return
    const novoItem: Omit<PlanilhaItem, 'id' | 'created_at'> = {
      categoria_id: categoriaId,
      obra_id,
      tipo,
      codigo: '',
      descricao: '',
      quantidade: 0,
      unidade: 'm²',
      valor_unitario: 0,
      ordem: cat.itens.length + 1,
    }
    const created = await createItem(novoItem)
    if (!created) { toast.error('Erro ao criar item'); return }
    setCategorias(prev =>
      prev.map(c =>
        c.id === categoriaId ? { ...c, itens: [...c.itens, created] } : c
      )
    )
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

  async function handleSaveItem(categoriaId: string, item: PlanilhaItem) {
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

  return (
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
          <Btn variant="primary" onClick={handleAddCategoria}>+ Categoria</Btn>
          <button className="px-3 py-1.5 text-xs font-medium bg-white/5 text-white/50 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
            Exportar XLSX
          </button>
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
                            onChange={e => handleUpdateCategoriaNome(cat.id, e.target.value)}
                            onBlur={e => handleSaveCategoriaNome(cat.id, e.target.value)}
                            className="bg-transparent outline-none font-semibold text-sm text-white/80 flex-1 focus:bg-white/5 rounded px-1 -mx-1"
                          />

                          {/* Spacer */}
                          <div className="flex-1 border-b border-dashed border-white/[0.06] mx-2" />

                          {/* Cat total */}
                          <span className="text-green-400 font-semibold font-mono text-sm">
                            {fmtCurrency(catTotal)}
                          </span>

                          {/* Extra cat cells */}
                          {extraCatCells?.(cat.itens)}

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteCategoria(cat.id)}
                            className="text-red-400/0 group-hover:text-red-400/60 hover:!text-red-400 transition-colors ml-2 text-xs"
                          >
                            ✕
                          </button>
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
                              onChange={v => handleUpdateItemLocal(cat.id, item.id, 'codigo', v)}
                              onBlur={() => handleSaveItem(cat.id, item)}
                            />
                          </td>

                          {/* Descrição */}
                          <td className="px-3 py-1.5">
                            <EditableCell
                              value={item.descricao}
                              placeholder="Descrição do item"
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
                              onChange={v => handleUpdateItemLocal(cat.id, item.id, 'quantidade', Number(v))}
                              onBlur={() => handleSaveItem(cat.id, item)}
                            />
                          </td>

                          {/* Unidade */}
                          <td className="px-3 py-1.5 w-16">
                            <EditableCell
                              value={item.unidade}
                              placeholder="m²"
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
                            <button
                              onClick={() => handleDeleteItem(cat.id, item.id)}
                              className="text-red-400/0 group-hover:text-red-400/50 hover:!text-red-400 transition-colors text-xs"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      )
                    })}

                    {/* ── Add item button ── */}
                    {!cat.collapsed && (
                      <tr>
                        <td colSpan={allHeaders.length} className="px-3 py-1.5 border-b border-white/[0.04]">
                          <button
                            onClick={() => handleAddItem(cat.id)}
                            className="text-xs text-blue-400/60 hover:text-blue-400 transition-colors"
                          >
                            + Adicionar item
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
  )
}
