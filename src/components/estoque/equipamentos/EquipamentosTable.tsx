'use client'

import { useEffect, useState } from 'react'
import {
  getEquipamentos,
  deleteEquipamento
} from '@/services/estoqueService'
import { EquipamentosModal } from './EquipamentosModal'

export function EquipamentosTable() {
  const [data, setData] = useState<any[]>([])
  const [open, setOpen] = useState(false)

  async function load() {
    const res = await getEquipamentos()
    setData(res)
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir equipamento?')) return
    await deleteEquipamento(id)
    load()
  }

  useEffect(() => {
    load()
  }, [])

  function statusColor(status: string) {
    if (status === 'disponivel') return 'text-green-400'
    if (status === 'em_uso') return 'text-blue-400'
    return 'text-yellow-400'
  }

  return (
    <div>
      <button
        onClick={() => setOpen(true)}
        className="mb-4 bg-green-600 px-3 py-1 rounded"
      >
        + Novo Equipamento
      </button>

      <div className="bg-[#1a1a1a] rounded-xl p-4">
        <table className="w-full text-sm">
          <thead className="text-gray-400">
            <tr>
              <th>Nome</th>
              <th>Série</th>
              <th>Categoria</th>
              <th>Local</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {data.map(item => (
              <tr key={item.id} className="border-t border-gray-800">
                <td>{item.nome}</td>
                <td>{item.numero_serie}</td>
                <td>{item.categoria}</td>
                <td>{item.localizacao || '-'}</td>

                <td className={statusColor(item.status)}>
                  {item.status}
                </td>

                <td className="flex gap-2">
                  <button className="text-blue-400">Editar</button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-400"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <EquipamentosModal
          onClose={() => setOpen(false)}
          onSuccess={load}
        />
      )}
    </div>
  )
}