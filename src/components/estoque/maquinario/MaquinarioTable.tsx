'use client'

import { useEffect, useState } from 'react'
import {
  getMaquinarios,
  deleteMaquinario
} from '@/services/estoqueService'
import { MaquinarioModal } from './MaquinarioModal'

export function MaquinarioTable() {
  const [data, setData] = useState<any[]>([])
  const [open, setOpen] = useState(false)

  async function load() {
    const res = await getMaquinarios()
    setData(res)
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir maquinário?')) return
    await deleteMaquinario(id)
    load()
  }

  useEffect(() => {
    load()
  }, [])

  function statusColor(status: string) {
    if (status === 'ativo') return 'text-green-400'
    if (status === 'em_uso') return 'text-blue-400'
    if (status === 'manutencao') return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div>
      <button
        onClick={() => setOpen(true)}
        className="mb-4 bg-green-600 px-3 py-1 rounded"
      >
        + Novo Maquinário
      </button>

      <div className="bg-[#1a1a1a] rounded-xl p-4">
        <table className="w-full text-sm">
          <thead className="text-gray-400">
            <tr>
              <th>Nome</th>
              <th>Tipo</th>
              <th>Modelo</th>
              <th>Horímetro</th>
              <th>Status</th>
              <th>Custo/H</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {data.map(item => (
              <tr key={item.id} className="border-t border-gray-800">
                <td>{item.nome}</td>
                <td>{item.tipo}</td>
                <td>{item.modelo}</td>
                <td>{item.horimetro}h</td>

                <td className={statusColor(item.status)}>
                  {item.status}
                </td>

                <td>
                  {item.custo_hora
                    ? `R$ ${item.custo_hora}`
                    : '-'}
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
        <MaquinarioModal
          onClose={() => setOpen(false)}
          onSuccess={load}
        />
      )}
    </div>
  )
}