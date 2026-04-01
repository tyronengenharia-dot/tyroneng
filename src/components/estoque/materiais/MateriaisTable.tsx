'use client'

import { useEffect, useState } from 'react'
import { getMateriais } from '@/services/estoqueService'
import { MateriaisModal } from './MateriaisModal'

export function MateriaisTable() {
  const [data, setData] = useState<any[]>([])
  const [open, setOpen] = useState(false)

  async function load() {
    const res = await getMateriais()
    setData(res)
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div>
      <button
        onClick={() => setOpen(true)}
        className="mb-4 bg-green-600 px-3 py-1 rounded"
      >
        + Novo Material
      </button>

      <div className="bg-[#1a1a1a] rounded-xl p-4">
        <table className="w-full text-sm">
          <thead className="text-gray-400">
            <tr>
              <th>Nome</th>
              <th>Quantidade</th>
              <th>Valor</th>
            </tr>
          </thead>

          <tbody>
            {data.map(item => (
              <tr key={item.id} className="border-t border-gray-800">
                <td>{item.nome}</td>
                <td>{item.quantidade}</td>
                <td>R$ {item.valor_unitario}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <MateriaisModal
          onClose={() => setOpen(false)}
          onSuccess={load}
        />
      )}
    </div>
  )
}