'use client'

import { useParams } from 'next/navigation'
import { useState } from 'react'
import { getLicitacaoById, updateChecklist } from '@/services/licitacaoService'
import { ChecklistTable } from '@/components/licitacoes/CheckListTable'

export default function LicitacaoDetalhePage() {
  const { id } = useParams()
  const lic = getLicitacaoById(id as string)

  const [items, setItems] = useState(lic?.checklist || [])

  function save() {
    updateChecklist(id as string, items)
  }

  if (!lic) return <div>Não encontrada</div>

  return (
    <div className="p-6 bg-black text-white min-h-screen space-y-4">
      <h1 className="text-xl font-bold">{lic.titulo}</h1>

      <ChecklistTable items={items} setItems={setItems} />

      <button
        onClick={save}
        className="bg-blue-600 px-4 py-2 rounded"
      >
        Salvar
      </button>
    </div>
  )
}