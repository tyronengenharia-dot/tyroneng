'use client'

import { useState } from 'react'
import { createEquipamento } from '@/services/estoqueService'

export function EquipamentosModal({ onClose, onSuccess }: any) {
  const [form, setForm] = useState({
    nome: '',
    numero_serie: '',
    categoria: '',
    status: 'disponivel',
    localizacao: '',
    responsavel: '',
    valor: 0
  })

  async function handleSave() {
    await createEquipamento(form)
    onSuccess()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
      <div className="bg-[#1a1a1a] p-6 rounded-xl w-[500px]">
        <h2 className="mb-4 text-lg font-semibold">
          Novo Equipamento
        </h2>

        <div className="grid grid-cols-2 gap-2">
          <input
            placeholder="Nome"
            className="p-2 bg-black rounded"
            onChange={e => setForm({ ...form, nome: e.target.value })}
          />

          <input
            placeholder="Número de Série"
            className="p-2 bg-black rounded"
            onChange={e =>
              setForm({ ...form, numero_serie: e.target.value })
            }
          />

          <input
            placeholder="Categoria"
            className="p-2 bg-black rounded"
            onChange={e => setForm({ ...form, categoria: e.target.value })}
          />

          <input
            placeholder="Localização"
            className="p-2 bg-black rounded"
            onChange={e => setForm({ ...form, localizacao: e.target.value })}
          />

          <input
            placeholder="Responsável"
            className="p-2 bg-black rounded"
            onChange={e => setForm({ ...form, responsavel: e.target.value })}
          />

          <select
            className="p-2 bg-black rounded"
            onChange={e => setForm({ ...form, status: e.target.value })}
          >
            <option value="disponivel">Disponível</option>
            <option value="em_uso">Em uso</option>
            <option value="manutencao">Manutenção</option>
          </select>
        </div>

        <input
          type="number"
          placeholder="Valor (R$)"
          className="w-full mt-3 p-2 bg-black rounded"
          onChange={e =>
            setForm({ ...form, valor: Number(e.target.value) })
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