'use client'

import { useState } from 'react'
import { Contrato, ContratoStatus } from '@/types/contrato'

interface ContratoModalProps {
  onClose: () => void
  onSave: (contrato: Omit<Contrato, 'id'>) => void
  initial?: Partial<Contrato>
}

const STATUS_OPTIONS: { value: ContratoStatus; label: string }[] = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'finalizado', label: 'Finalizado' },
  { value: 'cancelado', label: 'Cancelado' },
]

export function ContratoModal({ onClose, onSave, initial }: ContratoModalProps) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    client: initial?.client ?? '',
    client_email: initial?.client_email ?? '',
    client_cnpj: initial?.client_cnpj ?? '',
    value: initial?.value?.toString() ?? '',
    start_date: initial?.start_date ?? '',
    end_date: initial?.end_date ?? '',
    status: (initial?.status ?? 'pendente') as ContratoStatus,
    description: initial?.description ?? '',
    tags: initial?.tags?.join(', ') ?? '',
    file: null as File | null,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Nome é obrigatório'
    if (!form.client.trim()) e.client = 'Cliente é obrigatório'
    if (!form.start_date) e.start_date = 'Data de início é obrigatória'
    if (!form.end_date) e.end_date = 'Data de término é obrigatória'
    if (form.start_date && form.end_date && form.end_date < form.start_date)
      e.end_date = 'Data de término deve ser após o início'
    return e
  }

  function handleSubmit() {
    const e = validate()
    if (Object.keys(e).length > 0) {
      setErrors(e)
      return
    }

    onSave({
      name: form.name,
      client: form.client,
      client_email: form.client_email || undefined,
      client_cnpj: form.client_cnpj || undefined,
      value: form.value ? parseFloat(form.value) : undefined,
      start_date: form.start_date,
      end_date: form.end_date,
      status: form.status,
      description: form.description || undefined,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
      file_url: form.file ? URL.createObjectURL(form.file) : undefined,
      created_at: new Date().toISOString().split('T')[0],
    })

    onClose()
  }

  const field = (label: string, key: keyof typeof form, props?: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-400 font-medium">{label}</label>
      <input
        {...props}
        value={form[key] as string}
        onChange={e => {
          setForm(prev => ({ ...prev, [key]: e.target.value }))
          if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }))
        }}
        className={`bg-white/5 border rounded-xl px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/30 transition-colors ${
          errors[key] ? 'border-red-500/50' : 'border-white/10'
        }`}
      />
      {errors[key] && <span className="text-xs text-red-400">{errors[key]}</span>}
    </div>
  )

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#0e0e0e] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/10">
          <div>
            <h2 className="text-white font-semibold text-base">
              {initial ? 'Editar contrato' : 'Novo contrato'}
            </h2>
            <p className="text-gray-500 text-xs mt-0.5">Preencha os dados do contrato</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
          <div className="grid grid-cols-1 gap-4">
            {field('Nome do contrato *', 'name', { placeholder: 'Ex: Contrato de Serviços 2026' })}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {field('Cliente *', 'client', { placeholder: 'Nome do cliente' })}
            {field('E-mail', 'client_email', { type: 'email', placeholder: 'email@empresa.com' })}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {field('CNPJ', 'client_cnpj', { placeholder: '00.000.000/0001-00' })}
            {field('Valor (R$)', 'value', { type: 'number', placeholder: '0,00' })}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {field('Data de início *', 'start_date', { type: 'date' })}
            {field('Data de término *', 'end_date', { type: 'date' })}
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400 font-medium">Status</label>
            <div className="flex gap-2">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setForm(prev => ({ ...prev, status: opt.value }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    form.status === opt.value
                      ? 'bg-white text-black border-white'
                      : 'border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400 font-medium">Descrição</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva o escopo do contrato..."
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/30 resize-none transition-colors"
            />
          </div>

          {field('Tags (separadas por vírgula)', 'tags', { placeholder: 'ex: governo, saúde, TI' })}

          {/* File */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400 font-medium">Arquivo do contrato</label>
            <label className="flex items-center gap-3 bg-white/5 border border-white/10 border-dashed rounded-xl px-3 py-3 cursor-pointer hover:border-white/20 transition-colors">
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <span className="text-sm text-gray-400">
                {form.file ? form.file.name : 'Clique para enviar PDF ou DOC'}
              </span>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={e => setForm(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
              />
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors rounded-xl"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="bg-white text-black px-5 py-2 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            {initial ? 'Salvar alterações' : 'Criar contrato'}
          </button>
        </div>
      </div>
    </div>
  )
}
