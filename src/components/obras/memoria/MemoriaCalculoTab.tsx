'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { X, CheckCircle2, AlertTriangle } from 'lucide-react'
import { PlanilhaItem, PlanilhaCategoria, PlanilhaTipo, PlanilhaHeader } from '@/types'
import { getCategoriasByObra, getItensByObra, updateItem } from '@/services/planilhaService'
import { getPlanilhasStatus, planilhaEditavel } from '@/services/planilhaEstadoService'
import { getObraById } from '@/services/obraService'
import { MemoriaCalculo } from '@/types/memoria'
import {
  getMemoriaByObra,
  createMemoria,
  updateMemoria,
  deleteMemoria,
} from '@/services/memoriaService'
import { avaliarFormula } from '@/lib/avaliarFormula'
import { exportMemoriaPdf, MemoriaPdfCategoria, MemoriaPdfMode } from '@/lib/exportMemoriaPdf'
import { Btn, EmptyState, LoadingSpinner } from '@/components/ui'

const planilhaOpcoes: { value: PlanilhaTipo; label: string }[] = [
  { value: 'venda',           label: 'Venda' },
  { value: 'custo_planejado', label: 'Custo Planejado' },
  { value: 'custo_real',      label: 'Custo Real' },
]

function fmtQtd(n: number) {
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 4 })
}

// ── Item row (memory editor) ───────────────────────────────────────────────────

function ItemRow({
  item,
  catIdx,
  itemIdx,
  linhas,
  editavel,
  expandido,
  onToggle,
  onSetLinha,
  onSalvarLinha,
  onFormulaChange,
  onAddLinha,
  onDelLinha,
  onAplicar,
}: {
  item: PlanilhaItem
  catIdx: number
  itemIdx: number
  linhas: MemoriaCalculo[]
  editavel: boolean
  expandido: boolean
  onToggle: () => void
  onSetLinha: (id: string, patch: Partial<MemoriaCalculo>) => void
  onSalvarLinha: (l: MemoriaCalculo) => void
  onFormulaChange: (l: MemoriaCalculo, v: string) => void
  onAddLinha: () => void
  onDelLinha: (id: string) => void
  onAplicar: (total: number) => void
}) {
  const total    = linhas.reduce((s, l) => s + (l.quantidade || 0), 0)
  const temLinhas = linhas.length > 0
  const bate     = Math.abs(total - item.quantidade) < 0.0001

  return (
    <div className="border-t border-white/[0.04]">
      {/* Item header — click to expand */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-6 py-2.5 hover:bg-white/[0.02] transition-colors text-left"
      >
        <span className="text-white/20 text-[10px] w-3">{expandido ? '▼' : '▶'}</span>
        <span className="text-white/25 text-xs font-mono w-9 shrink-0">
          {catIdx + 1}.{itemIdx + 1}
        </span>
        <span className="font-mono text-white/40 text-xs whitespace-nowrap shrink-0">
          {item.codigo || '—'}
        </span>
        <span className="text-sm text-white/75 flex-1 min-w-0 truncate">
          {item.descricao || 'Sem descrição'}
        </span>
        <span className="text-xs text-white/40 whitespace-nowrap shrink-0">
          Planilha:{' '}
          <span className="text-white/60 font-mono">{fmtQtd(item.quantidade)}</span>{' '}
          {item.unidade}
        </span>
        {temLinhas && (
          <span className="inline-flex items-center gap-1 text-xs whitespace-nowrap shrink-0">
            <span className="text-white/30">Memória:</span>
            <span className="font-mono text-white/60">{fmtQtd(total)}</span>
            {bate
              ? <CheckCircle2 size={13} className="text-green-400" />
              : <AlertTriangle size={13} className="text-amber-400" />}
          </span>
        )}
      </button>

      {/* Memory editor */}
      {expandido && (
        <div className="border-t border-white/[0.04] bg-black/20 px-6 py-3 space-y-2">
          {linhas.length === 0 ? (
            <p className="text-xs text-white/25">Nenhuma linha de memória. Adicione abaixo.</p>
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
                        readOnly={!editavel}
                        onChange={e => onSetLinha(l.id, { descricao: e.target.value })}
                        onBlur={() => onSalvarLinha(l)}
                        placeholder="Ex.: Parede norte"
                        className="w-full bg-transparent text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:bg-white/5 rounded px-1 py-0.5"
                      />
                    </td>
                    <td className="py-1 pr-2">
                      <input
                        value={l.formula ?? ''}
                        readOnly={!editavel}
                        onChange={e => onFormulaChange(l, e.target.value)}
                        onBlur={() => onSalvarLinha(l)}
                        placeholder="Ex.: 10*3 + 8*3"
                        className="w-full bg-transparent font-mono text-sm text-white/70 placeholder:text-white/20 focus:outline-none focus:bg-white/5 rounded px-1 py-0.5"
                      />
                    </td>
                    <td className="py-1">
                      <input
                        type="number"
                        value={l.quantidade}
                        readOnly={!editavel}
                        onChange={e => onSetLinha(l.id, { quantidade: Number(e.target.value) })}
                        onBlur={() => onSalvarLinha(l)}
                        className="w-full bg-transparent text-right font-mono text-sm text-white/80 focus:outline-none focus:bg-white/5 rounded px-1 py-0.5"
                      />
                    </td>
                    <td className="py-1 text-right">
                      {editavel && (
                        <button
                          onClick={() => onDelLinha(l.id)}
                          className="text-red-400/40 hover:text-red-400 transition-colors"
                          title="Remover linha"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="flex items-center justify-between pt-1 gap-3 flex-wrap">
            {editavel && (
              <button
                onClick={onAddLinha}
                className="text-xs text-blue-400/60 hover:text-blue-400 transition-colors"
              >
                + Adicionar linha
              </button>
            )}
            <div className="flex items-center gap-3 text-xs ml-auto">
              <span className="text-white/40">
                Total memória:{' '}
                <span className="font-mono text-white/70">{fmtQtd(total)}</span>
                {' · '}Planilha:{' '}
                <span className="font-mono text-white/70">{fmtQtd(item.quantidade)}</span>
              </span>
              {temLinhas && !bate && editavel && (
                <Btn variant="ghost" size="sm" onClick={() => onAplicar(total)}>
                  Aplicar à planilha
                </Btn>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main tab ──────────────────────────────────────────────────────────────────

export function MemoriaCalculoTab({ obra_id }: { obra_id: string }) {
  const [tipo,       setTipo]       = useState<PlanilhaTipo>('custo_planejado')
  const [categorias, setCategorias] = useState<PlanilhaCategoria[]>([])
  const [itens,      setItens]      = useState<PlanilhaItem[]>([])
  const [memoria,    setMemoria]    = useState<MemoriaCalculo[]>([])
  const [headers,    setHeaders]    = useState<PlanilhaHeader[]>([])
  const [loading,    setLoading]    = useState(true)
  const [exporting,  setExporting]  = useState(false)
  const [exportOpen, setExportOpen] = useState(false)

  // Categorias colapsadas; itens com memória aberta (múltiplos simultâneos)
  const [catColapsadas, setCatColapsadas] = useState<Set<string>>(new Set())
  const [expandidos,    setExpandidos]    = useState<Set<string>>(new Set())

  useEffect(() => {
    let active = true
    setLoading(true)
    setExpandidos(new Set())
    setCatColapsadas(new Set())
    Promise.all([
      getCategoriasByObra(obra_id, tipo),
      getItensByObra(obra_id, tipo),
      getMemoriaByObra(obra_id),
      getPlanilhasStatus(obra_id),
    ]).then(([cats, its, mem, hs]) => {
      if (!active) return
      setCategorias(cats)
      setItens(its)
      setMemoria(mem)
      setHeaders(hs)
      setLoading(false)
    })
    return () => { active = false }
  }, [obra_id, tipo])

  const header  = headers.find(h => h.tipo === tipo)
  const editavel = header ? planilhaEditavel(tipo, header.status) : true

  // ── Handlers ───────────────────────────────────────────────────────────────

  function toggleCat(id: string) {
    setCatColapsadas(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleItem(id: string) {
    setExpandidos(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function setLinhaLocal(id: string, patch: Partial<MemoriaCalculo>) {
    setMemoria(prev => prev.map(m => (m.id === id ? { ...m, ...patch } : m)))
  }

  async function salvarLinha(l: MemoriaCalculo) {
    await updateMemoria(l.id, {
      descricao: l.descricao,
      formula:   l.formula,
      quantidade: l.quantidade,
    })
  }

  function onFormulaChange(l: MemoriaCalculo, value: string) {
    const q = avaliarFormula(value)
    setLinhaLocal(l.id, { formula: value, ...(q !== null ? { quantidade: q } : {}) })
  }

  async function addLinha(item: PlanilhaItem) {
    const ordem = memoria.filter(m => m.planilha_item_id === item.id).length + 1
    const { data, error } = await createMemoria({
      obra_id,
      planilha_item_id: item.id,
      descricao: '',
      formula: '',
      quantidade: 0,
      unidade: item.unidade,
      ordem,
    })
    if (error || !data) { toast.error(error ?? 'Erro ao adicionar linha'); return }
    setMemoria(prev => [...prev, data])
    // Garante que o item esteja expandido
    setExpandidos(prev => new Set(prev).add(item.id))
  }

  async function delLinha(id: string) {
    await deleteMemoria(id)
    setMemoria(prev => prev.filter(m => m.id !== id))
  }

  async function aplicar(item: PlanilhaItem, total: number) {
    const upd = await updateItem(item.id, { quantidade: total })
    if (!upd) { toast.error('Não foi possível aplicar (planilha bloqueada?).'); return }
    setItens(prev => prev.map(i => (i.id === item.id ? { ...i, quantidade: total } : i)))
    toast.success('Quantidade aplicada à planilha.')
  }

  // ── Derivações ─────────────────────────────────────────────────────────────

  const linhasDoItem = (itemId: string) =>
    memoria.filter(m => m.planilha_item_id === itemId).sort((a, b) => a.ordem - b.ordem)

  // Itens sem categoria (segurança)
  const itensSemCat = itens.filter(i => !categorias.some(c => c.id === i.categoria_id))

  // Contagem de itens com memória incompleta (para badge no cabeçalho)
  const pendentes = itens.filter(item => {
    const linhas = linhasDoItem(item.id)
    const total = linhas.reduce((s, l) => s + (l.quantidade || 0), 0)
    return linhas.length > 0 && Math.abs(total - item.quantidade) >= 0.0001
  }).length

  // ── Exportar PDF ─────────────────────────────────────────────────────────────

  const mapItem = (item: PlanilhaItem) => ({
    codigo:            item.codigo,
    descricao:         item.descricao,
    unidade:           item.unidade,
    quantidadePlanilha: item.quantidade,
    linhas: linhasDoItem(item.id).map(l => ({
      descricao:  l.descricao,
      formula:    l.formula ?? null,
      quantidade: l.quantidade,
    })),
  })

  async function handleExportPdf(mode: MemoriaPdfMode) {
    setExportOpen(false)
    if (categorias.length === 0 && itens.length === 0) {
      toast.error('Nada para exportar — sem itens.')
      return
    }
    if (mode === 'divergencias' && pendentes === 0) {
      toast('Nenhuma divergência nesta planilha.')
      return
    }
    setExporting(true)
    try {
      const obra = await getObraById(obra_id)
      const cats: MemoriaPdfCategoria[] = categorias
        .map(cat => ({
          nome: cat.nome,
          itens: itens.filter(i => i.categoria_id === cat.id).map(mapItem),
        }))
        .filter(c => c.itens.length > 0)

      if (itensSemCat.length > 0) {
        cats.push({ nome: 'Sem categoria', itens: itensSemCat.map(mapItem) })
      }

      exportMemoriaPdf({
        obra: { name: obra?.name ?? 'Obra', client: obra?.client, location: obra?.location },
        planilhaLabel: planilhaOpcoes.find(o => o.value === tipo)?.label ?? '',
        categorias: cats,
        mode,
      })
    } catch (e) {
      console.error('export memoria pdf error:', e)
      toast.error('Erro ao gerar o PDF.')
    } finally {
      setExporting(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) return <LoadingSpinner />

  const vazio = categorias.length === 0 && itens.length === 0

  return (
    <div className="space-y-4">

      {/* Cabeçalho + seletor de planilha */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-semibold text-white">
            Memória de Cálculo
            {pendentes > 0 && (
              <span className="ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400">
                {pendentes} divergente{pendentes !== 1 ? 's' : ''}
              </span>
            )}
          </p>
          <p className="text-xs text-white/30 mt-0.5">
            Quantitativos e fórmulas que justificam o volume de cada item.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
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
          <div className="relative">
            <button
              onClick={() => setExportOpen(o => !o)}
              disabled={exporting || vazio}
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
                <div className="absolute right-0 mt-1.5 z-50 w-64 bg-[#161616] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                  <button
                    onClick={() => handleExportPdf('completa')}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-white/[0.04] transition-colors"
                  >
                    <span className="block text-xs font-medium text-white/85">Completa</span>
                    <span className="block text-[11px] text-white/35 mt-0.5">Todos os itens e suas linhas</span>
                  </button>
                  <button
                    onClick={() => handleExportPdf('divergencias')}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-white/[0.04] transition-colors border-t border-white/[0.06]"
                  >
                    <span className="block text-xs font-medium text-white/85">
                      Só divergências
                      {pendentes > 0 && (
                        <span className="ml-1.5 text-[10px] font-medium px-1 py-0.5 rounded bg-amber-500/15 text-amber-400">
                          {pendentes}
                        </span>
                      )}
                    </span>
                    <span className="block text-[11px] text-white/35 mt-0.5">Apenas itens cuja memória não bate</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {vazio ? (
        <EmptyState
          message={`Nenhum item na planilha de ${planilhaOpcoes.find(o => o.value === tipo)?.label}.`}
        />
      ) : (
        <div className="bg-[#0d0d0d] border border-white/[0.08] rounded-2xl overflow-hidden">

          {/* ── Grupos por categoria ── */}
          {categorias.map((cat, catIdx) => {
            const catItens = itens.filter(i => i.categoria_id === cat.id)
            if (catItens.length === 0) return null
            const colapsada = catColapsadas.has(cat.id)

            // Resumo de divergências na categoria
            const divCat = catItens.filter(item => {
              const linhas = linhasDoItem(item.id)
              const total  = linhas.reduce((s, l) => s + (l.quantidade || 0), 0)
              return linhas.length > 0 && Math.abs(total - item.quantidade) >= 0.0001
            }).length

            return (
              <div key={cat.id} className="border-b border-white/[0.06] last:border-0">

                {/* Category header */}
                <button
                  onClick={() => toggleCat(cat.id)}
                  className="group w-full flex items-center gap-2 px-4 py-2.5 bg-[#111] hover:bg-[#141414] transition-colors text-left"
                >
                  <span className="text-white/30 text-[10px] w-3">{colapsada ? '▶' : '▼'}</span>
                  <span className="text-white/30 text-xs font-mono w-5">{catIdx + 1}.</span>
                  <span className="text-sm font-semibold text-white/80 flex-1">{cat.nome}</span>
                  {divCat > 0 && !colapsada && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400/80">
                      {divCat} div.
                    </span>
                  )}
                  <span className="text-xs text-white/25">
                    {catItens.length} item{catItens.length !== 1 ? 'ns' : ''}
                  </span>
                </button>

                {/* Items */}
                {!colapsada && catItens.map((item, itemIdx) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    catIdx={catIdx}
                    itemIdx={itemIdx}
                    linhas={linhasDoItem(item.id)}
                    editavel={editavel}
                    expandido={expandidos.has(item.id)}
                    onToggle={() => toggleItem(item.id)}
                    onSetLinha={setLinhaLocal}
                    onSalvarLinha={salvarLinha}
                    onFormulaChange={onFormulaChange}
                    onAddLinha={() => addLinha(item)}
                    onDelLinha={delLinha}
                    onAplicar={total => aplicar(item, total)}
                  />
                ))}
              </div>
            )
          })}

          {/* ── Itens sem categoria (fallback) ── */}
          {itensSemCat.length > 0 && (
            <div className="border-t border-white/[0.06]">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-[#111]">
                <span className="text-xs text-white/30 italic">Sem categoria</span>
              </div>
              {itensSemCat.map((item, itemIdx) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  catIdx={categorias.length}
                  itemIdx={itemIdx}
                  linhas={linhasDoItem(item.id)}
                  editavel={editavel}
                  expandido={expandidos.has(item.id)}
                  onToggle={() => toggleItem(item.id)}
                  onSetLinha={setLinhaLocal}
                  onSalvarLinha={salvarLinha}
                  onFormulaChange={onFormulaChange}
                  onAddLinha={() => addLinha(item)}
                  onDelLinha={delLinha}
                  onAplicar={total => aplicar(item, total)}
                />
              ))}
            </div>
          )}

        </div>
      )}
    </div>
  )
}
