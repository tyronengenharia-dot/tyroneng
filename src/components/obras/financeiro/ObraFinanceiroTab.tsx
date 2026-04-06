'use client'

import { useEffect, useState } from 'react'
import { getFinanceiroByObra } from '@/services/obraFinanceiroService'

import { FinanceTable as FinanceiroTable } from './FinanceiroTable'
import { FinanceiroFilters } from './FinanceiroFilters'
import { FinanceModal as FinanceiroModal } from './FinanceiroModal'
import { FinancialRecord } from '@/types/financial'

export function ObraFinanceiroTab({ obra_id }: any) {
  const [data, setData] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])

  const [type, setType] = useState('todos')
  const [status, setStatus] = useState('todos')
  const [openModal, setOpenModal] = useState(false)

  useEffect(() => {
    async function fetch() {
      const result = await getFinanceiroByObra(obra_id)
      setData(result)
      setFiltered(result)
    }

    fetch()
  }, [obra_id])

  useEffect(() => {
    let result = [...data]

    if (type !== 'todos') {
      result = result.filter(i => i.type === type)
    }

    if (status !== 'todos') {
      result = result.filter(i => i.status === status)
    }

    setFiltered(result)
  }, [type, status, data])

  const saldo = filtered.reduce(
    (acc, i) =>
      acc + (i.type === 'entrada' ? i.value : -i.value),
    0
  )

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex justify-between">
        <h2 className="text-white font-semibold">
          Financeiro da obra
        </h2>

        <button
          onClick={() => setOpenModal(true)}
          className="bg-white text-black px-3 py-1 rounded-lg"
        >
          + Lançamento
        </button>
      </div>

      {/* SALDO */}
      <div className="bg-[#111] p-4 rounded-xl border border-white/10">
        <p className="text-gray-400 text-sm">Saldo</p>
        <h2 className="text-white text-xl">
          R$ {saldo.toLocaleString()}
        </h2>
      </div>

      <FinanceiroFilters
        type={type}
        setType={setType}
        status={status}
        setStatus={setStatus}
      />

      <FinanceiroTable data={filtered} onEdit={function (item: FinancialRecord): void {
        throw new Error('Function not implemented.')
      } } onDelete={function (id: string): void {
        throw new Error('Function not implemented.')
      } } />

      {openModal && (
        <FinanceiroModal
          onClose={() => setOpenModal(false)}
          onSave={(item: any) =>
            setData(prev => [
              ...prev,
              { ...item, id: Date.now().toString(), obra_id },
            ])
          }
        />
      )}
    </div>
  )
}