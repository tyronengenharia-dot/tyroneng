'use client'

import { useState } from 'react'

export function ContratoModal({ onClose, onSave }: any) {
  const [form, setForm] = useState({
    name: '',
    client: '',
    start_date: '',
    end_date: '',
    status: 'ativo',
    file: null as File | null,
  })

  function handleSubmit() {
    onSave({
      ...form,
      file_url: form.file ? URL.createObjectURL(form.file) : null,
    })

    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-[#111] p-6 rounded-2xl w-full max-w-md space-y-4 border border-white/10">
        <h2 className="text-white font-semibold">Novo contrato</h2>

        <input placeholder="Nome" className="input"
          onChange={e => setForm({ ...form, name: e.target.value })} />

        <input placeholder="Cliente" className="input"
          onChange={e => setForm({ ...form, client: e.target.value })} />

        <input type="date" className="input"
          onChange={e => setForm({ ...form, start_date: e.target.value })} />

        <input type="date" className="input"
          onChange={e => setForm({ ...form, end_date: e.target.value })} />

        <input type="file"
          onChange={e =>
            setForm({ ...form, file: e.target.files?.[0] || null })
          }
        />

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