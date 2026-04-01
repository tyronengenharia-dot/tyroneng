'use client'

import { useEffect, useState } from 'react'
import { getMedicoes } from '@/services/medicaoService'

import { MedicaoTable } from './MedicaoTable'
import { MedicaoModal } from './MedicaoModal'
import { MedicaoResumo } from './MedicaoResumo'

export function MedicaoTab({ obra_id }: any) {
  const [data, setData] = useState<any[]>([])
  const [openModal, setOpenModal] = useState(false)

  useEffect(() => {
    async function fetch() {
      const result = await getMedicoes(obra_id)
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