'use client'

import { useState } from 'react'

export function MedicaoModal({ onClose, onSave }: any) {
  const [form, setForm] = useState({
    description: '',
    percentage: '',
    value: '',
  })

  function handleSubmit() {
    onSave({
      ...form,
      percentage: Number(form.percentage),
      value: Number(form.value),
      date: new Date().toISOString().slice(0, 10),
    })

    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-[#111] p-6 rounded-2xl w-full max-w-md space-y-4 border border-white/10">
        <h2 className="text-white font-semibold">
          Nova medição
        </h2>

        <input placeholder="Etapa" className="input"
          onChange={e => setForm({ ...form, description: e.target.value })} />

        <input type="number" placeholder="% executado" className="input"
          onChange={e => setForm({ ...form, percentage: e.target.value })} />

        <input type="number" placeholder="Valor" className="input"
          onChange={e => setForm({ ...form, value: e.target.value })} />

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