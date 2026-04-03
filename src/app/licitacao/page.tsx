'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
  getLicitacoes,
  createLicitacao,
  updateLicitacao,
  updateStatus,
  addChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
} from '@/services/licitacaoService'
import { Licitacao, LicitacaoFormData, LicitacaoStatus, ChecklistItem, ChecklistCategoria } from '@/types/licitacao'
import { LicitacaoSidebar } from '@/components/licitacoes/LicitacaoSidebar'
import { LicitacaoTopbar } from '@/components/licitacoes/LicitacaoTopbar'
import { LicitacaoMetrics } from '@/components/licitacoes/LicitacaoMetrics'
import { LicitacaoDisputa } from '@/components/licitacoes/LicitacaoDisputa'
import { ChecklistTable } from '@/components/licitacoes/ChecklistTable'
import { LicitacaoForm } from '@/components/licitacoes/LicitacaoForm'


export default function LicitacoesPage() {
  const [licitacoes, setLicitacoes] = useState<Licitacao[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Licitacao | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const selected = licitacoes.find(l => l.id === selectedId) ?? null

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  }, [])

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getLicitacoes()
      setLicitacoes(data)
      if (!selectedId && data.length > 0) setSelectedId(data[0].id)
    } finally {
      setLoading(false)
    }
  }, []) // eslint-disable-line

  useEffect(() => { load() }, []) // eslint-disable-line

  // Atualiza o checklist de uma licitação no estado local
  function patchChecklist(fn: (items: ChecklistItem[]) => ChecklistItem[]) {
    setLicitacoes(prev =>
      prev.map(l => l.id === selectedId ? { ...l, checklist: fn(l.checklist) } : l)
    )
  }

  // ─── licitação ──────────────────────────────────────────────────────────────

  async function handleSave(data: LicitacaoFormData) {
    if (!userId) return
    setSaving(true)
    try {
      if (editTarget) {
        await updateLicitacao(editTarget.id, data)
        setLicitacoes(prev =>
          prev.map(l => l.id === editTarget.id ? { ...l, ...data } : l)
        )
      } else {
        const nova = await createLicitacao(data, userId)
        setLicitacoes(prev => [nova, ...prev])
        setSelectedId(nova.id)
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusChange(status: LicitacaoStatus) {
    if (!selectedId) return
    setLicitacoes(prev => prev.map(l => l.id === selectedId ? { ...l, status } : l))
    await updateStatus(selectedId, status)
  }

  // ─── checklist ──────────────────────────────────────────────────────────────

  async function handleAddItem(nome: string, categoria: ChecklistCategoria) {
    if (!selectedId) return
    const item = await addChecklistItem(selectedId, { nome, categoria, status: 'pendente' })
    patchChecklist(items => [...items, item])
  }

  async function handleCycleStatus(itemId: string) {
    const cycle: Record<string, ChecklistItem['status']> = {
      pendente: 'andamento', andamento: 'concluido', concluido: 'pendente',
    }
    const item = selected?.checklist.find(i => i.id === itemId)
    if (!item) return
    const next = cycle[item.status]
    patchChecklist(items => items.map(i => i.id === itemId ? { ...i, status: next } : i))
    await updateChecklistItem(itemId, { status: next })
  }

  async function handleChangeStatus(itemId: string, status: ChecklistItem['status']) {
    patchChecklist(items => items.map(i => i.id === itemId ? { ...i, status } : i))
    await updateChecklistItem(itemId, { status })
  }

  async function handleDeleteItem(itemId: string) {
    patchChecklist(items => items.filter(i => i.id !== itemId))
    await deleteChecklistItem(itemId)
  }

  // ─── render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-screen bg-black items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-zinc-500">Carregando licitações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      <LicitacaoSidebar
        licitacoes={licitacoes}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onNew={() => { setEditTarget(null); setModalOpen(true) }}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {selected ? (
          <>
            <LicitacaoTopbar
              lic={selected}
              onStatusChange={handleStatusChange}
              onEdit={() => { setEditTarget(selected); setModalOpen(true) }}
            />
            <div className="flex-1 overflow-y-auto p-7 space-y-5">
              <LicitacaoMetrics lic={selected} />
              <LicitacaoDisputa
                lic={selected}
                onEdit={() => { setEditTarget(selected); setModalOpen(true) }}
              />
              <ChecklistTable
                items={selected.checklist}
                onAddItem={handleAddItem}
                onCycleStatus={handleCycleStatus}
                onChangeStatus={handleChangeStatus}
                onDelete={handleDeleteItem}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-zinc-600">
            <span className="text-5xl opacity-30">📋</span>
            <p className="text-sm">Nenhuma licitação ainda.</p>
            <button
              onClick={() => { setEditTarget(null); setModalOpen(true) }}
              className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-5 py-2 rounded-lg transition-colors"
            >
              + Nova Licitação
            </button>
          </div>
        )}
      </main>

      {modalOpen && (
        <LicitacaoForm
          licitacao={editTarget}
          saving={saving}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}
