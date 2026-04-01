'use client'

import { useEffect, useState } from 'react'
import { getVeiculos, deleteVeiculo } from '@/services/estoqueService'
import { VeiculosModal } from './VeiculosModal'

export function VeiculosTable() {
  const [data, setData] = useState<any[]>([])
  const [open, setOpen] = useState(false)

  async function load() {
    const res = await getVeiculos()
    setData(res)
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja excluir este veículo?')) return
    await deleteVeiculo(id)
    load()
  }

  useEffect(() => {
    load()
  }, [])

  function getStatusColor(status: string) {
    if (status === 'ativo') return 'text-green-400'
    if (status === 'manutencao') return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div>
      <button
        onClick={() => setOpen(true)}
        className="mb-4 bg-green-600 px-3 py-1 rounded"
      >
        + Novo Veículo
      </button>

      <div className="bg-[#1a1a1a] rounded-xl p-4">
        <table className="w-full text-sm">
          <thead className="text-gray-400">
            <tr>
              <th>Nome</th>
              <th>Placa</th>
              <th>Modelo</th>
              <th>Ano</th>
              <th>KM</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {data.map(item => (
              <tr key={item.id} className="border-t border-gray-800">
                <td>{item.nome}</td>
                <td>{item.placa}</td>
                <td>{item.modelo}</td>
                <td>{item.ano}</td>
                <td>{item.km}</td>

                <td className={getStatusColor(item.status)}>
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
        <VeiculosModal
          onClose={() => setOpen(false)}
          onSuccess={load}
        />
      )}
    </div>
  )
}