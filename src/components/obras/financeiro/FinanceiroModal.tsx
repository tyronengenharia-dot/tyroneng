'use client'

import { useState } from 'react'

export function FinanceiroModal({ onClose, onSave }: any) {
  const [form, setForm] = useState({
    description: '',
    category: '',
    type: 'saida',
    value: '',
    status: 'pendente',
  })

  function handleSubmit() {
    onSave({
      ...form,
      value: Number(form.value),
      date: new Date().toISOString(),
    })

    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-[#111] p-6 rounded-2xl w-full max-w-md space-y-4 border border-white/10">
        <h2 className="text-white font-semibold">
          Novo lançamento
        </h2>

        <input placeholder="Descrição" className="input"
          onChange={e => setForm({ ...form, description: e.target.value })} />

        <input placeholder="Categoria" className="input"
          onChange={e => setForm({ ...form, category: e.target.value })} />

        <input type="number" placeholder="Valor" className="input"
          onChange={e => setForm({ ...form, value: e.target.value })} />

        <select className="input"
          onChange={e => setForm({ ...form, type: e.target.value })}>
          <option value="entrada">Entrada</option>
          <option value="saida">Saída</option>
        </select>

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