'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getLicitacaoById, updateLicitacao } from '@/services/licitacaoService'
import { ChecklistTable } from '@/components/licitacoes/ChecklistTable'
import { Licitacao, ChecklistItem } from '@/types/licitacao'

export default function LicitacaoDetalhePage() {
  const { id } = useParams()
  const [lic, setLic] = useState<Licitacao | null>(null)
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const data = await getLicitacaoById(id as string)
      if (data) {
        setLic(data)
        setItems(data.checklist)
      }
      setLoading(false)
    }
    load()
  }, [id])

  async function save() {
    if (!lic) return
    const { id: _, checklist: __, ...licData } = lic;
    const checklist = items.map(item => ({
      id: item.id,
      descricao: item.descricao,
      status: item.status,
      observacao: item.observacao
    }));
    await updateLicitacao(id as string, { ...licData }, checklist)
  }

  if (loading) return <div className="p-6 text-white">Carregando...</div>
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