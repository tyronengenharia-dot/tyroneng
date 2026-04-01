'use client'

import { useState } from 'react'
import { createMaquinario } from '@/services/estoqueService'

export function MaquinarioModal({ onClose, onSuccess }: any) {
  const [form, setForm] = useState({
    nome: '',
    tipo: '',
    modelo: '',
    fabricante: '',
    ano: 2024,
    horimetro: 0,
    custo_hora: 0,
    status: 'ativo',
    localizacao: '',
    observacoes: ''
  })

  async function handleSave() {
    await createMaquinario(form)
    onSuccess()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
      <div className="bg-[#1a1a1a] p-6 rounded-xl w-[520px]">
        <h2 className="mb-4 text-lg font-semibold">
          Novo Maquinário
        </h2>

        <div className="grid grid-cols-2 gap-2">
          <input
            placeholder="Nome"
            className="p-2 bg-black rounded"
            onChange={e => setForm({ ...form, nome: e.target.value })}
          />

          <input
            placeholder="Tipo (Escavadeira...)"
            className="p-2 bg-black rounded"
            onChange={e => setForm({ ...form, tipo: e.target.value })}
          />

          <input
            placeholder="Modelo"
            className="p-2 bg-black rounded"
            onChange={e => setForm({ ...form, modelo: e.target.value })}
          />

          <input
            placeholder="Fabricante"
            className="p-2 bg-black rounded"
            onChange={e => setForm({ ...form, fabricante: e.target.value })}
          />

          <input
            type="number"
            placeholder="Ano"
            className="p-2 bg-black rounded"
            onChange={e => setForm({ ...form, ano: Number(e.target.value) })}
          />

          <input
            type="number"
            placeholder="Horímetro"
            className="p-2 bg-black rounded"
            onChange={e =>
              setForm({ ...form, horimetro: Number(e.target.value) })
            }
          />

          <input
            type="number"
            placeholder="Custo por Hora"
            className="p-2 bg-black rounded"
            onChange={e =>
              setForm({ ...form, custo_hora: Number(e.target.value) })
            }
          />

          <select
            className="p-2 bg-black rounded"
            onChange={e => setForm({ ...form, status: e.target.value })}
          >
            <option value="ativo">Ativo</option>
            <option value="em_uso">Em uso</option>
            <option value="manutencao">Manutenção</option>
            <option value="parado">Parado</option>
          </select>
        </div>

        <input
          placeholder="Localização / Obra"
          className="w-full mt-3 p-2 bg-black rounded"
          onChange={e =>
            setForm({ ...form, localizacao: e.target.value })
          }
        />

        <textarea
          placeholder="Observações"
          className="w-full mt-3 p-2 bg-black rounded"
          onChange={e =>
            setForm({ ...form, observacoes: e.target.value })
          }
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