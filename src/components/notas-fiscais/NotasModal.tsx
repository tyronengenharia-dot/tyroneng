'use client'

import { useState } from 'react'

export function NotaModal({ onClose, onSave }: any) {
  const [form, setForm] = useState({
    number: '',
    type: 'emitida',
    client: '',
    value: '',
    status: 'pendente',
    pdf: null as File | null,
    xml: null as File | null,
  })

  function handleSubmit() {
    onSave({
      ...form,
      value: Number(form.value),
      file_url: form.pdf ? URL.createObjectURL(form.pdf) : null,
      xml_url: form.xml ? URL.createObjectURL(form.xml) : null,
      date: new Date().toISOString(),
    })

    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-[#111] p-6 rounded-2xl w-full max-w-md space-y-4 border border-white/10">
        <h2 className="text-white font-semibold">Nova nota fiscal</h2>

        <input placeholder="Número" className="input"
          onChange={e => setForm({ ...form, number: e.target.value })} />

        <input placeholder="Cliente" className="input"
          onChange={e => setForm({ ...form, client: e.target.value })} />

        <input type="number" placeholder="Valor" className="input"
          onChange={e => setForm({ ...form, value: e.target.value })} />

        <select className="input"
          onChange={e => setForm({ ...form, type: e.target.value })}>
          <option value="emitida">Emitida</option>
          <option value="recebida">Recebida</option>
        </select>

        <input type="file"
          onChange={e => setForm({ ...form, pdf: e.target.files?.[0] || null })} />

        <input type="file"
          onChange={e => setForm({ ...form, xml: e.target.files?.[0] || null })} />

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