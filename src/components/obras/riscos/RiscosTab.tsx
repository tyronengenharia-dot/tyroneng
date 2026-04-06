'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  getRiscosByObra,
  createRisco,
  updateRisco,
  deleteRisco,
  calcNivelRisco,
  nivelRiscoLabel,
} from '@/services/diarioRiscoService'
import {
  Risco,
  RiscoCategoria,
  RiscoProbabilidade,
  RiscoImpacto,
  RiscoStatus,
} from '@/types/diario-riscos'
import { Btn, EmptyState, LoadingSpinner } from '@/components/ui'
import { fmtDate, fmtCurrency, cn } from '@/lib/utils'

// ─── Config maps ──────────────────────────────────────────────────────────────

const CATEGORIAS: { value: RiscoCategoria; label: string; icon: string }[] = [
  { value: 'seguranca',  label: 'Segurança',   icon: '⚠️' },
  { value: 'financeiro', label: 'Financeiro',  icon: '💰' },
  { value: 'prazo',      label: 'Prazo',        icon: '📅' },
  { value: 'qualidade',  label: 'Qualidade',   icon: '✅' },
  { value: 'ambiental',  label: 'Ambiental',   icon: '🌿' },
  { value: 'juridico',   label: 'Jurídico',    icon: '⚖️' },
  { value: 'outro',      label: 'Outro',        icon: '📋' },
]

const PROBABILIDADES: { value: RiscoProbabilidade; label: string; score: number }[] = [
  { value: 'muito_baixa', label: 'Muito baixa', score: 1 },
  { value: 'baixa',       label: 'Baixa',        score: 2 },
  { value: 'media',       label: 'Média',        score: 3 },
  { value: 'alta',        label: 'Alta',          score: 4 },
  { value: 'muito_alta',  label: 'Muito alta',   score: 5 },
]

const IMPACTOS: { value: RiscoImpacto; label: string; score: number }[] = [
  { value: 'muito_baixo', label: 'Muito baixo', score: 1 },
  { value: 'baixo',       label: 'Baixo',        score: 2 },
  { value: 'medio',       label: 'Médio',        score: 3 },
  { value: 'alto',        label: 'Alto',          score: 4 },
  { value: 'muito_alto',  label: 'Muito alto',   score: 5 },
]

const STATUS_RISCO: { value: RiscoStatus; label: string }[] = [
  { value: 'identificado',    label: 'Identificado' },
  { value: 'em_monitoramento', label: 'Monitorando' },
  { value: 'mitigado',        label: 'Mitigado' },
  { value: 'ocorreu',         label: 'Ocorreu' },
  { value: 'encerrado',       label: 'Encerrado' },
]

const catInfo = (c: RiscoCategoria) => CATEGORIAS.find(x => x.value === c) ?? CATEGORIAS[6]

// ─── Nivel badge ──────────────────────────────────────────────────────────────

const nivelColors: Record<string, string> = {
  red:    'bg-red-500/15 text-red-400 border-red-500/25',
  orange: 'bg-orange-500/15 text-orange-400 border-orange-500/25',
  amber:  'bg-amber-500/15 text-amber-400 border-amber-500/25',
  green:  'bg-green-500/15 text-green-400 border-green-500/25',
}

const statusColors: Record<RiscoStatus, string> = {
  identificado:     'bg-blue-500/10 text-blue-400 border-blue-500/20',
  em_monitoramento: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  mitigado:         'bg-green-500/10 text-green-400 border-green-500/20',
  ocorreu:          'bg-red-500/10 text-red-400 border-red-500/20',
  encerrado:        'bg-white/5 text-white/30 border-white/10',
}

// ─── Matriz 5x5 ───────────────────────────────────────────────────────────────

function MatrizRisco({ riscos }: { riscos: Risco[] }) {
  return (
    <div className="bg-[#0d0d0d] border border-white/[0.08] rounded-xl p-5">
      <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-4">Matriz de Risco</p>
      <div className="overflow-x-auto">
        <table className="text-[10px] border-collapse" style={{ minWidth: 320 }}>
          <thead>
            <tr>
              <td className="w-20" />
              {IMPACTOS.map(i => (
                <th key={i.value} className="px-1 py-1 text-center text-white/30 font-medium w-14">
                  {i.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...PROBABILIDADES].reverse().map(prob => (
              <tr key={prob.value}>
                <td className="pr-2 py-1 text-right text-white/30 font-medium whitespace-nowrap">
                  {prob.label}
                </td>
                {IMPACTOS.map(imp => {
                  const nivel = prob.score * imp.score
                  const { color } = nivelRiscoLabel(nivel)
                  const count = riscos.filter(r =>
                    r.probabilidade === prob.value && r.impacto === imp.value
                  ).length
                  const bg =
                    color === 'red'    ? 'bg-red-500/20'
                    : color === 'orange' ? 'bg-orange-500/20'
                    : color === 'amber'  ? 'bg-amber-500/15'
                    : 'bg-green-500/10'
                  return (
                    <td key={imp.value} className="px-1 py-0.5">
                      <div className={cn(
                        'w-12 h-10 rounded flex items-center justify-center font-bold text-xs',
                        bg,
                        count > 0 ? 'text-white' : 'text-white/20'
                      )}>
                        {count > 0 ? count : nivel}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-3 mt-3">
        {[
          { color: 'bg-green-500/20',  label: 'Baixo (1–3)' },
          { color: 'bg-amber-500/20',  label: 'Médio (4–8)' },
          { color: 'bg-orange-500/20', label: 'Alto (9–14)' },
          { color: 'bg-red-500/20',    label: 'Crítico (15+)' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={cn('w-3 h-3 rounded', l.color)} />
            <span className="text-[10px] text-white/30">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

type ModalProps = {
  obra_id: string
  inicial: Risco | null
  onClose: () => void
  onSuccess: () => void
}

function RiscoModal({ obra_id, inicial, onClose, onSuccess }: ModalProps) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    titulo:             inicial?.titulo ?? '',
    descricao:          inicial?.descricao ?? '',
    categoria:          inicial?.categoria ?? 'outro' as RiscoCategoria,
    probabilidade:      inicial?.probabilidade ?? 'media' as RiscoProbabilidade,
    impacto:            inicial?.impacto ?? 'medio' as RiscoImpacto,
    status:             inicial?.status ?? 'identificado' as RiscoStatus,
    plano_mitigacao:    inicial?.plano_mitigacao ?? '',
    responsavel:        inicial?.responsavel ?? '',
    prazo_resposta:     inicial?.prazo_resposta ?? '',
    custo_estimado:     inicial?.custo_estimado?.toString() ?? '',
    data_identificacao: inicial?.data_identificacao ?? new Date().toISOString().slice(0, 10),
    data_revisao:       inicial?.data_revisao ?? '',
  })

  function set(k: string, v: string) { setForm(p => ({ ...p, [k]: v })) }

  const nivelAtual = calcNivelRisco(form.probabilidade, form.impacto)
  const { label: nivelLabel, color: nivelColor } = nivelRiscoLabel(nivelAtual)

  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/25 transition-colors'

  async function handleSave() {
    if (!form.titulo.trim()) { toast.error('Informe o título do risco'); return }
    if (!form.plano_mitigacao.trim()) { toast.error('Informe o plano de mitigação'); return }
    setSaving(true)
    const payload = {
      obra_id,
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim(),
      categoria: form.categoria,
      probabilidade: form.probabilidade,
      impacto: form.impacto,
      nivel_risco: nivelAtual,
      status: form.status,
      plano_mitigacao: form.plano_mitigacao.trim(),
      responsavel: form.responsavel,
      prazo_resposta: form.prazo_resposta || undefined,
      custo_estimado: form.custo_estimado ? parseFloat(form.custo_estimado) : undefined,
      data_identificacao: form.data_identificacao,
      data_revisao: form.data_revisao || undefined,
    }
    const ok = inicial
      ? await updateRisco(inicial.id, payload)
      : await createRisco(payload)
    setSaving(false)
    if (ok) { toast.success('Risco salvo!'); onSuccess(); onClose() }
    else toast.error('Erro ao salvar')
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl w-full max-w-2xl my-4 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
          <h2 className="text-base font-semibold text-white">
            {inicial ? 'Editar risco' : 'Identificar novo risco'}
          </h2>
          <button onClick={onClose} className="text-white/30 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">

          {/* Nível calculado em tempo real */}
          <div className={cn(
            'flex items-center justify-between px-4 py-3 rounded-xl border',
            nivelColors[nivelColor]
          )}>
            <span className="text-sm font-medium">Nível de risco calculado</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold font-mono">{nivelAtual}</span>
              <span className="text-sm font-semibold">— {nivelLabel}</span>
            </div>
          </div>

          {/* Título e categoria */}
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Título do risco *</label>
            <input className={inputCls} placeholder="Ex: Atraso na entrega de materiais"
              value={form.titulo} onChange={e => set('titulo', e.target.value)} />
          </div>

          <div>
            <label className="block text-xs text-white/40 mb-2">Categoria</label>
            <div className="flex gap-1.5 flex-wrap">
              {CATEGORIAS.map(c => (
                <button key={c.value} type="button"
                  onClick={() => set('categoria', c.value)}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-all',
                    form.categoria === c.value
                      ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                      : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
                  )}>
                  {c.icon} {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-white/40 mb-1.5">Descrição</label>
            <textarea className={cn(inputCls, 'h-20 resize-none')}
              placeholder="Descreva detalhadamente o risco identificado..."
              value={form.descricao} onChange={e => set('descricao', e.target.value)} />
          </div>

          {/* Probabilidade × Impacto */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-white/40 mb-2">Probabilidade</label>
              <div className="space-y-1.5">
                {PROBABILIDADES.map(p => (
                  <button key={p.value} type="button"
                    onClick={() => set('probabilidade', p.value)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs border transition-all',
                      form.probabilidade === p.value
                        ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                        : 'bg-white/[0.03] border-white/[0.08] text-white/40 hover:border-white/15'
                    )}>
                    <span>{p.label}</span>
                    <span className="font-mono font-bold">{p.score}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-2">Impacto</label>
              <div className="space-y-1.5">
                {IMPACTOS.map(i => (
                  <button key={i.value} type="button"
                    onClick={() => set('impacto', i.value)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs border transition-all',
                      form.impacto === i.value
                        ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                        : 'bg-white/[0.03] border-white/[0.08] text-white/40 hover:border-white/15'
                    )}>
                    <span>{i.label}</span>
                    <span className="font-mono font-bold">{i.score}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Plano de mitigação */}
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Plano de mitigação *</label>
            <textarea className={cn(inputCls, 'h-20 resize-none')}
              placeholder="Descreva as ações para prevenir ou reduzir o impacto deste risco..."
              value={form.plano_mitigacao} onChange={e => set('plano_mitigacao', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Responsável</label>
              <input className={inputCls} placeholder="Nome do responsável"
                value={form.responsavel} onChange={e => set('responsavel', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Custo estimado (R$)</label>
              <input type="number" min="0" className={inputCls} placeholder="0,00"
                value={form.custo_estimado} onChange={e => set('custo_estimado', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Status</label>
              <select className={cn(inputCls, 'cursor-pointer')}
                value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUS_RISCO.map(s => (
                  <option key={s.value} value={s.value} className="bg-[#111]">{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Data identificação</label>
              <input type="date" className={inputCls}
                value={form.data_identificacao} onChange={e => set('data_identificacao', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Prazo de resposta</label>
              <input type="date" className={inputCls}
                value={form.prazo_resposta} onChange={e => set('prazo_resposta', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.08]">
          <Btn onClick={onClose}>Cancelar</Btn>
          <Btn variant="primary" size="md" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar risco'}
          </Btn>
        </div>
      </div>
    </div>
  )
}

// ─── Risco card ───────────────────────────────────────────────────────────────

function RiscoCard({
  risco,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  risco: Risco
  onEdit: () => void
  onDelete: () => void
  onStatusChange: (status: RiscoStatus) => void
}) {
  const nivel = risco.nivel_risco ?? calcNivelRisco(risco.probabilidade, risco.impacto)
  const { label: nivelLabel, color } = nivelRiscoLabel(nivel)
  const cat = catInfo(risco.categoria)

  return (
    <div className="bg-[#0d0d0d] border border-white/[0.08] rounded-xl p-5 hover:border-white/15 transition-colors group">
      {/* Top */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <span className="text-lg mt-0.5 shrink-0">{cat.icon}</span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white/90 leading-snug">{risco.titulo}</p>
            <p className="text-xs text-white/30 mt-0.5">{cat.label}</p>
          </div>
        </div>
        {/* Nivel badge */}
        <div className={cn(
          'flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold shrink-0',
          nivelColors[color]
        )}>
          <span className="font-mono">{nivel}</span>
          <span>{nivelLabel}</span>
        </div>
      </div>

      {/* Descrição */}
      {risco.descricao && (
        <p className="text-xs text-white/40 mb-3 line-clamp-2">{risco.descricao}</p>
      )}

      {/* Prob × Impacto */}
      <div className="flex gap-2 mb-3">
        <div className="flex-1 bg-white/[0.03] rounded-lg px-2.5 py-1.5">
          <p className="text-[9px] text-white/25 mb-0.5">PROBABILIDADE</p>
          <p className="text-xs font-medium text-blue-300">
            {PROBABILIDADES.find(p => p.value === risco.probabilidade)?.label}
          </p>
        </div>
        <div className="flex-1 bg-white/[0.03] rounded-lg px-2.5 py-1.5">
          <p className="text-[9px] text-white/25 mb-0.5">IMPACTO</p>
          <p className="text-xs font-medium text-purple-300">
            {IMPACTOS.find(i => i.value === risco.impacto)?.label}
          </p>
        </div>
      </div>

      {/* Plano de mitigação */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg px-3 py-2 mb-3">
        <p className="text-[9px] text-white/25 mb-1 font-semibold uppercase tracking-wider">Plano de mitigação</p>
        <p className="text-xs text-white/50 line-clamp-2">{risco.plano_mitigacao}</p>
      </div>

      {/* Meta info */}
      <div className="flex items-center gap-3 mb-3 text-xs text-white/30">
        {risco.responsavel && <span>👤 {risco.responsavel}</span>}
        {risco.prazo_resposta && <span>📅 {fmtDate(risco.prazo_resposta)}</span>}
        {risco.custo_estimado != null && risco.custo_estimado > 0 && (
          <span>💰 {fmtCurrency(risco.custo_estimado)}</span>
        )}
      </div>

      {/* Status selector */}
      <div className="flex gap-1 flex-wrap mb-3">
        {STATUS_RISCO.map(s => (
          <button key={s.value}
            onClick={() => onStatusChange(s.value)}
            className={cn(
              'px-2 py-1 rounded text-[10px] font-medium border transition-all',
              risco.status === s.value
                ? statusColors[s.value]
                : 'bg-transparent border-white/[0.06] text-white/20 hover:border-white/15 hover:text-white/40'
            )}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-white/[0.06]">
        <Btn onClick={onEdit} className="flex-1 justify-center">Editar</Btn>
        <Btn variant="danger" onClick={onDelete}>Excluir</Btn>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type Props = { obra_id: string }

export function RiscosTab({ obra_id }: Props) {
  const [riscos, setRiscos]   = useState<Risco[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState<'create' | Risco | null>(null)
  const [filtro, setFiltro]   = useState<string>('todos')

  async function load() {
    const data = await getRiscosByObra(obra_id)
    setRiscos(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [obra_id])

  async function handleDelete(id: string) {
    if (!confirm('Excluir este risco?')) return
    const ok = await deleteRisco(id)
    if (ok) { toast.success('Risco removido'); load() }
    else toast.error('Erro ao excluir')
  }

  async function handleStatusChange(id: string, status: RiscoStatus) {
    const nivel = riscos.find(r => r.id === id)
    if (!nivel) return
    const ok = await updateRisco(id, { status })
    if (ok) {
      setRiscos(prev => prev.map(r => r.id === id ? { ...r, status } : r))
      toast.success('Status atualizado')
    }
  }

  if (loading) return <LoadingSpinner />

  // Computed stats
  const criticos     = riscos.filter(r => (r.nivel_risco ?? 0) >= 15).length
  const altos        = riscos.filter(r => { const n = r.nivel_risco ?? 0; return n >= 9 && n < 15 }).length
  const abertos      = riscos.filter(r => !['mitigado','encerrado'].includes(r.status)).length
  const mitigados    = riscos.filter(r => r.status === 'mitigado').length

  const filtrados = filtro === 'todos'
    ? riscos
    : filtro === 'criticos'
    ? riscos.filter(r => (r.nivel_risco ?? 0) >= 15)
    : filtro === 'abertos'
    ? riscos.filter(r => !['mitigado','encerrado'].includes(r.status))
    : riscos.filter(r => r.status === filtro as RiscoStatus)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-base font-semibold text-white">Gerenciamento de Riscos</p>
          <p className="text-xs text-white/30 mt-0.5">{riscos.length} riscos identificados</p>
        </div>
        <Btn variant="primary" onClick={() => setModal('create')}>+ Identificar risco</Btn>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-[#0d0d0d] border border-white/[0.08] rounded-xl px-4 py-3">
          <p className="text-[10px] text-white/30 mb-1">Total identificados</p>
          <p className="text-xl font-semibold text-white">{riscos.length}</p>
        </div>
        <div className="bg-[#0d0d0d] border border-red-500/20 rounded-xl px-4 py-3">
          <p className="text-[10px] text-white/30 mb-1">Críticos</p>
          <p className="text-xl font-semibold text-red-400">{criticos}</p>
        </div>
        <div className="bg-[#0d0d0d] border border-amber-500/20 rounded-xl px-4 py-3">
          <p className="text-[10px] text-white/30 mb-1">Em aberto</p>
          <p className="text-xl font-semibold text-amber-400">{abertos}</p>
        </div>
        <div className="bg-[#0d0d0d] border border-green-500/20 rounded-xl px-4 py-3">
          <p className="text-[10px] text-white/30 mb-1">Mitigados</p>
          <p className="text-xl font-semibold text-green-400">{mitigados}</p>
        </div>
      </div>

      {/* Matriz + filtros lado a lado */}
      <div className="grid grid-cols-[300px_1fr] gap-4">
        <MatrizRisco riscos={riscos} />

        <div className="bg-[#0d0d0d] border border-white/[0.08] rounded-xl p-5">
          <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">Distribuição por categoria</p>
          <div className="space-y-2">
            {CATEGORIAS.map(cat => {
              const count = riscos.filter(r => r.categoria === cat.value).length
              const pct   = riscos.length > 0 ? (count / riscos.length) * 100 : 0
              return (
                <div key={cat.value} className="flex items-center gap-2">
                  <span className="text-sm w-5">{cat.icon}</span>
                  <span className="text-xs text-white/50 w-20 truncate">{cat.label}</span>
                  <div className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
                    <div className="h-full bg-blue-500/60 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-white/30 font-mono w-4 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Filtro tabs */}
      {riscos.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {[
            { key: 'todos',     label: `Todos (${riscos.length})` },
            { key: 'criticos',  label: `Críticos (${criticos})` },
            { key: 'abertos',   label: `Em aberto (${abertos})` },
            { key: 'mitigado',  label: `Mitigados (${mitigados})` },
          ].map(f => (
            <button key={f.key}
              onClick={() => setFiltro(f.key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                filtro === f.key
                  ? 'bg-white/10 text-white border-white/15'
                  : 'bg-transparent text-white/40 border-white/[0.08] hover:border-white/15 hover:text-white/60'
              )}>
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Grid de riscos */}
      {filtrados.length === 0 ? (
        <EmptyState message={
          riscos.length === 0
            ? 'Nenhum risco identificado. Clique em + Identificar risco para começar.'
            : 'Nenhum risco neste filtro.'
        } />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtrados.map(r => (
            <RiscoCard
              key={r.id}
              risco={r}
              onEdit={() => setModal(r)}
              onDelete={() => handleDelete(r.id)}
              onStatusChange={status => handleStatusChange(r.id, status)}
            />
          ))}
        </div>
      )}

      {modal && (
        <RiscoModal
          obra_id={obra_id}
          inicial={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSuccess={load}
        />
      )}
    </div>
  )
}
