'use client'

import { useEffect, useState } from 'react'
import { getContratos } from '@/services/contratoService'
import { Contrato } from '@/types/contrato'

import { ContratosTable } from '@/components/contratos/ContratosTable'
import { ContratosFilters } from '@/components/contratos/ContratosFilters'
import { ContratoModal } from '@/components/contratos/ContratoModal'

export default function ContratosPage() {
  const [data, setData] = useState<Contrato[]>([])
  const [filtered, setFiltered] = useState<Contrato[]>([])
  const [status, setStatus] = useState('todos')
  const [loading, setLoading] = useState(true)
  const [openModal, setOpenModal] = useState(false)

  useEffect(() => {
    async function fetch() {
      const result = await getContratos()
      setData(result)
      setFiltered(result)
      setLoading(false)
    }

    fetch()
  }, [])

  useEffect(() => {
    if (status === 'todos') {
      setFiltered(data)
    } else {
      setFiltered(data.filter(c => c.status === status))
    }
  }, [status, data])

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Contratos
          </h1>
          <p className="text-gray-400 text-sm">
            Gerencie contratos e documentos
          </p>
        </div>

        <button
          onClick={() => setOpenModal(true)}
          className="bg-white text-black px-4 py-2 rounded-xl"
        >
          + Novo contrato
        </button>
      </div>

      {/* FILTROS */}
      <ContratosFilters status={status} setStatus={setStatus} />

      {/* CONTENT */}
      {loading ? (
        <div className="text-gray-400">Carregando...</div>
      ) : (
        <ContratosTable data={filtered} />
      )}

      {/* MODAL */}
      {openModal && (
        <ContratoModal
          onClose={() => setOpenModal(false)}
          onSave={(item: Contrato) =>
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