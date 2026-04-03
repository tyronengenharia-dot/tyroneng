'use client'

import { useState, useEffect } from 'react'
import { Licitacao, LicitacaoFormData } from '@/types/licitacao'
import { MODALIDADES } from '@/lib/licitacaoUtils'

interface Props {
  licitacao?: Licitacao | null
  saving?: boolean
  onSave: (data: LicitacaoFormData) => void
  onClose: () => void
}

const empty: LicitacaoFormData = {
  titulo: '',
  orgao: '',
  local: '',
  valorEstimado: 0,
  dataEntrega: '',
  modalidade: 'Pregão Eletrônico',
  processo: '',
  lote: '',
  plataforma: '',
  dataDisputa: '',
  horaDisputa: '',
  responsavel: '',
  observacoes: '',
}

export function LicitacaoForm({ licitacao, saving = false, onSave, onClose }: Props) {
  const [form, setForm] = useState<LicitacaoFormData>(empty)

  useEffect(() => {
    if (licitacao) {
      setForm({
        titulo:        licitacao.titulo,
        orgao:         licitacao.orgao,
        local:         licitacao.local,
        valorEstimado: licitacao.valorEstimado,
        dataEntrega:   licitacao.dataEntrega,
        modalidade:    licitacao.modalidade,
        processo:      licitacao.processo,
        lote:          licitacao.lote,
        plataforma:    licitacao.plataforma,
        dataDisputa:   licitacao.dataDisputa,
        horaDisputa:   licitacao.horaDisputa,
        responsavel:   licitacao.responsavel,
        observacoes:   licitacao.observacoes,
      })
    } else {
      setForm(empty)
    }
  }, [licitacao])

  function set(key: keyof LicitacaoFormData, value: string | number) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function handleSave() {
    if (!form.titulo.trim() || saving) return
    onSave(form)
    onClose()
  }

  const inputClass =
    'w-full bg-zinc-800 border border-zinc-700 text-sm text-zinc-100 placeholder-zinc-500 rounded-lg px-3 py-2.5 outline-none focus:border-blue-500/50 transition-colors'

  const labelClass = 'block text-xs uppercase tracking-wider text-zinc-500 mb-1.5'

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-7">
        <h2 className="text-base font-semibold text-zinc-100 mb-6">
          {licitacao ? 'Editar Licitação' : 'Nova Licitação'}
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Título / Objeto *</label>
              <input className={inputClass} placeholder="Ex: Construção de escola municipal"
                value={form.titulo} onChange={e => set('titulo', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Órgão licitante</label>
              <input className={inputClass} placeholder="Ex: Prefeitura de Niterói"
                value={form.orgao} onChange={e => set('orgao', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Valor estimado (R$)</label>
              <input className={inputClass} type="number" placeholder="0"
                value={form.valorEstimado || ''} onChange={e => set('valorEstimado', Number(e.target.value))} />
            </div>
            <div>
              <label className={labelClass}>Modalidade</label>
              <select className={inputClass} value={form.modalidade} onChange={e => set('modalidade', e.target.value)}>
                {MODALIDADES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Número do processo / edital</label>
              <input className={inputClass} placeholder="Ex: 001/2025"
                value={form.processo} onChange={e => set('processo', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Nº lote / item</label>
              <input className={inputClass} placeholder="Ex: Lote 2"
                value={form.lote} onChange={e => set('lote', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Local da disputa</label>
              <input className={inputClass} placeholder="Ex: Sala de licitações, Ed. Sede"
                value={form.local} onChange={e => set('local', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Plataforma (se eletrônico)</label>
              <input className={inputClass} placeholder="Ex: ComprasNet, Licitanet..."
                value={form.plataforma} onChange={e => set('plataforma', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Data da disputa</label>
              <input className={inputClass} type="date"
                value={form.dataDisputa} onChange={e => set('dataDisputa', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Horário</label>
              <input className={inputClass} type="time"
                value={form.horaDisputa} onChange={e => set('horaDisputa', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Prazo entrega proposta</label>
              <input className={inputClass} type="date"
                value={form.dataEntrega} onChange={e => set('dataEntrega', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Responsável interno</label>
              <input className={inputClass} placeholder="Ex: João Silva"
                value={form.responsavel} onChange={e => set('responsavel', e.target.value)} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Observações</label>
            <textarea className={`${inputClass} resize-none`} rows={3}
              placeholder="Notas importantes sobre este edital..."
              value={form.observacoes} onChange={e => set('observacoes', e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm px-5 py-2.5 rounded-lg border border-zinc-700 transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving || !form.titulo.trim()}
            className={`text-sm font-medium px-6 py-2.5 rounded-lg transition-colors ${
              saving || !form.titulo.trim()
                ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}
