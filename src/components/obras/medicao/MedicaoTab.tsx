'use client'

import { useEffect, useState } from 'react'
import { getMedicoesByObra } from '@/services/medicaoService'

import { MedicaoTable } from './MedicaoTable'
import { MedicaoModal, type MedicaoFormData } from './MedicaoModal'
import { MedicaoResumo } from './MedicaoResumo'

export type MedicaoItem = {
  id: string
  obra_id?: string
  description: string
  percentage: number
  value: number
  date: string
}

export function MedicaoTab({ obra_id }: { obra_id: string }) {
  const [data, setData] = useState<MedicaoItem[]>([])
  const [openModal, setOpenModal] = useState(false)

  useEffect(() => {
    async function fetch() {
      const result = await getMedicoesByObra(obra_id)
      setData(result)
    }

    fetch()
  }, [obra_id])

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex justify-between">
        <h2 className="text-white font-semibold">
          Medições da obra
        </h2>

        <button
          onClick={() => setOpenModal(true)}
          className="bg-white text-black px-3 py-1 rounded-lg"
        >
          + Medição
        </button>
      </div>

      <MedicaoResumo data={data} />

      <MedicaoTable data={data} />

      {openModal && (
        <MedicaoModal
          onClose={() => setOpenModal(false)}
          onSave={(item: MedicaoFormData) =>
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