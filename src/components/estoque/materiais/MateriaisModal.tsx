'use client'

import { useState } from 'react'
import { createMaterial } from '@/services/estoqueService'

export function MateriaisModal({ onClose, onSuccess }: any) {
  const [form, setForm] = useState({
    nome: '',
    quantidade: 0,
    valor_unitario: 0,
  })

  async function handleSave() {
    await createMaterial(form)
    onSuccess()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
      <div className="bg-[#1a1a1a] p-6 rounded-xl w-[400px]">
        <h2 className="mb-4 text-lg">Novo Material</h2>

        <input
          placeholder="Nome"
          className="w-full mb-2 p-2 bg-black rounded"
          onChange={e => setForm({ ...form, nome: e.target.value })}
        />

        <input
          placeholder="Quantidade"
          type="number"
          className="w-full mb-2 p-2 bg-black rounded"
          onChange={e => setForm({ ...form, quantidade: Number(e.target.value) })}
        />

        <input
          placeholder="Valor"
          type="number"
          className="w-full mb-4 p-2 bg-black rounded"
          onChange={e => setForm({ ...form, valor_unitario: Number(e.target.value) })}
        />

        <div className="flex justify-end gap-2">
          <button onClick={onClose}>Cancelar</button>
          <button
            onClick={handleSave}
            className="bg-blue-600 px-3 py-1 rounded"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}