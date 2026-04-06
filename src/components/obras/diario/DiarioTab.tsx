'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  getDiariosByObra,
  createDiario,
  updateDiario,
  deleteDiario,
} from '@/services/diarioRiscoService'
import {
  DiarioObra,
  ClimaCondicao,
  DiarioFuncionario,
  DiarioServico,
} from '@/types/diario-riscos'
import { Btn, EmptyState, LoadingSpinner, Modal, Input, Select } from '@/components/ui'
import { fmtDate, cn } from '@/lib/utils'

// ─── Constants ────────────────────────────────────────────────────────────────

const CLIMA_OPTIONS: { value: ClimaCondicao; label: string; icon: string }[] = [
  { value: 'ensolarado',          label: 'Ensolarado',           icon: '☀️' },
  { value: 'parcialmente_nublado', label: 'Parc. nublado',       icon: '⛅' },
  { value: 'nublado',             label: 'Nublado',              icon: '☁️' },
  { value: 'chuvoso',             label: 'Chuvoso',              icon: '🌧️' },
  { value: 'tempestade',          label: 'Tempestade',           icon: '⛈️' },
]

const climaIcon = (v: ClimaCondicao) => CLIMA_OPTIONS.find(o => o.value === v)?.icon ?? '☁️'
const climaLabel = (v: ClimaCondicao) => CLIMA_OPTIONS.find(o => o.value === v)?.label ?? v

// ─── Default form ─────────────────────────────────────────────────────────────

function defaultForm(obra_id: string, numero: number): Omit<DiarioObra, 'id' | 'created_at' | 'updated_at'> {
  return {
    obra_id,
    data: new Date().toISOString().slice(0, 10),
    numero,
    clima_manha: 'ensolarado',
    clima_tarde: 'ensolarado',
    temperatura_max: undefined,
    temperatura_min: undefined,
    chuva_mm: undefined,
    horas_improdutivas: 0,
    funcionarios: [],
    total_funcionarios: 0,
    servicos: [],
    ocorrencias: '',
    observacoes: '',
    fotos: [],
    responsavel_nome: '',
    responsavel_cargo: '',
  }
}

// ─── PDF export ───────────────────────────────────────────────────────────────

function exportDiarioPDF(diario: DiarioObra, obraName: string) {
  const w = window.open('', '_blank')
  if (!w) { toast.error('Popup bloqueado. Permita popups neste site.'); return }

  const rows_func = diario.funcionarios.map(f =>
    `<tr><td>${f.nome}</td><td>${f.cargo}</td><td style="text-align:right">${f.quantidade}</td></tr>`
  ).join('')

  const rows_serv = diario.servicos.map(s =>
    `<tr><td>${s.descricao}</td><td style="text-align:right">${s.percentual_executado}%</td><td>${s.observacao ?? ''}</td></tr>`
  ).join('')

  const fotos_html = diario.fotos.length > 0
    ? `<h3>Registro Fotográfico</h3>
       <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
         ${diario.fotos.map(f => `
           <div>
             <img src="${f.url}" style="width:100%;height:120px;object-fit:cover;border-radius:4px" />
             ${f.legenda ? `<p style="font-size:10px;color:#666;margin:2px 0 0">${f.legenda}</p>` : ''}
           </div>`).join('')}
       </div>`
    : ''

  w.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Diário de Obra #${diario.numero}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #111; padding: 32px }
  h1 { font-size: 18px; font-weight: 700; margin-bottom: 2px }
  h2 { font-size: 13px; font-weight: 700; margin: 20px 0 6px; padding-bottom: 4px; border-bottom: 1px solid #ddd }
  h3 { font-size: 12px; font-weight: 700; margin: 16px 0 6px }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #111 }
  .meta { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; background: #f8f8f8; padding: 12px; border-radius: 6px }
  .meta-item label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #666 }
  .meta-item p { font-size: 13px; font-weight: 700 }
  .clima-grid { display: grid; grid-template-columns: repeat(5,1fr); gap: 8px; margin-bottom: 4px }
  .clima-box { background: #f8f8f8; border-radius: 4px; padding: 8px; text-align: center }
  .clima-box .icon { font-size: 20px }
  .clima-box label { font-size: 9px; color: #666; display: block }
  .clima-box p { font-size: 11px; font-weight: 600 }
  table { width: 100%; border-collapse: collapse; margin-top: 6px }
  th { background: #f0f0f0; text-align: left; padding: 6px 8px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em }
  td { padding: 5px 8px; border-bottom: 1px solid #eee }
  .obs { background: #fffbe6; border: 1px solid #f0d060; border-radius: 4px; padding: 10px; font-size: 11px; line-height: 1.5 }
  .sign { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 32px }
  .sign-box { text-align: center; border-top: 1px solid #333; padding-top: 6px; font-size: 10px }
  @media print { body { padding: 16px } }
</style>
</head>
<body>
<div class="header">
  <div>
    <p style="font-size:10px;color:#666;margin-bottom:2px">DIÁRIO DE OBRA</p>
    <h1>${obraName}</h1>
    <p style="color:#666;margin-top:2px">#RDO-${String(diario.numero).padStart(4,'0')} · ${fmtDate(diario.data)}</p>
  </div>
</div>

<div class="meta">
  <div class="meta-item"><label>Data</label><p>${fmtDate(diario.data)}</p></div>
  <div class="meta-item"><label>Nº RDO</label><p>#${String(diario.numero).padStart(4,'0')}</p></div>
  <div class="meta-item"><label>Total de funcionários</label><p>${diario.total_funcionarios}</p></div>
  <div class="meta-item"><label>Hs. improdutivas</label><p>${diario.horas_improdutivas ?? 0}h</p></div>
</div>

<h2>Condições Climáticas</h2>
<div class="clima-grid">
  <div class="clima-box"><div class="icon">${climaIcon(diario.clima_manha)}</div><label>Manhã</label><p>${climaLabel(diario.clima_manha)}</p></div>
  <div class="clima-box"><div class="icon">${climaIcon(diario.clima_tarde)}</div><label>Tarde</label><p>${climaLabel(diario.clima_tarde)}</p></div>
  <div class="clima-box"><div class="icon">🌡️</div><label>Temp. Máx.</label><p>${diario.temperatura_max ?? '—'}°C</p></div>
  <div class="clima-box"><div class="icon">🌡️</div><label>Temp. Mín.</label><p>${diario.temperatura_min ?? '—'}°C</p></div>
  <div class="clima-box"><div class="icon">💧</div><label>Chuva</label><p>${diario.chuva_mm ?? 0} mm</p></div>
</div>

<h2>Equipe (${diario.total_funcionarios} funcionários)</h2>
<table>
  <thead><tr><th>Nome / Equipe</th><th>Cargo / Função</th><th style="text-align:right">Qtd.</th></tr></thead>
  <tbody>${rows_func || '<tr><td colspan="3" style="color:#999;text-align:center">Nenhum funcionário registrado</td></tr>'}</tbody>
</table>

<h2>Serviços Executados</h2>
<table>
  <thead><tr><th>Descrição do Serviço</th><th style="text-align:right">% Exec.</th><th>Observação</th></tr></thead>
  <tbody>${rows_serv || '<tr><td colspan="3" style="color:#999;text-align:center">Nenhum serviço registrado</td></tr>'}</tbody>
</table>

${diario.ocorrencias ? `<h2>Ocorrências</h2><div class="obs">${diario.ocorrencias}</div>` : ''}
${diario.observacoes ? `<h2>Observações Gerais</h2><div class="obs">${diario.observacoes}</div>` : ''}
${fotos_html}

<div class="sign">
  <div class="sign-box">
    <p style="font-weight:700">${diario.responsavel_nome || '___________________________'}</p>
    <p>${diario.responsavel_cargo || 'Responsável Técnico'}</p>
  </div>
  <div class="sign-box">
    <p style="font-weight:700">___________________________</p>
    <p>Fiscal / Cliente</p>
  </div>
</div>

<script>window.onload = () => window.print()</script>
</body>
</html>`)
  w.document.close()
}

// ─── Modal ────────────────────────────────────────────────────────────────────

type ModalProps = {
  obra_id: string
  inicial: DiarioObra | null
  numero: number
  onClose: () => void
  onSuccess: () => void
}

function DiarioModal({ obra_id, inicial, numero, onClose, onSuccess }: ModalProps) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Omit<DiarioObra, 'id' | 'created_at' | 'updated_at'>>(
    inicial
      ? { ...inicial }
      : defaultForm(obra_id, numero)
  )

  function setF<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm(p => ({ ...p, [k]: v }))
  }

  // ── Funcionários ───────────────────────────────────────────────────────────

  function addFuncionario() {
    setF('funcionarios', [...form.funcionarios, { nome: '', cargo: '', quantidade: 1 }])
  }
  function updateFunc(idx: number, k: keyof DiarioFuncionario, v: string | number) {
    const updated = form.funcionarios.map((f, i) => i === idx ? { ...f, [k]: v } : f)
    setF('funcionarios', updated)
    setF('total_funcionarios', updated.reduce((a, f) => a + Number(f.quantidade), 0))
  }
  function removeFunc(idx: number) {
    const updated = form.funcionarios.filter((_, i) => i !== idx)
    setF('funcionarios', updated)
    setF('total_funcionarios', updated.reduce((a, f) => a + Number(f.quantidade), 0))
  }

  // ── Serviços ───────────────────────────────────────────────────────────────

  function addServico() {
    setF('servicos', [...form.servicos, { descricao: '', percentual_executado: 0, observacao: '' }])
  }
  function updateServico(idx: number, k: keyof DiarioServico, v: string | number) {
    setF('servicos', form.servicos.map((s, i) => i === idx ? { ...s, [k]: v } : s))
  }
  function removeServico(idx: number) {
    setF('servicos', form.servicos.filter((_, i) => i !== idx))
  }

  // ── Fotos (URL simples) ────────────────────────────────────────────────────
  // Para produção: integrar com Supabase Storage e usar signed upload URLs

  function addFoto() {
    const url = prompt('Cole a URL da foto (ou use Supabase Storage):')
    if (!url) return
    const legenda = prompt('Legenda (opcional):') ?? ''
    setF('fotos', [...form.fotos, { url, legenda }])
  }
  function removeFoto(idx: number) {
    setF('fotos', form.fotos.filter((_, i) => i !== idx))
  }

  // ── Save ───────────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!form.data) { toast.error('Informe a data'); return }
    if (!form.responsavel_nome.trim()) { toast.error('Informe o responsável'); return }
    setSaving(true)
    const ok = inicial
      ? await updateDiario(inicial.id, form)
      : await createDiario(form)
    setSaving(false)
    if (ok) { toast.success('Diário salvo!'); onSuccess(); onClose() }
    else toast.error('Erro ao salvar diário')
  }

  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/25 transition-colors'
  const sectionCls = 'border border-white/[0.08] rounded-xl p-4 space-y-3'

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl w-full max-w-3xl my-4 shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
          <div>
            <h2 className="text-base font-semibold text-white">
              {inicial ? 'Editar RDO' : 'Novo Relatório Diário de Obra'}
            </h2>
            <p className="text-xs text-white/30 mt-0.5">
              RDO #{ String(form.numero).padStart(4, '0') }
            </p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Data e responsável */}
          <div className={sectionCls}>
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Identificação</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-white/40 mb-1.5">Data *</label>
                <input type="date" className={inputCls} value={form.data}
                  onChange={e => setF('data', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1.5">Responsável *</label>
                <input className={inputCls} placeholder="Nome do engenheiro" value={form.responsavel_nome}
                  onChange={e => setF('responsavel_nome', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1.5">Cargo</label>
                <input className={inputCls} placeholder="Ex: Engenheiro" value={form.responsavel_cargo}
                  onChange={e => setF('responsavel_cargo', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Clima */}
          <div className={sectionCls}>
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Condições Climáticas</p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-white/40 mb-2">Clima manhã</label>
                <div className="flex gap-1.5 flex-wrap">
                  {CLIMA_OPTIONS.map(opt => (
                    <button key={opt.value} type="button"
                      onClick={() => setF('clima_manha', opt.value)}
                      className={cn(
                        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-all',
                        form.clima_manha === opt.value
                          ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                          : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
                      )}>
                      <span>{opt.icon}</span> {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-2">Clima tarde</label>
                <div className="flex gap-1.5 flex-wrap">
                  {CLIMA_OPTIONS.map(opt => (
                    <button key={opt.value} type="button"
                      onClick={() => setF('clima_tarde', opt.value)}
                      className={cn(
                        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-all',
                        form.clima_tarde === opt.value
                          ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                          : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
                      )}>
                      <span>{opt.icon}</span> {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-white/40 mb-1.5">Temp. máx. (°C)</label>
                <input type="number" className={inputCls} placeholder="—"
                  value={form.temperatura_max ?? ''}
                  onChange={e => setF('temperatura_max', e.target.value ? Number(e.target.value) : undefined)} />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1.5">Temp. mín. (°C)</label>
                <input type="number" className={inputCls} placeholder="—"
                  value={form.temperatura_min ?? ''}
                  onChange={e => setF('temperatura_min', e.target.value ? Number(e.target.value) : undefined)} />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1.5">Chuva (mm)</label>
                <input type="number" min="0" className={inputCls} placeholder="0"
                  value={form.chuva_mm ?? ''}
                  onChange={e => setF('chuva_mm', e.target.value ? Number(e.target.value) : undefined)} />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1.5">Hs. improdutivas</label>
                <input type="number" min="0" max="24" className={inputCls} placeholder="0"
                  value={form.horas_improdutivas ?? 0}
                  onChange={e => setF('horas_improdutivas', Number(e.target.value))} />
              </div>
            </div>
          </div>

          {/* Equipe */}
          <div className={sectionCls}>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">
                Equipe · {form.total_funcionarios} func.
              </p>
              <button onClick={addFuncionario}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                + Adicionar
              </button>
            </div>

            {form.funcionarios.length === 0 ? (
              <p className="text-xs text-white/20 text-center py-3">Nenhum funcionário adicionado</p>
            ) : (
              <div className="space-y-2">
                {form.funcionarios.map((f, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_80px_28px] gap-2 items-center">
                    <input className={inputCls} placeholder="Nome / equipe" value={f.nome}
                      onChange={e => updateFunc(i, 'nome', e.target.value)} />
                    <input className={inputCls} placeholder="Cargo / função" value={f.cargo}
                      onChange={e => updateFunc(i, 'cargo', e.target.value)} />
                    <input type="number" min="1" className={cn(inputCls, 'text-center')} value={f.quantidade}
                      onChange={e => updateFunc(i, 'quantidade', Number(e.target.value))} />
                    <button onClick={() => removeFunc(i)}
                      className="text-red-400/50 hover:text-red-400 transition-colors text-sm">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Serviços */}
          <div className={sectionCls}>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Serviços Executados</p>
              <button onClick={addServico}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                + Adicionar
              </button>
            </div>

            {form.servicos.length === 0 ? (
              <p className="text-xs text-white/20 text-center py-3">Nenhum serviço adicionado</p>
            ) : (
              <div className="space-y-2">
                {form.servicos.map((s, i) => (
                  <div key={i} className="grid grid-cols-[1fr_90px_1fr_28px] gap-2 items-center">
                    <input className={inputCls} placeholder="Descrição do serviço" value={s.descricao}
                      onChange={e => updateServico(i, 'descricao', e.target.value)} />
                    <div className="relative">
                      <input type="number" min="0" max="100" className={cn(inputCls, 'pr-6')}
                        placeholder="0" value={s.percentual_executado}
                        onChange={e => updateServico(i, 'percentual_executado', Number(e.target.value))} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/30">%</span>
                    </div>
                    <input className={inputCls} placeholder="Observação" value={s.observacao ?? ''}
                      onChange={e => updateServico(i, 'observacao', e.target.value)} />
                    <button onClick={() => removeServico(i)}
                      className="text-red-400/50 hover:text-red-400 transition-colors text-sm">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ocorrências e observações */}
          <div className={sectionCls}>
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Registro</p>
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Ocorrências / Problemas</label>
              <textarea className={cn(inputCls, 'h-20 resize-none')}
                placeholder="Registre problemas, paralisações, acidentes, visitas de fiscalização..."
                value={form.ocorrencias ?? ''}
                onChange={e => setF('ocorrencias', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Observações Gerais</label>
              <textarea className={cn(inputCls, 'h-16 resize-none')}
                placeholder="Anotações adicionais do dia..."
                value={form.observacoes ?? ''}
                onChange={e => setF('observacoes', e.target.value)} />
            </div>
          </div>

          {/* Fotos */}
          <div className={sectionCls}>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">
                Registro Fotográfico · {form.fotos.length} fotos
              </p>
              <button onClick={addFoto}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                + Foto (URL)
              </button>
            </div>

            {form.fotos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {form.fotos.map((foto, i) => (
                  <div key={i} className="relative group">
                    <img src={foto.url} alt={foto.legenda}
                      className="w-full h-24 object-cover rounded-lg border border-white/10" />
                    {foto.legenda && (
                      <p className="text-[10px] text-white/40 mt-1 truncate">{foto.legenda}</p>
                    )}
                    <button onClick={() => removeFoto(i)}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/70 text-red-400 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {form.fotos.length === 0 && (
              <p className="text-xs text-white/20 text-center py-3">
                Nenhuma foto adicionada · Cole URLs de imagens
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.08]">
          <Btn onClick={onClose}>Cancelar</Btn>
          <Btn variant="primary" size="md" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar RDO'}
          </Btn>
        </div>
      </div>
    </div>
  )
}

// ─── Card de diário ────────────────────────────────────────────────────────────

function DiarioCard({
  diario,
  obraName,
  onEdit,
  onDelete,
}: {
  diario: DiarioObra
  obraName: string
  onEdit: () => void
  onDelete: () => void
}) {
  const totalFunc = diario.total_funcionarios
  const totalServ = diario.servicos.length

  return (
    <div className="bg-[#0d0d0d] border border-white/[0.08] rounded-xl p-5 hover:border-white/15 transition-colors group">
      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-semibold text-white/40">
              #RDO-{String(diario.numero).padStart(4, '0')}
            </span>
            <span className="text-white/10">·</span>
            <span className="text-xs text-white/40">{fmtDate(diario.data)}</span>
          </div>
          <p className="text-sm font-medium text-white/80">{diario.responsavel_nome}</p>
          <p className="text-xs text-white/30">{diario.responsavel_cargo}</p>
        </div>

        {/* Clima badges */}
        <div className="flex items-center gap-1.5">
          <span className="text-lg" title={`Manhã: ${climaLabel(diario.clima_manha)}`}>
            {climaIcon(diario.clima_manha)}
          </span>
          <span className="text-white/20 text-xs">→</span>
          <span className="text-lg" title={`Tarde: ${climaLabel(diario.clima_tarde)}`}>
            {climaIcon(diario.clima_tarde)}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-white/[0.03] rounded-lg px-3 py-2">
          <p className="text-[10px] text-white/30 mb-0.5">Funcionários</p>
          <p className="text-sm font-semibold text-white">{totalFunc}</p>
        </div>
        <div className="bg-white/[0.03] rounded-lg px-3 py-2">
          <p className="text-[10px] text-white/30 mb-0.5">Serviços</p>
          <p className="text-sm font-semibold text-white">{totalServ}</p>
        </div>
        <div className="bg-white/[0.03] rounded-lg px-3 py-2">
          <p className="text-[10px] text-white/30 mb-0.5">Hs. improd.</p>
          <p className="text-sm font-semibold text-white">{diario.horas_improdutivas ?? 0}h</p>
        </div>
      </div>

      {/* Serviços preview */}
      {diario.servicos.length > 0 && (
        <div className="space-y-1 mb-4">
          {diario.servicos.slice(0, 2).map((s, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-xs text-white/50 truncate flex-1">{s.descricao}</span>
              <span className="text-xs font-mono text-blue-400 ml-2">{s.percentual_executado}%</span>
            </div>
          ))}
          {diario.servicos.length > 2 && (
            <p className="text-xs text-white/20">+{diario.servicos.length - 2} serviços</p>
          )}
        </div>
      )}

      {/* Ocorrência preview */}
      {diario.ocorrencias && (
        <div className="bg-amber-500/5 border border-amber-500/15 rounded-lg px-3 py-2 mb-4">
          <p className="text-[10px] text-amber-400/70 font-semibold mb-0.5">Ocorrência</p>
          <p className="text-xs text-white/50 line-clamp-2">{diario.ocorrencias}</p>
        </div>
      )}

      {/* Fotos preview */}
      {diario.fotos.length > 0 && (
        <div className="flex gap-1.5 mb-4">
          {diario.fotos.slice(0, 4).map((f, i) => (
            <img key={i} src={f.url} alt={f.legenda}
              className="w-12 h-12 rounded object-cover border border-white/10" />
          ))}
          {diario.fotos.length > 4 && (
            <div className="w-12 h-12 rounded border border-white/10 bg-white/5 flex items-center justify-center">
              <span className="text-xs text-white/30">+{diario.fotos.length - 4}</span>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-white/[0.06]">
        <button
          onClick={() => exportDiarioPDF(diario, obraName)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/5 border border-white/10 text-white/50 rounded-lg hover:text-white hover:bg-white/10 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 12h10M8 3v7M5 7l3 3 3-3"/>
          </svg>
          Exportar PDF
        </button>
        <Btn onClick={onEdit}>Editar</Btn>
        <Btn variant="danger" onClick={onDelete}>Excluir</Btn>
      </div>
    </div>
  )
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

type Props = { obra_id: string; obra_name?: string }

export function DiarioTab({ obra_id, obra_name = 'Obra' }: Props) {
  const [diarios, setDiarios] = useState<DiarioObra[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState<'create' | DiarioObra | null>(null)

  async function load() {
    const data = await getDiariosByObra(obra_id)
    setDiarios(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [obra_id])

  async function handleDelete(id: string) {
    if (!confirm('Excluir este diário? Esta ação não pode ser desfeita.')) return
    const ok = await deleteDiario(id)
    if (ok) { toast.success('Diário excluído'); load() }
    else toast.error('Erro ao excluir')
  }

  if (loading) return <LoadingSpinner />

  const proxNumero = diarios.length > 0
    ? Math.max(...diarios.map(d => d.numero)) + 1
    : 1

  const totalFunc = diarios.reduce((a, d) => a + d.total_funcionarios, 0)
  const totalOcorr = diarios.filter(d => d.ocorrencias).length

  return (
    <div className="space-y-4">
      {/* Header + KPIs */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-base font-semibold text-white">Diário de Obra (RDO)</p>
          <p className="text-xs text-white/30 mt-0.5">{diarios.length} relatórios registrados</p>
        </div>
        <Btn variant="primary" onClick={() => setModal('create')}>+ Novo RDO</Btn>
      </div>

      {/* Summary strip */}
      {diarios.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Relatórios emitidos', value: diarios.length, color: 'text-white' },
            { label: 'Total de funcionários', value: totalFunc, color: 'text-blue-400' },
            { label: 'Com ocorrências', value: totalOcorr, color: totalOcorr > 0 ? 'text-amber-400' : 'text-white/40' },
            { label: 'Último RDO', value: fmtDate(diarios[0]?.data ?? ''), color: 'text-white/60' },
          ].map(s => (
            <div key={s.label} className="bg-[#0d0d0d] border border-white/[0.08] rounded-xl px-4 py-3">
              <p className="text-[10px] text-white/30 mb-1">{s.label}</p>
              <p className={cn('text-sm font-semibold', s.color)}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Grid */}
      {diarios.length === 0 ? (
        <EmptyState message="Nenhum relatório diário registrado. Clique em + Novo RDO para começar." />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {diarios.map(d => (
            <DiarioCard
              key={d.id}
              diario={d}
              obraName={obra_name}
              onEdit={() => setModal(d)}
              onDelete={() => handleDelete(d.id)}
            />
          ))}
        </div>
      )}

      {modal && (
        <DiarioModal
          obra_id={obra_id}
          inicial={modal === 'create' ? null : modal}
          numero={proxNumero}
          onClose={() => setModal(null)}
          onSuccess={load}
        />
      )}
    </div>
  )
}
