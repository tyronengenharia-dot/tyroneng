'use client'

import { useState, useEffect } from 'react'
import { Contrato } from '@/types/contrato'
import { getContratos, criarContrato, atualizarContrato, excluirContrato } from '@/services/contratoService'
import { ContratosTable } from '@/components/contratos/ContratosTable'
import { ContratosFilters } from '@/components/contratos/ContratosFilters'
import { ContratoModal } from '@/components/contratos/ContratoModal'

export default function ContratosPage() {
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [status, setStatus] = useState('todos')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<Contrato | undefined>()

  async function carregar() {
    try {
      setLoading(true)
      setErro(null)
      const data = await getContratos()
      setContratos(data)
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  async function handleSave(data: Omit<Contrato, 'id'>) {
    try {
      if (editTarget) {
        const updated = await atualizarContrato(editTarget.id, data)
        setContratos(prev => prev.map(c => c.id === updated.id ? updated : c))
      } else {
        const novo = await criarContrato(data)
        setContratos(prev => [novo, ...prev])
      }
    } catch (e: any) {
      alert(`Erro ao salvar: ${e.message}`)
    }
    setEditTarget(undefined)
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este contrato?')) return
    try {
      await excluirContrato(id)
      setContratos(prev => prev.filter(c => c.id !== id))
    } catch (e: any) {
      alert(`Erro ao excluir: ${e.message}`)
    }
  }

  function handleEdit(item: Contrato) {
    setEditTarget(item)
    setShowModal(true)
  }

  const filtered = contratos.filter(c => {
    const matchStatus = status === 'todos' || c.status === status
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.client.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const counts = contratos.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] ?? 0) + 1
    return acc
  }, {})

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-zinc-500 text-sm animate-pulse">Carregando contratos...</p>
      </div>
    )
  }

  if (erro) {
    return (
      <div className="flex items-center justify-center py-20 text-center">
        <div>
          <p className="text-zinc-400 text-sm">Erro ao carregar contratos</p>
          <p className="text-zinc-600 text-xs mt-1 font-mono">{erro}</p>
          <button onClick={carregar} className="mt-4 text-xs text-amber-500 hover:text-amber-400">
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <ContratosFilters
          status={status}
          setStatus={setStatus}
          search={search}
          setSearch={setSearch}
          counts={counts}
        />
        <button
          onClick={() => { setEditTarget(undefined); setShowModal(true) }}
          className="flex items-center gap-2 bg-white text-black text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Novo Contrato
        </button>
      </div>

      <ContratosTable
        data={filtered}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {showModal && (
        <ContratoModal
          initial={editTarget}
          onClose={() => { setShowModal(false); setEditTarget(undefined) }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}