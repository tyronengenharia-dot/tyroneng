'use client'

import { useState } from 'react'
import {
  getLicitacoes,
  createLicitacao,
  updateLicitacao,
  updateStatus,
  updateChecklist,
} from '@/services/licitacaoService'
import { Licitacao, LicitacaoFormData, LicitacaoStatus, ChecklistItem } from '@/types/licitacao'
import { LicitacaoSidebar } from '@/components/licitacoes/LicitacaoSidebar'
import { LicitacaoTopbar } from '@/components/licitacoes/LicitacaoTopbar'
import { LicitacaoMetrics } from '@/components/licitacoes/LicitacaoMetrics'
import { LicitacaoDisputa } from '@/components/licitacoes/LicitacaoDisputa'
import { ChecklistTable } from '@/components/licitacoes/ChecklistTable'
import { LicitacaoForm } from '@/components/licitacoes/LicitacaoForm'

export default function LicitacoesPage() {
  const [licitacoes, setLicitacoes] = useState<Licitacao[]>(getLicitacoes())
  const [selectedId, setSelectedId] = useState<string | null>(licitacoes[0]?.id ?? null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Licitacao | null>(null)

  const selected = licitacoes.find(l => l.id === selectedId) ?? null

  function refresh() {
    setLicitacoes([...getLicitacoes()])
  }

  function handleCreate() {
    setEditTarget(null)
    setModalOpen(true)
  }

  function handleEdit() {
    setEditTarget(selected)
    setModalOpen(true)
  }

  function handleSave(data: LicitacaoFormData) {
    if (editTarget) {
      updateLicitacao(editTarget.id, data)
    } else {
      const nova = createLicitacao(data)
      setSelectedId(nova.id)
    }
    refresh()
  }

  function handleStatusChange(status: LicitacaoStatus) {
    if (!selectedId) return
    updateStatus(selectedId, status)
    refresh()
  }

  function handleChecklistChange(items: ChecklistItem[]) {
    if (!selectedId) return
    updateChecklist(selectedId, items)
    refresh()
  }

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      <LicitacaoSidebar
        licitacoes={licitacoes}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onNew={handleCreate}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {selected ? (
          <>
            <LicitacaoTopbar
              lic={selected}
              onStatusChange={handleStatusChange}
              onEdit={handleEdit}
            />

            <div className="flex-1 overflow-y-auto p-7 space-y-5">
              <LicitacaoMetrics lic={selected} />
              <LicitacaoDisputa lic={selected} onEdit={handleEdit} />
              <ChecklistTable
                items={selected.checklist}
                onChange={handleChecklistChange}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-zinc-600">
            <span className="text-5xl opacity-30">📋</span>
            <p className="text-sm">Selecione uma licitação ou crie uma nova</p>
            <button
              onClick={handleCreate}
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
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}
