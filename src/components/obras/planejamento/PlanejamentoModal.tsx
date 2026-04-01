'use client'

import { useState } from 'react'

export function PlanejamentoModal({ onClose, onSave }: any) {
  const [form, setForm] = useState({
    category: '',
    planned_value: '',
    actual_value: '',
  })

  function handleSubmit() {
    onSave({
      ...form,
      planned_value: Number(form.planned_value),
      actual_value: Number(form.actual_value),
    })

    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-[#111] p-6 rounded-2xl w-full max-w-md space-y-4 border border-white/10">
        <h2 className="text-white font-semibold">
          Novo planejamento
        </h2>

        <input placeholder="Categoria" className="input"
          onChange={e => setForm({ ...form, category: e.target.value })} />

        <input type="number" placeholder="Valor orçado" className="input"
          onChange={e => setForm({ ...form, planned_value: e.target.value })} />

        <input type="number" placeholder="Valor realizado" className="input"
          onChange={e => setForm({ ...form, actual_value: e.target.value })} />

        <button
          onClick={handleSubmit}
          className="bg-white text-black px-4 py-2 rounded-xl"
        >
          Salvar
        </button>
      </div>
    </div>
  )
}