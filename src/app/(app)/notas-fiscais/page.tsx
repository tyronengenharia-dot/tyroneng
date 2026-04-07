'use client'

import { useEffect, useState } from 'react'
import { getNotas } from '@/services/notaFiscalService'
import { NotaFiscal } from '@/types/notaFiscal'

import { NotasTable } from '@/components/notas-fiscais/NotasTable'
import { NotasFilters } from '@/components/notas-fiscais/NotasFilters'
import { NotaModal } from '@/components/notas-fiscais/NotasModal'

export default function NotasPage() {
  const [data, setData] = useState<NotaFiscal[]>([])
  const [filtered, setFiltered] = useState<NotaFiscal[]>([])
  const [type, setType] = useState('todos')
  const [status, setStatus] = useState('todos')
  const [loading, setLoading] = useState(true)
  const [openModal, setOpenModal] = useState(false)

  useEffect(() => {
    async function fetch() {
      const result = await getNotas()
      setData(result)
      setFiltered(result)
      setLoading(false)
    }

    fetch()
  }, [])

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

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Notas Fiscais
          </h1>
          <p className="text-gray-400 text-sm">
            Controle de notas emitidas e recebidas
          </p>
        </div>

        <button
          onClick={() => setOpenModal(true)}
          className="bg-white text-black px-4 py-2 rounded-xl"
        >
          + Nova nota
        </button>
      </div>

      <NotasFilters
        type={type}
        setType={setType}
        status={status}
        setStatus={setStatus} search={''} setSearch={function (v: string): void {
          throw new Error('Function not implemented.')
        } }      />

      {loading ? (
        <div className="text-gray-400">Carregando...</div>
      ) : (
        <NotasTable data={filtered} />
      )}

      {openModal && (
        <NotaModal
          onClose={() => setOpenModal(false)}
        onSave={(item: Omit<NotaFiscal, 'id'>) =>
          setData(prev => [
            ...prev,
            { ...item, id: Date.now().toString() },
          ])
        }
        />
      )}
    </div>
  )
}