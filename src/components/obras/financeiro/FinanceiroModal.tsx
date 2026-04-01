'use client'

import { useEffect, useRef, useState } from 'react'
import { FinancialRecord } from '@/types/financial'
import { createFinancialRecord, updateFinancialRecord } from '@/services/financialService'
import { toast } from 'sonner'

type Props = {
  onClose: () => void
  initialData: FinancialRecord | null
  onSuccess: () => void
}

export function FinanceModal({ onClose, initialData, onSuccess }: Props) {
  const modalRef = useRef<HTMLDivElement>(null)

  const [description, setDescription] = useState(initialData?.description ?? '')
  const [value, setValue] = useState(initialData?.value?.toString() ?? '')
  const [date, setDate] = useState(initialData?.date ?? '')
  const [type, setType] = useState(initialData?.type ?? 'entrada')
  const [status, setStatus] = useState(initialData?.status ?? 'pago')
  const [category, setCategory] = useState((initialData as any)?.category ?? 'Obra')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onClose])

  async function handleSave() {
    if (!description.trim() || !value || !date) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    setSaving(true)
    try {
      const payload = {
        description: description.trim(),
        value: parseFloat(value),
        date,
        type,
        status,
        category,
      }

      if (initialData) {
        await updateFinancialRecord(initialData.id, payload)
        toast.success('Transação atualizada')
      } else {
        await createFinancialRecord(payload)
        toast.success('Transação criada')
      }

      onSuccess()
      onClose()
    } catch (err) {
      toast.error('Erro ao salvar transação')
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors'

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        ref={modalRef}
        className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-base font-semibold text-white">
              {initialData ? 'Editar transação' : 'Nova transação'}
            </h2>
            <p className="text-xs text-white/40 mt-0.5">
              {initialData ? 'Atualize os dados abaixo' : 'Preencha os dados da transação'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white/70 hover:bg-white/10 rounded-lg p-1.5 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/40 mb-1.5">
              Descrição <span className="text-red-400">*</span>
            </label>
            <input
              className={inputClass}
              placeholder="Ex: Pagamento fornecedor cimento"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5">
                Valor (R$) <span className="text-red-400">*</span>
              </label>
              <input
                className={inputClass}
                type="number"
                placeholder="0,00"
                value={value}
                onChange={e => setValue(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5">
                Data <span className="text-red-400">*</span>
              </label>
              <input
                className={inputClass}
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5">Tipo</label>
              <select className={inputClass} value={type} onChange={e => setType(e.target.value as 'entrada' | 'saida')}>
                <option value="entrada" className="bg-[#111]">Entrada</option>
                <option value="saida" className="bg-[#111]">Saída</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5">Status</label>
              <select className={inputClass} value={status} onChange={e => setStatus(e.target.value as 'pago' | 'pendente')}>
                <option value="pago" className="bg-[#111]">Pago</option>
                <option value="pendente" className="bg-[#111]">Pendente</option>
                <option value="atrasado" className="bg-[#111]">Atrasado</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/40 mb-1.5">Categoria</label>
            <select className={inputClass} value={category} onChange={e => setCategory(e.target.value)}>
              {['Obra', 'Material', 'Mão de obra', 'Equipamento', 'Serviço', 'Outros'].map(c => (
                <option key={c} value={c} className="bg-[#111]">{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-white/40 hover:text-white/70 hover:bg-white/5 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-white text-black px-5 py-2 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {saving ? 'Salvando...' : 'Salvar transação'}
          </button>
        </div>
      </div>
    </div>
  )
}