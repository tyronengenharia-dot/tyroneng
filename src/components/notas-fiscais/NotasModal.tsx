'use client'

import { useState } from 'react'
import { NotaFiscal } from '@/types/notaFiscal'

interface Props {
  initialData?: NotaFiscal | null
  onClose: () => void
  onSave: (item: Omit<NotaFiscal, 'id'>) => void
}

const inputClass =
  'w-full bg-white/5 border border-white/10 text-white placeholder:text-white/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-white/30 transition-colors'

const labelClass = 'block text-xs text-white/40 uppercase tracking-widest mb-1.5'

export function NotaModal({ initialData, onClose, onSave }: Props) {
  const [form, setForm] = useState({
    number: initialData?.number ?? '',
    type: initialData?.type ?? 'emitida',
    client: initialData?.client ?? '',
    value: initialData?.value ? String(initialData.value) : '',
    status: initialData?.status ?? 'pendente',
    date: initialData?.date ?? new Date().toISOString().split('T')[0],
    pdf: null as File | null,
    xml: null as File | null,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const e: Record<string, string> = {}
    if (!form.number.trim()) e.number = 'Número obrigatório'
    if (!form.client.trim()) e.client = 'Cliente obrigatório'
    if (!form.value || isNaN(Number(form.value))) e.value = 'Valor inválido'
    return e
  }

  function handleSubmit() {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }

    onSave({
      number: form.number,
      type: form.type as 'emitida' | 'recebida',
      client: form.client,
      value: Number(form.value),
      status: form.status as 'aprovada' | 'pendente' | 'cancelada',
      date: form.date,
      file_url: form.pdf ? URL.createObjectURL(form.pdf) : undefined,
      xml_url: form.xml ? URL.createObjectURL(form.xml) : undefined,
    })

    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[#111] border border-white/[0.09] rounded-2xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.07]">
          <div>
            <h2 className="text-white font-semibold">
              {initialData ? 'Editar nota fiscal' : 'Nova nota fiscal'}
            </h2>
            <p className="text-xs text-white/40 mt-0.5">Preencha os dados da nota</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Número</label>
              <input
                placeholder="NF-001"
                value={form.number}
                onChange={e => setForm({ ...form, number: e.target.value })}
                className={inputClass}
              />
              {errors.number && <p className="text-xs text-red-400 mt-1">{errors.number}</p>}
            </div>

            <div>
              <label className={labelClass}>Data</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Cliente / Fornecedor</label>
            <input
              placeholder="Nome do cliente ou fornecedor"
              value={form.client}
              onChange={e => setForm({ ...form, client: e.target.value })}
              className={inputClass}
            />
            {errors.client && <p className="text-xs text-red-400 mt-1">{errors.client}</p>}
          </div>

          <div>
            <label className={labelClass}>Valor (R$)</label>
            <input
              type="number"
              placeholder="0,00"
              value={form.value}
              onChange={e => setForm({ ...form, value: e.target.value })}
              className={inputClass}
            />
            {errors.value && <p className="text-xs text-red-400 mt-1">{errors.value}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Tipo</label>
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value as 'emitida' | 'recebida' })}
                className={inputClass}
              >
                <option value="emitida">Emitida</option>
                <option value="recebida">Recebida</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Status</label>
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value as 'aprovada' | 'pendente' | 'cancelada' })}
                className={inputClass}
              >
                <option value="pendente">Pendente</option>
                <option value="aprovada">Aprovada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Arquivo PDF</label>
              <input
                type="file"
                accept=".pdf"
                onChange={e => setForm({ ...form, pdf: e.target.files?.[0] ?? null })}
                className="w-full text-sm text-white/50 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-white/10 file:text-white/70 file:text-xs hover:file:bg-white/20 file:cursor-pointer cursor-pointer"
              />
            </div>

            <div>
              <label className={labelClass}>Arquivo XML</label>
              <input
                type="file"
                accept=".xml"
                onChange={e => setForm({ ...form, xml: e.target.files?.[0] ?? null })}
                className="w-full text-sm text-white/50 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-white/10 file:text-white/70 file:text-xs hover:file:bg-white/20 file:cursor-pointer cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/[0.07]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-white/60 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2 text-sm font-medium bg-white text-black rounded-xl hover:opacity-90 transition-opacity"
          >
            {initialData ? 'Salvar alterações' : 'Adicionar nota'}
          </button>
        </div>
      </div>
    </div>
  )
}