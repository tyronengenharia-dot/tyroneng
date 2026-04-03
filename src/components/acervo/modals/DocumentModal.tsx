'use client'

import { useState, useEffect } from 'react'
import { X, AlertTriangle, Upload } from 'lucide-react'
import type { DocumentCategory, DocumentFormData } from '@/types/acervo'
import { DOCUMENT_CATEGORIES } from '@/lib/constants'
import { daysTo, getAlertMessage } from '@/lib/dateUtils'

interface DocumentModalProps {
  title?: string
  onClose: () => void
  onSave: (formData: DocumentFormData) => Promise<void>
  loading?: boolean
}

const defaultForm: DocumentFormData = {
  nome: '',
  orgao: '',
  numero: '',
  category: 'Outros',
  dataEmissao: '',
  temValidade: false,
  dataValidade: '',
  diasRenovar: '',
  urlEmissao: '',
  file: null,
}

export default function DocumentModal({
  title = 'Novo Documento',
  onClose,
  onSave,
  loading = false,
}: DocumentModalProps) {
  const [form, setForm] = useState<DocumentFormData>(defaultForm)
  const [alertMsg, setAlertMsg] = useState<string | null>(null)

  function set<K extends keyof DocumentFormData>(key: K, value: DocumentFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  // Recalculate alert whenever validade or diasRenovar changes
  useEffect(() => {
    if (!form.temValidade || !form.dataValidade || !form.diasRenovar) {
      setAlertMsg(null)
      return
    }
    const msg = getAlertMessage(form.dataValidade, parseInt(form.diasRenovar) || 0)
    setAlertMsg(msg)
  }, [form.temValidade, form.dataValidade, form.diasRenovar])

  async function handleSave() {
    if (!form.nome.trim()) {
      alert('Informe o nome do documento')
      return
    }
    if (form.temValidade && !form.diasRenovar) {
      alert('Informe quantos dias leva para renovar')
      return
    }
    await onSave(form)
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-[#111] border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-800 rounded-lg transition"
          >
            <X size={16} className="text-zinc-400" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Identificação */}
          <fieldset className="border border-zinc-800 rounded-xl p-4 space-y-3 bg-zinc-950/50">
            <legend className="text-xs font-medium text-zinc-500 px-1">
              Identificação
            </legend>

            <div>
              <label className="text-xs text-zinc-400 block mb-1.5">
                Nome do documento *
              </label>
              <input
                value={form.nome}
                onChange={(e) => set('nome', e.target.value)}
                placeholder="Ex: Alvará de Funcionamento 2026"
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-600 outline-none focus:border-[#c8f65d]/50 focus:ring-1 focus:ring-[#c8f65d]/20 transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-400 block mb-1.5">
                  Órgão emissor
                </label>
                <input
                  value={form.orgao}
                  onChange={(e) => set('orgao', e.target.value)}
                  placeholder="Ex: Prefeitura Municipal"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-600 outline-none focus:border-[#c8f65d]/50 transition"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1.5">
                  Número
                </label>
                <input
                  value={form.numero}
                  onChange={(e) => set('numero', e.target.value)}
                  placeholder="Ex: 2026/00123"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-600 outline-none focus:border-[#c8f65d]/50 transition"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-zinc-400 block mb-1.5">
                Categoria
              </label>
              <select
                value={form.category}
                onChange={(e) => set('category', e.target.value as DocumentCategory)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white outline-none focus:border-[#c8f65d]/50 transition"
              >
                {DOCUMENT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </fieldset>

          {/* Datas */}
          <fieldset className="border border-zinc-800 rounded-xl p-4 space-y-3 bg-zinc-950/50">
            <legend className="text-xs font-medium text-zinc-500 px-1">
              Datas &amp; Validade
            </legend>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-400 block mb-1.5">
                  Data de emissão
                </label>
                <input
                  type="date"
                  value={form.dataEmissao}
                  onChange={(e) => set('dataEmissao', e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white outline-none focus:border-[#c8f65d]/50 transition"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1.5">
                  Data de validade
                </label>
                <input
                  type="date"
                  value={form.dataValidade}
                  disabled={!form.temValidade}
                  onChange={(e) => set('dataValidade', e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white outline-none focus:border-[#c8f65d]/50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.temValidade}
                onChange={(e) => {
                  set('temValidade', e.target.checked)
                  if (!e.target.checked) {
                    set('dataValidade', '')
                    set('diasRenovar', '')
                  }
                }}
                className="rounded border-zinc-600"
              />
              <span className="text-sm text-zinc-300">Possui validade</span>
            </label>

            {form.temValidade && (
              <div>
                <label className="text-xs text-zinc-400 block mb-1.5">
                  Dias necessários para renovar (prazo do órgão)
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.diasRenovar}
                  onChange={(e) => set('diasRenovar', e.target.value)}
                  placeholder="Ex: 31"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-600 outline-none focus:border-[#c8f65d]/50 transition"
                />
              </div>
            )}
          </fieldset>

          {/* Alert banner */}
          {alertMsg && (
            <div className="flex items-start gap-2.5 p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl">
              <AlertTriangle
                size={15}
                className="text-amber-400 mt-0.5 shrink-0"
              />
              <p className="text-xs text-amber-300 leading-relaxed">{alertMsg}</p>
            </div>
          )}

          {/* Origem */}
          <fieldset className="border border-zinc-800 rounded-xl p-4 space-y-3 bg-zinc-950/50">
            <legend className="text-xs font-medium text-zinc-500 px-1">
              Origem
            </legend>
            <div>
              <label className="text-xs text-zinc-400 block mb-1.5">
                URL para emissão do documento
              </label>
              <input
                value={form.urlEmissao}
                onChange={(e) => set('urlEmissao', e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-600 outline-none focus:border-[#c8f65d]/50 transition"
              />
            </div>
          </fieldset>

          {/* Arquivo */}
          <fieldset className="border border-zinc-800 rounded-xl p-4 bg-zinc-950/50">
            <legend className="text-xs font-medium text-zinc-500 px-1">
              Arquivo
            </legend>
            <label className="flex flex-col items-center gap-2 cursor-pointer py-4 border-2 border-dashed border-zinc-700 rounded-xl hover:border-zinc-500 transition mt-2">
              <Upload size={20} className="text-zinc-500" />
              <span className="text-xs text-zinc-500">
                {form.file
                  ? form.file.name
                  : 'Clique para selecionar PDF, DOC, JPG'}
              </span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="hidden"
                onChange={(e) => set('file', e.target.files?.[0] ?? null)}
              />
            </label>
          </fieldset>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 pb-5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-5 py-2 text-sm font-semibold bg-[#c8f65d] text-black rounded-xl hover:bg-[#d4f97a] disabled:opacity-60 transition"
          >
            {loading ? 'Salvando...' : 'Salvar documento'}
          </button>
        </div>
      </div>
    </div>
  )
}
