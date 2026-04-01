'use client'

import { useEffect, useState } from 'react'
import {
  getFinancialRecords,
  deleteFinancialRecord,
} from '@/services/financialService'
import { FinancialRecord } from '@/types/financial'

import { FinanceTable } from '@/components/financeiro/FinanceTable'
import { FinanceDateFilter } from '@/components/financeiro/FinanceDateFilter'
import { FinancePagination } from '@/components/financeiro/FinancePagination'
import { FinanceModal } from '@/components/financeiro/FinanceModal'

export default function FinanceiroPage() {
  const [data, setData] = useState<FinancialRecord[]>([])
  const [filtered, setFiltered] = useState<FinancialRecord[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [type, setType] = useState('todos')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [openModal, setOpenModal] = useState(false)
  const [editing, setEditing] = useState<FinancialRecord | null>(null)

  const limit = 5

  async function fetchData() {
    setLoading(true)
    const { data } = await getFinancialRecords()
    setData(data)
    setFiltered(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    let result = [...data]

    if (search) {
      result = result.filter(item =>
        item.description.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (type !== 'todos') {
      result = result.filter(item => item.type === type)
    }

    if (startDate) {
      result = result.filter(item => item.date >= startDate)
    }

    if (endDate) {
      result = result.filter(item => item.date <= endDate)
    }

    setFiltered(result)
    setPage(1)
  }, [search, type, startDate, endDate, data])

  const totalPages = Math.ceil(filtered.length / limit)

  const paginatedData = filtered.slice(
    (page - 1) * limit,
    page * limit
  )

  function handleEdit(item: FinancialRecord) {
    setEditing(item)
    setOpenModal(true)
  }

  async function handleDelete(id: string) {
    await deleteFinancialRecord(id)
    fetchData()
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Financeiro</h1>
          <p className="text-gray-500 text-sm">
            Controle completo de receitas e despesas
          </p>
        </div>

        <button
          onClick={() => {
            setEditing(null)
            setOpenModal(true)
          }}
          className="bg-black text-white px-4 py-2 rounded-xl hover:opacity-90"
        >
          + Nova transação
        </button>
      </div>

      {/* FILTRO */}
      <FinanceDateFilter
        startDate={startDate}
        endDate={endDate}
        setStartDate={setStartDate}
        setEndDate={setEndDate}
      />

      {/* CONTEÚDO */}
      {loading ? (
        <div>Carregando...</div>
      ) : data.length === 0 ? (
        <div className="bg-[#111] border border-white/10 p-12 rounded-2xl text-center">
                <h2 className="text-xl font-semibold text-white mb-2">
                  Nenhuma transação ainda
                </h2>

                <p className="text-gray-400 mb-6">
                  Comece registrando sua primeira entrada ou despesa
                </p>

                <button
                  onClick={() => {
                    setEditing(null)
                    setOpenModal(true)
                  }}
                  className="bg-white text-black px-6 py-3 rounded-xl font-medium hover:scale-105 transition"
                >
                  + Nova transação
                </button>
              </div>
      ) : (
        <>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#111] p-4 rounded-2xl border border-white/10">
                  <p className="text-gray-400 text-sm">Receitas</p>
                  <h2 className="text-green-400 text-2xl font-bold">R$ 0,00</h2>
                </div>

                <div className="bg-[#111] p-4 rounded-2xl border border-white/10">
                  <p className="text-gray-400 text-sm">Despesas</p>
                  <h2 className="text-red-400 text-2xl font-bold">R$ 0,00</h2>
                </div>

                <div className="bg-[#111] p-4 rounded-2xl border border-white/10">
                  <p className="text-gray-400 text-sm">Saldo</p>
                  <h2 className="text-white text-2xl font-bold">R$ 0,00</h2>
                </div>
              </div>


          <FinanceTable
            data={paginatedData}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />

          <FinancePagination
            page={page}
            setPage={setPage}
            totalPages={totalPages}
          />
        </>
      )}

      {/* MODAL */}
      {openModal && (
        <FinanceModal
          initialData={editing}
          onClose={() => setOpenModal(false)}
          onSuccess={fetchData}
        />
      )}
    </div>
  )
}