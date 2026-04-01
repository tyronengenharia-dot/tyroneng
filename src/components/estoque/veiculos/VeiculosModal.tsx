'use client'

import { useState } from 'react'
import { createVeiculo } from '@/services/estoqueService'

export function VeiculosModal({ onClose, onSuccess }: any) {
  const [form, setForm] = useState({
    nome: '',
    placa: '',
    modelo: '',
    ano: 2024,
    km: 0,
    status: 'ativo',
    observacoes: ''
  })

  async function handleSave() {
    await createVeiculo(form)
    onSuccess()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
      <div className="bg-[#1a1a1a] p-6 rounded-xl w-[500px]">
        <h2 className="mb-4 text-lg font-semibold">Novo Veículo</h2>

        <div className="grid grid-cols-2 gap-2">
          <input
            placeholder="Nome"
            className="p-2 bg-black rounded"
            onChange={e => setForm({ ...form, nome: e.target.value })}
          />

          <input
            placeholder="Placa"
            className="p-2 bg-black rounded"
            onChange={e => setForm({ ...form, placa: e.target.value })}
          />

          <input
            placeholder="Modelo"
            className="p-2 bg-black rounded"
            onChange={e => setForm({ ...form, modelo: e.target.value })}
          />

          <input
            type="number"
            placeholder="Ano"
            className="p-2 bg-black rounded"
            onChange={e => setForm({ ...form, ano: Number(e.target.value) })}
          />

          <input
            type="number"
            placeholder="KM"
            className="p-2 bg-black rounded"
            onChange={e => setForm({ ...form, km: Number(e.target.value) })}
          />

          <select
            className="p-2 bg-black rounded"
            onChange={e => setForm({ ...form, status: e.target.value })}
          >
            <option value="ativo">Ativo</option>
            <option value="manutencao">Manutenção</option>
            <option value="inativo">Inativo</option>
          </select>
        </div>

        <textarea
          placeholder="Observações"
          className="w-full mt-3 p-2 bg-black rounded"
          onChange={e => setForm({ ...form, observacoes: e.target.value })}
        />

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose}>Cancelar</button>
          <button
            onClick={handleSave}
            className="bg-blue-600 px-4 py-2 rounded"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}